import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(1000).optional().nullable(),
  fechaVencimiento: z.string().datetime().optional(),
  categoriaId: z.string().optional().nullable(),
  completado: z.boolean().optional(),
  notificacionesActivas: z.boolean().optional(),
  frecuenciaRecordatorio: z.enum(['DIARIO', 'SEMANAL', 'MENSUAL']).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const recordatorio = await prisma.recordatorio.findUnique({
      where: { id: params.id },
    })

    if (!recordatorio || recordatorio.userId !== session.user.id) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const body = await request.json()
    console.log('📥 Body recibido:', JSON.stringify(body, null, 2))
    const data = updateSchema.parse(body)
    console.log('✅ Data parseada:', JSON.stringify(data, null, 2))

    const updateData: any = { ...data }

    // Convertir fechaVencimiento a Date si viene como string
    if (data.fechaVencimiento) {
      updateData.fechaVencimiento = new Date(data.fechaVencimiento)
    }

    // Si se marca como completado, SIEMPRE agregar al historial (permitir múltiples veces)
    // NO cambiar el estado de completado permanentemente, solo agregar al historial
    if (data.completado !== undefined && data.completado === true) {
      const fechaCompletado = new Date()
      
      // Obtener historial actual o crear uno nuevo
      let historialActual: string[] = []
      if (recordatorio.historialCompletados) {
        if (typeof recordatorio.historialCompletados === 'string') {
          try {
            historialActual = JSON.parse(recordatorio.historialCompletados)
          } catch {
            historialActual = []
          }
        } else if (Array.isArray(recordatorio.historialCompletados)) {
          historialActual = recordatorio.historialCompletados as string[]
        } else if (typeof recordatorio.historialCompletados === 'object') {
          // Si es un objeto, intentar convertirlo a array
          try {
            historialActual = Object.values(recordatorio.historialCompletados) as string[]
          } catch {
            historialActual = []
          }
        }
      }
      
      // Agregar nueva fecha al historial
      const nuevoHistorial = [...historialActual, fechaCompletado.toISOString()]
      
      // Actualizar campos del historial - Prisma acepta objetos JavaScript para campos JSON
      updateData.historialCompletados = nuevoHistorial
      updateData.vecesCompletado = (recordatorio.vecesCompletado || 0) + 1
      updateData.fechaCompletado = fechaCompletado // Última fecha de completado
      // NO cambiar completado a true permanentemente, solo actualizar la fecha
      delete updateData.completado
      
      console.log('✅ Agregando completado al historial, fechaCompletado:', fechaCompletado.toISOString())
      console.log('📊 Nuevo historial:', nuevoHistorial)
    } else if (data.completado !== undefined && data.completado === false) {
      // Solo permitir desmarcar si está marcado actualmente
      updateData.fechaCompletado = null
      updateData.completado = false
      // NO eliminar el historial ni el contador
      console.log('❌ Desmarcando estado actual (manteniendo historial)')
    }
    
    console.log('📤 UpdateData antes de actualizar:', {
      ...updateData,
      fechaCompletado: updateData.fechaCompletado instanceof Date 
        ? updateData.fechaCompletado.toISOString() 
        : updateData.fechaCompletado,
      fechaVencimiento: updateData.fechaVencimiento instanceof Date
        ? updateData.fechaVencimiento.toISOString()
        : updateData.fechaVencimiento
    })

    // Recalcular próxima notificación si cambian las notificaciones o frecuencia
    if (data.notificacionesActivas !== undefined || data.frecuenciaRecordatorio) {
      const notificacionesActivas = data.notificacionesActivas ?? recordatorio.notificacionesActivas
      const frecuencia = data.frecuenciaRecordatorio ?? recordatorio.frecuenciaRecordatorio

      if (notificacionesActivas) {
        const hoy = new Date()
        let proximaNotificacion: Date | null = null

        if (frecuencia === 'DIARIO') {
          proximaNotificacion = new Date(hoy)
          proximaNotificacion.setDate(proximaNotificacion.getDate() + 1)
        } else if (frecuencia === 'SEMANAL') {
          proximaNotificacion = new Date(hoy)
          proximaNotificacion.setDate(proximaNotificacion.getDate() + 7)
        } else if (frecuencia === 'MENSUAL') {
          proximaNotificacion = new Date(hoy)
          proximaNotificacion.setMonth(proximaNotificacion.getMonth() + 1)
        }

        updateData.proximaNotificacion = proximaNotificacion
      } else {
        updateData.proximaNotificacion = null
      }
    }

    console.log('🔄 Actualizando recordatorio con ID:', params.id)
    console.log('📦 Datos a actualizar (tipos):', {
      completado: typeof updateData.completado,
      fechaCompletado: updateData.fechaCompletado instanceof Date ? 'Date' : typeof updateData.fechaCompletado,
      fechaVencimiento: updateData.fechaVencimiento instanceof Date ? 'Date' : typeof updateData.fechaVencimiento,
      historialCompletados: typeof updateData.historialCompletados,
      vecesCompletado: typeof updateData.vecesCompletado
    })
    
    // Construir el objeto de actualización de forma explícita para que Prisma lo reconozca
    const prismaUpdateData: Parameters<typeof prisma.recordatorio.update>[0]['data'] = {}
    
    // Copiar solo los campos válidos
    if (updateData.titulo !== undefined) prismaUpdateData.titulo = updateData.titulo
    if (updateData.descripcion !== undefined) prismaUpdateData.descripcion = updateData.descripcion
    if (updateData.fechaVencimiento !== undefined) prismaUpdateData.fechaVencimiento = updateData.fechaVencimiento
    if (updateData.categoriaId !== undefined) prismaUpdateData.categoriaId = updateData.categoriaId
    if (updateData.completado !== undefined) prismaUpdateData.completado = updateData.completado
    if (updateData.fechaCompletado !== undefined) prismaUpdateData.fechaCompletado = updateData.fechaCompletado
    if (updateData.historialCompletados !== undefined) prismaUpdateData.historialCompletados = updateData.historialCompletados as any
    if (updateData.vecesCompletado !== undefined) prismaUpdateData.vecesCompletado = updateData.vecesCompletado
    if (updateData.notificacionesActivas !== undefined) prismaUpdateData.notificacionesActivas = updateData.notificacionesActivas
    if (updateData.frecuenciaRecordatorio !== undefined) prismaUpdateData.frecuenciaRecordatorio = updateData.frecuenciaRecordatorio
    if (updateData.proximaNotificacion !== undefined) prismaUpdateData.proximaNotificacion = updateData.proximaNotificacion
    
    const updated = await prisma.recordatorio.update({
      where: { id: params.id },
      data: prismaUpdateData,
      include: { categoria: true },
    })
    
    console.log('✅ Recordatorio actualizado:', JSON.stringify({
      id: updated.id,
      completado: updated.completado,
      fechaCompletado: updated.fechaCompletado,
    }, null, 2))

    // NO crear el siguiente recordatorio recurrente inmediatamente
    // El recordatorio permanecerá completado hasta su fecha de vencimiento
    // El siguiente se creará automáticamente cuando se resetee al pasar la fecha de vencimiento

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Error de validación Zod:', error.errors)
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    // Log detallado del error
    console.error('❌ Error actualizando recordatorio:', error)
    if (error instanceof Error) {
      console.error('❌ Mensaje de error:', error.message)
      console.error('❌ Stack trace:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Error al actualizar recordatorio',
        message: error instanceof Error ? error.message : 'Error desconocido',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const recordatorio = await prisma.recordatorio.findUnique({
      where: { id: params.id },
    })

    if (!recordatorio || recordatorio.userId !== session.user.id) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    await prisma.recordatorio.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Recordatorio eliminado' })
  } catch (error) {
    console.error('Error eliminando recordatorio:', error)
    return NextResponse.json(
      { error: 'Error al eliminar recordatorio' },
      { status: 500 }
    )
  }
}
