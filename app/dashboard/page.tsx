import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const session = await getServerSession()
    
    if (!session) {
      redirect('/login')
    }

    return <DashboardClient />
  } catch (error) {
    console.error('Error in dashboard page:', error)
    redirect('/login')
  }
}
