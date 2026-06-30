'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus, FileText } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useAuth'
import { useLiveClock } from '@/hooks/useLiveClock'
import { api } from '@/lib/api'
import { Navbar } from '@/components/shared/Navbar'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ComplaintCard } from '@/components/complaint/ComplaintCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonCard } from '@/components/shared/SkeletonCard'
import type { APIResponse, Complaint } from '@/types'

export default function CitizenDashboard() {
  const { user, isChecking } = useRequireAuth(['citizen'])
  const clock = useLiveClock()

  const { data: complaints, isLoading } = useQuery({
    queryKey: ['my-complaints'],
    queryFn: async () => (await api.get<APIResponse<Complaint[]>>('/complaints/user/me')).data.data,
    enabled: !!user,
  })

  if (isChecking || !user) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>
  }

  const resolved = complaints?.filter((c) =>
    ['completed', 'citizen_verified', 'closed'].includes(c.status)
  ).length ?? 0

  return (
    <div className="min-h-screen bg-bg">
      <Navbar homeHref="/citizen/dashboard" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader
          title={`${clock.greeting}, ${user.name.split(' ')[0]}`}
          description="Here's what's happening with your reports."
          action={
            <Link href="/citizen/report">
              <Button><Plus className="h-4 w-4" /> Report an issue</Button>
            </Link>
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatBox label="Total reports" value={complaints?.length ?? 0} />
          <StatBox label="Resolved" value={resolved} />
          <StatBox label="XP" value={user.xp} accent />
          <StatBox label="Level" value={`${user.badge} ${user.level_name}`} />
        </div>

        <h2 className="font-display text-base font-semibold text-ink mb-3">Your reports</h2>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !complaints?.length ? (
          <EmptyState
            icon={FileText}
            title="No reports yet"
            description="Spotted a pothole or a broken streetlight? Report it and we'll take it from there."
            actionLabel="Report an issue"
            onAction={() => (window.location.href = '/citizen/report')}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {complaints.map((c) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                href={`/citizen/complaints/${c.id}`}
                invalidateKeys={[['my-complaints']]}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function StatBox({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`font-display text-xl font-semibold mt-1 ${accent ? 'text-accent' : 'text-ink'}`}>
        {value}
      </p>
    </Card>
  )
}
