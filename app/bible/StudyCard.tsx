'use client'

import { useState } from 'react'
import { compareText, compareReference } from './diff'
import { applyRating, getCardState, type Rating } from './srs'
import { addEntry, todayKey } from './history'
import type { BibleVerse } from './page'
import { LESSON_PAINTINGS } from '@/lib/data/paintings'

type Mode = 'recite' | 'reference'
type FeedbackMode = 'highlight' | 'answer'
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
                  : 'bg-stone-700 border-stone-700'
                : 'bg-transparent border-stone-300'
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
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('highlight')
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

    addEntry({
      verseId: verse.id,
      date: todayKey(),
      ts: Date.now(),
      mode,
      correct,
      missedCount,
    })

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

  const newConsecutive = isCorrect
    ? Math.min(cardState.consecutiveCorrect + 1, 3)
    : 0
  const willBePassed = cardState.passed || newConsecutive >= 3

  // ── IDLE ──────────────────────────────────────────────────────────────────
  if (stage === 'idle') {
    const painting = LESSON_PAINTINGS[verse.id]
    return (
      <div className="max-w-xl mx-auto">
        <button onClick={onBack} className="text-stone-400 hover:text-stone-600 text-sm mb-6 flex items-center gap-1">
          ← 返回列表
        </button>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Painting */}
          {painting && (
            <div className="relative w-full h-56 bg-stone-100">
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

          <div className="p-8 text-center">
            <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">第 {verse.id} 课</p>
            <h2 className="text-2xl font-semibold text-stone-900 mb-3">{verse.lesson}</h2>

            {/* Consecutive progress */}
            <div className="mb-5 flex justify-center">
              <ConsecutiveDots count={cardState.consecutiveCorrect} passed={cardState.passed} />
            </div>

            {mode === 'recite' ? (
              <>
                <p className="text-stone-500 text-sm mb-3">{verse.reference}</p>
                <p className="text-xs text-stone-400 mb-6">默写出上方经文（标点可省略）</p>
                <button
                  onClick={() => setStage('inputting')}
                  className="w-full bg-stone-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors"
                >
                  开始默写
                </button>
              </>
            ) : (
              <>
                <div className="my-5 text-stone-700 leading-loose text-sm whitespace-pre-line border-l-2 border-stone-200 pl-4 text-left">
                  {verse.text}
                </div>
                <p className="text-xs text-stone-400 mb-4">写出这段经文的出处（书卷 章:节）</p>
                <button
                  onClick={() => setStage('inputting')}
                  className="w-full bg-stone-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors"
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

  // ── INPUTTING ─────────────────────────────────────────────────────────────
  if (stage === 'inputting') {
    return (
      <div className="max-w-xl mx-auto">
        <button onClick={() => setStage('idle')} className="text-stone-400 hover:text-stone-600 text-sm mb-6 flex items-center gap-1">
          ← 返回
        </button>
        <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">第 {verse.id} 课</p>
          <h2 className="text-xl font-semibold text-stone-900 mb-1">{verse.lesson}</h2>

          {mode === 'recite' ? (
            <>
              <p className="text-stone-500 text-sm mb-4">{verse.reference}</p>
              <div className="flex gap-2 mb-4 text-xs">
                <span className="text-stone-400 self-center">核对方式：</span>
                <button
                  onClick={() => setFeedbackMode('highlight')}
                  className={`px-3 py-1 rounded-full border transition-colors ${feedbackMode === 'highlight' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}
                >
                  标红错句
                </button>
                <button
                  onClick={() => setFeedbackMode('answer')}
                  className={`px-3 py-1 rounded-full border transition-colors ${feedbackMode === 'answer' ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-500 hover:border-stone-400'}`}
                >
                  给出答案
                </button>
              </div>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="在此默写经文，标点可省略，遗漏一字算错…"
                className="w-full border border-stone-200 rounded-xl p-4 text-sm leading-loose outline-none focus:border-stone-400 resize-none min-h-[180px]"
                autoFocus
              />
            </>
          ) : (
            <>
              <div className="my-4 text-stone-600 text-sm leading-loose whitespace-pre-line border-l-2 border-stone-200 pl-4">
                {verse.text}
              </div>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="如：马太福音 28:18-20"
                className="w-full border border-stone-200 rounded-xl p-4 text-sm outline-none focus:border-stone-400"
                autoFocus
              />
            </>
          )}

          <button
            onClick={handleCheck}
            disabled={!input.trim()}
            className="mt-4 w-full bg-stone-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-40 transition-colors"
          >
            提交
          </button>
        </div>
      </div>
    )
  }

  // ── REVIEWING ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto">
      <button onClick={resetCard} className="text-stone-400 hover:text-stone-600 text-sm mb-6 flex items-center gap-1">
        ← 再练一次
      </button>

      <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm space-y-5">
        <div>
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">第 {verse.id} 课</p>
          <h2 className="text-xl font-semibold text-stone-900">{verse.lesson}</h2>
        </div>

        {/* Consecutive progress (updated preview) */}
        <ConsecutiveDots count={newConsecutive} passed={willBePassed} />

        {/* Mastered celebration */}
        {!cardState.passed && willBePassed && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-green-700 font-semibold text-sm">恭喜！连续三次正确，此课已掌握！</p>
          </div>
        )}

        {/* Reference mode result */}
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

        {/* Recite mode result */}
        {mode === 'recite' && diffResult && (
          <div>
            {diffResult.allCorrect ? (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <p className="text-green-700 font-medium text-sm">✓ 全部正确！</p>
              </div>
            ) : (
              <div className="space-y-2">
                {feedbackMode === 'highlight' ? (
                  <div className="text-sm leading-loose">
                    {diffResult.sentences.map((s, i) => (
                      <span key={i} className={s.isCorrect ? 'text-stone-700' : 'bg-red-100 text-red-700 rounded px-0.5'}>
                        {s.original}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm leading-loose">
                    <p className="text-xs text-stone-400 mb-2">
                      <span className="text-green-600 font-bold">绿色</span> = 漏写 ·{' '}
                      <span className="text-red-500 line-through">红色</span> = 多写
                    </p>
                    {diffResult.sentences.map((s, i) => (
                      <span key={i}>
                        {s.isCorrect ? (
                          <span className="text-stone-700">{s.original}</span>
                        ) : (
                          s.annotated.map((a, j) => {
                            if (a.type === 'ok' || a.type === 'punct') return <span key={j} className="text-stone-700">{a.char}</span>
                            if (a.type === 'missing') return <span key={j} className="text-green-600 font-bold underline decoration-dotted">{a.char}</span>
                            if (a.type === 'extra') return <span key={j} className="text-red-500 line-through">{a.char}</span>
                            return null
                          })
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SRS rating */}
        <div>
          <p className="text-xs text-stone-400 mb-3">评分（影响下次复习间隔）</p>
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
  )
}
