'use client'

import { useMemo, useState } from 'react'
import { getDailyStats, getStreak } from './history'
import { getPassedCount } from './srs'

function getColor(count: number): string {
  if (count === 0) return 'bg-stone-100'
  if (count <= 2) return 'bg-green-200'
  if (count <= 5) return 'bg-green-400'
  return 'bg-green-600'
}

function buildGrid(): { date: string; col: number; row: number }[] {
  const today = new Date()
  // Align to Sunday of the current week, then go back 51 more weeks = 52 weeks total
  const dayOfWeek = today.getDay() // 0=Sun
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - dayOfWeek - 51 * 7)

  const cells: { date: string; col: number; row: number }[] = []
  for (let col = 0; col < 52; col++) {
    for (let row = 0; row < 7; row++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + col * 7 + row)
      if (d > today) continue
      cells.push({
        date: d.toISOString().slice(0, 10),
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
  const todayKey = new Date().toISOString().slice(0, 10)
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="今日练习" value={todayTotal} unit="次" />
        <StatCard label="总练习次数" value={totalPractice} unit="次" />
        <StatCard label="已掌握" value={passedCount} unit="课" highlight={passedCount > 0} />
        <StatCard label="连续天数" value={streak} unit="天" highlight={streak >= 3} />
      </div>
    </div>
  )
}

function StatCard({ label, value, unit, highlight = false }: { label: string; value: number; unit: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 text-center ${highlight ? 'bg-green-50 border-green-200' : 'bg-[var(--card-bg)] border-[var(--border)]'}`}>
      <p className={`text-2xl font-semibold ${highlight ? 'text-green-700' : 'text-[var(--app-text)]'}`}>
        {value}<span className="text-sm font-normal ml-0.5">{unit}</span>
      </p>
      <p className="text-xs text-stone-400 mt-1">{label}</p>
    </div>
  )
}
