'use client'

import { useState } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO, subWeeks, addWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import { Reminder, Category } from '@/types'
import { useI18n } from '@/hooks/useI18n'

interface WeeklyCompletedViewProps {
  reminders: Reminder[]
  categories: Category[]
  selectedDate: Date
  onDateChange?: (date: Date) => void
  onUpdate?: () => void
}

interface CompletedItem {
  reminder: Reminder
  completedDate: Date
  completedAt: string
}

export default function WeeklyCompletedView({
  reminders,
  categories,
  selectedDate,
  onDateChange,
  onUpdate,
}: WeeklyCompletedViewProps) {
  const t = useI18n('es')
  const [editingItem, setEditingItem] = useState<{ reminderId: string; completedAt: string } | null>(null)
  const [editingDate, setEditingDate] = useState('')
  const [editingTime, setEditingTime] = useState('')

  const fechaLocal = new Date(selectedDate)
  fechaLocal.setHours(0, 0, 0, 0)
  
  const diaSemanaLocal = fechaLocal.getDay()
  const diasDesdeLunes = diaSemanaLocal === 0 ? 6 : diaSemanaLocal - 1
  const inicioSemana = new Date(fechaLocal)
  inicioSemana.setDate(inicioSemana.getDate() - diasDesdeLunes)
  
  const finSemana = new Date(inicioSemana)
  finSemana.setDate(finSemana.getDate() + 6)
  
  const dias = Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(inicioSemana)
    dia.setDate(dia.getDate() + i)
    return dia
  })

  const completedItems: CompletedItem[] = []
  
  reminders.forEach((reminder) => {
    if (!reminder.completionHistory || reminder.timesCompleted === 0) return
    
    let history: string[] = []
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

    history.forEach((completedAt) => {
      const completedDate = new Date(completedAt)
      completedDate.setHours(0, 0, 0, 0)
      
      const inicioSemanaNormalizado = new Date(inicioSemana)
      inicioSemanaNormalizado.setHours(0, 0, 0, 0)
      const finSemanaNormalizado = new Date(finSemana)
      finSemanaNormalizado.setHours(23, 59, 59, 999)
      
      if (completedDate >= inicioSemanaNormalizado && completedDate <= finSemanaNormalizado) {
        completedItems.push({
          reminder,
          completedDate,
          completedAt,
        })
      }
    })
  })

  const itemsPorDia = dias.map((dia) => {
    const diaNormalizado = new Date(dia)
    diaNormalizado.setHours(0, 0, 0, 0)
    
    return completedItems.filter((item) => {
      const itemDate = new Date(item.completedDate)
      itemDate.setHours(0, 0, 0, 0)
      return itemDate.getTime() === diaNormalizado.getTime()
    })
  })

  const mismoMes = dias.every(dia => format(dia, 'MMM yyyy', { locale: es }) === format(inicioSemana, 'MMM yyyy', { locale: es }))

  const getCategory = (reminder: Reminder) => {
    return categories.find((c) => c.id === reminder.categoryId)
  }

  const handlePreviousWeek = () => {
    const nuevaFecha = subWeeks(selectedDate, 1)
    onDateChange?.(nuevaFecha)
  }

  const handleNextWeek = () => {
    const nuevaFecha = addWeeks(selectedDate, 1)
    onDateChange?.(nuevaFecha)
  }

  const handleToday = () => {
    onDateChange?.(new Date())
  }

  const isCurrentWeek = () => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const inicioSemanaHoy = new Date(hoy)
    const diaSemanaHoy = inicioSemanaHoy.getDay()
    const diasDesdeLunesHoy = diaSemanaHoy === 0 ? 6 : diaSemanaHoy - 1
    inicioSemanaHoy.setDate(inicioSemanaHoy.getDate() - diasDesdeLunesHoy)
    
    return inicioSemana.getTime() === inicioSemanaHoy.getTime()
  }

  const deleteCompletionEntry = async (reminderId: string, completedAt: string) => {
    if (!confirm(t.reminderCard.deleteCompletionConfirm)) return

    const reminder = reminders.find(r => r.id === reminderId)
    if (!reminder) return

    let currentHistory: string[] = []
    if (reminder.completionHistory) {
      if (typeof reminder.completionHistory === 'string') {
        try {
          currentHistory = JSON.parse(reminder.completionHistory)
        } catch {
          currentHistory = []
        }
      } else if (Array.isArray(reminder.completionHistory)) {
        currentHistory = reminder.completionHistory as string[]
      }
    }

    const newHistory = currentHistory.filter(entry => entry !== completedAt)

    try {
      const response = await fetch(`/api/recordatorios/${reminderId}`, {
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
        onUpdate?.()
      }
    } catch (error) {
    }
  }

  const startEditing = (reminderId: string, completedAt: string) => {
    const completedDate = new Date(completedAt)
    setEditingItem({ reminderId, completedAt })
    setEditingDate(completedDate.toISOString().split('T')[0])
    setEditingTime(format(completedDate, 'HH:mm'))
  }

  const saveEdit = async () => {
    if (!editingItem) return

    const reminder = reminders.find(r => r.id === editingItem.reminderId)
    if (!reminder) return

    let currentHistory: string[] = []
    if (reminder.completionHistory) {
      if (typeof reminder.completionHistory === 'string') {
        try {
          currentHistory = JSON.parse(reminder.completionHistory)
        } catch {
          currentHistory = []
        }
      } else if (Array.isArray(reminder.completionHistory)) {
        currentHistory = reminder.completionHistory as string[]
      }
    }

    const [hours, minutes] = editingTime.split(':').map(Number)
    const newDate = new Date(editingDate)
    newDate.setHours(hours, minutes, 0, 0)
    const newCompletedAt = newDate.toISOString()

    const newHistory = currentHistory.map(entry => 
      entry === editingItem.completedAt ? newCompletedAt : entry
    ).sort()

    try {
      const response = await fetch(`/api/recordatorios/${editingItem.reminderId}`, {
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
        setEditingItem(null)
        onUpdate?.()
      }
    } catch (error) {
    }
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setEditingDate('')
    setEditingTime('')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gray-50 border-b px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handlePreviousWeek}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            aria-label={t.dashboard.previousWeek}
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex-1 text-center">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">
              {mismoMes ? (
                `${format(inicioSemana, 'd', { locale: es })} - ${format(finSemana, "d 'de' MMMM 'de' yyyy", { locale: es })}`
              ) : (
                `${format(inicioSemana, "d 'de' MMMM", { locale: es })} - ${format(finSemana, "d 'de' MMMM 'de' yyyy", { locale: es })}`
              )}
            </h2>
            {!isCurrentWeek() && (
              <button
                onClick={handleToday}
                className="mt-1 text-xs text-primary-600 hover:text-primary-700 font-medium underline"
              >
                {t.dashboard.today}
              </button>
            )}
          </div>
          
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
            aria-label={t.dashboard.nextWeek}
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Desktop: Grid 7 columnas */}
      <div className="hidden md:grid md:grid-cols-7 border-b">
        {dias.map((dia) => (
          <div
            key={dia.toISOString()}
            className={`p-4 text-center border-r last:border-r-0 ${
              isSameDay(dia, new Date())
                ? 'bg-primary-50'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <div className="text-sm text-gray-600">
                  {format(dia, 'EEE', { locale: es })}
                </div>
                <div className={`text-lg mt-1 font-semibold ${
                  isSameDay(dia, new Date())
                    ? 'text-primary-600'
                    : 'text-gray-400'
                }`}>
                  {format(dia, 'd')}
                </div>
                {!mismoMes && (
                  <div className="text-xs text-gray-500 mt-1">
                    {format(dia, 'MMM', { locale: es })}
                  </div>
                )}
              </div>
              <button
                onClick={() => onDateChange?.(dia)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md group"
                title="Agregar tarea completada"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Desktop: Contenido 7 columnas */}
      <div className="hidden md:grid md:grid-cols-7 min-h-[400px]">
        {dias.map((dia, index) => {
          const itemsDelDia = itemsPorDia[index]

          return (
            <div
              key={dia.toISOString()}
              className="border-r last:border-r-0 p-2 min-h-[400px] relative group"
            >
              {itemsDelDia.length === 0 && (
                <button
                  onClick={() => onDateChange?.(dia)}
                  className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all rounded-lg border-2 border-dashed border-transparent hover:border-primary-200"
                >
                  <svg className="w-8 h-8 mb-2 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm opacity-0 group-hover:opacity-100 transition-opacity">Agregar tarea</span>
                </button>
              )}
              <div className="space-y-2">
                {itemsDelDia.map((item, itemIndex) => {
                  const category = getCategory(item.reminder)
                  const completedTime = new Date(item.completedAt)
                  const isEditing = editingItem?.reminderId === item.reminder.id && editingItem?.completedAt === item.completedAt
                  
                  return (
                    <div
                      key={`${item.reminder.id}-${item.completedAt}-${itemIndex}`}
                      className="bg-blue-50 rounded-lg border-l-4 p-2 shadow-sm hover:shadow-md transition-shadow relative group"
                      style={{
                        borderLeftColor: category?.color || '#3b82f6'
                      }}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="date"
                            value={editingDate}
                            onChange={(e) => setEditingDate(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                          <input
                            type="time"
                            value={editingTime}
                            onChange={(e) => setEditingTime(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={saveEdit}
                              className="flex-1 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                            >
                              {t.common.save}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              {t.common.cancel}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="font-semibold text-sm text-gray-900 mb-1">
                            {item.reminder.title}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            {format(completedTime, 'HH:mm', { locale: es })}
                          </div>
                          {category && (
                            <div className="flex items-center gap-1 mt-1">
                              <span
                                className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                                style={{ backgroundColor: category.color }}
                              >
                                {category.icon && <span className="mr-1">{category.icon}</span>}
                                {category.name}
                              </span>
                            </div>
                          )}
                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEditing(item.reminder.id, item.completedAt)}
                              className="flex-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center justify-center gap-1"
                              title={t.reminderCard.editCompletion}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              {t.common.edit}
                            </button>
                            <button
                              onClick={() => deleteCompletionEntry(item.reminder.id, item.completedAt)}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                              title={t.reminderCard.deleteCompletion}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: Grid responsive - 2-2-3 columnas con encabezado y contenido juntos */}
      <div className="md:hidden">
        {/* Primera fila: Lunes, Martes (2 columnas) */}
        <div className="grid grid-cols-2 border-b">
          {dias.slice(0, 2).map((dia, index) => {
            const itemsDelDia = itemsPorDia[index]
            
            return (
              <div
                key={dia.toISOString()}
                className="border-r last:border-r-0"
              >
                <div className={`p-3 border-b ${
                  isSameDay(dia, new Date())
                    ? 'bg-primary-50'
                    : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center">
                      <div className="text-sm text-gray-600">
                        {format(dia, 'EEE', { locale: es })}
                      </div>
                      <div className={`text-lg mt-1 font-semibold ${
                        isSameDay(dia, new Date())
                          ? 'text-primary-600'
                          : 'text-gray-400'
                      }`}>
                        {format(dia, 'd')}
                      </div>
                    </div>
                    <button
                      onClick={() => onDateChange?.(dia)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md flex-shrink-0"
                      title="Agregar tarea completada"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-2 min-h-[200px] relative group">
                  {itemsDelDia.length === 0 && (
                    <button
                      onClick={() => onDateChange?.(dia)}
                      className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all rounded-lg border-2 border-dashed border-transparent hover:border-primary-200 text-xs"
                    >
                      <svg className="w-6 h-6 mb-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">Agregar</span>
                    </button>
                  )}
                  <div className="space-y-2">
                    {itemsDelDia.map((item, itemIndex) => {
                      const category = getCategory(item.reminder)
                      const completedTime = new Date(item.completedAt)
                      const isEditing = editingItem?.reminderId === item.reminder.id && editingItem?.completedAt === item.completedAt
                      
                      return (
                        <div
                          key={`${item.reminder.id}-${item.completedAt}-${itemIndex}`}
                          className="bg-blue-50 rounded-lg border-l-4 p-2 shadow-sm relative group"
                          style={{
                            borderLeftColor: category?.color || '#3b82f6'
                          }}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="date"
                                value={editingDate}
                                onChange={(e) => setEditingDate(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              />
                              <input
                                type="time"
                                value={editingTime}
                                onChange={(e) => setEditingTime(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={saveEdit}
                                  className="flex-1 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                                >
                                  {t.common.save}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                  {t.common.cancel}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="font-semibold text-xs text-gray-900 mb-1">
                                {item.reminder.title}
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                {format(completedTime, 'HH:mm', { locale: es })}
                              </div>
                              {category && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span
                                    className="px-1.5 py-0.5 text-xs font-medium rounded-full text-white"
                                    style={{ backgroundColor: category.color }}
                                  >
                                    {category.icon && <span className="mr-0.5">{category.icon}</span>}
                                    {category.name}
                                  </span>
                                </div>
                              )}
                              <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditing(item.reminder.id, item.completedAt)}
                                  className="flex-1 px-1.5 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center justify-center gap-1"
                                  title={t.reminderCard.editCompletion}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => deleteCompletionEntry(item.reminder.id, item.completedAt)}
                                  className="px-1.5 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                                  title={t.reminderCard.deleteCompletion}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Segunda fila: Miércoles, Jueves (2 columnas) */}
        <div className="grid grid-cols-2 border-b">
          {dias.slice(2, 4).map((dia, index) => {
            const itemsDelDia = itemsPorDia[index + 2]
            
            return (
              <div
                key={dia.toISOString()}
                className="border-r last:border-r-0"
              >
                <div className={`p-3 border-b ${
                  isSameDay(dia, new Date())
                    ? 'bg-primary-50'
                    : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center">
                      <div className="text-sm text-gray-600">
                        {format(dia, 'EEE', { locale: es })}
                      </div>
                      <div className={`text-lg mt-1 font-semibold ${
                        isSameDay(dia, new Date())
                          ? 'text-primary-600'
                          : 'text-gray-400'
                      }`}>
                        {format(dia, 'd')}
                      </div>
                    </div>
                    <button
                      onClick={() => onDateChange?.(dia)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md flex-shrink-0"
                      title="Agregar tarea completada"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-2 min-h-[200px] relative group">
                  {itemsDelDia.length === 0 && (
                    <button
                      onClick={() => onDateChange?.(dia)}
                      className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all rounded-lg border-2 border-dashed border-transparent hover:border-primary-200 text-xs"
                    >
                      <svg className="w-6 h-6 mb-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">Agregar</span>
                    </button>
                  )}
                  <div className="space-y-2">
                    {itemsDelDia.map((item, itemIndex) => {
                      const category = getCategory(item.reminder)
                      const completedTime = new Date(item.completedAt)
                      const isEditing = editingItem?.reminderId === item.reminder.id && editingItem?.completedAt === item.completedAt
                      
                      return (
                        <div
                          key={`${item.reminder.id}-${item.completedAt}-${itemIndex}`}
                          className="bg-blue-50 rounded-lg border-l-4 p-2 shadow-sm relative group"
                          style={{
                            borderLeftColor: category?.color || '#3b82f6'
                          }}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="date"
                                value={editingDate}
                                onChange={(e) => setEditingDate(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              />
                              <input
                                type="time"
                                value={editingTime}
                                onChange={(e) => setEditingTime(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={saveEdit}
                                  className="flex-1 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                                >
                                  {t.common.save}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                  {t.common.cancel}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="font-semibold text-xs text-gray-900 mb-1">
                                {item.reminder.title}
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                {format(completedTime, 'HH:mm', { locale: es })}
                              </div>
                              {category && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span
                                    className="px-1.5 py-0.5 text-xs font-medium rounded-full text-white"
                                    style={{ backgroundColor: category.color }}
                                  >
                                    {category.icon && <span className="mr-0.5">{category.icon}</span>}
                                    {category.name}
                                  </span>
                                </div>
                              )}
                              <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditing(item.reminder.id, item.completedAt)}
                                  className="flex-1 px-1.5 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center justify-center gap-1"
                                  title={t.reminderCard.editCompletion}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => deleteCompletionEntry(item.reminder.id, item.completedAt)}
                                  className="px-1.5 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                                  title={t.reminderCard.deleteCompletion}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Tercera fila: Viernes, Sábado, Domingo (3 columnas) */}
        <div className="grid grid-cols-3">
          {dias.slice(4, 7).map((dia, index) => {
            const itemsDelDia = itemsPorDia[index + 4]
            
            return (
              <div
                key={dia.toISOString()}
                className="border-r last:border-r-0"
              >
                <div className={`p-3 border-b ${
                  isSameDay(dia, new Date())
                    ? 'bg-primary-50'
                    : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-center">
                      <div className="text-sm text-gray-600">
                        {format(dia, 'EEE', { locale: es })}
                      </div>
                      <div className={`text-lg mt-1 font-semibold ${
                        isSameDay(dia, new Date())
                          ? 'text-primary-600'
                          : 'text-gray-400'
                      }`}>
                        {format(dia, 'd')}
                      </div>
                    </div>
                    <button
                      onClick={() => onDateChange?.(dia)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md flex-shrink-0"
                      title="Agregar tarea completada"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-2 min-h-[200px] relative group">
                  {itemsDelDia.length === 0 && (
                    <button
                      onClick={() => onDateChange?.(dia)}
                      className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all rounded-lg border-2 border-dashed border-transparent hover:border-primary-200 text-xs"
                    >
                      <svg className="w-6 h-6 mb-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">Agregar</span>
                    </button>
                  )}
                  <div className="space-y-2">
                    {itemsDelDia.map((item, itemIndex) => {
                      const category = getCategory(item.reminder)
                      const completedTime = new Date(item.completedAt)
                      const isEditing = editingItem?.reminderId === item.reminder.id && editingItem?.completedAt === item.completedAt
                      
                      return (
                        <div
                          key={`${item.reminder.id}-${item.completedAt}-${itemIndex}`}
                          className="bg-blue-50 rounded-lg border-l-4 p-2 shadow-sm relative group"
                          style={{
                            borderLeftColor: category?.color || '#3b82f6'
                          }}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="date"
                                value={editingDate}
                                onChange={(e) => setEditingDate(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              />
                              <input
                                type="time"
                                value={editingTime}
                                onChange={(e) => setEditingTime(e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={saveEdit}
                                  className="flex-1 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                                >
                                  {t.common.save}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="flex-1 px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                  {t.common.cancel}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="font-semibold text-xs text-gray-900 mb-1">
                                {item.reminder.title}
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                {format(completedTime, 'HH:mm', { locale: es })}
                              </div>
                              {category && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span
                                    className="px-1.5 py-0.5 text-xs font-medium rounded-full text-white"
                                    style={{ backgroundColor: category.color }}
                                  >
                                    {category.icon && <span className="mr-0.5">{category.icon}</span>}
                                    {category.name}
                                  </span>
                                </div>
                              )}
                              <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditing(item.reminder.id, item.completedAt)}
                                  className="flex-1 px-1.5 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center justify-center gap-1"
                                  title={t.reminderCard.editCompletion}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => deleteCompletionEntry(item.reminder.id, item.completedAt)}
                                  className="px-1.5 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center"
                                  title={t.reminderCard.deleteCompletion}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
