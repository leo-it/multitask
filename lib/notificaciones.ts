// Sistema de notificaciones para recordatorios
// En el futuro, esto se puede expandir para usar Web Push API

import { prisma } from './prisma'

export async function procesarNotificaciones() {
  const ahora = new Date()

  // Obtener recordatorios que necesitan notificación
  const recordatorios = await prisma.recordatorio.findMany({
    where: {
      notificacionesActivas: true,
      completado: false,
      OR: [
        // Próxima notificación programada
        {
          proximaNotificacion: {
            lte: ahora,
          },
        },
        // O vencidos que necesitan re-notificación
        {
          fechaVencimiento: {
            lte: ahora,
          },
          ultimaNotificacion: {
            OR: [
              null,
              {
                // Última notificación hace más de un día (para frecuencia diaria)
                lt: new Date(ahora.getTime() - 24 * 60 * 60 * 1000),
              },
            ],
          },
        },
      ],
    },
    include: {
      categoria: true,
      user: true,
    },
  })

  for (const recordatorio of recordatorios) {
    // Calcular próxima notificación según frecuencia
    let proximaNotificacion: Date | null = null

    if (recordatorio.frecuenciaRecordatorio === 'DIARIO') {
      proximaNotificacion = new Date(ahora)
      proximaNotificacion.setDate(proximaNotificacion.getDate() + 1)
    } else if (recordatorio.frecuenciaRecordatorio === 'SEMANAL') {
      proximaNotificacion = new Date(ahora)
      proximaNotificacion.setDate(proximaNotificacion.getDate() + 7)
    } else if (recordatorio.frecuenciaRecordatorio === 'MENSUAL') {
      proximaNotificacion = new Date(ahora)
      proximaNotificacion.setMonth(proximaNotificacion.getMonth() + 1)
    }

    // Actualizar recordatorio con nueva fecha de notificación
    await prisma.recordatorio.update({
      where: { id: recordatorio.id },
      data: {
        ultimaNotificacion: ahora,
        proximaNotificacion,
      },
    })

    // TODO: Implementar Web Push API o servicio de notificaciones
    // await enviarNotificacionPush(recordatorio.user, recordatorio)
  }

  return recordatorios.length
}

// Función para enviar notificaciones push (a implementar)
async function enviarNotificacionPush(user: any, recordatorio: any) {
  // Implementar usando Web Push API
  // Requiere:
  // 1. Subscription del usuario (guardada en BD)
  // 2. VAPID keys
  // 3. Servicio de notificaciones push
}
