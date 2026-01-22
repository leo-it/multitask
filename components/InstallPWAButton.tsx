'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/hooks/useI18n'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWAButton() {
  const t = useI18n('es')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = (window.navigator as any).standalone === true

    if (isStandalone || (isIOS && isInStandaloneMode)) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowButton(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        alert('Para instalar en iOS: Toca el botón de compartir (□↑) y selecciona "Agregar a pantalla de inicio"')
      }
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowButton(false)
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
  }

  if (isInstalled || !showButton) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:w-auto z-50">
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl shadow-xl p-4 flex items-center gap-3 md:gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
            📱
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm md:text-base">Instalar App</p>
          <p className="text-xs md:text-sm text-white/90 opacity-90">
            Agrega Organizador a tu pantalla de inicio
          </p>
        </div>
        <button
          onClick={handleInstallClick}
          className="flex-shrink-0 px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-white/90 transition-colors text-sm whitespace-nowrap"
        >
          Instalar
        </button>
        <button
          onClick={() => setShowButton(false)}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
