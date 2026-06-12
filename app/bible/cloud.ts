import { loadHistory, saveHistory, type HistoryEntry } from './history'
import { loadState, saveState, type CardState } from './srs'
import { getActiveUserId, migrationKey, normalizeUserId } from './users'

export interface CloudProfile {
  id: string
  name: string
  slug: string
}

export interface CloudStudyState {
  cardStates: Record<number, CardState>
  history: HistoryEntry[]
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? '云端保存失败')
  }

  return response.json() as Promise<T>
}

export async function createOrLoadProfile(name: string): Promise<CloudProfile> {
  const result = await api<{ profile: CloudProfile }>('/api/profile', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
  return result.profile
}

export async function fetchCloudStudyState(slug: string): Promise<CloudStudyState> {
  return api<CloudStudyState>(`/api/study-state?user=${encodeURIComponent(slug)}`)
}

export async function saveCloudHistory(entry: HistoryEntry, slug = getActiveUserId()): Promise<void> {
  if (!slug || slug === 'default') return
  await api<{ ok: true }>('/api/history', {
    method: 'POST',
    body: JSON.stringify({ user: slug, entry }),
  })
}

export async function saveCloudCardState(verseId: number, state: CardState, slug = getActiveUserId()): Promise<void> {
  if (!slug || slug === 'default') return
  await api<{ ok: true }>('/api/card-state', {
    method: 'PUT',
    body: JSON.stringify({ user: slug, verseId, state }),
  })
}

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

function loadMigratableCardStates(): Record<number, CardState> {
  return {
    ...readLocalJson<Record<number, CardState>>('bible_srs', {}),
    ...readLocalJson<Record<number, CardState>>('bible_srs:default', {}),
    ...loadState(),
  }
}

function loadMigratableHistory(): HistoryEntry[] {
  return [
    ...readLocalJson<HistoryEntry[]>('bible_history', []),
    ...readLocalJson<HistoryEntry[]>('bible_history:default', []),
    ...loadHistory(),
  ]
}

export async function hydrateFromCloud(slug: string): Promise<CloudStudyState> {
  const normalizedSlug = normalizeUserId(slug)
  const cloud = await fetchCloudStudyState(normalizedSlug)
  const migratedKey = migrationKey(normalizedSlug)
  const hasMigrated = localStorage.getItem(migratedKey) === '1'

  if (!hasMigrated) {
    const localCardStates = loadMigratableCardStates()
    const localHistory = loadMigratableHistory()
    const hasLocalData = Object.keys(localCardStates).length > 0 || localHistory.length > 0

    if (hasLocalData) {
      const mergedCardStates = { ...cloud.cardStates, ...localCardStates }
      const seenHistory = new Set<string>()
      const mergedHistory = [...cloud.history, ...localHistory].filter(entry => {
        const key = `${entry.verseId}:${entry.ts}:${entry.mode}:${entry.correct}:${entry.missedCount}`
        if (seenHistory.has(key)) return false
        seenHistory.add(key)
        return true
      })

      const imported = await api<CloudStudyState>('/api/study-state', {
        method: 'POST',
        body: JSON.stringify({
          user: normalizedSlug,
          cardStates: mergedCardStates,
          history: mergedHistory,
        }),
      })

      saveState(imported.cardStates)
      saveHistory(imported.history)
      localStorage.setItem(migratedKey, '1')
      return imported
    }

    localStorage.setItem(migratedKey, '1')
  }

  saveState(cloud.cardStates)
  saveHistory(cloud.history)
  return cloud
}
