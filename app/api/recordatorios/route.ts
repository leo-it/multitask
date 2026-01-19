import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const recordatorioSchema = z.object({
  titulo: z.string().min(1).max(200),
  descripcion: z.string().max(1000).optional().nullable(),
  fechaVencimiento: z.string().optional().nullable(),
  categoriaId: z.string().optional().nullable(),
  notificacionesActivas: z.boolean().default(true),
  frecuenciaRecordatorio: z.enum(['DIARIO', 'SEMANAL', 'MENSUAL']).default('DIARIO'),
  recurrente: z.boolean().default(false),
  frecuenciaRecurrencia: z.enum(['DIARIO', 'SEMANAL', 'MENSUAL']).optional().nullable(),
}).refine((data) => {
  // Si es recurrente, debe tener frecuenciaRecurrencia
  if (data.recurrente && !data.frecuenciaRecurrencia) {
    return false
  }
  // Si no es recurrente, debe tener fechaVencimiento válida
  if (!data.recurrente && (!data.fechaVencimiento || data.fechaVencimiento.trim() === '')) {
    return false
  }
  return true
}, {
  message: "Los recordatorios recurrentes necesitan frecuencia, los no recurrentes necesitan fecha de vencimiento",
  path: ['fechaVencimiento']
})

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Resetear automáticamente los recordatorios completados que ya pasaron su fecha de vencimiento
    // NO crear nuevos recordatorios, solo resetear el estado
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    // Reset expired completed reminders
    const expiredReminders = await prisma.recordatorio.findMany({
      where: {
        userId: session.user.id,
        completado: true,
        fechaVencimiento: {
          lt: hoy
        }
      }
    })

    for (const reminder of expiredReminders) {
      await prisma.recordatorio.update({
        where: { id: reminder.id },
        data: {
          completado: false,
          fechaCompletado: null,
        } as any
      })
    }

    const recordatorios = await prisma.recordatorio.findMany({
      where: { userId: session.user.id },
      include: { categoria: true },
      orderBy: [
        { completado: 'asc' }, // Primero los no completados
        { fechaVencimiento: 'asc' }, // Luego ordenados por fecha
      ],
    })

    // Filter to show only one reminder per title if recurring
    // Prioritize the one without recordatorioPadreId (the original)
    const recordatoriosUnicos = recordatorios.reduce((acc, recordatorio) => {
      const reminder = recordatorio as typeof recordatorio & { vecesCompletado?: number }
      
      if (reminder.recurrente) {
        // If recurring, check if one with same title already exists
        const existente = acc.find(
          (r) => r.titulo === reminder.titulo && r.recurrente
        ) as typeof reminder | undefined
        
        if (!existente) {
          acc.push(reminder)
        } else {
          const existenteWithHistory = existente as typeof reminder
          // Keep the one without recordatorioPadreId (the original)
          // or the one with more completions
          if (
            !reminder.recordatorioPadreId ||
            (reminder.vecesCompletado || 0) > (existenteWithHistory.vecesCompletado || 0)
          ) {
            const index = acc.indexOf(existente)
            acc[index] = reminder
          }
        }
      } else {
        // If not recurring, add normally
        acc.push(reminder)
      }
      
      return acc
    }, [] as (typeof recordatorios[0] & { vecesCompletado?: number })[])

    // Sort again after filtering to ensure completed tasks go to the end
    const recordatoriosOrdenados = recordatoriosUnicos.sort((a, b) => {
      const reminderA = a as typeof a & { vecesCompletado?: number }
      const reminderB = b as typeof b & { vecesCompletado?: number }
      
      // Check if task has completion history (even if completado is false)
      const aHasHistory = reminderA.vecesCompletado && reminderA.vecesCompletado > 0
      const bHasHistory = reminderB.vecesCompletado && reminderB.vecesCompletado > 0
      
      // Consider a task "completed" if completado is true OR has history
      const aIsCompleted = a.completado === true || aHasHistory
      const bIsCompleted = b.completado === true || bHasHistory
      
      // Non-completed tasks first
      if (aIsCompleted !== bIsCompleted) {
        return aIsCompleted === true ? 1 : -1
      }
      // Within same completion status, sort by due date
      return a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime()
    })

    return NextResponse.json(recordatoriosOrdenados)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error fetching reminders' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = recordatorioSchema.parse(body)

    // Calcular fecha de vencimiento
    let fechaVencimiento: Date
    
    if (data.recurrente && data.frecuenciaRecurrencia) {
      // Si es recurrente, calcular fecha según frecuencia
      const hoy = new Date()
      
      if (data.frecuenciaRecurrencia === 'DIARIO') {
        fechaVencimiento = new Date(hoy)
        fechaVencimiento.setDate(fechaVencimiento.getDate() + 1)
      } else if (data.frecuenciaRecurrencia === 'SEMANAL') {
        // Calcular próximo domingo
        fechaVencimiento = new Date(hoy)
        const diaSemana = fechaVencimiento.getDay() // 0 = domingo, 6 = sábado
        const diasHastaDomingo = diaSemana === 0 ? 7 : 7 - diaSemana
        fechaVencimiento.setDate(fechaVencimiento.getDate() + diasHastaDomingo)
      } else if (data.frecuenciaRecurrencia === 'MENSUAL') {
        // Último día del mes actual
        fechaVencimiento = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
        // Si ya pasó el último día del mes, usar el del próximo mes
        if (fechaVencimiento < hoy) {
          fechaVencimiento = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0)
        }
      } else {
        fechaVencimiento = new Date(hoy)
      }
    } else {
      // Si no es recurrente, usar la fecha proporcionada
      fechaVencimiento = new Date(data.fechaVencimiento!)
    }

    // Calcular próxima notificación basada en la frecuencia
    let proximaNotificacion: Date | null = null

    if (data.notificacionesActivas) {
      const hoy = new Date()
      if (data.frecuenciaRecordatorio === 'DIARIO') {
        proximaNotificacion = new Date(hoy)
        proximaNotificacion.setDate(proximaNotificacion.getDate() + 1)
      } else if (data.frecuenciaRecordatorio === 'SEMANAL') {
        proximaNotificacion = new Date(hoy)
        proximaNotificacion.setDate(proximaNotificacion.getDate() + 7)
      } else if (data.frecuenciaRecordatorio === 'MENSUAL') {
        proximaNotificacion = new Date(hoy)
        proximaNotificacion.setMonth(proximaNotificacion.getMonth() + 1)
      }
    }

    // Si es recurrente, verificar si ya existe uno con el mismo título para este usuario
    if (data.recurrente) {
      const existente = await prisma.recordatorio.findFirst({
        where: {
          userId: session.user.id,
          titulo: data.titulo,
          recurrente: true,
          recordatorioPadreId: null, // Solo el original, no las instancias
        },
      })

      if (existente) {
        // Actualizar el existente en lugar de crear uno nuevo
        const actualizado = await prisma.recordatorio.update({
          where: { id: existente.id },
          data: {
            descripcion: data.descripcion,
            fechaVencimiento,
            categoriaId: data.categoriaId,
            notificacionesActivas: data.notificacionesActivas,
            frecuenciaRecordatorio: data.frecuenciaRecordatorio,
            frecuenciaRecurrencia: data.frecuenciaRecurrencia,
            proximaNotificacion,
          },
          include: { categoria: true },
        })
        return NextResponse.json(actualizado, { status: 200 })
      }
    }

    const recordatorio = await prisma.recordatorio.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        fechaVencimiento,
        categoriaId: data.categoriaId,
        notificacionesActivas: data.notificacionesActivas,
        frecuenciaRecordatorio: data.frecuenciaRecordatorio,
        recurrente: data.recurrente,
        frecuenciaRecurrencia: data.recurrente ? data.frecuenciaRecurrencia : null,
        proximaNotificacion,
        userId: session.user.id,
      },
      include: { categoria: true },
    })

    return NextResponse.json(recordatorio, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error creating reminder' },
      { status: 500 }
    )
  }
}
