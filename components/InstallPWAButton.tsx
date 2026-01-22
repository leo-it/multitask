'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const log = (message: string, metadata?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] [PWA] ${message}`
  if (metadata) {
    console.log(logMessage, metadata)
  } else {
    console.log(logMessage)
  }
}

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      log('Window is undefined, skipping PWA check')
      return
    }

    log('Initializing PWA install button check', {
      userAgent: navigator.userAgent,
      url: window.location.href
    })

    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isInStandaloneMode = (window.navigator as any).standalone === true
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

      log('Checking installation status', {
        isStandalone,
        ios,
        isInStandaloneMode,
        mobile,
        userAgent: navigator.userAgent,
      })

      setIsIOS(ios)
      setIsMobile(mobile)

      if (isStandalone || (ios && isInStandaloneMode)) {
        log('App is already installed', { isStandalone, ios, isInStandaloneMode })
        setIsInstalled(true)
        return true
      }
      return false
    }

    if (checkIfInstalled()) {
      log('App already installed, not showing button')
      return
    }

    log('App not installed, setting up install prompt listener')

    let deferredPromptValue: BeforeInstallPromptEvent | null = null

    const handler = (e: Event) => {
      log('beforeinstallprompt event fired')
      e.preventDefault()
      deferredPromptValue = e as BeforeInstallPromptEvent
      setDeferredPrompt(deferredPromptValue)
      setShowButton(true)
      log('Button set to show after beforeinstallprompt event')
    }

    window.addEventListener('beforeinstallprompt', handler)
    log('beforeinstallprompt listener added')

    const timeout = setTimeout(() => {
      log('Timeout reached, checking if button should be shown')
      const currentlyInstalled = checkIfInstalled()
      
      if (!currentlyInstalled) {
        const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
        const androidDevice = /Android/i.test(navigator.userAgent)
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        
        log('Mobile device check after timeout', { 
          iosDevice, 
          androidDevice, 
          isMobileDevice,
          hasDeferredPrompt: !!deferredPromptValue,
          userAgent: navigator.userAgent 
        })
        
        if (iosDevice || androidDevice || isMobileDevice) {
          log('Mobile device detected, showing button')
          setShowButton(true)
        } else if (deferredPromptValue) {
          log('Desktop browser has deferred prompt, showing button')
          setShowButton(true)
        } else {
          log('Not a mobile device and no deferred prompt, not showing button')
        }
      } else {
        log('App is installed, not showing button')
      }
    }, 2000)

    return () => {
      log('Cleaning up PWA install button listeners')
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    if (showButton) {
      log('Button visibility changed', { showButton, isInstalled, isIOS, isMobile, hasDeferredPrompt: !!deferredPrompt })
    }
  }, [showButton, isInstalled, isIOS, isMobile, deferredPrompt])

  const handleInstallClick = async () => {
    log('Install button clicked', { isIOS, hasDeferredPrompt: !!deferredPrompt })

    if (isIOS) {
      log('iOS device, showing manual instructions')
      return
    }

    if (!deferredPrompt) {
      log('No deferred prompt available')
      return
    }

    try {
      log('Calling deferredPrompt.prompt()')
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      log('User choice received', { outcome })

      if (outcome === 'accepted') {
        log('User accepted installation')
        setShowButton(false)
        setIsInstalled(true)
      } else {
        log('User dismissed installation')
      }
    } catch (error) {
      log('Error during installation', { error: error instanceof Error ? error.message : String(error) })
    } finally {
      setDeferredPrompt(null)
    }
  }

  useEffect(() => {
    log('Component render state', { 
      isInstalled, 
      showButton, 
      isIOS, 
      isMobile, 
      hasDeferredPrompt: !!deferredPrompt,
      shouldRender: !isInstalled && showButton
    })
  }, [isInstalled, showButton, isIOS, isMobile, deferredPrompt])

  if (isInstalled) {
    log('Not rendering: app is already installed')
    return null
  }

  if (!showButton) {
    log('Not rendering: showButton is false')
    return null
  }

  const shouldShowInstallButton = !isIOS && deferredPrompt !== null
  
  log('Rendering install button', { 
    shouldShowInstallButton, 
    isIOS, 
    isMobile, 
    hasDeferredPrompt: !!deferredPrompt 
  })

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
            {isIOS 
              ? 'Toca el botón de compartir (□↑) y selecciona "Agregar a pantalla de inicio"'
              : isMobile
              ? 'Agrega Organizador a tu pantalla de inicio para acceso rápido'
              : 'Instala esta app en tu dispositivo para una mejor experiencia'
            }
          </p>
        </div>
        {shouldShowInstallButton && (
          <button
            onClick={handleInstallClick}
            className="flex-shrink-0 px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-white/90 transition-colors text-sm whitespace-nowrap"
          >
            Instalar
          </button>
        )}
        <button
          onClick={() => setShowButton(false)}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors text-xl leading-none"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
