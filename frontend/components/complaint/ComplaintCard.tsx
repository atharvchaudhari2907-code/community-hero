import Link from 'next/link'
import { MapPin, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge, SeverityBadge } from '@/components/complaint/StatusBadge'
import { UpvoteButton } from '@/components/complaint/UpvoteButton'
import { formatRelativeTime } from '@/lib/utils'
import { CATEGORY_LABELS } from '@/types'
import type { Complaint } from '@/types'

export function ComplaintCard({
  complaint,
  href,
  showUpvote = true,
  invalidateKeys = [],
}: {
  complaint: Complaint
  href: string
  showUpvote?: boolean
  invalidateKeys?: string[][]
}) {
  return (
    <Card className="p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <Link href={href} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <StatusBadge status={complaint.status} />
            <SeverityBadge severity={complaint.severity} />
            <span className="text-xs text-slate-400">{CATEGORY_LABELS[complaint.category]}</span>
          </div>
          <h3 className="font-medium text-navy leading-snug">{complaint.title}</h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {complaint.location.address}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatRelativeTime(complaint.created_at)}
            </span>
          </div>
        </Link>
        {showUpvote && (
          <UpvoteButton complaintId={complaint.id} upvotes={complaint.upvotes} invalidateKeys={invalidateKeys} />
        )}
      </div>
    </Card>
  )
}
