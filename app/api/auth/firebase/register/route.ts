import { NextResponse } from 'next/server'
import { getAdminAuthInstance } from '@/lib/firebase-admin'
import { z } from 'zod'
import { getFirebaseErrorMessage } from '@/lib/firebase-errors'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)

    const adminAuth = getAdminAuthInstance()

    try {
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: false,
      })

      logger.info('Usuario creado exitosamente en Firebase', {
        userId: userRecord.uid,
        email: userRecord.email,
      })

      return NextResponse.json({
        success: true,
        message: 'Usuario creado exitosamente. Por favor verifica tu email.',
        userId: userRecord.uid,
        needsEmailVerification: true,
      }, { status: 201 })
    } catch (error: any) {
      logger.error('Error al crear usuario en Firebase', error instanceof Error ? error : new Error(String(error)), {
        action: 'createUser',
        email,
        errorCode: error.code || error.error?.code,
        errorMessage: error.message || error.error?.message,
      })

      const errorMessage = getFirebaseErrorMessage(error)
      
      if (error.error?.message === 'PASSWORD_LOGIN_DISABLED' || error.message === 'PASSWORD_LOGIN_DISABLED') {
        return NextResponse.json(
          { 
            error: errorMessage,
            code: 'PASSWORD_LOGIN_DISABLED',
            help: 'Ve a Firebase Console > Authentication > Sign-in method y habilita "Email/Password"'
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? (error.message || error.error?.message) : undefined
        },
        { status: 400 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      let errorMessage = 'Datos inválidos'
      
      if (firstError.path[0] === 'email') {
        errorMessage = 'El correo electrónico no es válido.'
      } else if (firstError.path[0] === 'password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres.'
      } else if (firstError.path[0] === 'name') {
        errorMessage = 'El nombre es requerido.'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    logger.error('Error al registrar usuario', error instanceof Error ? error : new Error(String(error)), {
      action: 'register',
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      { 
        error: 'Error al registrar usuario. Por favor intenta nuevamente.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}
