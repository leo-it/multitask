'use client'

import { useState, useEffect, useRef } from 'react'
import { Recordatorio, Categoria } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface RecordatorioCardProps {
  recordatorio: Recordatorio
  categorias: Categoria[]
  onUpdate: () => void
}

export default function RecordatorioCard({ recordatorio, categorias, onUpdate }: RecordatorioCardProps) {
  const [loading, setLoading] = useState(false)
  const [completadoLocal, setCompletadoLocal] = useState(recordatorio.completado)
  const isUpdatingRef = useRef(false)
  const lastRecordatorioIdRef = useRef(recordatorio.id)
  const lastServerCompletadoRef = useRef(recordatorio.completado)
  const categoria = categorias.find((c) => c.id === recordatorio.categoriaId)

  // Sincronizar el estado local cuando cambia el recordatorio del servidor
  useEffect(() => {
    // Si es un recordatorio diferente (nuevo ID), siempre sincronizar
    const isNewRecordatorio = lastRecordatorioIdRef.current !== recordatorio.id
    if (isNewRecordatorio) {
      lastRecordatorioIdRef.current = recordatorio.id
      lastServerCompletadoRef.current = recordatorio.completado
      isUpdatingRef.current = false
      setCompletadoLocal(recordatorio.completado)
      return
    }
    
    // Solo sincronizar si:
    // 1. No estamos actualizando
    // 2. El estado del servidor es diferente al local
    // 3. El estado del servidor es diferente al último estado del servidor que vimos
    // Esto previene bucles infinitos cuando el servidor aún no ha procesado la actualización
    const serverChanged = lastServerCompletadoRef.current !== recordatorio.completado
    if (!isUpdatingRef.current && completadoLocal !== recordatorio.completado && serverChanged) {
      console.log('🔄 Sincronizando estado local con servidor:', {
        id: recordatorio.id,
        completadoServidor: recordatorio.completado,
        completadoLocal: completadoLocal,
        fechaCompletado: recordatorio.fechaCompletado
      })
      lastServerCompletadoRef.current = recordatorio.completado
      setCompletadoLocal(recordatorio.completado)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordatorio.id, recordatorio.completado])

  const toggleCompletado = async () => {
    if (loading) return // Prevenir múltiples clics
    
    // Si está completado, permitir desmarcar
    // Si NO está completado, agregar al historial (permitir múltiples veces)
    const esDesmarcar = completadoLocal
    
    console.log('🔄 Frontend:', esDesmarcar ? 'Desmarcando' : 'Agregando completado al historial')
    console.log('📋 Recordatorio ID:', recordatorio.id)
    
    isUpdatingRef.current = true
    setLoading(true)
    
    try {
      const requestBody = { completado: !esDesmarcar } // true para agregar, false para desmarcar
      console.log('📤 Frontend: Enviando request:', JSON.stringify(requestBody, null, 2))
      
      const response = await fetch(`/api/recordatorios/${recordatorio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })

      console.log('📥 Frontend: Response status:', response.status, response.statusText)

      if (response.ok) {
        const updatedRecordatorio = await response.json()
        console.log('✅ Frontend: Recordatorio actualizado:', JSON.stringify({
          id: updatedRecordatorio.id,
          completado: updatedRecordatorio.completado,
          vecesCompletado: updatedRecordatorio.vecesCompletado,
        }, null, 2))
        
        // Si agregamos al historial, mantener el estado como no completado para permitir otro clic
        // Si desmarcamos, actualizar el estado
        if (!esDesmarcar) {
          // Agregamos al historial, resetear el estado local a false para permitir otro clic
          setCompletadoLocal(false)
          lastServerCompletadoRef.current = false
        } else {
          // Desmarcamos, actualizar el estado
          setCompletadoLocal(updatedRecordatorio.completado)
          lastServerCompletadoRef.current = updatedRecordatorio.completado
        }
        
        // Recargar datos para obtener el estado más reciente (historial actualizado)
        setTimeout(() => {
          console.log('🔄 Recargando datos...')
          onUpdate()
          setTimeout(() => {
            isUpdatingRef.current = false
          }, 200)
        }, 300)
      } else {
        // Revertir si hay error
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Frontend: Error actualizando recordatorio:', errorData)
        isUpdatingRef.current = false
      }
    } catch (error) {
      console.error('❌ Frontend: Error en la petición:', error)
      isUpdatingRef.current = false
    } finally {
      setLoading(false)
    }
  }

  const toggleNotificaciones = async () => {
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
      console.error('Error actualizando notificaciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const eliminar = async () => {
    if (!confirm('¿Estás seguro de eliminar este recordatorio?')) return

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
      console.error('Error eliminando recordatorio:', error)
    } finally {
      setLoading(false)
    }
  }

  const fechaVencimiento = new Date(recordatorio.fechaVencimiento)
  const hoy = new Date()
  const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  const estaVencido = diasRestantes < 0 && !completadoLocal
  
  // Obtener fecha de completado si existe
  const fechaCompletado = recordatorio.fechaCompletado ? new Date(recordatorio.fechaCompletado) : null
  
  // Log del estado actual para debugging (solo cuando cambia algo importante)
  useEffect(() => {
    // Solo loguear cuando cambia el ID o el estado de completado del servidor
    const key = `${recordatorio.id}-${recordatorio.completado}`
    if (lastRecordatorioIdRef.current !== recordatorio.id || 
        lastServerCompletadoRef.current !== recordatorio.completado) {
      console.log('📊 Estado del recordatorio:', {
        id: recordatorio.id,
        completadoServidor: recordatorio.completado,
        completadoLocal: completadoLocal,
        fechaCompletado: recordatorio.fechaCompletado,
        isUpdating: isUpdatingRef.current
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordatorio.id, recordatorio.completado])

  return (
    <div
      className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
        completadoLocal
          ? 'border-green-300 bg-green-50/70 opacity-100'
          : estaVencido
          ? 'border-red-200 bg-red-50/30'
          : diasRestantes <= 3
          ? 'border-orange-200 bg-orange-50/30'
          : 'border-gray-200'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Botón "Cumplí" / "Por dos" */}
          <div className="flex-shrink-0">
            <button
              onClick={toggleCompletado}
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
                'Cumplí'
              )}
            </button>
          </div>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3
                    className={`font-bold text-lg transition-all ${
                      completadoLocal 
                        ? 'text-green-700' 
                        : 'text-gray-900'
                    }`}
                  >
                    {recordatorio.titulo}
                  </h3>
                  {completadoLocal && (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                
                {recordatorio.descripcion && (
                  <p className={`text-sm mb-3 ${
                    completadoLocal ? 'text-gray-400' : 'text-gray-600'
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
                      🔄 Recurrente
                    </span>
                  )}
                </div>

                {/* Fecha y estado */}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{format(fechaVencimiento, "EEEE d 'de' MMMM, yyyy", { locale: es })}</span>
                  </div>
                  {!completadoLocal && (
                    <span
                      className={`px-2.5 py-1 rounded-lg font-semibold text-xs ${
                        estaVencido
                          ? 'bg-red-100 text-red-700'
                          : diasRestantes === 0
                          ? 'bg-orange-100 text-orange-700'
                          : diasRestantes <= 3
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {estaVencido
                        ? `⚠️ Vencido hace ${Math.abs(diasRestantes)} días`
                        : diasRestantes === 0
                        ? '⏰ Vence hoy'
                        : diasRestantes === 1
                        ? '⏰ Vence mañana'
                        : `${diasRestantes} días restantes`}
                    </span>
                  )}
                  {completadoLocal && fechaCompletado && (
                    <span className="px-2.5 py-1 rounded-lg font-semibold text-xs bg-green-100 text-green-700">
                      ✓ Cumplido el {format(fechaCompletado, "EEEE d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </span>
                  )}
                </div>
                
                {/* Mostrar información de completado con contador e historial */}
                {recordatorio.vecesCompletado && recordatorio.vecesCompletado > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-800">
                          ✓ Completado {recordatorio.vecesCompletado} {recordatorio.vecesCompletado === 1 ? 'vez' : 'veces'}
                        </p>
                        {fechaCompletado && (
                          <p className="text-xs text-green-600 mt-0.5">
                            Última vez: {format(fechaCompletado, "EEEE d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                          </p>
                        )}
                        {(() => {
                          // Manejar historial que puede venir como JSON de Prisma o como array
                          let historial: string[] = []
                          if (recordatorio.historialCompletados) {
                            if (Array.isArray(recordatorio.historialCompletados)) {
                              historial = recordatorio.historialCompletados
                            } else if (typeof recordatorio.historialCompletados === 'string') {
                              try {
                                historial = JSON.parse(recordatorio.historialCompletados)
                              } catch {
                                historial = []
                              }
                            } else if (typeof recordatorio.historialCompletados === 'object') {
                              // Si es un objeto JSON de Prisma, convertirlo a array
                              try {
                                historial = Object.values(recordatorio.historialCompletados) as string[]
                              } catch {
                                historial = []
                              }
                            }
                          }
                          
                          return historial.length > 0 ? (
                            <details className="mt-2">
                              <summary className="text-xs font-medium text-green-700 cursor-pointer hover:text-green-800">
                                Ver historial ({historial.length} {historial.length === 1 ? 'vez' : 'veces'})
                              </summary>
                              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                {[...historial].reverse().map((fecha, index) => {
                                  try {
                                    const fechaObj = new Date(fecha)
                                    return (
                                      <p key={index} className="text-xs text-green-600 pl-2 border-l-2 border-green-200">
                                        {format(fechaObj, "EEEE d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                                      </p>
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
                          Vence el {format(fechaVencimiento, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notificaciones */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer group/notif">
                    <input
                      type="checkbox"
                      checked={recordatorio.notificacionesActivas}
                      onChange={toggleNotificaciones}
                      disabled={loading}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-gray-600 group-hover/notif:text-gray-900 transition-colors">
                      🔔 Notificaciones {recordatorio.notificacionesActivas ? 'activas' : 'desactivadas'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Botón eliminar */}
              <button
                onClick={eliminar}
                disabled={loading}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50"
                title="Eliminar"
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
  )
}
