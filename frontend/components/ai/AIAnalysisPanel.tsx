import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Card'
import { ConfidenceBar } from '@/components/ai/ConfidenceBar'
import { ExplainabilityCard } from '@/components/ai/ExplainabilityCard'
import { CATEGORY_LABELS, SEVERITY_LABELS, type AIAnalysisResult } from '@/types'

export function AIAnalysisPanel({ analysis }: { analysis: AIAnalysisResult }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-semibold text-ink">AI Analysis</span>
        </div>
        <Badge className={analysis.source === 'gemini' ? 'bg-sky-50 text-primary' : 'bg-amber-50 text-amber-700'}>
          {analysis.source === 'gemini' ? 'Gemini AI' : 'Rule-based (no Gemini key set)'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category" value={CATEGORY_LABELS[analysis.category]} />
        <Field label="Severity" value={SEVERITY_LABELS[analysis.severity]} />
        <Field label="Department" value={analysis.suggested_department} />
        <Field label="Est. resolution" value={`${analysis.estimated_resolution_days} day(s)`} />
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 mb-1.5">AI confidence</p>
        <ConfidenceBar confidence={analysis.confidence} />
      </div>

      <p className="text-sm text-slate-600">{analysis.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {analysis.tags.map((tag) => (
          <Badge key={tag} className="bg-slate-100 text-slate-600">{tag}</Badge>
        ))}
      </div>

      <ExplainabilityCard explainability={analysis.explainability} />
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-ink mt-0.5">{value}</p>
    </div>
  )
}
