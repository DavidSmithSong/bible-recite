import type { CardState } from '@/app/bible/srs'
import type { HistoryEntry } from '@/app/bible/history'

export interface SupabaseProfile {
  id: string
  name: string
  slug: string
  created_at: string
  last_seen_at: string
}

interface CardStateRow {
  verse_id: number
  interval: number
  ease_factor: number | string
  due_date: string
  repetitions: number
  consecutive_correct: number
  passed: boolean
}

interface HistoryRow {
  verse_id: number
  date: string
  ts: string
  mode: 'recite' | 'reference'
  correct: boolean
  missed_count: number
}

function getConfig() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return { url: url.replace(/\/$/, ''), key }
}

function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function supabaseFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, key } = getConfig()
  const response = await fetch(`${url}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Supabase ${response.status}: ${text}`)
  }

  const text = await response.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

export function profileSlugFromName(name: string): string {
  return normalizeSlug(name)
}

export async function upsertProfile(name: string): Promise<SupabaseProfile> {
  const trimmed = name.trim()
  const slug = profileSlugFromName(trimmed)
  if (!trimmed || !slug) throw new Error('Name is required')

  const rows = await supabaseFetch<SupabaseProfile[]>('/profiles?on_conflict=slug', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({
      name: trimmed,
      slug,
      last_seen_at: new Date().toISOString(),
    }),
  })

  const profile = rows[0]
  if (!profile) throw new Error('Profile was not returned')
  return profile
}

export async function getProfileBySlug(slugInput: string): Promise<SupabaseProfile | null> {
  const slug = profileSlugFromName(slugInput)
  if (!slug) return null
  const rows = await supabaseFetch<SupabaseProfile[]>(
    `/profiles?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`,
  )
  return rows[0] ?? null
}

export function cardStateFromRow(row: CardStateRow): CardState {
  return {
    interval: row.interval,
    easeFactor: Number(row.ease_factor),
    dueDate: row.due_date,
    repetitions: row.repetitions,
    consecutiveCorrect: row.consecutive_correct,
    passed: row.passed,
  }
}

export function historyFromRow(row: HistoryRow): HistoryEntry {
  return {
    verseId: row.verse_id,
    date: row.date,
    ts: Date.parse(row.ts),
    mode: row.mode,
    correct: row.correct,
    missedCount: row.missed_count,
  }
}

export async function loadStudyState(profileId: string) {
  const [cardRows, historyRows] = await Promise.all([
    supabaseFetch<CardStateRow[]>(
      `/card_states?profile_id=eq.${encodeURIComponent(profileId)}&select=verse_id,interval,ease_factor,due_date,repetitions,consecutive_correct,passed`,
    ),
    supabaseFetch<HistoryRow[]>(
      `/history_entries?profile_id=eq.${encodeURIComponent(profileId)}&select=verse_id,date,ts,mode,correct,missed_count&order=ts.asc&limit=5000`,
    ),
  ])

  const cardStates: Record<number, CardState> = {}
  for (const row of cardRows) {
    cardStates[row.verse_id] = cardStateFromRow(row)
  }

  return {
    cardStates,
    history: historyRows.map(historyFromRow),
  }
}

export async function saveCardState(profileId: string, verseId: number, state: CardState): Promise<void> {
  await supabaseFetch('/card_states?on_conflict=profile_id,verse_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      profile_id: profileId,
      verse_id: verseId,
      interval: state.interval,
      ease_factor: state.easeFactor,
      due_date: state.dueDate,
      repetitions: state.repetitions,
      consecutive_correct: state.consecutiveCorrect,
      passed: state.passed,
      updated_at: new Date().toISOString(),
    }),
  })
}

export async function saveHistoryEntry(profileId: string, entry: HistoryEntry): Promise<void> {
  await supabaseFetch('/history_entries', {
    method: 'POST',
    body: JSON.stringify({
      profile_id: profileId,
      verse_id: entry.verseId,
      date: entry.date,
      ts: new Date(entry.ts).toISOString(),
      mode: entry.mode,
      correct: entry.correct,
      missed_count: entry.missedCount,
    }),
  })
}

export async function importStudyState(
  profileId: string,
  cardStates: Record<number, CardState>,
  history: HistoryEntry[],
): Promise<void> {
  const cardRows = Object.entries(cardStates).map(([verseId, state]) => ({
    profile_id: profileId,
    verse_id: Number(verseId),
    interval: state.interval,
    ease_factor: state.easeFactor,
    due_date: state.dueDate,
    repetitions: state.repetitions,
    consecutive_correct: state.consecutiveCorrect,
    passed: state.passed,
    updated_at: new Date().toISOString(),
  }))

  const historyRows = history.map(entry => ({
    profile_id: profileId,
    verse_id: entry.verseId,
    date: entry.date,
    ts: new Date(entry.ts).toISOString(),
    mode: entry.mode,
    correct: entry.correct,
    missed_count: entry.missedCount,
  }))

  if (cardRows.length > 0) {
    await supabaseFetch('/card_states?on_conflict=profile_id,verse_id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(cardRows),
    })
  }

  if (historyRows.length > 0) {
    await supabaseFetch('/history_entries', {
      method: 'POST',
      body: JSON.stringify(historyRows.slice(-2000)),
    })
  }
}

export interface AdminReportEntry {
  profile: SupabaseProfile
  totalCards: number
  passedCards: number
  totalHistory: number
  correctHistory: number
  lastHistoryTs: number | null
  recentHistory: {
    verseId: number
    date: string
    mode: 'recite' | 'reference'
    correct: boolean
    missedCount: number
    ts: number
  }[]
}

export async function getAdminReport(): Promise<AdminReportEntry[]> {
  const [profiles, cardStates, history] = await Promise.all([
    supabaseFetch<SupabaseProfile[]>('/profiles?select=*'),
    supabaseFetch<{ profile_id: string; passed: boolean }[]>('/card_states?select=profile_id,passed'),
    supabaseFetch<{
      profile_id: string
      verse_id: number
      date: string
      ts: string
      mode: 'recite' | 'reference'
      correct: boolean
      missed_count: number
    }[]>('/history_entries?select=profile_id,verse_id,date,ts,mode,correct,missed_count'),
  ])

  const reportMap: Record<string, AdminReportEntry> = {}
  const historyListMap: Record<string, any[]> = {}
  for (const p of profiles) {
    reportMap[p.id] = {
      profile: p,
      totalCards: 0,
      passedCards: 0,
      totalHistory: 0,
      correctHistory: 0,
      lastHistoryTs: null,
      recentHistory: [],
    }
    historyListMap[p.id] = []
  }

  for (const cs of cardStates) {
    const entry = reportMap[cs.profile_id]
    if (entry) {
      entry.totalCards++
      if (cs.passed) entry.passedCards++
    }
  }

  for (const h of history) {
    const entry = reportMap[h.profile_id]
    if (entry) {
      entry.totalHistory++
      if (h.correct) entry.correctHistory++
      const ts = Date.parse(h.ts)
      if (!entry.lastHistoryTs || ts > entry.lastHistoryTs) {
        entry.lastHistoryTs = ts
      }
      historyListMap[h.profile_id].push({
        verseId: h.verse_id,
        date: h.date,
        mode: h.mode,
        correct: h.correct,
        missedCount: h.missed_count,
        ts,
      })
    }
  }

  for (const p of profiles) {
    const list = historyListMap[p.id]
    list.sort((a, b) => b.ts - a.ts)
    reportMap[p.id].recentHistory = list.slice(0, 10)
  }

  return Object.values(reportMap).sort((a, b) => {
    const aTime = Date.parse(a.profile.last_seen_at)
    const bTime = Date.parse(b.profile.last_seen_at)
    return bTime - aTime
  })
}
