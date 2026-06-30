import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded border border-dashed border-border bg-white py-12 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50">
        <Icon className="h-6 w-6 text-primary" strokeWidth={1.75} />
      </div>
      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
      <p className="max-w-sm text-sm text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="mt-2">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
