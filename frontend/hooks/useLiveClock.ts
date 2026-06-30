'use client'
import { useState, useEffect } from 'react'

export interface ClockState {
  timeString: string
  shortTime: string
  dateString: string
  greeting: string
  hour: number
}

function formatNow(): ClockState {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const s = now.getSeconds()
  const ap = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  const pad = (n: number) => String(n).padStart(2, '0')
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return {
    timeString: `${h12}:${pad(m)}:${pad(s)} ${ap}`,
    shortTime: `${h12}:${pad(m)} ${ap}`,
    dateString: `${DAYS[now.getDay()]}, ${now.getDate()} ${MONS[now.getMonth()]} ${now.getFullYear()}`,
    greeting: h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening',
    hour: h,
  }
}

export function useLiveClock(): ClockState {
  const [clock, setClock] = useState<ClockState>(() =>
    typeof window !== 'undefined'
      ? formatNow()
      : { timeString: '', shortTime: '', dateString: '', greeting: 'Hello', hour: 12 }
  )

  useEffect(() => {
    setClock(formatNow())
    const timer = setInterval(() => setClock(formatNow()), 1000)
    return () => clearInterval(timer)
  }, [])

  return clock
}
