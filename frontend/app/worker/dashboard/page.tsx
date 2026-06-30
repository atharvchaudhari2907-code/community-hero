'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Navigation, PlayCircle, CheckCircle } from 'lucide-react'
import { useState } from 'react'

import { useRequireAuth } from '@/hooks/useAuth'
import { useLiveClock } from '@/hooks/useLiveClock'
import { api, extractErrorMessage } from '@/lib/api'
import { Navbar } from '@/components/shared/Navbar'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, SeverityBadge } from '@/components/complaint/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { SkeletonCard } from '@/components/shared/SkeletonCard'
import { CATEGORY_LABELS } from '@/types'
import type { APIResponse, Complaint, ComplaintStatus } from '@/types'
import { ClipboardList } from 'lucide-react'

export default function WorkerDashboard() {
  const { user, isChecking } = useRequireAuth(['worker'])
  const clock = useLiveClock()
  const queryClient = useQueryClient()
  const [errorByTask, setErrorByTask] = useState<Record<string, string>>({})

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['worker-tasks'],
    queryFn: async () => (await api.get<APIResponse<Complaint[]>>('/workers/tasks')).data.data,
    enabled: !!user,
    refetchInterval: 10000,
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ComplaintStatus }) =>
      (await api.put(`/workers/tasks/${id}/status`, { status })).data.data,
    onSuccess: (_data, vars) => {
      setErrorByTask((e) => ({ ...e, [vars.id]: '' }))
      queryClient.invalidateQueries({ queryKey: ['worker-tasks'] })
    },
    onError: (err, vars) => setErrorByTask((e) => ({ ...e, [vars.id]: extractErrorMessage(err) })),
  })

  if (isChecking || !user) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>
  }

  const active = tasks?.filter((t) => !['completed', 'citizen_verified', 'closed'].includes(t.status)) ?? []
  const done = tasks?.filter((t) => ['completed', 'citizen_verified', 'closed'].includes(t.status)) ?? []

  const NEXT_ACTION: Partial<Record<ComplaintStatus, { label: string; next: ComplaintStatus; icon: typeof Navigation }>> = {
    assigned: { label: 'Start heading there', next: 'worker_en_route', icon: Navigation },
    worker_en_route: { label: 'Start work', next: 'in_progress', icon: PlayCircle },
    in_progress: { label: 'Mark resolved', next: 'completed', icon: CheckCircle },
  }

  return (
    <div className="min-h-screen bg-bg">
      <Navbar homeHref="/worker/dashboard" />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader
          title={`${clock.greeting}, ${user.name.split(' ')[0]}`}
          description={`${active.length} active task${active.length === 1 ? '' : 's'} assigned to you right now.`}
        />

        <h2 className="font-display text-base font-semibold text-ink mb-3">Active tasks</h2>
        {isLoading ? (
          <div className="flex flex-col gap-3 mb-8">
            {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : active.length === 0 ? (
          <div className="mb-8">
            <EmptyState
              icon={ClipboardList}
              title="No active tasks"
              description="New assignments will show up here automatically as citizens report issues nearby."
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-8">
            {active.map((task) => {
              const action = NEXT_ACTION[task.status]
              return (
                <Card key={task.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <StatusBadge status={task.status} />
                        <SeverityBadge severity={task.severity} />
                        <span className="text-xs text-slate-400">{CATEGORY_LABELS[task.category]}</span>
                      </div>
                      <Link href={`/citizen/complaints/${task.id}`} className="font-medium text-ink hover:underline">
                        {task.title}
                      </Link>
                      <p className="text-xs text-slate-500 mt-1">{task.location.address}</p>
                      {errorByTask[task.id] && (
                        <p className="text-xs text-red-600 mt-1">{errorByTask[task.id]}</p>
                      )}
                    </div>
                    {action && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus.mutate({ id: task.id, status: action.next })}
                        isLoading={updateStatus.isPending && updateStatus.variables?.id === task.id}
                      >
                        <action.icon className="h-4 w-4" /> {action.label}
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        <h2 className="font-display text-base font-semibold text-ink mb-3">Recently completed</h2>
        {done.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing completed yet today.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {done.map((task) => (
              <Card key={task.id} className="p-4 opacity-70">
                <div className="flex items-center gap-2 mb-1.5">
                  <StatusBadge status={task.status} />
                  <span className="text-xs text-slate-400">{CATEGORY_LABELS[task.category]}</span>
                </div>
                <p className="font-medium text-ink">{task.title}</p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
