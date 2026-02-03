'use client'

import { LoadingProvider } from '@/lib/loading-context'
import GlobalLoadingSpinner from '@/components/GlobalLoadingSpinner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LoadingProvider>
      <GlobalLoadingSpinner />
      {children}
    </LoadingProvider>
  )
}
