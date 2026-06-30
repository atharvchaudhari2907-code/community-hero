// Severity hex values kept in sync with ComplaintMap.tsx and tailwind.config.js
const SEVERITY_HEX: Record<'critical' | 'high' | 'medium' | 'low', string> = {
  critical: '#EF4444',
  high: '#FB923C',
  medium: '#F59E0B',
  low: '#10B981',
}

export function MapLegend() {
  const items: Array<{ label: string; severity: keyof typeof SEVERITY_HEX }> = [
    { label: 'Critical', severity: 'critical' },
    { label: 'High', severity: 'high' },
    { label: 'Medium', severity: 'medium' },
    { label: 'Low', severity: 'low' },
  ]
  return (
    <div className="flex items-center gap-4 text-xs text-slate-500">
      {items.map((item) => (
        <span key={item.severity} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: SEVERITY_HEX[item.severity] }}
          />
          {item.label}
        </span>
      ))}
    </div>
  )
}
