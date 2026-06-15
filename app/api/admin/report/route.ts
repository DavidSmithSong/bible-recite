import { NextResponse } from 'next/server'
import { getAdminReport } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    const password = authHeader?.replace('Bearer ', '')
    const expected = process.env.ADMIN_PASSWORD || 'recite-admin'
    if (password !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const report = await getAdminReport()
    return NextResponse.json({ report })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to generate admin report' },
      { status: 400 },
    )
  }
}
