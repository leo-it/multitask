import { prisma } from './prisma'

export async function procesarNotificaciones() {
  const now = new Date()

  const reminders = await prisma.reminder.findMany({
    where: {
      notificationsEnabled: true,
      completed: false,
      OR: [
        {
          nextNotification: {
            lte: now,
          },
        },
        {
          dueDate: {
            lte: now,
          },
          lastNotification: {
            OR: [
              null,
              {
                lt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
              },
            ],
          },
        },
      ],
    },
    include: {
      category: true,
      user: true,
    },
  })

  for (const reminder of reminders) {
    let nextNotification: Date | null = null

    if (reminder.reminderFrequency === 'DAILY') {
      nextNotification = new Date(now)
      nextNotification.setDate(nextNotification.getDate() + 1)
    } else if (reminder.reminderFrequency === 'WEEKLY') {
      nextNotification = new Date(now)
      nextNotification.setDate(nextNotification.getDate() + 7)
    } else if (reminder.reminderFrequency === 'MONTHLY') {
      nextNotification = new Date(now)
      nextNotification.setMonth(nextNotification.getMonth() + 1)
    }

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        lastNotification: now,
        nextNotification,
      },
    })
  }

  return reminders.length
}

async function enviarNotificacionPush(user: any, reminder: any) {
}
