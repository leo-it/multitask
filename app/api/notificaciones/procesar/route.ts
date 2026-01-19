import { NextResponse } from 'next/server'
import { procesarNotificaciones } from '@/lib/notificaciones'

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedSecret = process.env.NOTIFICACIONES_SECRET

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cantidad = await procesarNotificaciones()

    return NextResponse.json({
      message: 'Notificaciones procesadas',
      cantidad,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error processing notifications' },
      { status: 500 }
    )
  }
}
