import { Badge } from '@/components/ui/Card'
import { STATUS_COLOR, SEVERITY_COLOR } from '@/lib/utils'
import { STATUS_LABELS, SEVERITY_LABELS } from '@/types'
import type { ComplaintStatus, SeverityLevel } from '@/types'

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  return <Badge className={STATUS_COLOR[status]}>{STATUS_LABELS[status]}</Badge>
}

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  return (
    <Badge className={`border ${SEVERITY_COLOR[severity]}`}>
      {SEVERITY_LABELS[severity]}
    </Badge>
  )
}
