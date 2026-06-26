'use client'

import { useState } from 'react'
import { compareText, compareReference, type AlignedChar } from './diff'
import { applyRating, getCardState, type Rating } from './srs'
import { addEntry, todayKey, type MistakeCard } from './history'
import { saveCloudCardState, saveCloudHistory } from './cloud'
import type { BibleVerse } from './page'
import { LESSON_PAINTINGS } from '@/lib/data/paintings'
import bibleChaptersData from '@/lib/data/bible_chapters.json'

type Mode = 'recite' | 'reference'
type Stage = 'idle' | 'inputting' | 'reviewing'

function BibleChapterContext({ verseId, isDrawer = false }: { verseId: number; isDrawer?: boolean }) {
  const chaptersObj = (bibleChaptersData as any)[verseId]
  const chapters = chaptersObj?.chapters || []

  if (chapters.length === 0) return null

  return (
    <div className={`text-left space-y-5 ${isDrawer ? '' : 'mt-6 max-w-2xl mx-auto'}`}>
      {chapters.map((ch: any, idx: number) => (
        <div key={idx} className="space-y-2">
          <p className="text-xs text-[var(--muted-text)] font-semibold font-sans">
            《{ch.book}》第 {ch.chapter} 章
          </p>
          <div className={`text-justify text-base [font-family:KaiTi,STKaiti,'Kaiti_SC',serif] leading-loose text-[var(--app-text)] ${
            isDrawer 
              ? 'bg-[var(--card-soft)]/50 border border-[var(--border)]/40 rounded-xl p-5' 
              : 'bg-[var(--card-soft)] border border-[var(--border)] rounded-xl p-5 max-h-[320px] overflow-y-auto scrollbar-thin'
          }`}>
            <p className="indent-[2em]">
              {ch.verses.map((v: any) => (
                <span
                  key={v.verseNum}
                  className={v.isHighlight ? "text-red-500 font-semibold inline" : "inline"}
                >
                  <sup className={`text-[10px] mr-0.5 select-none ${v.isHighlight ? 'text-red-400 font-bold' : 'text-stone-400'}`}>
                    {v.verseNum}
                  </sup>
                  {v.text}
                </span>
              ))}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}


interface Props {
  verse: BibleVerse
  mode: Mode
  profileName?: string
  onComplete: (correct: boolean, rating: Rating) => void
  onBack?: () => void
}


const RATING_LABELS: { rating: Rating; label: string; color: string }[] = [
  { rating: 1, label: '再学', color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' },
  { rating: 2, label: '有难度', color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' },
  { rating: 3, label: '记住了', color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
  { rating: 4, label: '太简单', color: 'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200' },
]

function AlignedReview({ aligned, isEnglish = false }: { aligned: AlignedChar[]; isEnglish?: boolean }) {
  if (isEnglish) {
    return (
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs text-[var(--muted-text)]">你的默写</p>
          <div className="font-mono rounded-xl bg-[var(--app-bg)] p-4 text-base leading-relaxed whitespace-pre-wrap text-justify break-words">
            {aligned.map((item, index) => {
              if (item.type === 'ok') {
                return <span key={index} className="text-[var(--app-text)]">{item.inputChar}</span>
              } else if (item.type === 'mismatch' || item.type === 'extra') {
                return (
                  <span key={index} className="bg-red-100 text-red-700 px-0.5 rounded">
                    {item.inputChar || '\u00A0'}
                  </span>
                )
              }
              return null
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs text-[var(--muted-text)]">正确经文</p>
          <div className="font-mono rounded-xl bg-[var(--app-bg)] p-4 text-base leading-relaxed whitespace-pre-wrap text-justify break-words">
            {aligned.map((item, index) => {
              if (item.type === 'ok') {
                return <span key={index} className="text-[var(--app-text)]">{item.originalChar}</span>
              } else if (item.type === 'mismatch' || item.type === 'missing') {
                return (
                  <span key={index} className="bg-red-100 text-red-700 px-0.5 rounded">
                    {item.originalChar || '\u00A0'}
                  </span>
                )
              }
              return null
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs text-[var(--muted-text)]">你的默写</p>
        <div className="[font-family:KaiTi,STKaiti,'Kaiti_SC',serif] rounded-xl bg-[var(--app-bg)] p-4 text-2xl leading-9">
          {aligned.map((item, index) => (
            <span
              key={`input-${index}`}
              className={`inline-flex w-[1em] justify-center rounded px-0 ${
                item.type === 'ok' ? 'text-[var(--app-text)]' : item.inputChar ? 'bg-red-100 text-red-700' : 'text-transparent'
              }`}
            >
              {item.inputChar ?? '\u00A0'}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-[var(--muted-text)]">正确经文</p>
        <div className="[font-family:KaiTi,STKaiti,'Kaiti_SC',serif] rounded-xl bg-[var(--app-bg)] p-4 text-2xl leading-9">
          {aligned.map((item, index) => (
            <span
              key={`original-${index}`}
              className={`inline-flex w-[1em] justify-center rounded px-0 ${
                item.type === 'ok' ? 'text-[var(--app-text)]' : item.originalChar ? 'bg-red-100 text-red-700' : 'text-transparent'
              }`}
            >
              {item.originalChar ?? '\u00A0'}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function PaintingPanel({ verse, compact = false }: { verse: BibleVerse; compact?: boolean }) {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <div className={`relative overflow-hidden bg-stone-200 ${compact ? 'h-48 rounded-t-2xl' : 'h-full min-h-[280px] rounded-l-2xl'}`}>
      {!imgFailed && verse.image?.url ? (
        <img
          src={verse.image.url}
          alt={verse.image.title}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-stone-300 to-stone-400 flex items-center justify-center">
          <span className="text-stone-500 text-4xl">✦</span>
        </div>
      )}
      {/* Attribution overlay */}
      {verse.image && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
          <p className="text-white/90 text-xs font-medium leading-tight">{verse.image.title}</p>
          <p className="text-white/60 text-xs">{verse.image.artist}</p>
        </div>
      )}
    </div>
  )
}

function ConsecutiveDots({ count, passed }: { count: number; passed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-stone-400">连续答对</span>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border-2 transition-colors ${
              i < count
                ? passed && count >= 3
                  ? 'bg-green-500 border-green-500'
                  : 'bg-[var(--button-bg)] border-[var(--button-bg)]'
                : 'bg-transparent border-[var(--border)]'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-stone-400">{Math.min(count, 3)}/3</span>
      {passed && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">已掌握 ✓</span>}
    </div>
  )
}

function buildMistakeCards(aligned: AlignedChar[]): MistakeCard[] {
  const cards: MistakeCard[] = []
  let index = 0
  const compact = (text: string) => text.length > 18 ? `${text.slice(0, 18)}…` : text

  while (index < aligned.length) {
    const current = aligned[index]
    if (current.type === 'ok') {
      index += 1
      continue
    }

    const group: AlignedChar[] = []
    while (index < aligned.length && aligned[index].type !== 'ok') {
      group.push(aligned[index])
      index += 1
    }

    const input = group.map(item => item.inputChar ?? '').join('')
    const expected = group.map(item => item.originalChar ?? '').join('')
    cards.push({
      input: compact(input) || '漏写',
      expected: compact(expected) || '多写',
      type: input && expected ? 'mismatch' : input ? 'extra' : 'missing',
    })
  }

  return cards.slice(0, 12)
}

function MistakeCards({ cards }: { cards: MistakeCard[] }) {
  if (cards.length === 0) return null

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="mb-3 text-sm font-semibold text-red-700">本次错点</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {cards.map((card, index) => (
          <div key={`${card.input}-${card.expected}-${index}`} className="rounded-lg border border-red-200 bg-[var(--card-bg)] p-3 text-left">
            <p className="text-xs text-stone-400">你写成</p>
            <p className="[font-family:KaiTi,STKaiti,'Kaiti_SC',serif] text-lg leading-relaxed text-red-700">{card.input}</p>
            <p className="mt-2 text-xs text-stone-400">应为</p>
            <p className="[font-family:KaiTi,STKaiti,'Kaiti_SC',serif] text-lg leading-relaxed text-[var(--app-text)]">{card.expected}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StudyCard({ verse, mode, profileName = '', onComplete, onBack }: Props) {
  const [stage, setStage] = useState<Stage>('idle')
  const [input, setInput] = useState('')
  const [diffResult, setDiffResult] = useState<ReturnType<typeof compareText> | null>(null)
  const [refCorrect, setRefCorrect] = useState<boolean | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [mistakeCards, setMistakeCards] = useState<MistakeCard[]>([])
  const [reciteLanguage, setReciteLanguage] = useState<'zh' | 'en'>('zh')

  const cardState = getCardState(verse.id)

  function handleCheck() {
    let correct = false
    let missedCount = 0
    let mistakes: MistakeCard[] = []

    if (mode === 'recite') {
      const targetText = reciteLanguage === 'en' ? (verse.textEn ?? '') : verse.text
      const result = compareText(input, targetText, reciteLanguage)
      setDiffResult(result)
      correct = result.allCorrect
      mistakes = result.allCorrect ? [] : buildMistakeCards(result.aligned)
      if (reciteLanguage === 'en') {
        missedCount = result.aligned.filter(a => a.type === 'missing').length
      } else {
        missedCount = result.sentences.reduce((acc, s) => {
          return acc + s.annotated.filter(a => a.type === 'missing').length
        }, 0)
      }
    } else {
      const targetRef = reciteLanguage === 'en' ? (verse.referenceEn ?? '') : verse.reference
      correct = compareReference(input, targetRef)
      setRefCorrect(correct)
      mistakes = correct ? [] : [{ input: input.trim() || '空白', expected: targetRef, type: 'mismatch' }]
    }

    setIsCorrect(correct)
    setMistakeCards(mistakes)
    const entry = { verseId: verse.id, date: todayKey(), ts: Date.now(), mode, correct, missedCount, mistakes }
    addEntry(entry)
    void saveCloudHistory(entry).catch(error => console.error(error))
    setStage('reviewing')
  }

  function handleRate(rating: Rating) {
    const state = applyRating(verse.id, isCorrect, rating)
    void saveCloudCardState(verse.id, state).catch(error => console.error(error))
    if (rating === 1) {
      resetCard()
    } else {
      onComplete(isCorrect, rating)
    }
  }

  function resetCard() {
    setStage('idle')
    setInput('')
    setDiffResult(null)
    setRefCorrect(null)
    setIsCorrect(false)
    setMistakeCards([])
    setReciteLanguage('zh')
  }

  const newConsecutive = isCorrect ? Math.min(cardState.consecutiveCorrect + 1, 3) : 0
  const willBePassed = cardState.passed || newConsecutive >= 3

  // ── IDLE — 大图 + 信息 ───────────────────────────────────────────────────
  if (stage === 'idle') {
    const painting = LESSON_PAINTINGS[verse.id]
    return (
      <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-4xl flex-col sm:h-[calc(100vh-3rem)]">
        {onBack && (
          <button onClick={onBack} className="text-[var(--muted-text)] hover:text-[var(--app-text)] text-sm mb-4 flex items-center gap-1 shrink-0">
            ← 返回列表
          </button>
        )}
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl shadow-black/20 flex flex-col">
          <div className="flex h-full flex-col min-h-0">
            {/* Painting */}
            {painting && (
              <div className="relative h-56 sm:h-72 md:h-[380px] w-full bg-stone-950 shrink-0 overflow-hidden border-b border-[var(--border)]/40 flex items-center justify-center">
                <img
                  src={painting.url.replace('/250px-', '/960px-')}
                  alt={painting.title}
                  className="h-full max-w-full object-contain"
                />
                <div className="absolute bottom-2 right-3 text-right bg-black/45 px-2 py-0.5 rounded backdrop-blur-xs">
                  <p className="text-white/95 text-[10px] sm:text-xs font-sans">{painting.title}</p>
                  <p className="text-white/70 text-[10px] sm:text-xs font-sans">{painting.artistZh} · {painting.year}</p>
                </div>
              </div>
            )}

            <div className="flex min-h-0 flex-1 flex-col p-5 text-center sm:p-6 md:p-8">
              <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">第 {verse.id} 课</p>
              <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--app-text)] mb-3">{verse.lesson}</h2>

              {/* Consecutive progress */}
              <div className="mb-4 flex justify-center shrink-0">
                <ConsecutiveDots count={cardState.consecutiveCorrect} passed={cardState.passed} />
              </div>

              {mode === 'recite' ? (
                <>
                  <p className="text-[var(--muted-text)] text-sm mb-2 shrink-0">{verse.reference}</p>
                  <div className="mb-4 min-h-0 flex-1 overflow-y-auto rounded-xl bg-[var(--app-bg)] p-4 text-left">
                    <div className={verse.textEn && profileName === '宋大副' ? "grid gap-4 md:grid-cols-2 md:gap-6" : "max-w-2xl mx-auto"}>
                      {/* Chinese text */}
                      <div className="[font-family:KaiTi,STKaiti,'Kaiti_SC',serif] text-base leading-loose text-[var(--app-text)] sm:text-lg">
                        {verse.text.split('\n').map((line, i) => (
                          <p key={i} className="indent-[2em] whitespace-pre-wrap">
                            {line}
                          </p>
                        ))}
                      </div>
                      {/* English text (ESV) */}
                      {verse.textEn && profileName === '宋大副' && (
                        <div className="border-t border-[var(--border)]/30 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6 [font-family:Georgia,serif] text-sm leading-relaxed text-[var(--muted-text)] sm:text-base">
                          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-stone-400 mb-2 font-sans font-medium">ESV Translation ({verse.referenceEn})</p>
                          <p className="whitespace-pre-line italic">{verse.textEn}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="inline-flex items-center justify-center gap-1.5 text-xs text-stone-400 border border-[var(--border)] px-3 py-1.5 rounded-lg hover:bg-[var(--card-soft)] transition-colors mb-4 cursor-pointer shrink-0"
                  >
                    📖 查看本章上下文
                  </button>
                  <p className="text-xs text-[var(--muted-text)] mb-3 shrink-0">熟读原文后开始默写（标点可省略）</p>
                  <button
                    onClick={() => {
                      setReciteLanguage('zh')
                      setStage('inputting')
                    }}
                    className="w-full bg-[var(--button-bg)] text-[var(--button-text)] py-4 rounded-xl text-sm font-semibold transition-colors hover:opacity-90 shrink-0 mb-2"
                  >
                    开始默写
                  </button>
                  {verse.textEn && profileName === '宋大副' && (
                    <button
                      onClick={() => {
                        setReciteLanguage('en')
                        setStage('inputting')
                      }}
                      className="w-full border border-[var(--border)] text-[var(--app-text)] py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--card-soft)] shrink-0"
                    >
                      ESV 英文默写
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className="mb-4 min-h-0 flex-1 overflow-y-auto rounded-xl bg-[var(--app-bg)] p-4 text-left border-l-2 border-[var(--border)] pl-4">
                    <div className={verse.textEn && profileName === '宋大副' ? "grid gap-4 md:grid-cols-2 md:gap-6" : "max-w-2xl mx-auto"}>
                      {/* Chinese text */}
                      <div className="[font-family:KaiTi,STKaiti,'Kaiti_SC',serif] text-base leading-loose text-[var(--app-text)] sm:text-lg">
                        {verse.text.split('\n').map((line, i) => (
                          <p key={i} className="indent-[2em] whitespace-pre-wrap">
                            {line}
                          </p>
                        ))}
                      </div>
                      {/* English text (ESV) */}
                      {verse.textEn && profileName === '宋大副' && (
                        <div className="border-t border-[var(--border)]/30 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-6 [font-family:Georgia,serif] text-sm leading-relaxed text-[var(--muted-text)] sm:text-base">
                          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-stone-400 mb-2 font-sans font-medium">ESV Translation ({verse.referenceEn})</p>
                          <p className="whitespace-pre-line italic">{verse.textEn}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="inline-flex items-center justify-center gap-1.5 text-xs text-stone-400 border border-[var(--border)] px-3 py-1.5 rounded-lg hover:bg-[var(--card-soft)] transition-colors mb-4 cursor-pointer shrink-0"
                  >
                    📖 查看本章上下文
                  </button>
                  <p className="text-xs text-[var(--muted-text)] mb-3 shrink-0">写出这段经文的出处（书卷 章:节）</p>
                  <button
                    onClick={() => {
                      setReciteLanguage('zh')
                      setStage('inputting')
                    }}
                    className="mt-auto w-full bg-[var(--button-bg)] text-[var(--button-text)] py-4 rounded-xl text-sm font-semibold transition-colors hover:opacity-90 shrink-0 mb-2"
                  >
                    输入出处
                  </button>
                  {verse.referenceEn && profileName === '宋大副' && (
                    <button
                      onClick={() => {
                        setReciteLanguage('en')
                        setStage('inputting')
                      }}
                      className="w-full border border-[var(--border)] text-[var(--app-text)] py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--card-soft)] shrink-0"
                    >
                      输入英文出处 (ESV)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Drawer */}
        <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${showSidebar ? 'visible' : 'invisible'}`}>
          <div 
            className={`absolute inset-0 bg-black/45 backdrop-blur-sm transition-opacity duration-300 ${showSidebar ? 'opacity-100' : 'opacity-0'}`} 
            onClick={() => setShowSidebar(false)} 
          />
          <div className={`relative w-full max-w-lg bg-[var(--card-bg)] border-l border-[var(--border)] h-full p-8 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[var(--border)] shrink-0">
              <h3 className="text-lg font-bold text-[var(--app-text)]">整章上下文</h3>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-stone-400 hover:text-[var(--app-text)] text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--card-soft)] transition-colors cursor-pointer"
                aria-label="关闭"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-1">
              <BibleChapterContext verseId={verse.id} isDrawer={true} />
            </div>
          </div>
        </div>

      </div>
    )
  }



  // ── INPUTTING — 左图右输入 ───────────────────────────────────────────────
  if (stage === 'inputting') {
    return (
      <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-4xl flex-col sm:h-[calc(100vh-3rem)]">
        <button onClick={() => setStage('idle')} className="text-[var(--muted-text)] hover:text-[var(--app-text)] text-sm mb-4 flex items-center gap-1 shrink-0">
          ← 返回
        </button>
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl shadow-black/20 flex flex-col">
          {/* Painting */}
          <div className="relative bg-stone-950 h-56 sm:h-72 md:h-[380px] shrink-0 overflow-hidden border-b border-[var(--border)]/40 flex items-center justify-center">
            <PaintingImage verse={verse} />
            {/* Lesson label overlay */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent px-4 py-3">
              <p className="text-white/70 text-xs">第 {verse.id} 课</p>
              <p className="text-white font-semibold text-sm">{verse.lesson}</p>
            </div>
          </div>

          {/* Input area */}
          <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6 md:p-8">
            {mode === 'recite' ? (
              <>
                <p className="text-[var(--app-text)] font-medium text-base mb-3">
                  {reciteLanguage === 'en' ? (verse.referenceEn ?? '') : verse.reference}
                </p>
                <p className="mb-4 text-xs text-[var(--muted-text)]">
                  {reciteLanguage === 'en' ? '默写英文 (ESV) 经文，提交后逐字对照' : '默写经文，提交后逐字对照'}
                </p>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={reciteLanguage === 'en' ? 'Type the ESV English verse here, punctuation is optional...' : '在此默写经文，标点可省略，遗漏一字算错…'}
                  className={`${
                    reciteLanguage === 'en'
                      ? 'font-mono text-base leading-relaxed'
                      : '[font-family:KaiTi,STKaiti,\'Kaiti_SC\',serif] text-xl leading-loose'
                  } flex-1 w-full border border-[var(--border)] bg-[var(--app-bg)] text-[var(--app-text)] rounded-xl p-5 outline-none focus:border-[var(--muted-text)] resize-none placeholder:text-[var(--subtle-text)]`}
                  autoFocus
                />
              </>
            ) : (
              <>
                {reciteLanguage === 'en' ? (
                  <div className="font-mono flex-1 text-[var(--app-text)] text-sm leading-relaxed border-l-2 border-[var(--border)] pl-4 mb-4 overflow-y-auto whitespace-pre-line italic">
                    {verse.textEn}
                  </div>
                ) : (
                  <div className="[font-family:KaiTi,STKaiti,'Kaiti_SC',serif] flex-1 text-[var(--app-text)] text-base leading-loose border-l-2 border-[var(--border)] pl-4 mb-4 overflow-y-auto space-y-2">
                    {verse.text.split('\n').map((line, i) => (
                      <p key={i} className="indent-[2em]">
                        {line}
                      </p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-[var(--muted-text)] mb-2">
                  {reciteLanguage === 'en' ? '写出这段经文的出处（书卷 章:节，英文）' : '写出这段经文的出处（书卷 章:节）'}
                </p>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={reciteLanguage === 'en' ? 'e.g., Matthew 28:18-20' : '如：马太福音 28:18-20'}
                  className="w-full border border-[var(--border)] bg-[var(--app-bg)] text-[var(--app-text)] rounded-xl p-4 text-sm outline-none focus:border-[var(--muted-text)] placeholder:text-[var(--subtle-text)]"
                  autoFocus
                />
              </>
            )}
            <button
              onClick={handleCheck}
              disabled={!input.trim()}
              className="mt-5 w-full bg-[var(--button-bg)] text-[var(--button-text)] py-4 rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors hover:opacity-90"
            >
              提交
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── REVIEWING ─────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-4xl flex-col sm:h-[calc(100vh-3rem)]">
      <button onClick={resetCard} className="text-[var(--muted-text)] hover:text-[var(--app-text)] text-sm mb-4 flex items-center gap-1 shrink-0">
        ← 再练一次
      </button>
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl shadow-black/20 flex flex-col">
        {/* Painting */}
        <div className="relative bg-stone-950 h-56 sm:h-72 md:h-[380px] shrink-0 overflow-hidden border-b border-[var(--border)]/40 flex items-center justify-center">
          <PaintingImage verse={verse} />
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent px-4 py-3">
            <p className="text-white/70 text-xs">第 {verse.id} 课</p>
            <p className="text-white font-semibold text-sm">{verse.lesson}</p>
          </div>
        </div>

        {/* Results */}
        <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6 md:p-8 space-y-5 overflow-y-auto">
          <ConsecutiveDots count={newConsecutive} passed={willBePassed} />

          {!cardState.passed && willBePassed && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <p className="text-xl mb-0.5">🎉</p>
              <p className="text-green-700 font-semibold text-sm">连续三次正确，已掌握！</p>
            </div>
          )}

          {mode === 'reference' && refCorrect !== null && (
            <div className={`p-4 rounded-xl text-sm ${refCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {refCorrect ? (
                <p className="text-green-700 font-medium">✓ 正确！</p>
              ) : (
                <>
                  <p className="text-red-700 font-medium mb-2">✗ 出处有误</p>
                  <p className="text-stone-500 text-xs">你的回答：<span className="text-red-600 line-through">{input}</span></p>
                  <p className="text-stone-600 mt-1">
                    正确出处：<span className="font-medium text-green-700">
                      {reciteLanguage === 'en' ? (verse.referenceEn ?? '') : verse.reference}
                    </span>
                  </p>
                </>
              )}
            </div>
          )}

          <MistakeCards cards={mistakeCards} />

          {mode === 'recite' && diffResult && (
            <div>
              {diffResult.allCorrect ? (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                  <p className="text-green-700 font-medium text-sm">✓ 全部正确！</p>
                </div>
              ) : (
                <AlignedReview aligned={diffResult.aligned} isEnglish={reciteLanguage === 'en'} />
              )}
            </div>
          )}

          <div className="pt-2">
            <p className="text-xs text-stone-400 mb-2">评分（影响下次复习间隔）</p>
            <div className="grid grid-cols-4 gap-2">
              {RATING_LABELS.map(({ rating, label, color }) => (
                <button
                  key={rating}
                  onClick={() => handleRate(rating)}
                  className={`border py-2 rounded-xl text-sm font-medium transition-colors ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Extracted to avoid useState reset on parent re-render
function PaintingImage({ verse }: { verse: BibleVerse }) {
  const [failed, setFailed] = useState(false)
  const painting = LESSON_PAINTINGS[verse.id]
  const image = painting
    ? {
        url: painting.url.replace('/250px-', '/960px-'),
        title: painting.title,
        artist: `${painting.artistZh} · ${painting.year}`,
      }
    : verse.image

  return (
    <>
      {!failed && image?.url ? (
        <img
          src={image.url}
          alt={image.title ?? verse.lesson}
          onError={() => setFailed(true)}
          className="h-full max-w-full object-contain"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-stone-900 to-stone-800 flex items-center justify-center">
          <span className="text-stone-600 text-5xl">✦</span>
        </div>
      )}
      {image && (
        <div className="absolute bottom-2 right-3 text-right bg-black/45 px-2 py-0.5 rounded backdrop-blur-xs">
          <p className="text-white/95 text-[10px] sm:text-xs font-sans">{image.title}</p>
          <p className="text-white/70 text-[10px] sm:text-xs font-sans">{image.artist}</p>
        </div>
      )}
    </>
  )
}
