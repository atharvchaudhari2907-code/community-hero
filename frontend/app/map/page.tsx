'use client'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter, Activity } from 'lucide-react'

import { useRequireAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { Navbar } from '@/components/shared/Navbar'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, Badge } from '@/components/ui/Card'
import { LiveIssueMap } from '@/components/map/LiveIssueMap'
import { MapLegend } from '@/components/map/MapLegend'
import { UpvoteButton } from '@/components/complaint/UpvoteButton'
import { StatusBadge } from '@/components/complaint/StatusBadge'
import { formatRelativeTime, cn } from '@/lib/utils'
import { CATEGORY_LABELS, type APIResponse, type PaginatedResponse, type Complaint, type IssueCategory, type ComplaintStatus } from '@/types'

const CATEGORIES: IssueCategory[] = ['pothole', 'streetlight', 'garbage', 'water', 'drainage', 'tree', 'traffic_signal', 'other']
const STATUS_GROUPS: Array<{ label: string; statuses: ComplaintStatus[] }> = [
  { label: 'All', statuses: [] },
  { label: 'Open', statuses: ['submitted', 'ai_processing', 'routed'] },
  { label: 'In Progress', statuses: ['assigned', 'worker_en_route', 'in_progress'] },
  { label: 'Resolved', statuses: ['completed', 'citizen_verified', 'closed'] },
]

export default function LiveMapPage() {
  const { user, isChecking } = useRequireAuth()
  const [categoryFilter, setCategoryFilter] = useState<IssueCategory | null>(null)
  const [statusGroupIdx, setStatusGroupIdx] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['live-map-complaints'],
    queryFn: async () =>
      (await api.get<APIResponse<PaginatedResponse<Complaint>>>('/complaints', { params: { per_page: 100 } })).data
        .data,
    enabled: !!user,
    refetchInterval: 10000,
  })

  const allComplaints = data?.items ?? []

  const filtered = useMemo(() => {
    let list = allComplaints
    if (categoryFilter) list = list.filter((c) => c.category === categoryFilter)
    const group = STATUS_GROUPS[statusGroupIdx]
    if (group.statuses.length > 0) list = list.filter((c) => group.statuses.includes(c.status))
    return list
  }, [allComplaints, categoryFilter, statusGroupIdx])

  const counts = useMemo(() => {
    const open = allComplaints.filter((c) => STATUS_GROUPS[1].statuses.includes(c.status)).length
    const inProgress = allComplaints.filter((c) => STATUS_GROUPS[2].statuses.includes(c.status)).length
    const resolved = allComplaints.filter((c) => STATUS_GROUPS[3].statuses.includes(c.status)).length
    return { open, inProgress, resolved }
  }, [allComplaints])

  const feed = useMemo(
    () => [...allComplaints].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 25),
    [allComplaints]
  )

  if (isChecking || !user) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar homeHref={user.role === 'citizen' ? '/citizen/dashboard' : user.role === 'worker' ? '/worker/dashboard' : '/admin/dashboard'} />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <PageHeader title="Live issue map" description="Every reported civic issue, visualised in real time." />

        <div className="grid lg:grid-cols-[220px_1fr_280px] gap-4">
          {/* Filters sidebar */}
          <Card className="p-4 h-fit lg:sticky lg:top-20">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
              <Filter className="h-3.5 w-3.5" /> Filters
            </div>

            <p className="text-xs font-medium text-slate-500 mb-2">Status</p>
            <div className="flex flex-col gap-1 mb-4">
              {STATUS_GROUPS.map((g, i) => (
                <button
                  key={g.label}
                  onClick={() => setStatusGroupIdx(i)}
                  className={cn(
                    'text-left text-sm rounded px-2 py-1.5 transition-colors',
                    statusGroupIdx === i ? 'bg-primary text-white font-medium' : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <p className="text-xs font-medium text-slate-500 mb-2">Category</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                onClick={() => setCategoryFilter(null)}
                className={cn(
                  'text-xs rounded-full px-2.5 py-1 border transition-colors',
                  !categoryFilter ? 'bg-primary text-white border-primary' : 'border-border text-slate-600 hover:border-primary/40'
                )}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                  className={cn(
                    'text-xs rounded-full px-2.5 py-1 border transition-colors',
                    categoryFilter === cat ? 'bg-primary text-white border-primary' : 'border-border text-slate-600 hover:border-primary/40'
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            <div className="border-t border-border pt-3 flex flex-col gap-1.5 text-xs">
              <CountRow label="Open" value={counts.open} dotClass="bg-primary" />
              <CountRow label="In Progress" value={counts.inProgress} dotClass="bg-accent" />
              <CountRow label="Resolved" value={counts.resolved} dotClass="bg-secondary" />
            </div>
          </Card>

          {/* Map */}
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{filtered.length} issue{filtered.length === 1 ? '' : 's'} shown</span>
              <MapLegend />
            </div>
            {isLoading ? (
              <div className="w-full h-[560px] rounded-lg border border-border bg-slate-50 animate-pulse" />
            ) : (
              <LiveIssueMap complaints={filtered} height="560px" />
            )}
          </div>

          {/* Activity feed */}
          <Card className="p-4 h-fit lg:sticky lg:top-20 max-h-[640px] overflow-y-auto">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
              <Activity className="h-3.5 w-3.5" /> Activity feed
            </div>
            <div className="flex flex-col gap-3">
              {feed.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-2 pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm text-navy leading-snug truncate">{c.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <StatusBadge status={c.status} />
                      <span className="text-xs text-slate-400">{formatRelativeTime(c.created_at)}</span>
                    </div>
                  </div>
                  <UpvoteButton complaintId={c.id} upvotes={c.upvotes} size="sm" invalidateKeys={[['live-map-complaints']]} />
                </div>
              ))}
              {feed.length === 0 && <p className="text-sm text-slate-400">No activity yet.</p>}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

function CountRow({ label, value, dotClass }: { label: string; value: number; dotClass: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-slate-500">
        <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} /> {label}
      </span>
      <span className="font-mono font-medium text-navy">{value}</span>
    </div>
  )
}
