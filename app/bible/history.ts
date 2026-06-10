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
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function addEntry(entry: HistoryEntry): void {
  const history = loadHistory()
  history.push(entry)
  // Keep max 2000 entries to avoid localStorage bloat
  const trimmed = history.length > 2000 ? history.slice(-2000) : history
  localStorage.setItem(KEY, JSON.stringify(trimmed))
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
    const key = d.toISOString().slice(0, 10)
    if (!stats[key] || stats[key].total === 0) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}
