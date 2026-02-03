'use client'

import { useLoading } from '@/lib/loading-context'
import LoadingSpinner from './LoadingSpinner'

export default function GlobalLoadingSpinner() {
  const { isLoading } = useLoading()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm pointer-events-none">
      <div className="bg-white rounded-2xl shadow-2xl p-8 pointer-events-auto">
        <LoadingSpinner size="lg" />
      </div>
    </div>
  )
}
