import { NextResponse } from 'next/server'
import { deleteSessionCookie } from '@/lib/firebase-auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  await deleteSessionCookie()
  return NextResponse.json({ success: true })
}
