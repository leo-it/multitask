import { NextResponse } from 'next/server'
import { getAdminAuthInstance } from '@/lib/firebase-admin'
import { createSessionCookie, setSessionCookie } from '@/lib/firebase-auth'
import { z } from 'zod'
import { getFirebaseErrorMessage } from '@/lib/firebase-errors'

export const dynamic = 'force-dynamic'

const loginSchema = z.object({
  idToken: z.string(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { idToken } = loginSchema.parse(body)

    const adminAuth = getAdminAuthInstance()
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    const firebaseData = decodedToken.firebase as any
    const isGoogleProvider = firebaseData?.sign_in_provider === 'google.com' || 
                             (firebaseData?.identities && 'google.com' in firebaseData.identities)
    
    if (!decodedToken.email_verified && !isGoogleProvider) {
      return NextResponse.json(
        { error: 'Email no verificado. Por favor verifica tu email antes de iniciar sesión.' },
        { status: 403 }
      )
    }

    const sessionCookie = await createSessionCookie(idToken)
    await setSessionCookie(sessionCookie)

    return NextResponse.json({
      success: true,
      user: {
        id: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos. Por favor verifica la información enviada.' },
        { status: 400 }
      )
    }

    const errorMessage = getFirebaseErrorMessage(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    )
  }
}
