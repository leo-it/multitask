import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    const session = await getServerSession()
    
    if (session) {
      redirect('/dashboard')
    }
    
    redirect('/login')
  } catch (error) {
    console.error('Error in home page:', error)
    redirect('/login')
  }
}
