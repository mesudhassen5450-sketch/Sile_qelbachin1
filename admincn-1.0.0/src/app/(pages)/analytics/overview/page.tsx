'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Stats = {
  website: {
    visitors: number
    sessions: number
    page_views: number
    audio_plays: number
    video_plays: number
    pdf_plays: number
  }
  mobile: {
    app_opens: number
    audio_plays: number
    video_plays: number
    pdf_plays: number
  }
  content: {
    kitabs: number
    ders: number
    audio: number
    video: number
    pdfs: number
  }
}

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString() : '0')

const AnalyticsOverviewPage = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/stats?days=7', { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load')
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })()
  }, [])

  const cards = [
    { label: 'Visitors (7d)', value: fmt(stats?.website.visitors ?? 0) },
    { label: 'Page views (7d)', value: fmt(stats?.website.page_views ?? 0) },
    { label: 'Audio plays (7d)', value: fmt(stats?.website.audio_plays ?? 0) },
    { label: 'Video plays (7d)', value: fmt(stats?.website.video_plays ?? 0) },
    { label: 'App opens (7d)', value: fmt(stats?.mobile.app_opens ?? 0) },
    { label: 'Published kitabs', value: fmt(stats?.content.kitabs ?? 0) }
  ]

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold tracking-tight'>Analytics Overview</h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            Live numbers from the website and your published library (zeros until people visit).
          </p>
        </div>
        <Button variant='outline' render={<Link href='/dashboard' />} nativeButton={false}>
          Open Dashboard
        </Button>
      </div>

      {error ? <p className='text-destructive text-sm'>{error}</p> : null}

      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        {cards.map(c => (
          <Card key={c.label} size='sm'>
            <CardHeader className='pb-0'>
              <CardDescription>{c.label}</CardDescription>
              <CardTitle className='text-2xl tabular-nums'>{c.value}</CardTitle>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </div>
  )
}

export default AnalyticsOverviewPage
