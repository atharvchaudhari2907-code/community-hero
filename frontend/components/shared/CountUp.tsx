'use client'
import { useEffect, useRef, useState } from 'react'

export function CountUp({ value, duration = 1200, className }: { value: number; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const hasRun = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true
          const start = performance.now()
          function tick(now: number) {
            const elapsed = now - start
            const progress = Math.min(1, elapsed / duration)
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplay(Math.round(eased * value))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration])

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString('en-IN')}
    </span>
  )
}
