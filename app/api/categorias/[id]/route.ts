import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const categoria = await prisma.categoria.findUnique({
      where: { id: params.id },
    })

    if (!categoria || categoria.userId !== session.user.id) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    await prisma.categoria.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Categoría eliminada' })
  } catch (error) {
    console.error('Error eliminando categoría:', error)
    return NextResponse.json(
      { error: 'Error al eliminar categoría' },
      { status: 500 }
    )
  }
}
