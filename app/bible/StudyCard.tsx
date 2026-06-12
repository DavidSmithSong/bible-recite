'use client'

import { useState } from 'react'
import { compareText, compareReference, type AlignedChar } from './diff'
import { applyRating, getCardState, type Rating } from './srs'
import { addEntry, todayKey } from './history'
import type { BibleVerse } from './page'
import { LESSON_PAINTINGS } from '@/lib/data/paintings'

type Mode = 'recite' | 'reference'
type Stage = 'idle' | 'inputting' | 'reviewing'

interface Props {
  verse: BibleVerse
  mode: Mode
  onComplete: (correct: boolean, rating: Rating) => void
  onBack: () => void
}

const RATING_LABELS: { rating: Rating; label: string; color: string }[] = [
  { rating: 1, label: '再学', color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' },
  { rating: 2, label: '有难度', color: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' },
  { rating: 3, label: '记住了', color: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' },
  { rating: 4, label: '太简单', color: 'bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-200' },
]

function AlignedReview({ aligned }: { aligned: AlignedChar[] }) {
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

export default function StudyCard({ verse, mode, onComplete, onBack }: Props) {
  const [stage, setStage] = useState<Stage>('idle')
  const [input, setInput] = useState('')
  const [diffResult, setDiffResult] = useState<ReturnType<typeof compareText> | null>(null)
  const [refCorrect, setRefCorrect] = useState<boolean | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)

  const cardState = getCardState(verse.id)

  function handleCheck() {
    let correct = false
    let missedCount = 0

    if (mode === 'recite') {
      const result = compareText(input, verse.text)
      setDiffResult(result)
      correct = result.allCorrect
      missedCount = result.sentences.reduce((acc, s) => {
        return acc + s.annotated.filter(a => a.type === 'missing').length
      }, 0)
    } else {
      correct = compareReference(input, verse.reference)
      setRefCorrect(correct)
    }

    setIsCorrect(correct)
    addEntry({ verseId: verse.id, date: todayKey(), ts: Date.now(), mode, correct, missedCount })
    setStage('reviewing')
  }

  function handleRate(rating: Rating) {
    applyRating(verse.id, isCorrect, rating)
    onComplete(isCorrect, rating)
  }

  function resetCard() {
    setStage('idle')
    setInput('')
    setDiffResult(null)
    setRefCorrect(null)
    setIsCorrect(false)
  }

  const newConsecutive = isCorrect ? Math.min(cardState.consecutiveCorrect + 1, 3) : 0
  const willBePassed = cardState.passed || newConsecutive >= 3

  // ── IDLE — 大图 + 信息 ───────────────────────────────────────────────────
  if (stage === 'idle') {
    const painting = LESSON_PAINTINGS[verse.id]
    return (
      <div className="mx-auto max-w-4xl">
        <button onClick={onBack} className="text-[var(--muted-text)] hover:text-[var(--app-text)] text-sm mb-4 flex items-center gap-1">
          ← 返回列表
        </button>
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] shadow-2xl shadow-black/20 overflow-hidden">
          {/* Painting */}
          {painting && (
            <div className="relative w-full h-96 bg-[var(--card-soft)]">
              <img
                src={painting.url.replace('/250px-', '/960px-')}
                alt={painting.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-3 text-right">
                <p className="text-white/60 text-xs drop-shadow">{painting.title}</p>
                <p className="text-white/60 text-xs drop-shadow">{painting.artistZh} · {painting.year}</p>
              </div>
            </div>
          )}

          <div className="p-10 text-center">
            <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">第 {verse.id} 课</p>
            <h2 className="text-3xl font-semibold text-[var(--app-text)] mb-4">{verse.lesson}</h2>

            {/* Consecutive progress */}
            <div className="mb-5 flex justify-center">
              <ConsecutiveDots count={cardState.consecutiveCorrect} passed={cardState.passed} />
            </div>

            {mode === 'recite' ? (
              <>
                <p className="text-[var(--muted-text)] text-sm mb-3">{verse.reference}</p>
                <div className="[font-family:KaiTi,STKaiti,'Kaiti_SC',serif] mx-auto mb-8 max-w-2xl whitespace-pre-line text-left text-lg leading-loose text-[var(--app-text)]">
                  {verse.text}
                </div>
                <p className="text-xs text-[var(--muted-text)] mb-6">熟读原文后开始默写（标点可省略）</p>
                <button
                  onClick={() => setStage('inputting')}
                  className="w-full bg-[var(--button-bg)] text-[var(--button-text)] py-4 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
                >
                  开始默写
                </button>
              </>
            ) : (
              <>
                <div className="[font-family:KaiTi,STKaiti,'Kaiti_SC',serif] my-5 text-[var(--app-text)] leading-loose text-sm whitespace-pre-line border-l-2 border-[var(--border)] pl-4 text-left">
                  {verse.text}
                </div>
                <p className="text-xs text-[var(--muted-text)] mb-4">写出这段经文的出处（书卷 章:节）</p>
                <button
                  onClick={() => setStage('inputting')}
                  className="w-full bg-[var(--button-bg)] text-[var(--button-text)] py-4 rounded-xl text-sm font-semibold transition-colors hover:opacity-90"
                >
                  输入出处
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── INPUTTING — 左图右输入 ───────────────────────────────────────────────
  if (stage === 'inputting') {
    return (
      <div className="mx-auto max-w-6xl">
        <button onClick={() => setStage('idle')} className="text-[var(--muted-text)] hover:text-[var(--app-text)] text-sm mb-4 flex items-center gap-1">
          ← 返回
        </button>
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] shadow-2xl shadow-black/20 overflow-hidden">
          {/* Painting */}
          <div className="relative bg-[var(--card-soft)] h-[360px]">
            <PaintingImage verse={verse} />
            {/* Lesson label overlay */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent px-4 py-3">
              <p className="text-white/70 text-xs">第 {verse.id} 课</p>
              <p className="text-white font-semibold text-sm">{verse.lesson}</p>
            </div>
          </div>

          {/* Input area */}
          <div className="flex min-h-[420px] flex-col p-8">
            {mode === 'recite' ? (
              <>
                <p className="text-[var(--app-text)] font-medium text-base mb-3">{verse.reference}</p>
                <p className="mb-4 text-xs text-[var(--muted-text)]">默写经文，提交后逐字对照</p>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="在此默写经文，标点可省略，遗漏一字算错…"
                  className="[font-family:KaiTi,STKaiti,'Kaiti_SC',serif] flex-1 w-full border border-[var(--border)] bg-[var(--app-bg)] text-[var(--app-text)] rounded-xl p-5 text-base leading-loose outline-none focus:border-[var(--muted-text)] resize-none placeholder:text-[var(--subtle-text)]"
                  autoFocus
                />
              </>
            ) : (
              <>
                <div className="[font-family:KaiTi,STKaiti,'Kaiti_SC',serif] flex-1 text-[var(--app-text)] text-base leading-loose whitespace-pre-line border-l-2 border-[var(--border)] pl-4 mb-4 overflow-y-auto">
                  {verse.text}
                </div>
                <p className="text-xs text-[var(--muted-text)] mb-2">写出这段经文的出处（书卷 章:节）</p>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="如：马太福音 28:18-20"
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
    <div className="mx-auto max-w-6xl">
      <button onClick={resetCard} className="text-[var(--muted-text)] hover:text-[var(--app-text)] text-sm mb-4 flex items-center gap-1">
        ← 再练一次
      </button>
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] shadow-2xl shadow-black/20 overflow-hidden">
        {/* Painting */}
        <div className="relative bg-[var(--card-soft)] h-[360px]">
          <PaintingImage verse={verse} />
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent px-4 py-3">
            <p className="text-white/70 text-xs">第 {verse.id} 课</p>
            <p className="text-white font-semibold text-sm">{verse.lesson}</p>
          </div>
        </div>

        {/* Results */}
        <div className="p-8 space-y-5">
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
                  <p className="text-stone-600 mt-1">正确出处：<span className="font-medium text-green-700">{verse.reference}</span></p>
                </>
              )}
            </div>
          )}

          {mode === 'recite' && diffResult && (
            <div>
              {diffResult.allCorrect ? (
                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                  <p className="text-green-700 font-medium text-sm">✓ 全部正确！</p>
                </div>
              ) : (
                <AlignedReview aligned={diffResult.aligned} />
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
          className="w-full h-full object-contain object-left"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-stone-900 to-stone-800 flex items-center justify-center">
          <span className="text-stone-600 text-5xl">✦</span>
        </div>
      )}
      {image && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
          <p className="text-white/90 text-xs font-medium leading-tight">{image.title}</p>
          <p className="text-white/60 text-xs">{image.artist}</p>
        </div>
      )}
    </>
  )
}
