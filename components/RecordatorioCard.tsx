'use client'

import { useState, useEffect, useRef } from 'react'
import { Recordatorio, Categoria } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useI18n } from '@/hooks/useI18n'

interface RecordatorioCardProps {
  recordatorio: Recordatorio
  categorias: Categoria[]
  onUpdate: () => void
  onEdit?: (recordatorio: Recordatorio) => void
}

export default function RecordatorioCard({ recordatorio, categorias, onUpdate, onEdit }: RecordatorioCardProps) {
  const t = useI18n('es')
  const [loading, setLoading] = useState(false)
  const [completedLocal, setCompletedLocal] = useState(recordatorio.completado)
  const [editingHistoryIndex, setEditingHistoryIndex] = useState<number | null>(null)
  const [editHistoryDate, setEditHistoryDate] = useState('')
  const isUpdatingRef = useRef(false)
  const lastReminderIdRef = useRef(recordatorio.id)
  const lastServerCompletedRef = useRef(recordatorio.completado)
  const categoria = categorias.find((c) => c.id === recordatorio.categoriaId)

  // Sync local state when server reminder changes
  useEffect(() => {
    const isNewReminder = lastReminderIdRef.current !== recordatorio.id
    if (isNewReminder) {
      lastReminderIdRef.current = recordatorio.id
      lastServerCompletedRef.current = recordatorio.completado
      isUpdatingRef.current = false
      setCompletedLocal(recordatorio.completado)
      return
    }
    
    // Only sync if:
    // 1. Not currently updating
    // 2. Server state differs from local
    // 3. Server state differs from last known server state
    // This prevents infinite loops when server hasn't processed update yet
    const serverChanged = lastServerCompletedRef.current !== recordatorio.completado
    if (!isUpdatingRef.current && completedLocal !== recordatorio.completado && serverChanged) {
      console.log('🔄 Syncing local state with server:', {
        id: recordatorio.id,
        serverCompleted: recordatorio.completado,
        localCompleted: completedLocal,
        completionDate: recordatorio.fechaCompletado
      })
      lastServerCompletedRef.current = recordatorio.completado
      setCompletedLocal(recordatorio.completado)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordatorio.id, recordatorio.completado])

  const toggleCompleted = async () => {
    if (loading) return
    
    const isUnmarking = completedLocal
    
    console.log('🔄 Frontend:', isUnmarking ? 'Unmarking' : 'Adding to history')
    console.log('📋 Reminder ID:', recordatorio.id)
    
    isUpdatingRef.current = true
    setLoading(true)
    
    try {
      const requestBody = { completado: !isUnmarking }
      console.log('📤 Frontend: Sending request:', JSON.stringify(requestBody, null, 2))
      
      const response = await fetch(`/api/recordatorios/${recordatorio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })

      console.log('📥 Frontend: Response status:', response.status, response.statusText)

      if (response.ok) {
        const updatedReminder = await response.json()
        console.log('✅ Frontend: Reminder updated:', JSON.stringify({
          id: updatedReminder.id,
          completado: updatedReminder.completado,
          vecesCompletado: updatedReminder.vecesCompletado,
        }, null, 2))
        
        if (!isUnmarking) {
          setCompletedLocal(false)
          lastServerCompletedRef.current = false
        } else {
          setCompletedLocal(updatedReminder.completado)
          lastServerCompletedRef.current = updatedReminder.completado
        }
        
        setTimeout(() => {
          console.log('🔄 Reloading data...')
          onUpdate()
          setTimeout(() => {
            isUpdatingRef.current = false
          }, 200)
        }, 300)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Frontend: Error updating reminder:', errorData)
        isUpdatingRef.current = false
      }
    } catch (error) {
      console.error('❌ Frontend: Request error:', error)
      isUpdatingRef.current = false
    } finally {
      setLoading(false)
    }
  }

  const toggleNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/recordatorios/${recordatorio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificacionesActivas: !recordatorio.notificacionesActivas }),
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteReminder = async () => {
    if (!confirm(t.reminderCard.deleteConfirm)) return

    setLoading(true)
    try {
      const response = await fetch(`/api/recordatorios/${recordatorio.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error deleting reminder:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateHistory = async (newHistory: string[]) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/recordatorios/${recordatorio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          historialCompletados: newHistory,
          vecesCompletado: newHistory.length,
          fechaCompletado: newHistory.length > 0 ? newHistory[newHistory.length - 1] : null,
        }),
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating history:', error)
    } finally {
      setLoading(false)
    }
  }

  const dueDate = new Date(recordatorio.fechaVencimiento)
  const today = new Date()
  const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const isExpired = daysRemaining < 0 && !completedLocal
  
  const completionDate = recordatorio.fechaCompletado ? new Date(recordatorio.fechaCompletado) : null
  
  useEffect(() => {
    if (lastReminderIdRef.current !== recordatorio.id || 
        lastServerCompletedRef.current !== recordatorio.completado) {
      console.log('📊 Reminder state:', {
        id: recordatorio.id,
        serverCompleted: recordatorio.completado,
        localCompleted: completedLocal,
        completionDate: recordatorio.fechaCompletado,
        isUpdating: isUpdatingRef.current
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordatorio.id, recordatorio.completado])

  return (
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
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Completed button */}
          <div className="flex-shrink-0">
            <button
              onClick={toggleCompleted}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-primary-500 to-indigo-600 text-white hover:from-primary-600 hover:to-indigo-700"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>...</span>
                </span>
              ) : (
                t.reminderCard.completed
              )}
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3
                    className={`font-bold text-lg transition-all ${
                      completedLocal 
                        ? 'text-green-700' 
                        : 'text-gray-900'
                    }`}
                  >
                    {recordatorio.titulo}
                  </h3>
                  {completedLocal && (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                
                {recordatorio.descripcion && (
                  <p className={`text-sm mb-3 ${
                    completedLocal ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {recordatorio.descripcion}
                  </p>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {categoria && (
                    <span
                      className="px-3 py-1 text-xs font-semibold rounded-full text-white shadow-sm"
                      style={{ 
                        backgroundColor: categoria.color,
                        boxShadow: `0 2px 8px ${categoria.color}40`
                      }}
                    >
                      {categoria.icono && <span className="mr-1">{categoria.icono}</span>}
                      {categoria.nombre}
                    </span>
                  )}
                  {recordatorio.recurrente && (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
                      🔄 {t.reminderCard.recurring}
                    </span>
                  )}
                </div>

                {/* Date and status */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{format(dueDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
                  </div>
                  {!completedLocal && (
                    <span
                      className={`px-2.5 py-1 rounded-lg font-semibold text-xs ${
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
                  {completedLocal && completionDate && (
                    <span className="px-2.5 py-1 rounded-lg font-semibold text-xs bg-green-100 text-green-700">
                      ✓ {t.reminderCard.completedOn} {format(completionDate, "EEEE d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </span>
                  )}
                </div>
                
                {/* Completion info with counter and history */}
                {recordatorio.vecesCompletado && recordatorio.vecesCompletado > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-800">
                          ✓ {t.reminderCard.completedTimes} {recordatorio.vecesCompletado} {recordatorio.vecesCompletado === 1 ? t.reminderCard.time : t.reminderCard.times}
                        </p>
                        {completionDate && (
                          <p className="text-xs text-green-600 mt-0.5">
                            {t.reminderCard.lastTime} {format(completionDate, "EEEE d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                          </p>
                        )}
                        {(() => {
                          let history: string[] = []
                          if (recordatorio.historialCompletados) {
                            if (Array.isArray(recordatorio.historialCompletados)) {
                              history = recordatorio.historialCompletados
                            } else if (typeof recordatorio.historialCompletados === 'string') {
                              try {
                                history = JSON.parse(recordatorio.historialCompletados)
                              } catch {
                                history = []
                              }
                            } else if (typeof recordatorio.historialCompletados === 'object') {
                              try {
                                history = Object.values(recordatorio.historialCompletados) as string[]
                              } catch {
                                history = []
                              }
                            }
                          }
                          
                          return history.length > 0 ? (
                            <details className="mt-2">
                              <summary className="text-xs font-medium text-green-700 cursor-pointer hover:text-green-800">
                                {t.reminderCard.viewHistory} ({history.length} {history.length === 1 ? t.reminderCard.time : t.reminderCard.times})
                              </summary>
                              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                {[...history].reverse().map((fecha, originalIndex) => {
                                  try {
                                    const fechaObj = new Date(fecha)
                                    const actualIndex = history.length - 1 - originalIndex
                                    const isEditing = editingHistoryIndex === originalIndex
                                    
                                    return (
                                      <div key={originalIndex} className="flex items-center gap-2 group/item pl-2 border-l-2 border-green-200">
                                        {isEditing ? (
                                          <>
                                            <input
                                              type="datetime-local"
                                              value={editHistoryDate}
                                              onChange={(e) => setEditHistoryDate(e.target.value)}
                                              className="flex-1 text-xs px-2 py-1 border border-green-300 rounded"
                                            />
                                            <button
                                              onClick={async () => {
                                                const newHistory = [...history]
                                                newHistory[actualIndex] = new Date(editHistoryDate).toISOString()
                                                await updateHistory(newHistory)
                                                setEditingHistoryIndex(null)
                                                setEditHistoryDate('')
                                              }}
                                              className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                              {t.reminderHistory.save}
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingHistoryIndex(null)
                                                setEditHistoryDate('')
                                              }}
                                              className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                            >
                                              {t.common.cancel}
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <p className="flex-1 text-xs text-green-600">
                                              {format(fechaObj, "EEEE d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                                            </p>
                                            <button
                                              onClick={() => {
                                                setEditingHistoryIndex(originalIndex)
                                                setEditHistoryDate(new Date(fecha).toISOString().slice(0, 16))
                                              }}
                                              className="opacity-0 group-hover/item:opacity-100 text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                                              title={t.reminderHistory.edit}
                                            >
                                              ✏️
                                            </button>
                                            <button
                                              onClick={async () => {
                                                if (confirm(t.reminderHistory.deleteConfirm)) {
                                                  const newHistory = history.filter((_, i) => i !== actualIndex)
                                                  await updateHistory(newHistory)
                                                }
                                              }}
                                              className="opacity-0 group-hover/item:opacity-100 text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-all"
                                              title={t.reminderHistory.delete}
                                            >
                                              🗑️
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
                            </details>
                          ) : null
                        })()}
                        <p className="text-xs text-green-600 mt-2">
                          {t.reminderCard.dueOn} {format(dueDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer group/notif">
                    <input
                      type="checkbox"
                      checked={recordatorio.notificacionesActivas}
                      onChange={toggleNotifications}
                      disabled={loading}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-gray-600 group-hover/notif:text-gray-900 transition-colors">
                      🔔 {t.reminderCard.notifications} {recordatorio.notificacionesActivas ? t.reminderCard.active : t.reminderCard.inactive}
                    </span>
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                {onEdit && (
                  <button
                    onClick={() => onEdit(recordatorio)}
                    disabled={loading}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50"
                    title={t.common.edit}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={deleteReminder}
                  disabled={loading}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50"
                  title={t.common.delete}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
