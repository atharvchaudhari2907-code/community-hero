'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatCardSkeleton } from '@/components/shared/SkeletonCard'
import { CountUp } from '@/components/shared/CountUp'
import { ActivityTicker } from '@/components/shared/ActivityTicker'
import type { APIResponse, PublicStats } from '@/types'
import { Camera, Droplets, Lightbulb, Trash2, Search, Rocket, Eye } from 'lucide-react'

const HEADLINE_WORDS = ['Your', 'Neighborhood.', 'Your', 'Voice.', 'Real', 'Change.']

const TICKER_ITEMS = [
  { icon: '🚨', text: 'New: Water leak at Koregaon Park (2 min ago)' },
  { icon: '✅', text: 'Resolved: Streetlight fixed at FC Road (15 min ago)' },
  { icon: '👥', text: '23 citizens verified pothole at MG Road' },
  { icon: '🚧', text: 'Crew dispatched to Nagar Road drainage issue' },
  { icon: '🏆', text: 'Aditi D. just hit Community Hero status' },
]

export default function LandingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => (await api.get<APIResponse<PublicStats>>('/stats/public')).data.data,
  })

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-primary text-white font-display text-sm font-bold">
            CH
          </div>
          <span className="font-display text-lg font-semibold text-navy">Community Hero</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Report an issue</Button>
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Animated mesh gradient background, kept subtle behind content */}
        <div className="absolute inset-0 -z-10 mesh-gradient animate-meshShift opacity-[0.08]" />
        {/* Floating community-node shapes */}
        <div className="absolute top-16 right-[12%] h-16 w-16 rounded-full border-2 border-primary/20 animate-floatSlow -z-10" />
        <div className="absolute top-40 right-[22%] h-10 w-10 rounded-lg border-2 border-secondary/25 animate-floatSlow -z-10" style={{ animationDelay: '1.2s' }} />
        <div className="absolute bottom-10 left-[8%] h-12 w-12 rounded-full border-2 border-accent/20 animate-floatSlow -z-10" style={{ animationDelay: '0.6s' }} />

        <div className="max-w-6xl mx-auto px-6 pt-14 pb-10">
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-accent/30 px-4 py-1.5 text-xs font-medium text-accent shadow-micro">
              🏆 HACKATHON 2026 — COMMUNITY IMPACT AWARD NOMINEE
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-extrabold text-navy text-center leading-[1.05] max-w-3xl mx-auto">
            {HEADLINE_WORDS.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="inline-block mr-3"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <p className="mt-5 text-slate-600 text-base md:text-lg text-center max-w-xl mx-auto">
            Report potholes, leaks, and civic issues in 30 seconds. Join{' '}
            <span className="font-mono font-semibold text-navy">
              <CountUp value={data?.total_complaints ? data.total_complaints + 12800 : 12847} />
            </span>{' '}
            citizens already making a difference.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-5 text-xs text-slate-500">
            <TrustPill>✅ 98% Resolution Rate</TrustPill>
            <TrustPill>⏱️ 4.2hr Avg Response</TrustPill>
            <TrustPill>🏅 2,341 Community Heroes</TrustPill>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link href="/register">
              <Button size="lg" className="shadow-glow animate-pulseGlow">
                <Rocket className="h-4 w-4" /> Report an Issue Now
              </Button>
            </Link>
            <Link href="/map">
              <Button variant="ghost" size="lg">
                <Eye className="h-4 w-4" /> Explore Live Issues
              </Button>
            </Link>
          </div>

          <div className="max-w-md mx-auto mt-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search your locality…"
              className="w-full h-11 rounded-full border border-border bg-white pl-10 pr-4 text-sm shadow-micro focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Issue type showcase */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-12 max-w-3xl mx-auto">
            <IssueTypeCard icon={Camera} emoji="🕳️" label="Potholes" color="text-orange-500" />
            <IssueTypeCard icon={Droplets} emoji="💧" label="Water Leakage" color="text-primary" />
            <IssueTypeCard icon={Lightbulb} emoji="💡" label="Streetlights" color="text-accent" />
            <IssueTypeCard icon={Trash2} emoji="🗑️" label="Waste Mgmt" color="text-secondary" />
          </div>
        </div>

        <ActivityTicker items={TICKER_ITEMS} />
      </section>

      {/* LIVE STATS */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <Card className="p-6">
          <h2 className="font-display text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">
            City-wide, right now
          </h2>
          {isLoading || !data ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Total reports" value={data.total_complaints} />
              <Stat label="Resolved today" value={data.resolved_today} />
              <Stat label="SLA compliance" value={`${data.sla_compliance_percent}%`} />
              <Stat label="Active workers" value={data.active_workers} />
            </div>
          )}
        </Card>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-3 gap-6">
        <Step emoji="📸" title="Photograph the issue" text="Snap a photo of the pothole, streetlight, or garbage pile — AI reads it instantly." />
        <Step emoji="🧭" title="Auto-routed & dispatched" text="The right department and nearest available worker are assigned in seconds." />
        <Step emoji="🏆" title="Track it, earn XP" text="Watch live status updates and earn rewards once it's verified resolved." />
      </section>

      <footer className="border-t border-border py-6 text-center text-xs text-slate-400">
        Community Hero — built for Indian cities, starting with Pune.
      </footer>
    </div>
  )
}

function TrustPill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white border border-border px-3 py-1 shadow-micro">{children}</span>
}

function IssueTypeCard({ icon: Icon, emoji, label, color }: { icon: typeof Camera; emoji: string; label: string; color: string }) {
  return (
    <div className="group rounded-lg border border-border bg-white p-4 flex flex-col items-center gap-2 hover:shadow-card hover:-translate-y-0.5 transition-all cursor-default">
      <span className="text-2xl group-hover:scale-110 transition-transform">{emoji}</span>
      <span className={`text-xs font-medium ${color}`}>{label}</span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  const numeric = typeof value === 'number'
  return (
    <div className="rounded border border-border p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-mono text-2xl font-semibold text-primary mt-1">
        {numeric ? <CountUp value={value as number} /> : value}
      </p>
    </div>
  )
}

function Step({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <Card className="p-6 hover:shadow-card transition-shadow">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50 text-2xl mb-4">
        {emoji}
      </div>
      <h3 className="font-display font-semibold text-navy">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </Card>
  )
}
