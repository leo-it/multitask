import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const categoriaSchema = z.object({
  nombre: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icono: z.string().optional().nullable(),
})

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categorias = await prisma.categoria.findMany({
      where: { userId: session.user.id },
      orderBy: { nombre: 'asc' },
    })

    return NextResponse.json(categorias)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = categoriaSchema.parse(body)

    const categoria = await prisma.categoria.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    })

    return NextResponse.json(categoria, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error creating category' },
      { status: 500 }
    )
  }
}
