'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, LogOut, Map as MapIcon, Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLiveClock } from '@/hooks/useLiveClock'
import { cn } from '@/lib/utils'

export function Navbar({ homeHref }: { homeHref: string }) {
  const { user, logout } = useAuth()
  const clock = useLiveClock()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white px-4 md:px-6">
      <div className="flex items-center gap-5">
        <Link href={homeHref} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white font-display text-sm font-bold">
            CH
          </div>
          <span className="font-display text-base font-semibold text-primary hidden sm:inline">
            Community Hero
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink href="/map" active={pathname === '/map'}>
            <MapIcon className="h-3.5 w-3.5" /> Live Map
          </NavLink>
          {user?.role === 'citizen' && (
            <NavLink href="/citizen/leaderboard" active={pathname === '/citizen/leaderboard'}>
              <Trophy className="h-3.5 w-3.5" /> Leaderboard
            </NavLink>
          )}
        </nav>
      </div>

      <div className="hidden md:flex items-center gap-1 text-sm text-slate-500">
        <span>{clock.dateString}</span>
        <span className="mx-1">·</span>
        <span className="font-mono font-medium text-navy">{clock.shortTime}</span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span className="text-lg leading-none">{user.badge}</span>
            <span className="font-medium text-navy">{user.name}</span>
          </div>
        )}
        <button
          className="flex h-9 w-9 items-center justify-center rounded hover:bg-slate-50 text-slate-500"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" strokeWidth={1.75} />
        </button>
        <button
          onClick={logout}
          className="flex h-9 w-9 items-center justify-center rounded hover:bg-slate-50 text-slate-500"
          aria-label="Log out"
        >
          <LogOut className="h-4.5 w-4.5" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-sky-50 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-navy'
      )}
    >
      {children}
    </Link>
  )
}
