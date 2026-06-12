import { getActiveUserId, scopedStorageKey } from './users'

export interface CardState {
  interval: number
  easeFactor: number
  dueDate: string
  repetitions: number
  consecutiveCorrect: number  // resets to 0 on any wrong answer
  passed: boolean             // true once consecutiveCorrect has reached 3
}

export type Rating = 1 | 2 | 3 | 4  // 再学 | 有难度 | 记住了 | 太简单

const STORAGE_KEY = 'bible_srs'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function loadState(): Record<number, CardState> {
  if (typeof window === 'undefined') return {}
  try {
    const scoped = localStorage.getItem(scopedStorageKey(STORAGE_KEY))
    const legacy = getActiveUserId() === 'default' ? localStorage.getItem(STORAGE_KEY) : null
    return JSON.parse(scoped ?? legacy ?? '{}')
  } catch {
    return {}
  }
}

export function saveState(state: Record<number, CardState>): void {
  localStorage.setItem(scopedStorageKey(STORAGE_KEY), JSON.stringify(state))
}

export function getCardState(id: number): CardState {
  const state = loadState()
  return state[id] ?? defaultState()
}

function defaultState(): CardState {
  return {
    interval: 0,
    easeFactor: 2.5,
    dueDate: today(),
    repetitions: 0,
    consecutiveCorrect: 0,
    passed: false,
  }
}

// correct = system-determined (allCorrect from diff, or refCorrect)
// rating  = user's self-assessment (affects interval only)
export function applyRating(id: number, correct: boolean, rating: Rating): CardState {
  const state = loadState()
  const card = state[id] ?? defaultState()

  let { interval, easeFactor, repetitions, consecutiveCorrect, passed } = card

  // Update consecutive streak
  if (correct) {
    consecutiveCorrect += 1
    if (consecutiveCorrect >= 3) passed = true
  } else {
    consecutiveCorrect = 0
    // passed stays true — a lapse doesn't un-master a card
  }

  // Compute next interval
  if (!passed) {
    // Pre-mastery: short fixed intervals to drive practice
    if (!correct || rating === 1) {
      interval = 1
      repetitions = 0
      easeFactor = Math.max(1.3, easeFactor - 0.2)
    } else {
      repetitions += 1
      interval = repetitions <= 1 ? 1 : repetitions === 2 ? 2 : 4
    }
  } else {
    // Post-mastery: standard SM-2
    if (!correct || rating === 1) {
      interval = 1
      repetitions = 0
      easeFactor = Math.max(1.3, easeFactor - 0.2)
    } else {
      repetitions += 1
      if (repetitions <= 2) {
        interval = repetitions === 1 ? 1 : 4
      } else {
        if (rating === 2) {
          interval = Math.max(2, Math.round(interval * 1.2))
        } else if (rating === 3) {
          interval = Math.round(interval * easeFactor)
        } else {
          interval = Math.round(interval * easeFactor * 1.3)
          easeFactor = Math.min(3.0, easeFactor + 0.15)
        }
      }
    }
  }

  state[id] = {
    interval,
    easeFactor,
    dueDate: addDays(today(), interval),
    repetitions,
    consecutiveCorrect,
    passed,
  }

  saveState(state)
  return state[id]
}

export function getDueIds(allIds: number[]): number[] {
  const state = loadState()
  const t = today()
  return allIds.filter(id => {
    const card = state[id]
    return !card || card.dueDate <= t
  })
}

export function getPassedCount(): number {
  const state = loadState()
  return Object.values(state).filter(c => c.passed).length
}
