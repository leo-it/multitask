import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/firebase-auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  return NextResponse.json({ user: session.user })
}
