'use client'
import { useQuery } from '@tanstack/react-query'
import { Flame } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { Navbar } from '@/components/shared/Navbar'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/Card'
import { SkeletonCard } from '@/components/shared/SkeletonCard'
import type { APIResponse, RewardsState } from '@/types'

export default function RewardsPage() {
  const { user, isChecking } = useRequireAuth(['citizen'])

  const { data: rewards, isLoading } = useQuery({
    queryKey: ['rewards-me'],
    queryFn: async () => (await api.get<APIResponse<RewardsState>>('/rewards/me')).data.data,
    enabled: !!user,
  })

  if (isChecking || !user) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar homeHref="/citizen/dashboard" />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <PageHeader title="Your rewards" description="Earn XP for every report you submit and verify." />

        {isLoading || !rewards ? (
          <SkeletonCard lines={5} />
        ) : (
          <div className="flex flex-col gap-6">
            <Card className="p-6 flex items-center gap-5">
              <div className="text-5xl">{rewards.badge}</div>
              <div className="flex-1">
                <p className="font-display text-lg font-semibold text-ink">{rewards.level_name}</p>
                <p className="text-sm text-slate-500">{rewards.xp} XP earned</p>
                {rewards.next_level && (
                  <div className="mt-2">
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{
                          width: `${Math.min(100, (rewards.xp / rewards.next_level.xp_required) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {rewards.xp_to_next_level} XP to {rewards.next_level.badge} {rewards.next_level.name}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 rounded px-2.5 py-1.5">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-medium">{rewards.streak_days} day streak</span>
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="font-display text-sm font-semibold text-ink mb-4">All levels</h2>
              <div className="flex flex-col gap-2">
                {rewards.all_levels.map((lvl) => (
                  <div
                    key={lvl.level}
                    className={`flex items-center justify-between rounded px-3 py-2 ${
                      lvl.level === rewards.level ? 'bg-amber-50 border border-accent/30' : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lvl.badge}</span>
                      <span className="text-sm font-medium text-ink">{lvl.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{lvl.xp_required}+ XP</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
