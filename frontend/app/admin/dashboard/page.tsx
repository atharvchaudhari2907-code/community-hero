'use client'
import { useQuery } from '@tanstack/react-query'
import { useRequireAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { Navbar } from '@/components/shared/Navbar'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/Card'
import { ComplaintCard } from '@/components/complaint/ComplaintCard'
import { SkeletonCard } from '@/components/shared/SkeletonCard'
import { StatCardSkeleton } from '@/components/shared/SkeletonCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { Inbox } from 'lucide-react'
import type { APIResponse, PaginatedResponse, Complaint, PublicStats } from '@/types'

export default function AdminDashboard() {
  const { user, isChecking } = useRequireAuth(['admin'])

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get<APIResponse<PublicStats>>('/stats/public')).data.data,
    enabled: !!user,
  })

  const { data: complaints, isLoading: listLoading } = useQuery({
    queryKey: ['admin-complaints'],
    queryFn: async () =>
      (await api.get<APIResponse<PaginatedResponse<Complaint>>>('/complaints', { params: { per_page: 20 } })).data
        .data,
    enabled: !!user,
    refetchInterval: 10000,
  })

  if (isChecking || !user) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar homeHref="/admin/dashboard" />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <PageHeader title="City overview" description="Live status across all reported civic issues." />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {statsLoading || !stats ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <StatBox label="Total reports" value={stats.total_complaints} />
              <StatBox label="Resolved today" value={stats.resolved_today} />
              <StatBox label="Avg. resolution" value={`${stats.average_resolution_hours}h`} />
              <StatBox label="SLA compliance" value={`${stats.sla_compliance_percent}%`} />
            </>
          )}
        </div>

        <h2 className="font-display text-base font-semibold text-ink mb-3">All complaints</h2>
        {listLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : !complaints?.items.length ? (
          <EmptyState icon={Inbox} title="No complaints yet" description="Reports will appear here as citizens submit them." />
        ) : (
          <div className="flex flex-col gap-3">
            {complaints.items.map((c) => (
              <ComplaintCard
                key={c.id}
                complaint={c}
                href={`/citizen/complaints/${c.id}`}
                invalidateKeys={[['admin-complaints']]}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-display text-xl font-semibold text-ink mt-1">{value}</p>
    </Card>
  )
}
