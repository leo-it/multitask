'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface LoadingContextType {
  isLoading: boolean
  startLoading: () => void
  stopLoading: () => void
  withLoading: <T>(promise: Promise<T>) => Promise<T>
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingCount, setLoadingCount] = useState(0)

  const startLoading = useCallback(() => {
    setLoadingCount((prev) => prev + 1)
  }, [])

  const stopLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1))
  }, [])

  const withLoading = useCallback(
    async <T,>(promise: Promise<T>): Promise<T> => {
      startLoading()
      try {
        return await promise
      } finally {
        stopLoading()
      }
    },
    [startLoading, stopLoading]
  )

  return (
    <LoadingContext.Provider
      value={{
        isLoading: loadingCount > 0,
        startLoading,
        stopLoading,
        withLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
