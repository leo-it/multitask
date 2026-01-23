import { prisma } from './prisma'
import { cookies } from 'next/headers'
import { logger } from './logger'

const SESSION_COOKIE_NAME = '__session'
const SESSION_MAX_AGE_SECONDS = 14 * 24 * 60 * 60

export async function createSessionCookie(idToken: string): Promise<string> {
  const expiresIn = SESSION_MAX_AGE_SECONDS * 1000
  const { getAdminAuthInstance } = await import('./firebase-admin')
  const adminAuth = getAdminAuthInstance()
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
  return sessionCookie
}

export async function verifySessionCookie(sessionCookie: string) {
  try {
    const { getAdminAuthInstance } = await import('./firebase-admin')
    const adminAuth = getAdminAuthInstance()
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)
    return decodedClaims
  } catch (error) {
    return null
  }
}

export async function getServerSession() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (!sessionCookie) {
      return null
    }

    const decodedClaims = await verifySessionCookie(sessionCookie)
    
    if (!decodedClaims) {
      return null
    }

    const firebaseUserId = decodedClaims.uid
    const email = decodedClaims.email

    if (!email) {
      return null
    }

    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: decodedClaims.name || email.split('@')[0],
          emailVerified: decodedClaims.email_verified ? new Date() : null,
        },
      })
    } else {
      const updateData: any = {}
      
      if (!user.emailVerified && decodedClaims.email_verified) {
        updateData.emailVerified = new Date()
      }
      
      if (decodedClaims.name && decodedClaims.name !== user.name) {
        updateData.name = decodedClaims.name
      }
      
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        })
      }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }
  } catch (error) {
    logger.error('Error getting server session', error instanceof Error ? error : new Error(String(error)), {
      action: 'getServerSession',
    })
    return null
  }
}

export async function setSessionCookie(sessionCookie: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  })
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
