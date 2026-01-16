export interface Categoria {
  id: string
  nombre: string
  color: string
  icono?: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Recordatorio {
  id: string
  titulo: string
  descripcion?: string | null
  fechaVencimiento: string
  categoriaId?: string | null
  userId: string
  completado: boolean
  fechaCompletado?: string | null
  vecesCompletado?: number
  historialCompletados?: string[] // Array de fechas ISO string
  notificacionesActivas: boolean
  frecuenciaRecordatorio: string
  recurrente: boolean
  frecuenciaRecurrencia?: string | null
  recordatorioPadreId?: string | null
  ultimaNotificacion?: string | null
  proximaNotificacion?: string | null
  createdAt: string
  updatedAt: string
  categoria?: Categoria | null
}
