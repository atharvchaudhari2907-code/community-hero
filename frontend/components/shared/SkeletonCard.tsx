export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded border border-border bg-white p-4 shadow-micro animate-pulse">
      <div className="h-4 w-2/3 rounded bg-slate-200 mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-slate-100 mb-2"
          style={{ width: `${90 - i * 15}%` }}
        />
      ))}
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/2 rounded bg-slate-200" />
        <div className="h-3 w-1/3 rounded bg-slate-100" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded border border-border bg-white p-4 shadow-micro animate-pulse">
      <div className="h-3 w-1/2 rounded bg-slate-100 mb-3" />
      <div className="h-7 w-1/3 rounded bg-slate-200" />
    </div>
  )
}
