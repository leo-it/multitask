import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const session = await getServerSession()
    
    if (session) {
      redirect('/dashboard')
    }
    
    redirect('/login')
  } catch (error) {
    logger.error('Error in home page', error instanceof Error ? error : new Error(String(error)), {
      route: '/',
    })
    redirect('/login')
  }
}
