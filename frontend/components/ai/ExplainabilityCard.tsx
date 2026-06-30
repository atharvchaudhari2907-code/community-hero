import { Eye, Brain, AlertTriangle } from 'lucide-react'
import type { AIExplainability } from '@/types'

export function ExplainabilityCard({ explainability }: { explainability: AIExplainability }) {
  return (
    <div className="rounded border border-border bg-slate-50 p-3 flex flex-col gap-3">
      <Row icon={Eye} label="Visual cues">
        <div className="flex flex-wrap gap-1.5 mt-1">
          {explainability.visual_cues.map((cue, i) => (
            <span key={i} className="rounded bg-white border border-border px-2 py-0.5 text-xs text-slate-600">
              {cue}
            </span>
          ))}
        </div>
      </Row>
      <Row icon={Brain} label="Reasoning">
        <p className="text-xs text-slate-600 mt-1">{explainability.reasoning}</p>
      </Row>
      <Row icon={AlertTriangle} label="Hazard assessment">
        <p className="text-xs text-slate-600 mt-1">{explainability.hazard_assessment}</p>
      </Row>
    </div>
  )
}

function Row({ icon: Icon, label, children }: { icon: typeof Eye; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        {label}
      </div>
      {children}
    </div>
  )
}
