'use client'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, User as UserIcon, Building2 } from 'lucide-react'
import { useState } from 'react'

import { useRequireAuth } from '@/hooks/useAuth'
import { api, extractErrorMessage } from '@/lib/api'
import { Navbar } from '@/components/shared/Navbar'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, SeverityBadge } from '@/components/complaint/StatusBadge'
import { ComplaintTimeline } from '@/components/complaint/ComplaintTimeline'
import { UpvoteButton } from '@/components/complaint/UpvoteButton'
import { AIAnalysisPanel } from '@/components/ai/AIAnalysisPanel'
import { SkeletonCard } from '@/components/shared/SkeletonCard'
import { LiveIssueMap } from '@/components/map/LiveIssueMap'
import { formatDateTime } from '@/lib/utils'
import type { APIResponse, Complaint } from '@/types'

export default function ComplaintDetailPage() {
  const { user, isChecking } = useRequireAuth()
  const params = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const { data: complaint, isLoading } = useQuery({
    queryKey: ['complaint', params.id],
    queryFn: async () => (await api.get<APIResponse<Complaint>>(`/complaints/${params.id}`)).data.data,
    enabled: !!user,
    refetchInterval: 8000, // simple polling for live status, stands in for a Firestore listener
  })

  const verify = useMutation({
    mutationFn: async () => (await api.post(`/complaints/${params.id}/verify`)).data.data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaint', params.id] })
      queryClient.invalidateQueries({ queryKey: ['my-complaints'] })
    },
    onError: (e) => setError(extractErrorMessage(e)),
  })

  if (isChecking || isLoading || !complaint) {
    return (
      <div className="min-h-screen bg-bg">
        <Navbar homeHref="/citizen/dashboard" />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <SkeletonCard lines={6} />
        </main>
      </div>
    )
  }

  const canVerify = user?.role === 'citizen' && complaint.citizen_id === user.id && complaint.status === 'completed'

  return (
    <div className="min-h-screen bg-bg">
      <Navbar homeHref={user?.role === 'citizen' ? '/citizen/dashboard' : user?.role === 'worker' ? '/worker/dashboard' : '/admin/dashboard'} />
      <main className="max-w-3xl mx-auto px-4 py-8 grid md:grid-cols-[1.3fr_1fr] gap-6">
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <StatusBadge status={complaint.status} />
              <SeverityBadge severity={complaint.severity} />
            </div>
            <h1 className="font-display text-xl font-semibold text-navy">{complaint.title}</h1>
            <p className="text-sm text-slate-600 mt-2">{complaint.description}</p>

            {complaint.media_urls.length > 0 && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/v1', '') || 'http://localhost:8000'}${complaint.media_urls[0]}`}
                alt="Reported issue"
                className="w-full h-48 object-cover rounded mt-3"
              />
            )}

            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <InfoRow icon={MapPin} label="Location" value={complaint.location.address} />
              <InfoRow icon={Building2} label="Department" value={complaint.department || 'Pending'} />
              <InfoRow icon={UserIcon} label="Assigned to" value={complaint.assigned_worker_name || 'Not yet assigned'} />
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <p className="text-xs text-slate-400">
                Reported {formatDateTime(complaint.created_at)} · SLA deadline {formatDateTime(complaint.deadline)}
              </p>
              <div className="flex items-center gap-2">
                <UpvoteButton complaintId={complaint.id} upvotes={complaint.upvotes} />
                {canVerify && (
                  <Button size="sm" onClick={() => verify.mutate()} isLoading={verify.isPending}>
                    Confirm resolved
                  </Button>
                )}
              </div>
            </div>
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          </Card>

          <Card className="p-2">
            <LiveIssueMap complaints={[complaint]} height="240px" />
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-sm font-semibold text-navy mb-4">Status timeline</h2>
            <ComplaintTimeline timeline={complaint.timeline} />
          </Card>
        </div>

        <div>
          <Card className="p-5">
            {complaint.ai_analysis ? (
              <AIAnalysisPanel analysis={complaint.ai_analysis} />
            ) : (
              <p className="text-sm text-slate-400">AI analysis is still processing…</p>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-navy">{value}</p>
      </div>
    </div>
  )
}
