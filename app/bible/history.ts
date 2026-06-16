import { getActiveUserId, scopedStorageKey } from './users'

export interface HistoryEntry {
  verseId: number
  date: string        // YYYY-MM-DD
  ts: number          // Unix ms
  mode: 'recite' | 'reference'
  correct: boolean
  missedCount: number // chars missed in recite mode
}

const KEY = 'bible_history'

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const scoped = localStorage.getItem(scopedStorageKey(KEY))
    const legacy = getActiveUserId() === 'default' ? localStorage.getItem(KEY) : null
    return JSON.parse(scoped ?? legacy ?? '[]')
  } catch {
    return []
  }
}

export function addEntry(entry: HistoryEntry): void {
  const history = loadHistory()
  history.push(entry)
  // Keep max 2000 entries to avoid localStorage bloat
  const trimmed = history.length > 2000 ? history.slice(-2000) : history
  saveHistory(trimmed)
}

export function saveHistory(history: HistoryEntry[]): void {
  localStorage.setItem(scopedStorageKey(KEY), JSON.stringify(history.slice(-2000)))
}

export function getVerseHistory(verseId: number): HistoryEntry[] {
  return loadHistory().filter(e => e.verseId === verseId)
}

export function getDailyStats(): Record<string, { total: number; correct: number }> {
  const stats: Record<string, { total: number; correct: number }> = {}
  for (const e of loadHistory()) {
    if (!stats[e.date]) stats[e.date] = { total: 0, correct: 0 }
    stats[e.date].total++
    if (e.correct) stats[e.date].correct++
  }
  return stats
}

export function getStreak(): number {
  const stats = getDailyStats()
  let streak = 0
  const d = new Date()
  while (true) {
    const offset = d.getTimezoneOffset()
    const localDate = new Date(d.getTime() - (offset * 60 * 1000))
    const key = localDate.toISOString().slice(0, 10)
    if (!stats[key] || stats[key].total === 0) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function todayKey(): string {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const localDate = new Date(d.getTime() - (offset * 60 * 1000))
  return localDate.toISOString().slice(0, 10)
}

