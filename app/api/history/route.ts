import { NextResponse } from 'next/server'
import { getProfileBySlug, saveHistoryEntry } from '@/lib/supabase-server'
import type { HistoryEntry } from '@/app/bible/history'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const profile = await getProfileBySlug(String(body.user ?? ''))
    if (!profile) throw new Error('Profile not found')
    await saveHistoryEntry(profile.id, body.entry as HistoryEntry)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save history' },
      { status: 400 },
    )
  }
}
