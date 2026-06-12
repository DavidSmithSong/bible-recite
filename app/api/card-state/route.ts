import { NextResponse } from 'next/server'
import { getProfileBySlug, saveCardState } from '@/lib/supabase-server'
import type { CardState } from '@/app/bible/srs'

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const profile = await getProfileBySlug(String(body.user ?? ''))
    const verseId = Number(body.verseId)
    if (!profile) throw new Error('Profile not found')
    if (!Number.isInteger(verseId)) throw new Error('Verse id is required')
    await saveCardState(profile.id, verseId, body.state as CardState)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to save card state' },
      { status: 400 },
    )
  }
}
