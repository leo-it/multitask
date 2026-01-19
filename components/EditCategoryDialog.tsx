'use client'

import { useState, useEffect } from 'react'
import { Category } from '@/types'
import { useI18n } from '@/hooks/useI18n'

interface EditCategoryDialogProps {
  category: Category
  onClose: () => void
  onSuccess: () => void
}

const colors = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
]

const icons = ['💳', '🏋️', '🏠', '🚗', '📱', '💊', '🎓', '🍔', '✈️', '🎁']

export default function EditCategoryDialog({ category, onClose, onSuccess }: EditCategoryDialogProps) {
  const t = useI18n('es')
  const [name, setName] = useState(category.name)
  const [color, setColor] = useState(category.color)
  const [icon, setIcon] = useState(category.icon || icons[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setName(category.name)
    setColor(category.color)
    setIcon(category.icon || icons[0])
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name) {
      setError(t.createCategory.nameRequired)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/categorias/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          color,
          icon,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || t.editCategory.updateError)
        return
      }

      onSuccess()
      onClose()
    } catch (error) {
      setError(t.editCategory.updateError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {t.editCategory.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{t.editCategory.subtitle}</p>
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
                {t.createCategory.nameLabel}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                placeholder={t.createCategory.namePlaceholder}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {t.createCategory.iconLabel}
              </label>
              <div className="flex flex-wrap gap-3">
                {icons.map((ico) => (
                  <button
                    key={ico}
                    type="button"
                    onClick={() => setIcon(ico)}
                    className={`w-14 h-14 text-2xl rounded-xl border-2 transition-all duration-200 hover:scale-110 ${
                      icon === ico
                        ? 'border-primary-500 bg-primary-50 shadow-lg scale-110'
                        : 'border-gray-200 hover:border-gray-300 bg-white/50'
                    }`}
                  >
                    {ico}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                {t.createCategory.colorLabel}
              </label>
              <div className="flex flex-wrap gap-3">
                {colors.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setColor(col)}
                    className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-110 ${
                      color === col ? 'border-gray-800 scale-110 shadow-lg ring-2 ring-offset-2' : 'border-gray-200'
                    }`}
                    style={{ 
                      backgroundColor: col,
                      ...(color === col && { ringColor: col + '40' })
                    }}
                  />
                ))}
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
                    {t.editCategory.updating}
                  </span>
                ) : t.editCategory.updateButton}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
