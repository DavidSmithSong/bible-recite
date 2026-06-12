const ACTIVE_USER_KEY = 'bible_active_user'
const ACTIVE_PROFILE_NAME_KEY = 'bible_active_profile_name'

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

export function getActiveProfileName(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(ACTIVE_PROFILE_NAME_KEY) ?? ''
}

export function setActiveProfileName(name: string): void {
  localStorage.setItem(ACTIVE_PROFILE_NAME_KEY, name.trim())
}

export function clearActiveProfile(): void {
  localStorage.removeItem(ACTIVE_USER_KEY)
  localStorage.removeItem(ACTIVE_PROFILE_NAME_KEY)
}

export function migrationKey(slug: string): string {
  return `bible_cloud_migrated:${normalizeUserId(slug) || DEFAULT_USER_ID}`
}
