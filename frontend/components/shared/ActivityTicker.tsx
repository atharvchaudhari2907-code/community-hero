'use client'

export interface ActivityItem {
  icon: string
  text: string
}

export function ActivityTicker({ items }: { items: ActivityItem[] }) {
  // Duplicate the list so the marquee loop is seamless at -50% translateX
  const doubled = [...items, ...items]

  return (
    <div className="relative overflow-hidden border-t border-border bg-white/60 py-3 group">
      <div className="flex w-max gap-8 animate-marquee group-hover:[animation-play-state:paused]">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-2 text-sm text-slate-600 whitespace-nowrap">
            <span aria-hidden>{item.icon}</span>
            {item.text}
          </span>
        ))}
      </div>
    </div>
  )
}
