'use client'

import { useState, useEffect } from 'react'
import versesData from '@/lib/data/bible_verses.json'
import StudyCard from './StudyCard'
import Heatmap from './Heatmap'
import { getDueIds, getCardState, type Rating } from './srs'
import { getVerseHistory } from './history'
import { LESSON_PAINTINGS } from '@/lib/data/paintings'
import { getWeekLessonId, getScheduleEntry } from '@/lib/data/schedule'
import { APP_VERSION } from '@/lib/version'
import { clearActiveProfile, getActiveProfileName, setActiveProfileName, setActiveUserId } from './users'
import { createOrLoadProfile, hydrateFromCloud, type CloudProfile } from './cloud'

export interface BibleVerse {
  id: number
  lesson: string
  reference: string
  text: string
  referenceEn?: string
  textEn?: string
  image?: { url: string; title: string; artist: string }
}

const verses: BibleVerse[] = versesData as BibleVerse[]
type StudyMode = 'recite' | 'reference'
type Tab = 'week' | 'all' | 'stats'
type Theme = 'light' | 'dark'

export default function BiblePage() {
  const [tab, setTab] = useState<Tab>('week')
  const [dueIds, setDueIds] = useState<number[]>([])
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null)
  const [studyMode, setStudyMode] = useState<StudyMode>('recite')
  const [theme, setTheme] = useState<Theme>('dark')
  const [activeUserId, setActiveUser] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [profile, setProfile] = useState<CloudProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [weekCardKey, setWeekCardKey] = useState(0)

  useEffect(() => {
    const savedTheme = localStorage.getItem('bible_theme') as Theme | null
    let activeListenerCleanup: (() => void) | undefined

    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setTheme(mediaQuery.matches ? 'dark' : 'light')
      const listener = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem('bible_theme')) {
          setTheme(e.matches ? 'dark' : 'light')
        }
      }
      mediaQuery.addEventListener('change', listener)
      activeListenerCleanup = () => mediaQuery.removeEventListener('change', listener)
    }

    const params = new URLSearchParams(window.location.search)
    const urlName = params.get('user') ?? ''
    const savedName = getActiveProfileName()
    const initialName = urlName || savedName

    if (initialName) {
      void activateProfile(initialName, Boolean(urlName))
    } else {
      setProfileLoading(false)
    }

    return () => {
      if (activeListenerCleanup) activeListenerCleanup()
    }
  }, [])

  useEffect(() => {
    refreshDue()
  }, [activeUserId])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    const themeColor = theme === 'dark' ? '#000000' : '#f8f7f4'
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', themeColor)
  }, [theme])

  function refreshDue() {
    setDueIds(getDueIds(verses.map(v => v.id)))
  }

  async function activateProfile(name: string, cleanUrl = false) {
    const trimmed = name.trim()
    if (!trimmed) {
      setProfileError('请输入姓名')
      setProfileLoading(false)
      return
    }

    setProfileLoading(true)
    setProfileError('')
    setHydrated(false)

    try {
      const loadedProfile = await createOrLoadProfile(trimmed)
      setActiveUserId(loadedProfile.slug)
      setActiveProfileName(loadedProfile.name)
      setActiveUser(loadedProfile.slug)
      setProfile(loadedProfile)
      await hydrateFromCloud(loadedProfile.slug)
      refreshDue()
      setHydrated(true)

      if (cleanUrl) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    } catch (error) {
      setProfile(null)
      setProfileError(error instanceof Error ? error.message : '云端连接失败')
    } finally {
      setProfileLoading(false)
    }
  }

  function switchProfile() {
    clearActiveProfile()
    setProfile(null)
    setActiveUser('')
    setDueIds([])
    setHydrated(false)
    setSelectedVerse(null)
    setProfileError('')
  }

  function handleComplete(_correct: boolean, _rating: Rating) {
    refreshDue()
    setSelectedVerse(null)
  }

  function startStudy(verse: BibleVerse, mode: StudyMode) {
    setStudyMode(mode)
    setSelectedVerse(verse)
  }

  // ── Study card view ───────────────────────────────────────────────────────
  if (selectedVerse) {
    return (
      <main className="min-h-screen bg-[var(--app-bg)] px-4 py-4 sm:px-6 sm:py-6">
        <StudyCard
          verse={selectedVerse}
          mode={studyMode}
          profileName={profile?.name}
          onComplete={handleComplete}
          onBack={() => setSelectedVerse(null)}
        />
      </main>
    )
  }


  const weekLessonId = getWeekLessonId()
  const weekEntry = getScheduleEntry(weekLessonId)
  const weekVerse = verses.find(v => v.id === weekLessonId) ?? null

  if (!profile) {
    return (
      <main className="min-h-screen flex flex-col bg-[var(--app-bg)] px-6 py-10 text-[var(--app-text)]">
        <div className="mx-auto flex flex-col justify-center flex-grow max-w-lg w-full">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-semibold">合神心意的门徒</h1>
            <p className="mt-2 text-xl text-[var(--muted-text)] [font-family:'Times_New_Roman',Times,serif]">Discipleship Essentials</p>
          </div>
          {profileLoading && !profileError ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 text-center text-sm text-[var(--muted-text)] shadow-2xl shadow-black/10">
              正在连接云端…
            </div>
          ) : (
            <NameGate
              loading={profileLoading}
              error={profileError}
              onSubmit={name => void activateProfile(name)}
            />
          )}
        </div>
        <footer className="mt-12 text-center text-xs text-[var(--subtle-text)] [font-family:'Times_New_Roman',Times,serif] shrink-0">
          {APP_VERSION}
        </footer>
      </main>
    )
  }


  return (
    <main className="min-h-screen flex flex-col bg-[var(--app-bg)] px-6 py-10 text-[var(--app-text)]">
      <div className="mx-auto max-w-5xl flex-grow w-full">
        <div className="mb-8 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div className="sm:col-start-2 text-center">
            <h1 className="text-3xl font-semibold">合神心意的门徒</h1>
            <p className="mt-2 text-xl text-[var(--muted-text)] [font-family:'Times_New_Roman',Times,serif]">Discipleship Essentials</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:col-start-3 sm:justify-end">
            <span className="text-xs border border-[var(--border)] px-3 py-1.5 rounded-lg bg-[var(--card-bg)] text-[var(--muted-text)] flex items-center gap-1.5 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              {profile.name}
            </span>
            <button
              onClick={() => {
                const nextTheme = theme === 'dark' ? 'light' : 'dark'
                setTheme(nextTheme)
                localStorage.setItem('bible_theme', nextTheme)
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-base text-[var(--app-text)] hover:bg-[var(--card-soft)]"
              aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
              title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-[var(--border)]">
          {([['week', '本周经文'], ['all', '全部经文'], ['stats', '统计']] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                tab === t ? 'text-[var(--app-text)]' : 'text-[var(--muted-text)] hover:text-[var(--app-text)]'
              }`}
            >
              {label}
              {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--app-text)] rounded-t" />}
            </button>
          ))}
        </div>

        {/* 本周经文 */}
        {tab === 'week' && (
          <div>
            {weekEntry && (
              <p className="text-xs text-stone-400 mb-3">
                第 {weekLessonId} 课 · 上课日期 {weekEntry.date}
              </p>
            )}
            {weekVerse ? (
              <div className="mt-4">
                <StudyCard
                  key={`week-card-${weekVerse.id}-${weekCardKey}`}
                  verse={weekVerse}
                  mode="recite"
                  onComplete={() => {
                    refreshDue()
                    setWeekCardKey(prev => prev + 1)
                  }}
                />
              </div>
            ) : (
              <p className="text-[var(--muted-text)] text-sm py-12 text-center">课程尚未开始</p>
            )}
          </div>
        )}

        {/* All verses */}
        {tab === 'all' && (
          <div className="space-y-3">
            {verses.map(verse => (
              <VerseRow key={verse.id} verse={verse} onStudy={startStudy} isDue={dueIds.includes(verse.id)} hydrated={hydrated} />
            ))}
          </div>
        )}

        {/* Stats */}
        {tab === 'stats' && <Heatmap key={activeUserId} />}
      </div>
      <footer className="mt-12 flex items-center justify-center gap-3 text-xs text-[var(--subtle-text)] [font-family:'Times_New_Roman',Times,serif] shrink-0">
        <span>{APP_VERSION}</span>
        <button onClick={switchProfile} className="font-sans hover:text-[var(--app-text)]">
          切换姓名
        </button>
      </footer>
    </main>
  )
}



function NameGate({
  loading,
  error,
  onSubmit,
}: {
  loading: boolean
  error: string
  onSubmit: (name: string) => void
}) {
  const [name, setName] = useState('')

  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        onSubmit(name)
      }}
      className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-2xl shadow-black/10"
    >
      <label className="block text-sm font-medium text-[var(--app-text)]" htmlFor="profile-name">
        请输入姓名
      </label>
      <input
        id="profile-name"
        value={name}
        onChange={event => setName(event.target.value)}
        placeholder="如：Michael"
        className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--app-bg)] px-4 py-3 text-base text-[var(--app-text)] outline-none placeholder:text-[var(--subtle-text)] focus:border-[var(--muted-text)]"
        autoFocus
      />
      {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="mt-5 w-full rounded-xl bg-[var(--button-bg)] py-3 text-sm font-semibold text-[var(--button-text)] transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {loading ? '正在连接云端…' : '进入'}
      </button>
      <p className="mt-4 text-xs leading-relaxed text-[var(--muted-text)]">
        数据会按姓名分别保存。姓名不是密码，请不要使用需要保密的信息。
      </p>
    </form>
  )
}


function HistoryDots({ verseId, hydrated }: { verseId: number; hydrated: boolean }) {
  if (!hydrated || typeof window === 'undefined') return null
  const history = getVerseHistory(verseId).slice(-5)
  if (history.length === 0) return null
  return (
    <div className="flex gap-0.5 mt-1">
      {history.map((e, i) => (
        <span key={i} className={`text-xs ${e.correct ? 'text-green-500' : 'text-red-400'}`} title={e.date}>
          {e.correct ? '✓' : '✗'}
        </span>
      ))}
    </div>
  )
}

function VerseRow({
  verse,
  onStudy,
  isDue,
  hydrated,
}: {
  verse: BibleVerse
  onStudy: (v: BibleVerse, mode: StudyMode) => void
  isDue: boolean
  hydrated: boolean
}) {
  const state = hydrated && typeof window !== 'undefined' ? getCardState(verse.id) : null
  const painting = LESSON_PAINTINGS[verse.id]

  return (
    <div
      onClick={() => onStudy(verse, 'recite')}
      className="bg-[var(--card-bg)] rounded-xl border border-[var(--border)] p-5 flex items-center gap-5 transition-colors hover:opacity-90 cursor-pointer hover:border-[var(--muted-text)]/30"
    >
      {/* Painting thumbnail */}
      {painting && (
        <div className="shrink-0 w-24 h-16 rounded-md overflow-hidden bg-[var(--card-soft)]">
          <img
            src={painting.url}
            alt={painting.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-500 shrink-0">第 {verse.id} 课</span>
          {isDue && (
            <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5 shrink-0">待复习</span>
          )}
          {state?.passed && (
            <span className="text-xs bg-green-100 text-green-600 rounded-full px-2 py-0.5 shrink-0">已掌握</span>
          )}
        </div>
        <p className="font-medium text-[var(--app-text)] text-base mt-0.5">{verse.lesson}</p>
        <p className="text-xs text-[var(--muted-text)] truncate">{verse.reference}</p>
        {state && state.repetitions > 0 && (
          <p className="text-xs text-[var(--subtle-text)] mt-0.5">下次复习：{state.dueDate}</p>
        )}
        <HistoryDots verseId={verse.id} hydrated={hydrated} />
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onStudy(verse, 'recite')}
          className="text-xs border border-[var(--border)] text-[var(--app-text)] px-4 py-2 rounded-lg hover:bg-[var(--card-soft)] transition-colors"
        >
          默写经文
        </button>
      </div>
    </div>
  )
}
