'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import versesData from '@/lib/data/bible_verses.json'
import type { AdminReportEntry } from '@/lib/supabase-server'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [report, setReport] = useState<AdminReportEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const TOTAL_VERSES = versesData.length || 60

  useEffect(() => {
    const savedPassword = localStorage.getItem('bible_admin_password')
    if (savedPassword) {
      setPassword(savedPassword)
      void fetchReport(savedPassword)
    }
  }, [])

  async function fetchReport(pwd: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/report', {
        headers: {
          Authorization: `Bearer ${pwd}`,
        },
      })

      if (res.status === 401) {
        localStorage.removeItem('bible_admin_password')
        setAuthorized(false)
        setError('密码错误，请重新输入')
        return
      }

      if (!res.ok) {
        throw new Error('获取报告数据失败')
      }

      const data = await res.json()
      setReport(data.report || [])
      setAuthorized(true)
      localStorage.setItem('bible_admin_password', pwd)
    } catch (err) {
      setError(err instanceof Error ? err.message : '连接错误')
    } finally {
      setLoading(false)
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    void fetchReport(password)
  }

  function handleLogout() {
    localStorage.removeItem('bible_admin_password')
    setPassword('')
    setAuthorized(false)
    setReport([])
    setError('')
  }

  function formatTime(ts: string | number | null) {
    if (!ts) return '从未活跃'
    const date = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins} 分钟前`
    if (diffHours < 24) return `${diffHours} 小时前`
    if (diffDays < 7) return `${diffDays} 天前`
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // ── 1. 密码输入对话框（鉴权） ──────────────────────────────────────────────
  if (!authorized) {
    return (
      <main className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] flex items-center justify-center p-6 [font-family:SimSun,'Songti_SC',serif]">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold">门训班看板</h1>
            <p className="mt-1.5 text-xs text-[var(--muted-text)]">请输入管理员密码以查看数据</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="默认密码为 recite-admin"
              className="w-full border border-[var(--border)] bg-[var(--app-bg)] text-[var(--app-text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--muted-text)] placeholder:text-[var(--subtle-text)] text-center font-mono"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--button-bg)] text-[var(--button-text)] py-3 rounded-xl text-sm font-semibold transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {loading ? '验证中…' : '进入看板'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/bible" className="text-xs text-[var(--muted-text)] hover:underline">
              ← 返回主页
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ── 2. 数据看板主界面 ──────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] px-6 py-10 [font-family:SimSun,'Songti_SC',serif]">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h1 className="text-2xl font-semibold">学员默写看板</h1>
            <p className="mt-1 text-xs text-[var(--muted-text)]">
              目前共登记学员 {report.length} 人（已自动按最近活跃时间排序）
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/bible"
              className="border border-[var(--border)] hover:bg-[var(--card-bg)] text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              返回背经页
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              退出
            </button>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 text-sm text-[var(--muted-text)]">
            正在连接云端，加载学员数据中…
          </div>
        ) : error ? (
          <div className="text-center py-20 border border-[var(--border)] rounded-2xl bg-[var(--card-bg)]">
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
              onClick={() => fetchReport(password)}
              className="bg-[var(--button-bg)] text-[var(--button-text)] px-6 py-2 rounded-xl text-xs font-semibold"
            >
              重试
            </button>
          </div>
        ) : report.length === 0 ? (
          <div className="text-center py-20 text-sm text-[var(--muted-text)] border border-[var(--border)] rounded-2xl bg-[var(--card-bg)]">
            目前还没有任何学员注册记录
          </div>
        ) : (
          <div className="space-y-4">
            {report.map(entry => {
              const isExpanded = expandedId === entry.profile.id
              const hasLearned = entry.totalCards > 0
              const progressPct = Math.round((entry.passedCards / TOTAL_VERSES) * 100)
              const successRatePct = entry.totalHistory > 0
                ? Math.round((entry.correctHistory / entry.totalHistory) * 100)
                : 0

              return (
                <div
                  key={entry.profile.id}
                  className="border border-[var(--border)] rounded-2xl bg-[var(--card-bg)] shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-[var(--muted-text)]/30"
                >
                  {/* Summary Card Header (Click to expand) */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : entry.profile.id)}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between cursor-pointer select-none gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{entry.profile.name}</span>
                        <span className="text-[10px] uppercase text-[var(--muted-text)] font-mono tracking-wider">
                          ({entry.profile.slug})
                        </span>
                      </div>
                      <div className="text-xs text-[var(--muted-text)]">
                        最后活跃：{formatTime(entry.profile.last_seen_at)}
                      </div>
                    </div>

                    <div className="flex-1 max-w-xs md:mx-6 space-y-1.5">
                      <div className="flex justify-between text-xs text-[var(--muted-text)]">
                        <span>进度：已掌握 {entry.passedCards}/{TOTAL_VERSES} 课</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="w-full bg-[var(--app-bg)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
                        <div
                          className="bg-green-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-xs text-[var(--muted-text)]">默写次数</p>
                        <p className="font-semibold">{entry.totalHistory} 次</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[var(--muted-text)]">成功率</p>
                        <p className={`font-semibold ${successRatePct >= 80 ? 'text-green-600' : 'text-[var(--app-text)]'}`}>
                          {entry.totalHistory > 0 ? `${successRatePct}%` : '—'}
                        </p>
                      </div>
                      <div className="text-[var(--muted-text)] pl-2 text-xs">
                        {isExpanded ? '▲ 收起' : '▼ 详情'}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border)] bg-[var(--app-bg)] p-5 space-y-4">
                      <div>
                        <h3 className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider mb-2">
                          学习概况
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 text-center">
                          <div>
                            <p className="text-[10px] text-[var(--muted-text)]">已掌握课程</p>
                            <p className="text-lg font-bold text-green-600">{entry.passedCards} 课</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[var(--muted-text)]">学习中课程</p>
                            <p className="text-lg font-bold text-sky-600">{entry.totalCards - entry.passedCards} 课</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[var(--muted-text)]">正确默写</p>
                            <p className="text-lg font-bold text-green-600">{entry.correctHistory} 次</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[var(--muted-text)]">错误默写</p>
                            <p className="text-lg font-bold text-red-600">{entry.totalHistory - entry.correctHistory} 次</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs font-semibold text-[var(--muted-text)] uppercase tracking-wider mb-2">
                          最近 10 次默写历史
                        </h3>
                        {entry.recentHistory.length === 0 ? (
                          <p className="text-xs text-[var(--subtle-text)] text-center py-4">无历史默写记录</p>
                        ) : (
                          <div className="overflow-hidden border border-[var(--border)] rounded-xl bg-[var(--card-bg)]">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-[var(--border)] bg-[var(--app-bg)] text-[var(--muted-text)]">
                                  <th className="px-4 py-2 font-semibold">时间</th>
                                  <th className="px-4 py-2 font-semibold">课程</th>
                                  <th className="px-4 py-2 font-semibold">模式</th>
                                  <th className="px-4 py-2 font-semibold text-right">结果</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border)]">
                                {entry.recentHistory.map((h, i) => {
                                  const verse = versesData.find(v => v.id === h.verseId)
                                  const lessonText = verse ? `第${h.verseId}课 · ${verse.lesson}` : `第${h.verseId}课`
                                  return (
                                    <tr key={i} className="hover:bg-[var(--app-bg)]/30">
                                      <td className="px-4 py-2 text-[var(--muted-text)]">
                                        {new Date(h.ts).getMonth() + 1}月{new Date(h.ts).getDate()}日 {String(new Date(h.ts).getHours()).padStart(2, '0')}:{String(new Date(h.ts).getMinutes()).padStart(2, '0')}
                                      </td>
                                      <td className="px-4 py-2 font-medium">{lessonText}</td>
                                      <td className="px-4 py-2 text-[var(--muted-text)]">
                                        {h.mode === 'recite' ? '经文默写' : '出处默写'}
                                      </td>
                                      <td className="px-4 py-2 text-right">
                                        {h.correct ? (
                                          <span className="text-green-600 font-semibold">正确</span>
                                        ) : (
                                          <span className="text-red-500 font-semibold">
                                            错误{h.missedCount > 0 ? ` (漏${h.missedCount}字)` : ''}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
