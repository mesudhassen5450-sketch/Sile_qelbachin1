'use client'

import { useEffect, useState } from 'react'

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
}

const fmt = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n) ? '0' : n.toLocaleString()

const Page = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [today, setToday] = useState<PlatformStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/stats?days=7', { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed')
        setStats(data.website)
        setToday(data.today?.website || null)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })()
  }, [])

  const cards = [
    { label: 'Unique visitors (7d)', value: stats?.unique_visitors ?? stats?.visitors },
    { label: 'Sessions (7d)', value: stats?.sessions },
    { label: 'Page views (7d)', value: stats?.page_views },
    { label: 'Audio plays (7d)', value: stats?.audio_plays },
    { label: 'Video views (7d)', value: stats?.video_plays },
    { label: 'PDF opens (7d)', value: stats?.pdf_opens ?? stats?.pdf_plays },
    { label: 'Downloads (7d)', value: stats?.downloads },
    { label: 'Searches (7d)', value: stats?.searches },
    { label: 'Today page views', value: today?.page_views },
    { label: 'Today audio plays', value: today?.audio_plays },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Website Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Live website platform events. Zeros until the public site records visits.
        </p>
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map(c => (
          <Card key={c.label} size="sm">
            <CardHeader className="pb-0">
              <CardDescription>{c.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{fmt(c.value)}</CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Page
