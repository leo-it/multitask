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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [remindersRes, categoriesRes] = await Promise.all([
        fetch('/api/recordatorios', { credentials: 'include' }),
        fetch('/api/categorias', { credentials: 'include' }),
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
      await fetch('/api/auth/firebase/logout', {
        method: 'POST',
        credentials: 'include',
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
            onDateChange={setWeeklyViewDate}
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
    </div>
  )
}
