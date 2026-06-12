import { NextResponse } from 'next/server'
import {
  getProfileBySlug,
  importStudyState,
  loadStudyState,
  type SupabaseProfile,
} from '@/lib/supabase-server'
import type { CardState } from '@/app/bible/srs'
import type { HistoryEntry } from '@/app/bible/history'

async function requireProfile(slug: string): Promise<SupabaseProfile> {
  const profile = await getProfileBySlug(slug)
  if (!profile) throw new Error('Profile not found')
  return profile
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const profile = await requireProfile(url.searchParams.get('user') ?? '')
    const state = await loadStudyState(profile.id)
    return NextResponse.json(state)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load study state' },
      { status: 400 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const profile = await requireProfile(String(body.user ?? ''))
    await importStudyState(
      profile.id,
      (body.cardStates ?? {}) as Record<number, CardState>,
      (body.history ?? []) as HistoryEntry[],
    )
    const state = await loadStudyState(profile.id)
    return NextResponse.json(state)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to import study state' },
      { status: 400 },
    )
  }
}
