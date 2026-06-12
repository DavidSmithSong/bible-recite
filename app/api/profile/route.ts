import { NextResponse } from 'next/server'
import { upsertProfile } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const profile = await upsertProfile(String(body.name ?? ''))
    return NextResponse.json({ profile })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save profile' },
      { status: 400 },
    )
  }
}
