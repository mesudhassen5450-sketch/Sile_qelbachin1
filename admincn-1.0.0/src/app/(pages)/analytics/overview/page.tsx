'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type PlatformStats = {
  visitors?: number
  unique_visitors?: number
  sessions?: number
  page_views?: number
  audio_plays?: number
  video_plays?: number
  pdf_plays?: number
  pdf_opens?: number
  downloads?: number
  searches?: number
  kitab_opens?: number
  featured_clicks?: number
  app_opens?: number
}

type Stats = {
  days: number
  website: PlatformStats
  mobile: PlatformStats
  combined: PlatformStats
  today?: {
    website: PlatformStats
    mobile: PlatformStats
    combined: PlatformStats
  }
  content: Record<string, number>
  community?: {
    question_submissions: number
    questions_answered: number
    avg_response_hours: number | null
  }
  ai?: {
    requests: number
    successful: number
    failures: number
  }
  content_usage?: {
    kitab_opens: number
    audio_plays: number
    video_views: number
    pdf_opens: number
    downloads: number
    searches: number
    featured_clicks: number
    top_paths: Array<{ path: string; hits: number }>
  }
}

const fmt = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? '0' : n.toLocaleString()

function StatGrid({
  title,
  description,
  stats,
}: {
  title: string
  description: string
  stats: PlatformStats
}) {
  const cards = [
    { label: 'Unique visitors', value: stats.unique_visitors ?? stats.visitors },
    { label: 'Sessions', value: stats.sessions },
    { label: 'Page views', value: stats.page_views },
    { label: 'Audio plays', value: stats.audio_plays },
    { label: 'Video views', value: stats.video_plays },
    { label: 'PDF opens', value: stats.pdf_opens ?? stats.pdf_plays },
    { label: 'Downloads', value: stats.downloads },
    { label: 'Searches', value: stats.searches },
    { label: 'Kitab opens', value: stats.kitab_opens },
    { label: 'Featured clicks', value: stats.featured_clicks },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map(c => (
            <div key={c.label} className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">{c.label}</p>
              <p className="text-xl font-semibold tabular-nums">{fmt(c.value)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const AnalyticsOverviewPage = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [days, setDays] = useState(7)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/admin/stats?days=${days}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load')
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })()
  }, [days])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Website, Mobile, and Combined — live events only (zeros until traffic). Private question
            text is never shown.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 7, 30].map(d => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? 'default' : 'outline'}
              onClick={() => setDays(d)}
            >
              {d === 1 ? 'Today window' : `${d}d`}
            </Button>
          ))}
          <Button variant="outline" render={<Link href="/dashboard" />} nativeButton={false}>
            Open Dashboard
          </Button>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {stats?.today ? (
        <StatGrid
          title="Today (Combined)"
          description="Events since midnight local server time."
          stats={stats.today.combined}
        />
      ) : null}

      <StatGrid
        title={`Website (${days}d)`}
        description="Public website beacon events."
        stats={stats?.website || {}}
      />
      <StatGrid
        title={`Mobile (${days}d)`}
        description="Mobile app / mobile platform events when reported."
        stats={{
          ...(stats?.mobile || {}),
          page_views: stats?.mobile?.app_opens ?? stats?.mobile?.page_views,
        }}
      />
      <StatGrid
        title={`Combined (${days}d)`}
        description="Website + mobile totals."
        stats={stats?.combined || {}}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader className="pb-0">
            <CardDescription>Question submissions</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {fmt(stats?.community?.question_submissions)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            Answered: {fmt(stats?.community?.questions_answered)} · Avg reply:{' '}
            {stats?.community?.avg_response_hours == null
              ? '—'
              : `${stats.community.avg_response_hours}h`}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-0">
            <CardDescription>AI requests</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{fmt(stats?.ai?.requests)}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            OK {fmt(stats?.ai?.successful)} · Fail {fmt(stats?.ai?.failures)}
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader className="pb-0">
            <CardDescription>Published kitabs</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{fmt(stats?.content?.kitabs)}</CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
        <Card size="sm">
          <CardHeader className="pb-0">
            <CardDescription>Published audio</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{fmt(stats?.content?.audio)}</CardTitle>
          </CardHeader>
          <CardContent />
        </Card>
      </div>
    </div>
  )
}

export default AnalyticsOverviewPage
