import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'

let adminApp: App | undefined
let _adminAuthInstance: Auth | undefined

function getAdminAuth(): Auth {
  if (!_adminAuthInstance) {
    if (getApps().length === 0) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      
      if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
        const projectId = process.env.FIREBASE_PROJECT_ID || 'multitask-f44a8'
        throw new Error(`Missing Firebase Admin environment variables. Please configure FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, and FIREBASE_PROJECT_ID. Project ID: ${projectId}`)
      }

      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      })
      
      _adminAuthInstance = getAuth(adminApp)
    } else {
      adminApp = getApps()[0]
      _adminAuthInstance = getAuth(adminApp)
    }
  }
  
  return _adminAuthInstance
}

export function getAdminAuthInstance(): Auth {
  return getAdminAuth()
}
