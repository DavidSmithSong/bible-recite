'use client'

import { useMemo, useState } from 'react'
import { getDailyStats, getStreak, getMistakeStats } from './history'
import { getPassedCount, loadState } from './srs'
import versesData from '@/lib/data/bible_verses.json'


function getColor(count: number): string {
  if (count === 0) return 'bg-stone-100'
  if (count <= 2) return 'bg-green-200'
  if (count <= 5) return 'bg-green-400'
  return 'bg-green-600'
}

function buildGrid(): { date: string; col: number; row: number }[] {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - dayOfWeek - 51 * 7)

  const cells: { date: string; col: number; row: number }[] = []
  for (let col = 0; col < 52; col++) {
    for (let row = 0; row < 7; row++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + col * 7 + row)
      if (d > today) continue
      
      const offset = d.getTimezoneOffset()
      const localDate = new Date(d.getTime() - (offset * 60 * 1000))
      cells.push({
        date: localDate.toISOString().slice(0, 10),
        col,
        row,
      })
    }
  }
  return cells
}


function getMonthLabels(cells: { date: string; col: number; row: number }[]): { col: number; label: string }[] {
  const seen = new Set<string>()
  const labels: { col: number; label: string }[] = []
  for (const c of cells) {
    if (c.row !== 0) continue
    const month = c.date.slice(0, 7) // YYYY-MM
    if (!seen.has(month)) {
      seen.add(month)
      const d = new Date(c.date)
      labels.push({ col: c.col, label: (d.getMonth() + 1) + '月' })
    }
  }
  return labels
}

export default function Heatmap() {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  const stats = useMemo(() => getDailyStats(), [])
  const streak = useMemo(() => getStreak(), [])
  const passedCount = useMemo(() => getPassedCount(), [])
  const mistakeStats = useMemo(() => getMistakeStats(), [])
  const todayKey = getLocalTodayStr()
  const totalPractice = useMemo(() => Object.values(stats).reduce((s, d) => s + d.total, 0), [stats])
  const todayTotal = stats[todayKey]?.total ?? 0


  const cells = useMemo(() => buildGrid(), [])
  const monthLabels = useMemo(() => getMonthLabels(cells), [cells])

  const CELL = 12
  const GAP = 2
  const STEP = CELL + GAP

  return (
    <div className="space-y-8">
      {/* Heatmap */}
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-6">
        <h2 className="text-sm font-medium text-[var(--app-text)] mb-4">练习记录</h2>

        <div className="overflow-x-auto">
        {/* Month labels */}
        <div className="relative mb-1 ml-8" style={{ height: 16, minWidth: 52 * STEP + 32 }}>
          {monthLabels.map(({ col, label }) => (
            <span
              key={`${label}-${col}`}
              className="absolute text-xs text-stone-400"
              style={{ left: col * STEP + 32 }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex gap-2" style={{ minWidth: 52 * STEP + 32 }}>
          {/* Weekday labels */}
          <div className="flex flex-col gap-[2px] justify-start mt-0" style={{ width: 24 }}>
            {['一', '', '三', '', '五', '', '日'].map((label, i) => (
              <div key={i} className="text-xs text-[var(--subtle-text)] flex items-center" style={{ height: CELL }}>
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div
            className="relative"
            style={{ width: 52 * STEP, height: 7 * STEP }}
          >
            {cells.map(({ date, col, row }) => {
              const dayStats = stats[date]
              const count = dayStats?.total ?? 0
              return (
                <div
                  key={date}
                  className={`absolute rounded-sm cursor-default transition-opacity hover:opacity-80 ${getColor(count)}`}
                  style={{
                    width: CELL,
                    height: CELL,
                    left: col * STEP,
                    top: row * STEP,
                  }}
                  onMouseEnter={e => {
                    const rect = (e.target as HTMLElement).getBoundingClientRect()
                    const correct = dayStats?.correct ?? 0
                    setTooltip({
                      x: rect.left + CELL / 2,
                      y: rect.top - 8,
                      text: count === 0
                        ? `${date} · 无记录`
                        : `${date} · 练习${count}次 · 正确${correct}次`,
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
          </div>
        </div>

        </div>{/* end overflow-x-auto */}

        {/* Legend */}
        <div className="flex items-center gap-1 mt-2 ml-8">
          <span className="text-xs text-[var(--subtle-text)] mr-1">少</span>
          {[0, 1, 3, 6].map(n => (
            <div key={n} className={`w-3 h-3 rounded-sm ${getColor(n)}`} />
          ))}
          <span className="text-xs text-[var(--subtle-text)] ml-1">多</span>
        </div>
      </div>

      {/* Tooltip (fixed position) */}
      {tooltip && (
        <div
          className="fixed z-50 bg-stone-800 text-white text-xs px-2 py-1 rounded pointer-events-none -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="今日练习" value={todayTotal} unit="次" />
        <StatCard label="总练习次数" value={totalPractice} unit="次" />
        <StatCard label="已掌握" value={passedCount} unit="课" highlight={passedCount > 0} />
        <StatCard label="连续天数" value={streak} unit="天" highlight={streak >= 3} />
        <StatCard label="错点记录" value={mistakeStats.total} unit="处" highlight={mistakeStats.total > 0} tone="red" />
      </div>

      {mistakeStats.recent.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[var(--app-text)]">最近错点</h2>
            <span className="text-xs text-[var(--subtle-text)]">复习时优先看这些</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {mistakeStats.recent.map((mistake, index) => (
              <div key={`${mistake.verseId}-${mistake.date}-${index}`} className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs text-stone-400">
                  <span>第 {mistake.verseId} 课</span>
                  <span>{mistake.date}</span>
                </div>
                <p className="text-xs text-stone-400">你常写成</p>
                <p className="[font-family:KaiTi,STKaiti,'Kaiti_SC',serif] text-lg leading-relaxed text-red-700">{mistake.input}</p>
                <p className="mt-2 text-xs text-stone-400">应为</p>
                <p className="[font-family:KaiTi,STKaiti,'Kaiti_SC',serif] text-lg leading-relaxed text-[var(--app-text)]">{mistake.expected}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ebbinghaus memory curve */}
      <EbbinghausDashboard />
    </div>
  )
}

function StatCard({
  label,
  value,
  unit,
  highlight = false,
  tone = 'green',
}: {
  label: string
  value: number
  unit: string
  highlight?: boolean
  tone?: 'green' | 'red'
}) {
  const highlightClass = tone === 'red' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
  const valueClass = tone === 'red' ? 'text-red-700' : 'text-green-700'
  return (
    <div className={`rounded-2xl border p-4 text-center ${highlight ? highlightClass : 'bg-[var(--card-bg)] border-[var(--border)]'}`}>
      <p className={`text-2xl font-semibold ${highlight ? valueClass : 'text-[var(--app-text)]'}`}>
        {value}<span className="text-sm font-normal ml-0.5">{unit}</span>
      </p>
      <p className="text-xs text-stone-400 mt-1">{label}</p>
    </div>
  )
}

function getLocalTodayStr(): string {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const localDate = new Date(d.getTime() - (offset * 60 * 1000))
  return localDate.toISOString().slice(0, 10)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getDaysDiff(date1Str: string, date2Str: string): number {
  const d1 = new Date(date1Str + 'T00:00:00')
  const d2 = new Date(date2Str + 'T00:00:00')
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

function ForgettingCurveSparkline({ interval, elapsed, retention }: { interval: number; elapsed: number; retention: number }) {
  const width = 80
  const height = 24
  const maxDays = Math.max(interval * 1.5, elapsed, 4)
  
  const points: string[] = []
  const steps = 20
  for (let i = 0; i <= steps; i++) {
    const t = (maxDays * i) / steps
    const r = Math.exp(-t / (interval || 1))
    const x = (t / maxDays) * width
    const y = height - (r * (height - 4)) - 2
    points.push(`${x},${y}`)
  }
  
  const dotX = Math.min((elapsed / maxDays) * width, width - 3)
  const dotY = height - (retention * (height - 4)) - 2
  
  let dotColor = 'fill-green-500'
  if (retention < 0.35) dotColor = 'fill-red-500'
  else if (retention < 0.50) dotColor = 'fill-amber-500'
  else if (retention < 0.80) dotColor = 'fill-emerald-400'

  return (
    <svg width={width} height={height} className="overflow-visible">
      <line
        x1={0}
        y1={height - (Math.exp(-1) * (height - 4)) - 2}
        x2={width}
        y2={height - (Math.exp(-1) * (height - 4)) - 2}
        className="stroke-stone-200 dark:stroke-stone-800"
        strokeDasharray="2,2"
      />
      <polyline
        fill="none"
        stroke="#9ca3af"
        strokeWidth="1.5"
        points={points.join(' ')}
        className="opacity-40"
      />
      <circle
        cx={dotX}
        cy={dotY}
        r="3.5"
        className={`${dotColor} stroke-white dark:stroke-stone-900 stroke-1`}
      />
    </svg>
  )
}

function EbbinghausDashboard() {
  const state = loadState()
  const todayStr = getLocalTodayStr()
  
  const studiedVerses = useMemo(() => {
    return versesData
      .map(v => {
        const card = state[v.id]
        if (!card || card.repetitions === 0) return null
        
        const interval = card.interval || 1
        const dueDate = card.dueDate
        const lastReviewDateStr = addDays(dueDate, -interval)
        let elapsed = getDaysDiff(lastReviewDateStr, todayStr)
        if (elapsed < 0) elapsed = 0
        
        const retention = Math.exp(-elapsed / interval)
        return {
          ...v,
          card,
          interval,
          elapsed,
          retention,
          retentionPercent: Math.round(retention * 100)
        }
      })
      .filter((v): v is NonNullable<typeof v> => v !== null)
      .sort((a, b) => a.retention - b.retention)
  }, [state, todayStr])

  if (studiedVerses.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-6 text-center text-sm text-[var(--muted-text)]">
        开始默写第一篇经文后，即可解锁艾宾浩斯记忆保留曲线追踪 ✦
      </div>
    )
  }

  const totalStudied = studiedVerses.length
  const avgRetention = Math.round((studiedVerses.reduce((sum, v) => sum + v.retention, 0) / totalStudied) * 100)
  
  const zones = {
    consolidated: studiedVerses.filter(v => v.retention >= 0.8).length,
    optimal: studiedVerses.filter(v => v.retention >= 0.5 && v.retention < 0.8).length,
    critical: studiedVerses.filter(v => v.retention >= 0.35 && v.retention < 0.5).length,
    forgetting: studiedVerses.filter(v => v.retention < 0.35).length,
  }

  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (avgRetention / 100) * circumference

  let ringColor = 'stroke-green-500'
  let textColor = 'text-green-600 dark:text-green-400'
  let descText = '记忆稳如磐石 ✦'
  if (avgRetention < 35) {
    ringColor = 'stroke-red-500'
    textColor = 'text-red-600 dark:text-red-400'
    descText = '急需复习拉回记忆线'
  } else if (avgRetention < 50) {
    ringColor = 'stroke-amber-500'
    textColor = 'text-amber-600 dark:text-amber-400'
    descText = '建议复习临界状态经文'
  } else if (avgRetention < 80) {
    ringColor = 'stroke-emerald-400'
    textColor = 'text-emerald-500 dark:text-emerald-300'
    descText = '整体留存良好'
  }

  return (
    <div className="grid gap-6 md:grid-cols-12">
      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-6 md:col-span-5 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--app-text)] mb-4">艾宾浩斯记忆保留分析</h3>
          <div className="flex items-center gap-5 my-4">
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-full h-full -rotate-90">
                <circle cx="48" cy="48" r={radius} className="stroke-stone-100 dark:stroke-stone-800 fill-none" strokeWidth="8" />
                <circle cx="48" cy="48" r={radius} className={`${ringColor} fill-none transition-all duration-500`} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-[var(--app-text)] font-sans">{avgRetention}%</span>
                <span className="text-[10px] text-stone-400 font-sans">平均留存</span>
              </div>
            </div>
            <div>
              <p className={`text-base font-semibold ${textColor}`}>{descText}</p>
              <p className="text-xs text-[var(--muted-text)] mt-1">基于遗忘曲线估算，当前已学 {totalStudied} 首金句。</p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-4 border-t border-[var(--border)]">
          <BreakdownBar label="记忆巩固区 (80%-100%)" count={zones.consolidated} total={totalStudied} color="bg-green-500" />
          <BreakdownBar label="记忆良好区 (50%-80%)" count={zones.optimal} total={totalStudied} color="bg-emerald-400" />
          <BreakdownBar label="临界复习区 (35%-50%)" count={zones.critical} total={totalStudied} color="bg-amber-500" />
          <BreakdownBar label="遗忘边缘区 (<35%)" count={zones.forgetting} total={totalStudied} color="bg-red-500" />
        </div>
      </div>

      <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-6 md:col-span-7">
        <h3 className="text-sm font-semibold text-[var(--app-text)] mb-3">经文记忆保留度追踪</h3>
        <p className="text-xs text-stone-400 mb-4">按记忆保留度升序排列（最顶部的课次最急需复习）</p>
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
          {studiedVerses.map(v => {
            let statusText = `${v.elapsed} 天前复习`
            if (v.elapsed === 0) statusText = '今日已复习'
            
            let colorClass = 'text-green-500 bg-green-500/10'
            if (v.retention < 0.35) colorClass = 'text-red-500 bg-red-500/10'
            else if (v.retention < 0.50) colorClass = 'text-amber-500 bg-amber-500/10'
            else if (v.retention < 0.80) colorClass = 'text-emerald-500 bg-emerald-500/10'

            return (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)]/50 bg-[var(--card-soft)]/50 hover:bg-[var(--card-soft)] transition-colors">
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-stone-400 shrink-0 font-sans">第 {v.id} 课</span>
                    <span className="text-xs font-semibold text-[var(--app-text)] truncate">{v.lesson}</span>
                  </div>
                  <p className="text-[10px] text-[var(--muted-text)] mt-0.5 font-sans truncate">{v.reference}</p>
                </div>
                
                <div className="shrink-0 mr-4">
                  <ForgettingCurveSparkline interval={v.interval} elapsed={v.elapsed} retention={v.retention} />
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                  <span className={`text-xs font-bold font-sans px-2 py-0.5 rounded-full ${colorClass}`}>
                    {v.retentionPercent}%
                  </span>
                  <span className="text-[10px] text-stone-400 font-sans">{statusText}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function BreakdownBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percent = total > 0 ? (count / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-[11px] text-[var(--muted-text)] mb-1 font-sans">
        <span>{label}</span>
        <span className="font-semibold text-[var(--app-text)]">{count} 课 ({Math.round(percent)}%)</span>
      </div>
      <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

