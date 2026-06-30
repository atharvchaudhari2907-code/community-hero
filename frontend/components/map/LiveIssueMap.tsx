'use client'
import dynamic from 'next/dynamic'
import type { Complaint } from '@/types'

const ComplaintMapInner = dynamic(
  () => import('./ComplaintMap').then((mod) => mod.ComplaintMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[480px] rounded-lg border border-border bg-slate-50 flex items-center justify-center text-sm text-slate-400 animate-pulse">
        Loading map…
      </div>
    ),
  }
)

export function LiveIssueMap(props: { complaints: Complaint[]; height?: string; onSelect?: (id: string) => void }) {
  return <ComplaintMapInner {...props} />
}
