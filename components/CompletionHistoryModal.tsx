'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useI18n } from '@/hooks/useI18n'
import LoadingSpinner from './LoadingSpinner'

interface CompletionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  reminder: {
    id: string
    title: string
    timesCompleted?: number
    completionHistory?: any
    completedAt?: string | null | undefined
    dueDate: string
  }
  onUpdate: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function CompletionHistoryModal({
  isOpen,
  onClose,
  reminder,
  onUpdate,
  onEdit,
  onDelete,
}: CompletionHistoryModalProps) {
  const t = useI18n('es')
  const [editingHistoryIndex, setEditingHistoryIndex] = useState<number | null>(null)
  const [editHistoryDate, setEditHistoryDate] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  let history: string[] = []
  if (reminder.completionHistory) {
    if (Array.isArray(reminder.completionHistory)) {
      history = reminder.completionHistory
    } else if (typeof reminder.completionHistory === 'string') {
      try {
        history = JSON.parse(reminder.completionHistory)
      } catch {
        history = []
      }
    } else if (typeof reminder.completionHistory === 'object') {
      try {
        history = Object.values(reminder.completionHistory) as string[]
      } catch {
        history = []
      }
    }
  }

  const updateHistory = async (newHistory: string[]) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/recordatorios/${reminder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          completionHistory: newHistory,
          timesCompleted: newHistory.length,
          completedAt: newHistory.length > 0 ? newHistory[newHistory.length - 1] : null,
        }),
      })

      if (response.ok) {
        onUpdate()
        setEditingHistoryIndex(null)
        setEditHistoryDate('')
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const deleteHistoryEntry = async (index: number) => {
    if (!confirm(t.reminderCard.deleteCompletionConfirm)) return
    
    const newHistory = history.filter((_, i) => i !== index)
    await updateHistory(newHistory)
  }

  const completionDate = reminder.completedAt ? new Date(reminder.completedAt) : null
  const dueDate = new Date(reminder.dueDate)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{reminder.title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {t.reminderCard.completedTimes} {reminder.timesCompleted || 0} {(reminder.timesCompleted || 0) === 1 ? t.reminderCard.time : t.reminderCard.times}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {completionDate && (
            <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm font-semibold text-green-800">
                {t.reminderCard.lastTime}
              </p>
              <p className="text-sm text-green-600 mt-1">
                {format(completionDate, "EEEE d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </div>
          )}

          {history.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {t.reminderCard.viewHistory}
              </h3>
              {[...history].reverse().map((fecha, originalIndex) => {
                try {
                  const fechaObj = new Date(fecha)
                  const actualIndex = history.length - 1 - originalIndex
                  const isEditing = editingHistoryIndex === originalIndex

                  return (
                    <div
                      key={originalIndex}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      {isEditing ? (
                        <>
                          <input
                            type="datetime-local"
                            value={editHistoryDate}
                            onChange={(e) => setEditHistoryDate(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            disabled={loading}
                          />
                          <button
                            onClick={async () => {
                              const newHistory = [...history]
                              newHistory[actualIndex] = new Date(editHistoryDate).toISOString()
                              await updateHistory(newHistory)
                            }}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            {loading ? <LoadingSpinner size="sm" /> : t.common.save}
                          </button>
                          <button
                            onClick={() => {
                              setEditingHistoryIndex(null)
                              setEditHistoryDate('')
                            }}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                          >
                            {t.common.cancel}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {format(fechaObj, "EEEE d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setEditingHistoryIndex(originalIndex)
                              setEditHistoryDate(new Date(fecha).toISOString().slice(0, 16))
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={t.reminderCard.editCompletion}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteHistoryEntry(actualIndex)}
                            disabled={loading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title={t.reminderCard.deleteCompletion}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  )
                } catch {
                  return null
                }
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No hay historial disponible</p>
            </div>
          )}

          <div className="mt-6 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">{t.reminderCard.dueOn}</span>{' '}
              {format(dueDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t.common.edit}
          </button>
          <button
            onClick={onDelete}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t.common.delete}
          </button>
        </div>
      </div>
    </div>
  )
}
