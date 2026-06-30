import { type ClassValue, clsx } from 'clsx'
import type { SeverityLevel, ComplaintStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

// Document 2's severity scale: Red (critical) -> Orange (high) -> Yellow/gold (medium) -> Green (low)
export const SEVERITY_COLOR: Record<SeverityLevel, string> = {
  low: 'text-secondary bg-emerald-50 border-emerald-200',
  medium: 'text-accent bg-amber-50 border-amber-200',
  high: 'text-orange-600 bg-orange-50 border-orange-200',
  critical: 'text-danger bg-red-50 border-red-200',
}

export const SEVERITY_DOT: Record<SeverityLevel, string> = {
  low: 'bg-secondary',
  medium: 'bg-accent',
  high: 'bg-orange-500',
  critical: 'bg-danger',
}

export const STATUS_COLOR: Record<ComplaintStatus, string> = {
  submitted: 'text-slate-600 bg-slate-100',
  ai_processing: 'text-primary bg-sky-50',
  ai_failed: 'text-danger bg-red-50',
  routed: 'text-primary bg-sky-50',
  assigned: 'text-primary bg-sky-50',
  worker_en_route: 'text-primary bg-sky-50',
  in_progress: 'text-accent bg-amber-50',
  completed: 'text-secondary bg-emerald-50',
  citizen_verified: 'text-secondary bg-emerald-50',
  closed: 'text-slate-500 bg-slate-100',
  escalated: 'text-danger bg-red-50',
}

export function deadlineUrgency(deadlineIso: string): 'safe' | 'soon' | 'overdue' {
  const deadline = new Date(deadlineIso).getTime()
  const now = Date.now()
  const hoursLeft = (deadline - now) / (1000 * 60 * 60)
  if (hoursLeft < 0) return 'overdue'
  if (hoursLeft < 6) return 'soon'
  return 'safe'
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-IN')
}
