'use client'

import { useState } from 'react'
import { Categoria } from '@/types'

interface CategoriaCardProps {
  categoria: Categoria
  onUpdate: () => void
  onClick?: () => void
  isSelected?: boolean
}

export default function CategoriaCard({ categoria, onUpdate, onClick, isSelected = false }: CategoriaCardProps) {
  const [loading, setLoading] = useState(false)

  const eliminar = async () => {
    if (!confirm('¿Estás seguro de eliminar esta categoría? Los recordatorios no se eliminarán.')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/categorias/${categoria.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    // Si se hace clic en el botón de eliminar, no ejecutar onClick
    if ((e.target as HTMLElement).closest('button[title="Eliminar"]')) {
      return
    }
    onClick?.()
  }

  return (
    <div
      onClick={handleClick}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 relative group cursor-pointer transition-all duration-300 ${
        isSelected 
          ? 'ring-4 ring-offset-2 scale-105 shadow-xl border-4' 
          : 'hover:shadow-xl hover:scale-[1.03] border-gray-200'
      }`}
      style={{ 
        ...(isSelected && { 
          borderColor: categoria.color,
          ringColor: categoria.color + '40',
        } as React.CSSProperties)
      }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {categoria.icono && (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                  style={{ backgroundColor: categoria.color + '20' }}
                >
                  {categoria.icono}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-base truncate ${
                  isSelected ? 'text-gray-900' : 'text-gray-800'
                }`}>
                  {categoria.nombre}
                </h3>
                {isSelected && (
                  <span className="text-xs font-semibold text-primary-600 mt-0.5 inline-block">
                    ✓ Seleccionada
                  </span>
                )}
              </div>
            </div>
            
            {/* Barra de progreso decorativa */}
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: categoria.color + '15' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  backgroundColor: categoria.color, 
                  width: '100%',
                  boxShadow: `0 0 8px ${categoria.color}60`
                }}
              />
            </div>
          </div>
          
          {/* Botón eliminar */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              eliminar()
            }}
            disabled={loading}
            className="ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 flex-shrink-0"
            title="Eliminar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
