const ACTIVE_USER_KEY = 'bible_active_user'

const DEFAULT_USER_ID = 'default'

export function normalizeUserId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getActiveUserId(): string {
  if (typeof window === 'undefined') return DEFAULT_USER_ID
  return localStorage.getItem(ACTIVE_USER_KEY) || DEFAULT_USER_ID
}

export function setActiveUserId(userId: string): void {
  localStorage.setItem(ACTIVE_USER_KEY, normalizeUserId(userId) || DEFAULT_USER_ID)
}

export function scopedStorageKey(baseKey: string): string {
  return `${baseKey}:${getActiveUserId()}`
}
