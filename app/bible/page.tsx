'use client'

import { useState, useEffect } from 'react'
import versesData from '@/lib/data/bible_verses.json'
import StudyCard from './StudyCard'
import Heatmap from './Heatmap'
import { getDueIds, getCardState, type Rating } from './srs'
import { getVerseHistory } from './history'
import { LESSON_PAINTINGS } from '@/lib/data/paintings'
import { getWeekLessonId, getScheduleEntry } from '@/lib/data/schedule'

export interface BibleVerse {
  id: number
  lesson: string
  reference: string
  text: string
}

const verses: BibleVerse[] = versesData as BibleVerse[]
type StudyMode = 'recite' | 'reference'
type Tab = 'week' | 'all' | 'stats'

export default function BiblePage() {
  const [tab, setTab] = useState<Tab>('week')
  const [dueIds, setDueIds] = useState<number[]>([])
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null)
  const [studyMode, setStudyMode] = useState<StudyMode>('recite')

  useEffect(() => {
    refreshDue()
  }, [])

  function refreshDue() {
    setDueIds(getDueIds(verses.map(v => v.id)))
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

  const weekLessonId = getWeekLessonId()
  const weekEntry = getScheduleEntry(weekLessonId)
  const weekVerse = verses.find(v => v.id === weekLessonId) ?? null

  return (
    <main className="px-4 py-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">背经练习</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-stone-200">
        {([['week', '本周经文'], ['all', '全部经文'], ['stats', '统计']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              tab === t ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            {label}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 rounded-t" />}
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
            <VerseRow verse={weekVerse} onStudy={startStudy} isDue={dueIds.includes(weekVerse.id)} />
          ) : (
            <p className="text-stone-400 text-sm py-12 text-center">课程尚未开始</p>
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
  const painting = LESSON_PAINTINGS[verse.id]

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4 hover:border-stone-300 transition-colors">
      {/* Painting thumbnail */}
      {painting && (
        <div className="shrink-0 w-16 h-16 rounded-md overflow-hidden bg-stone-100">
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
