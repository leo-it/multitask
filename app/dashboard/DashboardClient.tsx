'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReminderCard from '@/components/ReminderCard'
import CategoryCard from '@/components/CategoryCard'
import CreateReminderDialog from '@/components/CreateReminderDialog'
import CreateCategoryDialog from '@/components/CreateCategoryDialog'
import EditReminderDialog from '@/components/EditReminderDialog'
import EditCategoryDialog from '@/components/EditCategoryDialog'
import WeeklyCompletedView from '@/components/WeeklyCompletedView'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Reminder, Category } from '@/types'
import { useI18n } from '@/hooks/useI18n'
import Modal from '@/components/Modal'
import { useApiFetch } from '@/lib/fetch'

export default function DashboardClient() {
  const router = useRouter()
  const t = useI18n('es')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateReminder, setShowCreateReminder] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [completionFilter, setCompletionFilter] = useState<'todos' | 'pendientes' | 'completados'>('pendientes')
  const [reminderCategoryId, setReminderCategoryId] = useState<string | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<'list' | 'weekly'>('list')
  const [weeklyViewDate, setWeeklyViewDate] = useState(new Date())
  const [showCustom, setShowCustom] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const onDateChange = (date: Date) => {
    if(date) {
      setSelectedDate(date)
      setWeeklyViewDate(date)
      setShowCustom(true)
    }
  }

  const onWeekChange = (date: Date) => {
    if(date) {
      setWeeklyViewDate(date)
    }
  }

  const addCompletedReminders = async (reminders: Reminder[]) => {
    if (!selectedDate) {
      console.error('No hay fecha seleccionada')
      return
    }

    const selectedDateTime = new Date(selectedDate)
    selectedDateTime.setHours(12, 0, 0, 0)
    const selectedDateISO = selectedDateTime.toISOString()

    const updatePromises = reminders
      .filter((reminder) => reminder.completed)
      .map(async (reminder) => {
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
          } else if (typeof reminder.completionHistory === 'object') {
            try {
              currentHistory = Object.values(reminder.completionHistory) as string[]
            } catch {
              currentHistory = []
            }
          }
        }

        if (currentHistory.includes(selectedDateISO)) {
          return Promise.resolve()
        }

        const newHistory = [...currentHistory, selectedDateISO].sort()

        try {
          const response = await fetch(`/api/recordatorios/${reminder.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              completionHistory: newHistory,
              timesCompleted: newHistory.length,
              completedAt: newHistory[newHistory.length - 1],
            }),
          })

          if (response.ok) {
            const data = await response.json()
            console.log('reminder actualizado:', data)
            return data
          } else {
            throw new Error('Error en la respuesta')
          }
        } catch (error) {
          console.error('Error al actualizar el reminder:', error)
          throw error
        }
      })

    try {
      await Promise.all(updatePromises)
      loadData()
      setShowCustom(false)
    } catch (error) {
      console.error('Error al actualizar los reminders:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    let lastBackPress = 0
    const DOUBLE_BACK_PRESS_DELAY = 2000

    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      const now = Date.now()
      const timeSinceLastPress = now - lastBackPress

      if (timeSinceLastPress < DOUBLE_BACK_PRESS_DELAY) {
        lastBackPress = 0
        return
      }

      lastBackPress = now
      window.history.pushState(null, '', window.location.href)
      router.push('/')
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [router])

  const { fetch: fetchWithLoading } = useApiFetch()

  const loadData = async () => {
    try {
      const [remindersRes, categoriesRes] = await Promise.all([
        fetchWithLoading('/api/recordatorios'),
        fetchWithLoading('/api/categorias'),
      ])

      if (!remindersRes.ok) {
        setReminders([])
      } else {
        const remindersData = await remindersRes.json()
        setReminders(Array.isArray(remindersData) ? remindersData : [])
      }

      if (!categoriesRes.ok) {
        setCategories([])
      } else {
        const categoriesData = await categoriesRes.json()
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      }
    } catch (error) {
      setReminders([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const remindersArray = Array.isArray(reminders) ? reminders : []

  const filteredReminders = remindersArray
    .filter((r) => {
      if (categoryFilter && r.categoryId !== categoryFilter) return false
      
      if (completionFilter === 'pendientes') {
        if (!r.completed) return true
        const dueDate = new Date(r.dueDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate >= today
      }
      
      if (completionFilter === 'completados' && !r.completed) return false
      return true
    })
    .sort((a, b) => {
      const aHasHistory = a.timesCompleted && a.timesCompleted > 0
      const bHasHistory = b.timesCompleted && b.timesCompleted > 0
      
      const aIsCompleted = a.completed === true || aHasHistory
      const bIsCompleted = b.completed === true || bHasHistory
      
      if (aIsCompleted !== bIsCompleted) {
        return aIsCompleted === true ? 1 : -1
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

  const handleLogout = async () => {
    try {
      await fetchWithLoading('/api/auth/firebase/logout', {
        method: 'POST',
      })
      router.push('/login')
      router.refresh()
    } catch (error) {
      router.push('/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <LoadingSpinner size="lg" text={t.dashboard.loadingTasks} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-20">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">✓</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {t.dashboard.title}
                </h1>
                <p className="text-xs text-gray-500">{t.dashboard.subtitle}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow transition-all duration-200"
            >
              {t.dashboard.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'list'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.dashboard.reminders}
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'weekly'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.dashboard.weeklyCompleted}
          </button>
        </div>

        {activeTab === 'weekly' ? (
          <WeeklyCompletedView
            reminders={reminders}
            categories={categories}
            selectedDate={weeklyViewDate}
            onDateChange={onDateChange}
            onWeekChange={onWeekChange}
            onUpdate={loadData}
          />
        ) : (
          <>
            {/* Filters */}
            <div className="mb-8 flex flex-wrap gap-3">
          <select
            value={categoryFilter || 'todas'}
            onChange={(e) => setCategoryFilter(e.target.value === 'todas' ? null : e.target.value)}
            className="px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm hover:shadow transition-all duration-200 text-sm font-medium text-gray-700"
          >
            <option value="todas">{t.dashboard.allCategories}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={completionFilter}
            onChange={(e) => setCompletionFilter(e.target.value as any)}
            className="px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm hover:shadow transition-all duration-200 text-sm font-medium text-gray-700"
          >
            <option value="todos">{t.dashboard.all}</option>
            <option value="pendientes">{t.dashboard.pending}</option>
            <option value="completados">{t.dashboard.completed}</option>
          </select>
        </div>

        {/* Categories */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{t.dashboard.categories}</h2>
              <p className="text-sm text-gray-600">
                {t.dashboard.clickToFilter}
                {categoryFilter && (
                  <button
                    onClick={() => setCategoryFilter(null)}
                    className="ml-2 text-primary-600 hover:text-primary-700 font-medium underline decoration-2 underline-offset-2"
                  >
                    {t.dashboard.viewAll}
                  </button>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowCreateCategory(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-medium rounded-xl hover:from-primary-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              {t.dashboard.newCategory}
            </button>
          </div>
          <div className="overflow-x-auto -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex gap-4 min-w-max pb-2">
              {categories.map((category) => (
                <div key={category.id} className="flex-shrink-0 w-[calc(50vw-1.5rem)] sm:w-[calc(25%-0.5rem)] md:w-[calc(25%-0.5rem)] lg:w-[calc(33.333%-0.67rem)]">
                  <CategoryCard
                    category={category}
                    onUpdate={loadData}
                    onClick={() => {
                      setCategoryFilter(categoryFilter === category.id ? null : category.id)
                    }}
                    isSelected={categoryFilter === category.id}
                    onEdit={setEditingCategory}
                    onAddReminder={(cat) => {
                      setReminderCategoryId(cat.id)
                      setShowCreateReminder(true)
                    }}
                  />
                </div>
              ))}
            </div>
            {categories.length === 0 && (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="text-5xl mb-4">📁</div>
                <p className="text-gray-600 font-medium mb-2">{t.dashboard.noCategories}</p>
                <p className="text-sm text-gray-500 mb-4">{t.dashboard.createCategoryPrompt}</p>
                <button
                  onClick={() => setShowCreateCategory(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium text-sm"
                >
                  {t.dashboard.createCategory}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reminders */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{t.dashboard.reminders}</h2>
              <p className="text-sm text-gray-600">
                {filteredReminders.length} {filteredReminders.length === 1 ? t.dashboard.reminder : t.dashboard.remindersPlural}
              </p>
            </div>
            <button
              onClick={() => setShowCreateReminder(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-medium rounded-xl hover:from-primary-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              {t.dashboard.newReminder}
            </button>
          </div>
          <div className="space-y-4">
            {filteredReminders.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="text-5xl mb-4">📝</div>
                <p className="text-gray-600 font-medium mb-2">{t.dashboard.noReminders}</p>
                <p className="text-sm text-gray-500 mb-4">{t.dashboard.createReminderPrompt}</p>
                <button
                  onClick={() => setShowCreateReminder(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl hover:from-primary-700 hover:to-indigo-700 transition font-medium shadow-lg hover:shadow-xl"
                >
                  {t.dashboard.createReminder}
                </button>
              </div>
            ) : (
              filteredReminders.map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  categories={categories}
                  onUpdate={loadData}
                  onEdit={setEditingReminder}
                />
              ))
            )}
          </div>
        </div>
          </>
        )}
      </main>

      {/* Mobile floating buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 md:hidden z-40">
        <button
          onClick={() => setShowCreateCategory(true)}
          className="bg-gradient-to-br from-gray-700 to-gray-800 text-white w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center text-2xl hover:from-gray-800 hover:to-gray-900 transition-all duration-200 hover:scale-110 active:scale-95"
          title={t.dashboard.newCategory}
        >
          📁
        </button>
        <button
          onClick={() => setShowCreateReminder(true)}
          className="bg-gradient-to-br from-primary-600 to-indigo-600 text-white w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center text-3xl font-bold hover:from-primary-700 hover:to-indigo-700 transition-all duration-200 hover:scale-110 active:scale-95"
          title={t.dashboard.newReminder}
        >
          +
        </button>
      </div>

      {/* Dialogs */}
      {showCreateReminder && (
        <CreateReminderDialog
          categories={categories}
          onClose={() => {
            setShowCreateReminder(false)
            setReminderCategoryId(undefined)
          }}
          onSuccess={loadData}
          initialCategoryId={reminderCategoryId}
        />
      )}

      {showCreateCategory && (
        <CreateCategoryDialog
          onClose={() => setShowCreateCategory(false)}
          onSuccess={loadData}
        />
      )}

      {editingReminder && (
        <EditReminderDialog
          reminder={editingReminder}
          categories={categories}
          onClose={() => setEditingReminder(null)}
          onSuccess={loadData}
        />
      )}

      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={loadData}
        />
      )}

 {showCustom && selectedDate && ( 
  <Modal
  isOpen={showCustom}
  onClose={() => {
    setShowCustom(false)
    setReminders(reminders.map(r => ({ ...r, completed: false })))
  }}
  header={
    <div className="flex items-center gap-2">
      <span>📅</span>
      <h2>Día seleccionado: {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
    </div>
  }
  footer={
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      <button 
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          addCompletedReminders(reminders)
        }}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
      >
        Guardar
      </button>
      <button 
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setShowCustom(false)
          setReminders(reminders.map(r => ({ ...r, completed: false })))
        }}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
      >
        Cancelar
      </button>
    </div>
  }
  maxWidth="lg"
>
  <div className="space-y-3">
    {reminders.length === 0 ? (
      <p className="text-gray-500 text-center py-4">No hay recordatorios disponibles</p>
    ) : (
      reminders.map((reminder) => {
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
        
        const selectedDateISO = new Date(selectedDate).setHours(12, 0, 0, 0)
        const dateStr = new Date(selectedDateISO).toISOString().split('T')[0]
        const isAlreadyCompleted = currentHistory.some(h => h.split('T')[0] === dateStr)

        return (
          <div key={reminder.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
            <input 
              type="checkbox" 
              checked={reminder.completed || false} 
              onChange={() => {
                setReminders(reminders.map((r) => r.id === reminder.id ? { ...r, completed: !r.completed } : r))
              }}
              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
            />
            <label className="flex-1 cursor-pointer">
              <div className="font-medium text-gray-900">{reminder.title}</div>
              {isAlreadyCompleted && (
                <div className="text-xs text-green-600 mt-1">✓ Ya completado en este día</div>
              )}
            </label>
          </div>
        )
      })
    )}
  </div>
</Modal>
)}
    </div>
  )
}
