import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  dueDate: z.string().datetime().optional(),
  categoryId: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  notificationsEnabled: z.boolean().optional(),
  reminderFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional(),
  completionHistory: z.array(z.string()).optional(),
  timesCompleted: z.number().int().min(0).optional(),
  completedAt: z.string().datetime().nullable().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reminder = await prisma.reminder.findUnique({
      where: { id: params.id },
    })

    if (!reminder || reminder.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const reminderWithHistory = reminder as typeof reminder & {
      completionHistory?: string[] | object | null
      timesCompleted?: number
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    const updateData: any = { ...data }

    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate)
    }

    const isDirectHistoryUpdate = data.completionHistory !== undefined
    
    if (isDirectHistoryUpdate && data.completionHistory !== undefined) {
      updateData.completionHistory = data.completionHistory
      if (data.completedAt) {
        updateData.completedAt = new Date(data.completedAt)
      } else if (data.completionHistory.length === 0) {
        updateData.completedAt = null
      } else {
        updateData.completedAt = new Date(data.completionHistory[data.completionHistory.length - 1])
      }
    }

    if (!isDirectHistoryUpdate && data.completed !== undefined && data.completed === true) {
      const completedAt = new Date()
      
      let currentHistory: string[] = []
      if (reminderWithHistory.completionHistory) {
        if (typeof reminderWithHistory.completionHistory === 'string') {
          try {
            currentHistory = JSON.parse(reminderWithHistory.completionHistory)
          } catch {
            currentHistory = []
          }
        } else if (Array.isArray(reminderWithHistory.completionHistory)) {
          currentHistory = reminderWithHistory.completionHistory as string[]
        } else if (typeof reminderWithHistory.completionHistory === 'object') {
          try {
            currentHistory = Object.values(reminderWithHistory.completionHistory) as string[]
          } catch {
            currentHistory = []
          }
        }
      }
      
      const newHistory = [...currentHistory, completedAt.toISOString()]
      
      updateData.completionHistory = newHistory
      updateData.timesCompleted = (reminderWithHistory.timesCompleted || 0) + 1
      updateData.completedAt = completedAt
      delete updateData.completed
    } else if (data.completed !== undefined && data.completed === false) {
      updateData.completedAt = null
      updateData.completed = false
    }

    if (data.notificationsEnabled !== undefined || data.reminderFrequency) {
      const notificationsEnabled = data.notificationsEnabled ?? reminderWithHistory.notificationsEnabled
      const frequency = data.reminderFrequency ?? reminderWithHistory.reminderFrequency

      if (notificationsEnabled) {
        const today = new Date()
        let nextNotification: Date | null = null

        if (frequency === 'DAILY') {
          nextNotification = new Date(today)
          nextNotification.setDate(nextNotification.getDate() + 1)
        } else if (frequency === 'WEEKLY') {
          nextNotification = new Date(today)
          nextNotification.setDate(nextNotification.getDate() + 7)
        } else if (frequency === 'MONTHLY') {
          nextNotification = new Date(today)
          nextNotification.setMonth(nextNotification.getMonth() + 1)
        }

        updateData.nextNotification = nextNotification
      } else {
        updateData.nextNotification = null
      }
    }
    
    const prismaUpdateData: any = {}
    
    if (updateData.title !== undefined) prismaUpdateData.title = updateData.title
    if (updateData.description !== undefined) prismaUpdateData.description = updateData.description
    if (updateData.dueDate !== undefined) prismaUpdateData.dueDate = updateData.dueDate
    if (updateData.categoryId !== undefined) prismaUpdateData.categoryId = updateData.categoryId
    if (updateData.completed !== undefined) prismaUpdateData.completed = updateData.completed
    if (updateData.completedAt !== undefined) prismaUpdateData.completedAt = updateData.completedAt
    if (updateData.completionHistory !== undefined) prismaUpdateData.completionHistory = updateData.completionHistory
    if (updateData.timesCompleted !== undefined) prismaUpdateData.timesCompleted = updateData.timesCompleted
    if (updateData.notificationsEnabled !== undefined) prismaUpdateData.notificationsEnabled = updateData.notificationsEnabled
    if (updateData.reminderFrequency !== undefined) prismaUpdateData.reminderFrequency = updateData.reminderFrequency
    if (updateData.nextNotification !== undefined) prismaUpdateData.nextNotification = updateData.nextNotification
    
    const updated = await prisma.reminder.update({
      where: { id: params.id },
      data: prismaUpdateData as any,
      include: { category: true },
    })
    
    const updatedReminder = updated as typeof updated & {
      completedAt?: Date | null
      completionHistory?: string[] | object | null
      timesCompleted?: number
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Error updating reminder',
        message: error instanceof Error ? error.message : 'Unknown error',
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reminder = await prisma.reminder.findUnique({
      where: { id: params.id },
    })

    if (!reminder || reminder.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.reminder.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Reminder deleted' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error deleting reminder' },
      { status: 500 }
    )
  }
}
