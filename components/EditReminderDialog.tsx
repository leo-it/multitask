'use client'

import { useState, useEffect } from 'react'
import { Reminder, Category } from '@/types'
import { useI18n } from '@/hooks/useI18n'

interface EditReminderDialogProps {
  reminder: Reminder
  categories: Category[]
  onClose: () => void
  onSuccess: () => void
}

export default function EditReminderDialog({
  reminder,
  categories,
  onClose,
  onSuccess,
}: EditReminderDialogProps) {
  const t = useI18n('es')
  const [title, setTitle] = useState(reminder.title)
  const [description, setDescription] = useState(reminder.description || '')
  const [dueDate, setDueDate] = useState(
    reminder.dueDate ? new Date(reminder.dueDate).toISOString().split('T')[0] : ''
  )
  const [categoryId, setCategoryId] = useState<string>(reminder.categoryId || '')
  const [notificationsActive, setNotificationsActive] = useState(reminder.notificationsEnabled)
  const [reminderFrequency, setReminderFrequency] = useState(reminder.reminderFrequency)
  const [recurring, setRecurring] = useState(reminder.recurring)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(reminder.recurrenceFrequency || 'WEEKLY')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setTitle(reminder.title)
    setDescription(reminder.description || '')
    setDueDate(
      reminder.dueDate ? new Date(reminder.dueDate).toISOString().split('T')[0] : ''
    )
    setCategoryId(reminder.categoryId || '')
    setNotificationsActive(reminder.notificationsEnabled)
    setReminderFrequency(reminder.reminderFrequency)
    setRecurring(reminder.recurring)
    setRecurrenceFrequency(reminder.recurrenceFrequency || 'WEEKLY')
  }, [reminder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title) {
      setError(t.createReminder.titleRequired)
      return
    }

    if (!recurring && !dueDate) {
      setError(t.createReminder.dueDateRequired)
      return
    }

    setLoading(true)
    try {
      let dueDateISO: string | null = null
      if (!recurring && dueDate) {
        const date = new Date(dueDate)
        dueDateISO = date.toISOString()
      }

      const response = await fetch(`/api/recordatorios/${reminder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description: description || null,
          dueDate: dueDateISO,
          categoryId: categoryId || null,
          notificationsEnabled: notificationsActive,
          reminderFrequency,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || t.editReminder.updateError)
        return
      }

      onSuccess()
      onClose()
    } catch (error) {
      setError(t.editReminder.updateError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200 animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {t.editReminder.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{t.editReminder.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.createReminder.titleLabel}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                placeholder={t.createReminder.titlePlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.createReminder.descriptionLabel}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none bg-white/50 backdrop-blur-sm"
                placeholder={t.createReminder.descriptionPlaceholder}
              />
            </div>

            {!recurring && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.createReminder.dueDateLabel}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required={!recurring}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.createReminder.categoryLabel}
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white/50 backdrop-blur-sm font-medium"
              >
                <option value="">{t.createReminder.noCategory}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.createReminder.reminderFrequencyLabel}
              </label>
              <select
                value={reminderFrequency}
                onChange={(e) => setReminderFrequency(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white/50 backdrop-blur-sm font-medium"
              >
                <option value="DAILY">{t.createReminder.daily}</option>
                <option value="WEEKLY">{t.createReminder.weekly}</option>
                <option value="MONTHLY">{t.createReminder.monthly}</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notificaciones-edit"
                  checked={notificationsActive}
                  onChange={(e) => setNotificationsActive(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="notificaciones-edit" className="text-sm text-gray-700">
                  {t.createReminder.enableNotifications}
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t.editReminder.updating}
                  </span>
                ) : t.editReminder.updateButton}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
