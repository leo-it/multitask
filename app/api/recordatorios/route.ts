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
  path: data => data.recurrente ? ['frecuenciaRecurrencia'] : ['fechaVencimiento']
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
    
    await prisma.recordatorio.updateMany({
      where: {
        userId: session.user.id,
        completado: true,
        fechaVencimiento: {
          lt: hoy
        }
      },
      data: {
        completado: false,
        fechaCompletado: null
      }
    })

    const recordatorios = await prisma.recordatorio.findMany({
      where: { userId: session.user.id },
      include: { categoria: true },
      orderBy: [
        { completado: 'asc' }, // Primero los no completados
        { fechaVencimiento: 'asc' }, // Luego ordenados por fecha
      ],
    })

    // Filtrar para mostrar solo un recordatorio único por título si es recurrente
    // Priorizar el que no tiene recordatorioPadreId (el original)
    const recordatoriosUnicos = recordatorios.reduce((acc, recordatorio) => {
      if (recordatorio.recurrente) {
        // Si es recurrente, buscar si ya existe uno con el mismo título
        const existente = acc.find(
          (r) => r.titulo === recordatorio.titulo && r.recurrente
        )
        
        if (!existente) {
          // Si no existe, agregarlo
          acc.push(recordatorio)
        } else {
          // Si existe, mantener el que no tiene recordatorioPadreId (el original)
          // o el que tiene más veces completado
          if (
            !recordatorio.recordatorioPadreId ||
            (recordatorio.vecesCompletado || 0) > (existente.vecesCompletado || 0)
          ) {
            const index = acc.indexOf(existente)
            acc[index] = recordatorio
          }
        }
      } else {
        // Si no es recurrente, agregarlo normalmente
        acc.push(recordatorio)
      }
      
      return acc
    }, [] as typeof recordatorios)

    return NextResponse.json(recordatoriosUnicos)
  } catch (error) {
    console.error('Error obteniendo recordatorios:', error)
    return NextResponse.json(
      { error: 'Error al obtener recordatorios' },
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

    console.error('Error creando recordatorio:', error)
    return NextResponse.json(
      { error: 'Error al crear recordatorio' },
      { status: 500 }
    )
  }
}
