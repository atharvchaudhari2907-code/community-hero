import { CheckCircle2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { TimelineEvent } from '@/types'

export function ComplaintTimeline({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <ol className="flex flex-col gap-0">
      {timeline.map((event, i) => (
        <li key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            </div>
            {i < timeline.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
          </div>
          <div className="pb-5">
            <p className="text-sm text-ink">{event.message}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {event.actor} · {formatDateTime(event.timestamp)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
