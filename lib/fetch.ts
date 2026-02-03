'use client'

import { useCallback, useState } from 'react'
import { useLoading } from './loading-context'

export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  return response
}

export function useApiFetch() {
  const { withLoading } = useLoading()

  const fetchWithLoading = useCallback(
    async (url: string, options?: RequestInit): Promise<Response> => {
      return withLoading(apiFetch(url, options))
    },
    [withLoading]
  )

  return { fetch: fetchWithLoading }
}

export function useFetch<T = any>() {
  const { withLoading } = useLoading()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(
    async (url: string, options?: RequestInit): Promise<T | null> => {
      setLoading(true)
      setError(null)
      try {
        const response = await withLoading(apiFetch(url, options))
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Error en la petición')
        }
        const data = await response.json()
        return data as T
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error desconocido')
        setError(error)
        return null
      } finally {
        setLoading(false)
      }
    },
    [withLoading]
  )

  return { execute, loading, error }
}
