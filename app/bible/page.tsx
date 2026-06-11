'use client'

import { useState, useEffect } from 'react'
import versesData from '@/lib/data/bible_verses.json'
import StudyCard from './StudyCard'
import Heatmap from './Heatmap'
import { getDueIds, getCardState, type Rating } from './srs'
import { getVerseHistory } from './history'

export interface BibleVerse {
  id: number
  lesson: string
  reference: string
  text: string
  image?: { url: string; title: string; artist: string }
}

const verses: BibleVerse[] = versesData as BibleVerse[]
type StudyMode = 'recite' | 'reference'
type Tab = 'due' | 'all' | 'stats'

export default function BiblePage() {
  const [tab, setTab] = useState<Tab>('due')
  const [dueIds, setDueIds] = useState<number[]>([])
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null)
  const [studyMode, setStudyMode] = useState<StudyMode>('recite')
  const [completedThisSession, setCompletedThisSession] = useState<number[]>([])

  useEffect(() => {
    refreshDue()
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const checkedToday = localStorage.getItem('bible_notif_checked')
      const today = new Date().toISOString().slice(0, 10)
      if (checkedToday !== today) {
        Notification.requestPermission()
        localStorage.setItem('bible_notif_checked', today)
      }
    }
  }, [])

  function refreshDue() {
    setDueIds(getDueIds(verses.map(v => v.id)))
  }

  function handleComplete(_correct: boolean, _rating: Rating) {
    if (selectedVerse) {
      setCompletedThisSession(prev => [...prev, selectedVerse.id])
    }
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
      <main className="px-4 py-10 max-w-2xl mx-auto">
        <StudyCard
          verse={selectedVerse}
          mode={studyMode}
          onComplete={handleComplete}
          onBack={() => setSelectedVerse(null)}
        />
      </main>
    )
  }

  const dueVerses = verses.filter(v => dueIds.includes(v.id))
  const todayDone = dueIds.length === 0 && completedThisSession.length > 0

  return (
    <main className="px-4 py-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">背经练习</h1>
      <p className="text-stone-400 text-sm mb-6">圣经和合本 · 艾宾浩斯间隔复习</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-stone-200">
        {([['due', '今日复习'], ['all', '全部经文'], ['stats', '统计']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              tab === t ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {label}
            {t === 'due' && dueIds.length > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {dueIds.length}
              </span>
            )}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 rounded-t" />}
          </button>
        ))}
      </div>

      {/* Today's due */}
      {tab === 'due' && (
        <div>
          {dueVerses.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              {todayDone ? (
                <>
                  <p className="text-2xl mb-2">🎉</p>
                  <p className="font-medium text-stone-600">今日复习完成！</p>
                  <p className="text-sm mt-1">明天再来继续吧</p>
                </>
              ) : (
                <>
                  <p className="text-2xl mb-2">✅</p>
                  <p className="font-medium text-stone-600">今日无需复习</p>
                  <p className="text-sm mt-1">可前往「全部经文」开始新的背诵</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {dueVerses.map(verse => (
                <VerseRow key={verse.id} verse={verse} onStudy={startStudy} isDue />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All verses */}
      {tab === 'all' && (
        <div className="space-y-3">
          {verses.map(verse => (
            <VerseRow key={verse.id} verse={verse} onStudy={startStudy} isDue={dueIds.includes(verse.id)} />
          ))}
        </div>
      )}

      {/* Stats */}
      {tab === 'stats' && <Heatmap />}
    </main>
  )
}

function HistoryDots({ verseId }: { verseId: number }) {
  if (typeof window === 'undefined') return null
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
}: {
  verse: BibleVerse
  onStudy: (v: BibleVerse, mode: StudyMode) => void
  isDue: boolean
}) {
  const state = typeof window !== 'undefined' ? getCardState(verse.id) : null

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4 hover:border-stone-300 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 shrink-0">第 {verse.id} 课</span>
          {isDue && (
            <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5 shrink-0">待复习</span>
          )}
          {state?.passed && (
            <span className="text-xs bg-green-100 text-green-600 rounded-full px-2 py-0.5 shrink-0">已掌握</span>
          )}
        </div>
        <p className="font-medium text-stone-900 text-sm mt-0.5">{verse.lesson}</p>
        <p className="text-xs text-stone-400 truncate">{verse.reference}</p>
        {state && state.repetitions > 0 && (
          <p className="text-xs text-stone-300 mt-0.5">下次复习：{state.dueDate}</p>
        )}
        <HistoryDots verseId={verse.id} />
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onStudy(verse, 'recite')}
          className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
        >
          默写经文
        </button>
        <button
          onClick={() => onStudy(verse, 'reference')}
          className="text-xs border border-stone-200 text-stone-600 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
        >
          背出处
        </button>
      </div>
    </div>
  )
}
