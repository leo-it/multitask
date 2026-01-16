'use client'

import { useState } from 'react'
import { Categoria } from '@/types'

interface CrearRecordatorioDialogProps {
  categorias: Categoria[]
  onClose: () => void
  onSuccess: () => void
}

export default function CrearRecordatorioDialog({
  categorias,
  onClose,
  onSuccess,
}: CrearRecordatorioDialogProps) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [notificacionesActivas, setNotificacionesActivas] = useState(true)
  const [frecuenciaRecordatorio, setFrecuenciaRecordatorio] = useState('DIARIO')
  const [recurrente, setRecurrente] = useState(false)
  const [frecuenciaRecurrencia, setFrecuenciaRecurrencia] = useState('SEMANAL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!titulo) {
      setError('El título es obligatorio')
      return
    }

    // Si no es recurrente, necesita fecha de vencimiento
    if (!recurrente && !fechaVencimiento) {
      setError('La fecha de vencimiento es obligatoria para recordatorios no recurrentes')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/recordatorios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          titulo,
          descripcion: descripcion || null,
          fechaVencimiento: recurrente ? null : fechaVencimiento || null,
          categoriaId: categoriaId || null,
          notificacionesActivas,
          frecuenciaRecordatorio,
          recurrente,
          frecuenciaRecurrencia: recurrente ? frecuenciaRecurrencia : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Error al crear recordatorio')
        return
      }

      onSuccess()
      onClose()
    } catch (error) {
      setError('Error al crear recordatorio')
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
                Nuevo Recordatorio
              </h2>
              <p className="text-sm text-gray-500 mt-1">Crea un nuevo recordatorio</p>
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
                Título *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                placeholder="Ej: Pagar servicio de luz"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none bg-white/50 backdrop-blur-sm"
                placeholder="Detalles adicionales..."
              />
            </div>

            {!recurrente && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  required={!recurrente}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white/50 backdrop-blur-sm font-medium"
              >
                <option value="">Sin categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frecuencia de Recordatorio
              </label>
              <select
                value={frecuenciaRecordatorio}
                onChange={(e) => setFrecuenciaRecordatorio(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white/50 backdrop-blur-sm font-medium"
              >
                <option value="DIARIO">Diario</option>
                <option value="SEMANAL">Semanal</option>
                <option value="MENSUAL">Mensual</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notificaciones"
                  checked={notificacionesActivas}
                  onChange={(e) => setNotificacionesActivas(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="notificaciones" className="text-sm text-gray-700">
                  Activar notificaciones
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurrente"
                  checked={recurrente}
                  onChange={(e) => setRecurrente(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <label htmlFor="recurrente" className="text-sm text-gray-700">
                  Recordatorio recurrente (ej: rutinas de gimnasio semanales)
                </label>
              </div>

              {recurrente && (
                <div className="ml-6 space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frecuencia de repetición *
                    </label>
                    <select
                      value={frecuenciaRecurrencia}
                      onChange={(e) => setFrecuenciaRecurrencia(e.target.value)}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    >
                      <option value="DIARIO">Diario (se vence cada día)</option>
                      <option value="SEMANAL">Semanal (se vence cada domingo)</option>
                      <option value="MENSUAL">Mensual (se vence el último día del mes)</option>
                    </select>
                  </div>
                  <p className="text-xs text-gray-500">
                    ✅ Se creará automáticamente un nuevo recordatorio cada vez que completes este.
                    {frecuenciaRecurrencia === 'SEMANAL' && ' La fecha de vencimiento será cada domingo.'}
                    {frecuenciaRecurrencia === 'MENSUAL' && ' La fecha de vencimiento será el último día de cada mes.'}
                    {frecuenciaRecurrencia === 'DIARIO' && ' La fecha de vencimiento será cada día.'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Cancelar
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
                    Creando...
                  </span>
                ) : 'Crear Recordatorio'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
