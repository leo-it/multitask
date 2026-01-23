import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'

let firebaseApp: FirebaseApp | undefined
let _firebaseAuthInstance: Auth | undefined

function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (!_firebaseAuthInstance) {
    if (getApps().length === 0) {
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyB-S_YqVJielus_RSPXiyUSSOvKJXi3YGs',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'multitask-f44a8.firebaseapp.com',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'multitask-f44a8',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'multitask-f44a8.firebasestorage.app',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '847454394674',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:847454394674:web:e524eabe33dbb3842edf2b',
      }

      if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
        console.warn('Firebase client environment variables are not configured. Please set NEXT_PUBLIC_FIREBASE_* variables.')
        return null
      }

      try {
        firebaseApp = initializeApp(firebaseConfig)
        _firebaseAuthInstance = getAuth(firebaseApp)
      } catch (error) {
        console.error('Error initializing Firebase:', error)
        return null
      }
    } else {
      firebaseApp = getApps()[0]
      _firebaseAuthInstance = getAuth(firebaseApp)
    }
  }

  return _firebaseAuthInstance
}

export function getFirebaseAuthInstance(): Auth | null {
  return getFirebaseAuth()
}
