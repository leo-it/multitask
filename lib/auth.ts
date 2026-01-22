import { NextAuthOptions } from 'next-auth'
import { getServerSession as getSessionFromNextAuth } from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { headers } from 'next/headers'
import { logger } from './logger'

const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET

if (!secret && process.env.NODE_ENV === 'production') {
  logger.error('NEXTAUTH_SECRET is not set in production environment variables', undefined, {
    action: 'auth_config_check',
    environment: 'production',
  })
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: secret || (process.env.NODE_ENV === 'production' ? undefined : 'development-secret-change-in-production'),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}

// Helper para obtener la sesión en rutas de API de Next.js 14 App Router
export async function getServerSession() {
  const headersList = await headers()
  const req = {
    headers: Object.fromEntries(headersList.entries()),
  } as any
  
  return getSessionFromNextAuth({ req, ...authOptions })
}
