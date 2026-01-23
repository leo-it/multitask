'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/hooks/useI18n'
import InstallPWAButton from '@/components/InstallPWAButton'
import LoadingSpinner from '@/components/LoadingSpinner'
import { getFirebaseAuthInstance } from '@/lib/firebase'
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { getFirebaseErrorMessage } from '@/lib/firebase-errors'

export default function LoginPage() {
  const router = useRouter()
  const t = useI18n('es')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const firebaseAuth = getFirebaseAuthInstance()
      
      if (!firebaseAuth) {
        setError('Firebase no está configurado. Por favor configura las variables de entorno NEXT_PUBLIC_FIREBASE_* en tu archivo .env')
        setLoading(false)
        return
      }

      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password)
      const idToken = await userCredential.user.getIdToken()

      const response = await fetch('/api/auth/firebase/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t.login.invalidCredentials)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      const firebaseAuth = getFirebaseAuthInstance()
      
      if (!firebaseAuth) {
        setError('Firebase no está configurado. Por favor configura las variables de entorno NEXT_PUBLIC_FIREBASE_* en tu archivo .env')
        setGoogleLoading(false)
        return
      }

      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(firebaseAuth, provider)
      const idToken = await userCredential.user.getIdToken()

      const response = await fetch('/api/auth/firebase/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al iniciar sesión con Google')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('')
      } else {
        setError(getFirebaseErrorMessage(err))
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-8 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <span className="text-white text-3xl font-bold">✓</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            {t.login.title}
          </h1>
          <p className="text-gray-600 font-medium">{t.login.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              {t.login.emailLabel}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
              placeholder={t.login.emailPlaceholder}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              {t.login.passwordLabel}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all bg-white/50 backdrop-blur-sm"
              placeholder={t.login.passwordPlaceholder}
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3.5 rounded-xl font-semibold hover:from-primary-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <LoadingSpinner text={t.login.loggingIn} />
            ) : t.login.loginButton}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/80 text-gray-500">O continúa con</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="mt-4 w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {googleLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t.login.noAccount}{' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold underline decoration-2 underline-offset-2 transition-colors">
              {t.login.registerLink}
            </Link>
          </p>
          {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('verify') === 'true' && (
            <div className="mt-4 bg-blue-50 border-2 border-blue-200 text-blue-700 px-4 py-3 rounded-xl">
              <p className="text-sm font-medium">Por favor verifica tu email antes de iniciar sesión.</p>
              <p className="text-xs mt-1 opacity-90">💡 Revisa tu carpeta de spam si no encuentras el correo de verificación.</p>
            </div>
          )}
        </div>
      </div>

      <InstallPWAButton />
    </div>
  )
}
