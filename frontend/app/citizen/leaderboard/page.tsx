'use client'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Award, Medal, ArrowLeft, Star, Flame } from 'lucide-react'
import Link from 'next/link'
import { useRequireAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { Navbar } from '@/components/shared/Navbar'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { APIResponse } from '@/types'

interface LeaderboardUser {
  id: string
  name: string
  xp: number
  level: number
  level_name: string
  badge: string
  ward: string
}

export default function LeaderboardPage() {
  const { user, isChecking } = useRequireAuth(['citizen'])

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => (await api.get<APIResponse<LeaderboardUser[]>>('/stats/leaderboard')).data.data,
    enabled: !!user,
  })

  if (isChecking || !user) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>
  }

  const list = data ?? []
  const topThree = list.slice(0, 3)
  const rest = list.slice(3)

  // Reorder top 3 to be [2nd, 1st, 3rd] for visual podium alignment
  const podium = [
    topThree[1], // 2nd Place
    topThree[0], // 1st Place (Center)
    topThree[2], // 3rd Place
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-bg">
      <Navbar homeHref="/citizen/dashboard" />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader
          title="Community Leaderboard"
          description="Meet Pune's top civic heroes and tracking their achievements."
          action={
            <Link href="/citizen/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
              </Button>
            </Link>
          }
        />

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 h-64 items-end bg-slate-50 border border-slate-100 rounded-xl p-6 animate-pulse" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-50 border border-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ) : list.length === 0 ? (
          <Card className="p-8 text-center flex flex-col items-center justify-center">
            <Trophy className="h-12 w-12 text-slate-300 mb-2" />
            <p className="text-slate-500 font-medium">No citizens ranked yet.</p>
            <p className="text-xs text-slate-400">Submit a complaint and earn XP to rank up!</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Top 3 Podium */}
            {topThree.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-12 pb-6 px-4 bg-gradient-to-b from-white to-transparent border border-border/40 rounded-2xl relative overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.05),transparent_70%)] pointer-events-none" />

                {/* 2nd Place */}
                {topThree[1] && (
                  <div className="flex flex-col items-center flex-1 order-1">
                    <div className="relative group">
                      <div className="absolute -inset-1 rounded-full bg-slate-300 opacity-20 blur group-hover:opacity-40 transition" />
                      <div className="h-16 w-16 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-2xl font-bold relative z-10">
                        {topThree[1].badge}
                      </div>
                      <span className="absolute -bottom-2 -right-1 bg-slate-400 text-white rounded-full p-1 border-2 border-white shadow-sm z-20">
                        <Medal className="h-3 w-3" />
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400 mt-3 uppercase tracking-wider">#2 Place</span>
                    <p className="text-sm font-semibold text-navy mt-1 text-center truncate w-full max-w-[120px]">
                      {topThree[1].name}
                    </p>
                    <p className="text-xs text-slate-400 truncate w-full max-w-[120px] text-center">
                      {topThree[1].ward}
                    </p>
                    <div className="h-28 bg-gradient-to-t from-slate-200 to-slate-100 w-full rounded-t-xl mt-4 flex flex-col items-center justify-center border-t border-slate-300 shadow-inner">
                      <p className="text-sm font-bold text-slate-700">{topThree[1].xp} XP</p>
                      <p className="text-[10px] text-slate-500 font-medium">{topThree[1].level_name}</p>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                  <div className="flex flex-col items-center flex-1 order-2 -mt-8">
                    <div className="relative group">
                      <div className="absolute -inset-2 rounded-full bg-yellow-400 opacity-30 blur group-hover:opacity-60 transition" />
                      <div className="h-20 w-20 rounded-full bg-yellow-50 border-4 border-yellow-400 flex items-center justify-center text-3xl font-bold relative z-10">
                        {topThree[0].badge}
                      </div>
                      <span className="absolute -bottom-2 -right-1 bg-yellow-400 text-white rounded-full p-1.5 border-2 border-white shadow-sm z-20">
                        <Trophy className="h-4.5 w-4.5 text-amber-900" />
                      </span>
                    </div>
                    <span className="text-xs font-bold text-yellow-600 mt-4 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                      <Star className="h-3 w-3 fill-yellow-600" /> Champion
                    </span>
                    <p className="text-base font-bold text-navy mt-1 text-center truncate w-full max-w-[140px]">
                      {topThree[0].name}
                    </p>
                    <p className="text-xs text-slate-500 truncate w-full max-w-[140px] text-center">
                      {topThree[0].ward}
                    </p>
                    <div className="h-36 bg-gradient-to-t from-yellow-100 to-amber-50 w-full rounded-t-2xl mt-4 flex flex-col items-center justify-center border-t-2 border-yellow-300 shadow-md">
                      <p className="text-base font-black text-amber-700">{topThree[0].xp} XP</p>
                      <p className="text-xs text-amber-800 font-semibold">{topThree[0].level_name}</p>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                  <div className="flex flex-col items-center flex-1 order-3">
                    <div className="relative group">
                      <div className="absolute -inset-1 rounded-full bg-orange-300 opacity-20 blur group-hover:opacity-40 transition" />
                      <div className="h-16 w-16 rounded-full bg-orange-50 border-2 border-orange-300 flex items-center justify-center text-2xl font-bold relative z-10">
                        {topThree[2].badge}
                      </div>
                      <span className="absolute -bottom-2 -right-1 bg-orange-400 text-white rounded-full p-1 border-2 border-white shadow-sm z-20">
                        <Award className="h-3 w-3" />
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-orange-600 mt-3 uppercase tracking-wider">#3 Place</span>
                    <p className="text-sm font-semibold text-navy mt-1 text-center truncate w-full max-w-[120px]">
                      {topThree[2].name}
                    </p>
                    <p className="text-xs text-slate-400 truncate w-full max-w-[120px] text-center">
                      {topThree[2].ward}
                    </p>
                    <div className="h-24 bg-gradient-to-t from-orange-100 to-orange-50 w-full rounded-t-xl mt-4 flex flex-col items-center justify-center border-t border-orange-300 shadow-inner">
                      <p className="text-sm font-bold text-orange-700">{topThree[2].xp} XP</p>
                      <p className="text-[10px] text-orange-600 font-medium">{topThree[2].level_name}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rest of the leaderboard */}
            {rest.length > 0 && (
              <div className="space-y-2">
                <h2 className="font-display text-sm font-semibold text-slate-500 uppercase tracking-wider px-2">
                  Civic Hero Rankings
                </h2>
                <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                  {rest.map((c, index) => {
                    const rank = index + 4
                    const isOwnRow = c.id === user.id
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center justify-between p-4 border-b border-border/80 last:border-0 hover:bg-slate-50/50 transition-colors ${isOwnRow ? 'bg-primary/5 hover:bg-primary/10' : ''
                          }`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="w-6 text-sm font-semibold text-slate-400 text-center">{rank}</span>
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-lg shadow-sm border border-border">
                            {c.badge}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-navy flex items-center gap-1.5">
                              {c.name}
                              {isOwnRow && (
                                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                              <span>{c.ward}</span>
                              <span>·</span>
                              <span>{c.level_name}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-navy">{c.xp} XP</p>
                            <p className="text-[10px] text-slate-400 font-medium">Level {c.level}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
