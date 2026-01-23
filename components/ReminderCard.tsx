'use client'

import { useState, useEffect, useRef } from 'react'
import { Reminder, Category } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useI18n } from '@/hooks/useI18n'
import CompletionHistoryModal from './CompletionHistoryModal'
import LoadingSpinner from './LoadingSpinner'

interface ReminderCardProps {
  reminder: Reminder
  categories: Category[]
  onUpdate: () => void
  onEdit?: (reminder: Reminder) => void
}

export default function ReminderCard({ reminder, categories, onUpdate, onEdit }: ReminderCardProps) {
  const t = useI18n('es')
  const [loading, setLoading] = useState(false)
  const [completedLocal, setCompletedLocal] = useState(reminder.completed)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const isUpdatingRef = useRef(false)
  const lastReminderIdRef = useRef(reminder.id)
  const lastServerCompletedRef = useRef(reminder.completed)
  const category = categories.find((c) => c.id === reminder.categoryId)

  // Sync local state when server reminder changes
  useEffect(() => {
    const isNewReminder = lastReminderIdRef.current !== reminder.id
    if (isNewReminder) {
      lastReminderIdRef.current = reminder.id
      lastServerCompletedRef.current = reminder.completed
      isUpdatingRef.current = false
      setCompletedLocal(reminder.completed)
      return
    }
    
    const serverChanged = lastServerCompletedRef.current !== reminder.completed
    if (!isUpdatingRef.current && completedLocal !== reminder.completed && serverChanged) {
      lastServerCompletedRef.current = reminder.completed
      setCompletedLocal(reminder.completed)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminder.id, reminder.completed])

  const toggleCompleted = async () => {
    if (loading) return
    
    const isUnmarking = completedLocal
    
    isUpdatingRef.current = true
    setLoading(true)
    
    try {
      const requestBody = { completed: !isUnmarking }
      
      const response = await fetch(`/api/recordatorios/${reminder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const updatedReminder = await response.json()
        
        if (!isUnmarking) {
          setCompletedLocal(false)
          lastServerCompletedRef.current = false
        } else {
          setCompletedLocal(updatedReminder.completed)
          lastServerCompletedRef.current = updatedReminder.completed
        }
        
        setTimeout(() => {
          onUpdate()
          setTimeout(() => {
            isUpdatingRef.current = false
          }, 200)
        }, 300)
      } else {
        const errorData = await response.json().catch(() => ({}))
        isUpdatingRef.current = false
      }
    } catch (error) {
      isUpdatingRef.current = false
    } finally {
      setLoading(false)
    }
  }

  const toggleNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/recordatorios/${reminder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationsEnabled: !reminder.notificationsEnabled }),
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const deleteReminder = async () => {
    if (!confirm(t.reminderCard.deleteConfirm)) return

    setLoading(true)
    try {
      const response = await fetch(`/api/recordatorios/${reminder.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }


  const dueDate = new Date(reminder.dueDate)
  const today = new Date()
  const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isExpired = daysRemaining < 0 && !completedLocal
  
  const completionDate = reminder.completedAt ? new Date(reminder.completedAt) : null
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminder.id, reminder.completed])

  return (
    <>
      <div
        className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
          completedLocal
            ? 'border-green-300 bg-green-50/70 opacity-100'
            : isExpired
            ? 'border-red-200 bg-red-50/30'
            : daysRemaining <= 3
            ? 'border-orange-200 bg-orange-50/30'
            : 'border-gray-200'
        }`}
      >
        <div className="p-4 sm:p-5">
          {/* Header with title and action buttons */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3
                  className={`font-bold text-base sm:text-lg transition-all ${
                    completedLocal 
                      ? 'text-green-700' 
                      : 'text-gray-900'
                  }`}
                >
                  {reminder.title}
                </h3>
                {completedLocal && (
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Action buttons - top right */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Completed button */}
              <button
                onClick={toggleCompleted}
                disabled={loading}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-primary-500 to-indigo-600 text-white hover:from-primary-600 hover:to-indigo-700 whitespace-nowrap"
              >
                {loading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  t.reminderCard.completed
                )}
              </button>

              {/* Edit and Delete buttons */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                {onEdit && (
                  <button
                    onClick={() => onEdit(reminder)}
                    disabled={loading}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50"
                    title={t.common.edit}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={deleteReminder}
                  disabled={loading}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50"
                  title={t.common.delete}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="space-y-3">
            {reminder.description && (
              <p className={`text-sm ${
                completedLocal ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {reminder.description}
              </p>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
                  {category && (
                    <span
                      className="px-3 py-1 text-xs font-semibold rounded-full text-white shadow-sm"
                      style={{ 
                        backgroundColor: category.color,
                        boxShadow: `0 2px 8px ${category.color}40`
                      }}
                    >
                      {category.icon && <span className="mr-1">{category.icon}</span>}
                      {category.name}
                    </span>
                  )}
              {reminder.recurring && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                  🔄 {t.reminderCard.recurring}
                </span>
              )}
            </div>

            {/* Date and status */}
            <div className="flex items-center gap-2 sm:gap-4 text-sm flex-wrap">
              <div className="flex items-center gap-1.5 text-gray-600 flex-shrink-0">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-xs sm:text-sm">{format(dueDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
              </div>
              {!completedLocal && (
                <span
                  className={`px-2.5 py-1 rounded-lg font-semibold text-xs whitespace-nowrap ${
                    isExpired
                      ? 'bg-red-100 text-red-700'
                      : daysRemaining === 0
                      ? 'bg-orange-100 text-orange-700'
                      : daysRemaining <= 3
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {isExpired
                    ? `⚠️ ${t.reminderCard.expiredDaysAgo} ${Math.abs(daysRemaining)} ${t.reminderCard.days}`
                    : daysRemaining === 0
                    ? `⏰ ${t.reminderCard.dueToday}`
                    : daysRemaining === 1
                    ? `⏰ ${t.reminderCard.dueTomorrow}`
                    : `${daysRemaining} ${t.reminderCard.daysRemaining}`}
                </span>
              )}
            </div>
            
            {/* Completion info - simplified and clickeable */}
            {reminder.timesCompleted && reminder.timesCompleted > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="w-full p-3 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 hover:border-green-300 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-semibold text-green-800">
                    {t.reminderCard.completedTimes}
                  </span>
                  <svg className="w-4 h-4 text-green-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            )}

            {/* Notifications */}
            <div className="pt-3 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer group/notif">
                <input
                  type="checkbox"
                  checked={reminder.notificationsEnabled}
                  onChange={toggleNotifications}
                  disabled={loading}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-600 group-hover/notif:text-gray-900 transition-colors">
                  🔔 {t.reminderCard.notifications} {reminder.notificationsEnabled ? t.reminderCard.active : t.reminderCard.inactive}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Completion History Modal */}
      <CompletionHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        reminder={{
          id: reminder.id,
          title: reminder.title,
          timesCompleted: reminder.timesCompleted || 0,
          completionHistory: reminder.completionHistory,
          completedAt: reminder.completedAt || null,
          dueDate: reminder.dueDate,
        }}
        onUpdate={onUpdate}
        onEdit={() => {
          setShowHistoryModal(false)
          if (onEdit) onEdit(reminder)
        }}
        onDelete={() => {
          setShowHistoryModal(false)
          deleteReminder()
        }}
      />
    </>
  )
}
