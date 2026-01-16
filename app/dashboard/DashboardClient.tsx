'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import RecordatorioCard from '@/components/RecordatorioCard'
import CategoriaCard from '@/components/CategoriaCard'
import CrearRecordatorioDialog from '@/components/CrearRecordatorioDialog'
import CrearCategoriaDialog from '@/components/CrearCategoriaDialog'
import { Recordatorio, Categoria } from '@/types'

export default function DashboardClient() {
  const router = useRouter()
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showCrearRecordatorio, setShowCrearRecordatorio] = useState(false)
  const [showCrearCategoria, setShowCrearCategoria] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null)
  const [filtroCompletado, setFiltroCompletado] = useState<'todos' | 'pendientes' | 'completados'>('pendientes')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [recordatoriosRes, categoriasRes] = await Promise.all([
        fetch('/api/recordatorios', { credentials: 'include' }),
        fetch('/api/categorias', { credentials: 'include' }),
      ])

      // Verificar que las respuestas sean exitosas
      if (!recordatoriosRes.ok) {
        console.error('Error obteniendo recordatorios:', recordatoriosRes.status)
        setRecordatorios([])
      } else {
        const recordatoriosData = await recordatoriosRes.json()
        // Asegurarse de que sea un array
        setRecordatorios(Array.isArray(recordatoriosData) ? recordatoriosData : [])
      }

      if (!categoriasRes.ok) {
        console.error('Error obteniendo categorías:', categoriasRes.status)
        setCategorias([])
      } else {
        const categoriasData = await categoriasRes.json()
        // Asegurarse de que sea un array
        setCategorias(Array.isArray(categoriasData) ? categoriasData : [])
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      setRecordatorios([])
      setCategorias([])
    } finally {
      setLoading(false)
    }
  }

  // Asegurarse de que recordatorios siempre sea un array
  const recordatoriosArray = Array.isArray(recordatorios) ? recordatorios : []

  const recordatoriosFiltrados = recordatoriosArray.filter((r) => {
    if (filtroCategoria && r.categoriaId !== filtroCategoria) return false
    
    // Si el filtro es "pendientes", mostrar todos los pendientes Y los completados que aún no han vencido
    if (filtroCompletado === 'pendientes') {
      if (!r.completado) return true // Mostrar pendientes
      // Mostrar completados solo si aún no han pasado su fecha de vencimiento
      const fechaVencimiento = new Date(r.fechaVencimiento)
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      fechaVencimiento.setHours(0, 0, 0, 0)
      return fechaVencimiento >= hoy // Mostrar si la fecha de vencimiento es hoy o en el futuro
    }
    
    if (filtroCompletado === 'completados' && !r.completado) return false
    return true
  })

  const recordatoriosPendientes = recordatoriosArray.filter((r) => !r.completado)
  const proximosVencimientos = recordatoriosPendientes
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
          <p className="mt-6 text-gray-600 font-medium">Cargando tus tareas...</p>
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
                  Organizador de Tareas
                </h1>
                <p className="text-xs text-gray-500">Gestiona tus recordatorios</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 shadow-sm hover:shadow transition-all duration-200"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📋</span>
              </div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {recordatoriosArray.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Recordatorios</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">⏰</span>
              </div>
            </div>
            <p className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              {recordatoriosPendientes.length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Por completar</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-8 flex flex-wrap gap-3">
          <select
            value={filtroCategoria || 'todas'}
            onChange={(e) => setFiltroCategoria(e.target.value === 'todas' ? null : e.target.value)}
            className="px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm hover:shadow transition-all duration-200 text-sm font-medium text-gray-700"
          >
            <option value="todas">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>

          <select
            value={filtroCompletado}
            onChange={(e) => setFiltroCompletado(e.target.value as any)}
            className="px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none shadow-sm hover:shadow transition-all duration-200 text-sm font-medium text-gray-700"
          >
            <option value="todos">Todos</option>
            <option value="pendientes">Pendientes</option>
            <option value="completados">Completados</option>
          </select>
        </div>

        {/* Categorías */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Categorías</h2>
              <p className="text-sm text-gray-600">
                Haz clic en una categoría para filtrar
                {filtroCategoria && (
                  <button
                    onClick={() => setFiltroCategoria(null)}
                    className="ml-2 text-primary-600 hover:text-primary-700 font-medium underline decoration-2 underline-offset-2"
                  >
                    Ver todas
                  </button>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowCrearCategoria(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-medium rounded-xl hover:from-primary-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Nueva Categoría
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categorias.map((categoria) => (
              <CategoriaCard
                key={categoria.id}
                categoria={categoria}
                onUpdate={cargarDatos}
                onClick={() => {
                  setFiltroCategoria(filtroCategoria === categoria.id ? null : categoria.id)
                }}
                isSelected={filtroCategoria === categoria.id}
              />
            ))}
            {categorias.length === 0 && (
              <div className="col-span-full bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="text-5xl mb-4">📁</div>
                <p className="text-gray-600 font-medium mb-2">No hay categorías</p>
                <p className="text-sm text-gray-500 mb-4">Crea una para organizar tus recordatorios</p>
                <button
                  onClick={() => setShowCrearCategoria(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium text-sm"
                >
                  Crear categoría
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recordatorios */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Recordatorios</h2>
              <p className="text-sm text-gray-600">
                {recordatoriosFiltrados.length} {recordatoriosFiltrados.length === 1 ? 'recordatorio' : 'recordatorios'}
              </p>
            </div>
            <button
              onClick={() => setShowCrearRecordatorio(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-medium rounded-xl hover:from-primary-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Nuevo Recordatorio
            </button>
          </div>
          <div className="space-y-4">
            {recordatoriosFiltrados.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
                <div className="text-5xl mb-4">📝</div>
                <p className="text-gray-600 font-medium mb-2">No hay recordatorios</p>
                <p className="text-sm text-gray-500 mb-4">Crea tu primer recordatorio para comenzar</p>
                <button
                  onClick={() => setShowCrearRecordatorio(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl hover:from-primary-700 hover:to-indigo-700 transition font-medium shadow-lg hover:shadow-xl"
                >
                  Crear recordatorio
                </button>
              </div>
            ) : (
              recordatoriosFiltrados.map((recordatorio) => (
                <RecordatorioCard
                  key={recordatorio.id}
                  recordatorio={recordatorio}
                  categorias={categorias}
                  onUpdate={cargarDatos}
                />
              ))
            )}
          </div>
        </div>

        {/* Próximos vencimientos - Al final */}
        {proximosVencimientos.length > 0 && (
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Próximos Vencimientos</h2>
            <div className="space-y-4">
              {proximosVencimientos.map((recordatorio) => (
                <RecordatorioCard
                  key={recordatorio.id}
                  recordatorio={recordatorio}
                  categorias={categorias}
                  onUpdate={cargarDatos}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Botones flotantes móviles */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 md:hidden z-40">
        <button
          onClick={() => setShowCrearCategoria(true)}
          className="bg-gradient-to-br from-gray-700 to-gray-800 text-white w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center text-2xl hover:from-gray-800 hover:to-gray-900 transition-all duration-200 hover:scale-110 active:scale-95"
          title="Nueva categoría"
        >
          📁
        </button>
        <button
          onClick={() => setShowCrearRecordatorio(true)}
          className="bg-gradient-to-br from-primary-600 to-indigo-600 text-white w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center text-3xl font-bold hover:from-primary-700 hover:to-indigo-700 transition-all duration-200 hover:scale-110 active:scale-95"
          title="Nuevo recordatorio"
        >
          +
        </button>
      </div>

      {/* Dialogs */}
      {showCrearRecordatorio && (
        <CrearRecordatorioDialog
          categorias={categorias}
          onClose={() => setShowCrearRecordatorio(false)}
          onSuccess={cargarDatos}
        />
      )}

      {showCrearCategoria && (
        <CrearCategoriaDialog
          onClose={() => setShowCrearCategoria(false)}
          onSuccess={cargarDatos}
        />
      )}
    </div>
  )
}
