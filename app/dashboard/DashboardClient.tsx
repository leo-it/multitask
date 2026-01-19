'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import RecordatorioCard from '@/components/RecordatorioCard'
import CategoriaCard from '@/components/CategoriaCard'
import CrearRecordatorioDialog from '@/components/CrearRecordatorioDialog'
import CrearCategoriaDialog from '@/components/CrearCategoriaDialog'
import EditReminderDialog from '@/components/EditReminderDialog'
import EditCategoryDialog from '@/components/EditCategoryDialog'
import { Recordatorio, Categoria } from '@/types'
import { useI18n } from '@/hooks/useI18n'

export default function DashboardClient() {
  const router = useRouter()
  const t = useI18n('es')
  const [reminders, setReminders] = useState<Recordatorio[]>([])
  const [categories, setCategories] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateReminder, setShowCreateReminder] = useState(false)
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Recordatorio | null>(null)
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [completionFilter, setCompletionFilter] = useState<'todos' | 'pendientes' | 'completados'>('pendientes')

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
      if (categoryFilter && r.categoriaId !== categoryFilter) return false
      
      if (completionFilter === 'pendientes') {
        if (!r.completado) return true
        const dueDate = new Date(r.fechaVencimiento)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate >= today
      }
      
      if (completionFilter === 'completados' && !r.completado) return false
      return true
    })
    .sort((a, b) => {
      // Check if task has completion history (even if completado is false)
      const aHasHistory = a.vecesCompletado && a.vecesCompletado > 0
      const bHasHistory = b.vecesCompletado && b.vecesCompletado > 0
      
      // Consider a task "completed" if completado is true OR has history
      const aIsCompleted = a.completado === true || aHasHistory
      const bIsCompleted = b.completado === true || bHasHistory
      
      // Non-completed tasks first
      if (aIsCompleted !== bIsCompleted) {
        return aIsCompleted === true ? 1 : -1
      }
      // Within same completion status, sort by due date (earliest first)
      return new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime()
    })

  const pendingReminders = remindersArray.filter((r) => !r.completado)
  const upcomingDueDates = pendingReminders
    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())
    .slice(0, 5)

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-400 animate-spin" style={{ animationDuration: '0.75s' }}></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">{t.dashboard.loadingTasks}</p>
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
        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{t.dashboard.total}</p>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📋</span>
              </div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {remindersArray.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">{t.dashboard.reminders}</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">{t.dashboard.pending}</p>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">⏰</span>
              </div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              {pendingReminders.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">{t.dashboard.toComplete}</p>
          </div>
        </div>

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
                {cat.nombre}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categories.map((categoria) => (
              <CategoriaCard
                key={categoria.id}
                categoria={categoria}
                onUpdate={loadData}
                onClick={() => {
                  setCategoryFilter(categoryFilter === categoria.id ? null : categoria.id)
                }}
                isSelected={categoryFilter === categoria.id}
                onEdit={setEditingCategory}
              />
            ))}
            {categories.length === 0 && (
              <div className="col-span-full bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
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
              filteredReminders.map((recordatorio) => (
                <RecordatorioCard
                  key={recordatorio.id}
                  recordatorio={recordatorio}
                  categorias={categories}
                  onUpdate={loadData}
                  onEdit={setEditingReminder}
                />
              ))
            )}
          </div>
        </div>

        {/* Upcoming due dates */}
        {upcomingDueDates.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.dashboard.upcomingDueDates}</h2>
            <div className="space-y-4">
              {upcomingDueDates.map((recordatorio) => (
                <RecordatorioCard
                  key={recordatorio.id}
                  recordatorio={recordatorio}
                  categorias={categories}
                  onUpdate={loadData}
                  onEdit={setEditingReminder}
                />
              ))}
            </div>
          </div>
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
        <CrearRecordatorioDialog
          categorias={categories}
          onClose={() => setShowCreateReminder(false)}
          onSuccess={loadData}
        />
      )}

      {showCreateCategory && (
        <CrearCategoriaDialog
          onClose={() => setShowCreateCategory(false)}
          onSuccess={loadData}
        />
      )}

      {editingReminder && (
        <EditReminderDialog
          recordatorio={editingReminder}
          categorias={categories}
          onClose={() => setEditingReminder(null)}
          onSuccess={loadData}
        />
      )}

      {editingCategory && (
        <EditCategoryDialog
          categoria={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}
