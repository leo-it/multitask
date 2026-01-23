import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/firebase-auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

function isNextRedirect(error: unknown): boolean {
  if (error && typeof error === 'object' && 'digest' in error) {
    const digest = (error as { digest?: string }).digest
    return typeof digest === 'string' && digest.includes('NEXT_REDIRECT')
  }
  return false
}

export default async function Home() {
  try {
    const session = await getServerSession()
    
    if (session) {
      redirect('/dashboard')
    }
    
    redirect('/login')
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error
    }
    
    logger.error('Error in home page', error instanceof Error ? error : new Error(String(error)), {
      route: '/',
    })
    redirect('/login')
  }
}
