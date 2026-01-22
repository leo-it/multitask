import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import DashboardClient from './DashboardClient'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const session = await getServerSession()
    
    if (!session) {
      redirect('/login')
    }

    return <DashboardClient />
  } catch (error) {
    logger.error('Error in dashboard page', error instanceof Error ? error : new Error(String(error)), {
      route: '/dashboard',
    })
    redirect('/login')
  }
}
