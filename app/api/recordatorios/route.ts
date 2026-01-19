import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reminderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  notificationsEnabled: z.boolean().default(true),
  reminderFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).default('DAILY'),
  recurring: z.boolean().default(false),
  recurrenceFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']).optional().nullable(),
}).refine((data) => {
  if (data.recurring && !data.recurrenceFrequency) {
    return false
  }
  if (!data.recurring && (!data.dueDate || data.dueDate.trim() === '')) {
    return false
  }
  return true
}, {
  message: "Recurring reminders need frequency, non-recurring need due date",
  path: ['dueDate']
})

export async function GET() {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const expiredReminders = await prisma.reminder.findMany({
      where: {
        userId: session.user.id,
        completed: true,
        dueDate: {
          lt: today
        }
      }
    })

    for (const reminder of expiredReminders) {
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          completed: false,
          completedAt: null,
        } as any
      })
    }

    const reminders = await prisma.reminder.findMany({
      where: { userId: session.user.id },
      include: { category: true },
      orderBy: [
        { completed: 'asc' },
        { dueDate: 'asc' },
      ],
    })

    const uniqueReminders = reminders.reduce((acc, reminder) => {
      const reminderWithHistory = reminder as typeof reminder & { timesCompleted?: number }
      
      if (reminderWithHistory.recurring) {
        const existing = acc.find(
          (r) => r.title === reminderWithHistory.title && r.recurring
        ) as typeof reminderWithHistory | undefined
        
        if (!existing) {
          acc.push(reminderWithHistory)
        } else {
          const existingWithHistory = existing as typeof reminderWithHistory
          if (
            !reminderWithHistory.parentReminderId ||
            (reminderWithHistory.timesCompleted || 0) > (existingWithHistory.timesCompleted || 0)
          ) {
            const index = acc.indexOf(existing)
            acc[index] = reminderWithHistory
          }
        }
      } else {
        acc.push(reminderWithHistory)
      }
      
      return acc
    }, [] as (typeof reminders[0] & { timesCompleted?: number })[])

    const sortedReminders = uniqueReminders.sort((a, b) => {
      const reminderA = a as typeof a & { timesCompleted?: number }
      const reminderB = b as typeof b & { timesCompleted?: number }
      
      const aHasHistory = reminderA.timesCompleted && reminderA.timesCompleted > 0
      const bHasHistory = reminderB.timesCompleted && reminderB.timesCompleted > 0
      
      const aIsCompleted = a.completed === true || aHasHistory
      const bIsCompleted = b.completed === true || bHasHistory
      
      if (aIsCompleted !== bIsCompleted) {
        return aIsCompleted === true ? 1 : -1
      }
      return a.dueDate.getTime() - b.dueDate.getTime()
    })

    return NextResponse.json(sortedReminders)
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = reminderSchema.parse(body)

    let dueDate: Date
    
    if (data.recurring && data.recurrenceFrequency) {
      const today = new Date()
      
      if (data.recurrenceFrequency === 'DAILY') {
        dueDate = new Date(today)
        dueDate.setDate(dueDate.getDate() + 1)
      } else if (data.recurrenceFrequency === 'WEEKLY') {
        dueDate = new Date(today)
        const dayOfWeek = dueDate.getDay()
        const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek
        dueDate.setDate(dueDate.getDate() + daysUntilSunday)
      } else if (data.recurrenceFrequency === 'MONTHLY') {
        dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        if (dueDate < today) {
          dueDate = new Date(today.getFullYear(), today.getMonth() + 2, 0)
        }
      } else {
        dueDate = new Date(today)
      }
    } else {
      dueDate = new Date(data.dueDate!)
    }

    let nextNotification: Date | null = null

    if (data.notificationsEnabled) {
      const today = new Date()
      if (data.reminderFrequency === 'DAILY') {
        nextNotification = new Date(today)
        nextNotification.setDate(nextNotification.getDate() + 1)
      } else if (data.reminderFrequency === 'WEEKLY') {
        nextNotification = new Date(today)
        nextNotification.setDate(nextNotification.getDate() + 7)
      } else if (data.reminderFrequency === 'MONTHLY') {
        nextNotification = new Date(today)
        nextNotification.setMonth(nextNotification.getMonth() + 1)
      }
    }

    if (data.recurring) {
      const existing = await prisma.reminder.findFirst({
        where: {
          userId: session.user.id,
          title: data.title,
          recurring: true,
          parentReminderId: null,
        },
      })

      if (existing) {
        const updated = await prisma.reminder.update({
          where: { id: existing.id },
          data: {
            description: data.description,
            dueDate,
            categoryId: data.categoryId,
            notificationsEnabled: data.notificationsEnabled,
            reminderFrequency: data.reminderFrequency,
            recurrenceFrequency: data.recurrenceFrequency,
            nextNotification,
          },
          include: { category: true },
        })
        return NextResponse.json(updated, { status: 200 })
      }
    }

    const reminder = await prisma.reminder.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate,
        categoryId: data.categoryId,
        notificationsEnabled: data.notificationsEnabled,
        reminderFrequency: data.reminderFrequency,
        recurring: data.recurring,
        recurrenceFrequency: data.recurring ? data.recurrenceFrequency : null,
        nextNotification,
        userId: session.user.id,
      },
      include: { category: true },
    })

    return NextResponse.json(reminder, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error creating reminder' },
      { status: 500 }
    )
  }
}
