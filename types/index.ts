export interface Category {
  id: string
  name: string
  color: string
  icon?: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Reminder {
  id: string
  title: string
  description?: string | null
  dueDate: string
  categoryId?: string | null
  userId: string
  completed: boolean
  completedAt?: string | null
  timesCompleted?: number
  completionHistory?: string[]
  notificationsEnabled: boolean
  reminderFrequency: string
  recurring: boolean
  recurrenceFrequency?: string | null
  parentReminderId?: string | null
  lastNotification?: string | null
  nextNotification?: string | null
  createdAt: string
  updatedAt: string
  colorPostit?: string | null
  category?: Category | null
}
