import { NextResponse } from 'next/server'
import { procesarNotificaciones } from '@/lib/notificaciones'

// Este endpoint puede ser llamado por un cron job o servicio externo
// para procesar las notificaciones pendientes
export async function POST(request: Request) {
  try {
    // Verificar autenticación (opcional, puede ser un secret key)
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.NOTIFICACIONES_SECRET

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const cantidad = await procesarNotificaciones()

    return NextResponse.json({
      message: 'Notificaciones procesadas',
      cantidad,
    })
  } catch (error) {
    console.error('Error procesando notificaciones:', error)
    return NextResponse.json(
      { error: 'Error al procesar notificaciones' },
      { status: 500 }
    )
  }
}
