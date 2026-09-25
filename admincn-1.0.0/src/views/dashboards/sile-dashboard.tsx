'use client'

import { useEffect, useState, type ComponentType } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  FileAudio,
  FileText,
  Film,
  Headphones,
  MonitorPlay,
  Smartphone,
  Eye,
  Activity,
  AlertTriangle,
  Plus,
  HeartPulse,
  Bell
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type StatsPayload = {
  ok: boolean
  days: number
  content: {
    kitabs: number
    ders: number
    audio: number
    video: number
    pdfs: number
    reminders: number
    media_files: number
  }
  website: {
    visitors: number
    sessions: number
    page_views: number
    audio_plays: number
    video_plays: number
    pdf_plays: number
  }
  mobile: {
    registered: number
    active_30d: number
    app_opens: number
    audio_plays: number
    video_plays: number
    pdf_plays: number
  }
  events_total: number
}

type StatCard = { label: string; value: string }

function fmt(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString() : '0'
}

function StatGroup({
  title,
  description,
  icon: Icon,
  stats
}: {
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  stats: StatCard[]
}) {
  return (
    <section className='space-y-3'>
      <div className='flex items-center gap-2'>
        <div className='bg-primary/15 text-primary flex size-8 items-center justify-center rounded-lg'>
          <Icon className='size-4' />
        </div>
        <div>
          <h2 className='text-lg font-semibold'>{title}</h2>
          <p className='text-muted-foreground text-xs'>{description}</p>
        </div>
      </div>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
        {stats.map(stat => (
          <Card key={stat.label} size='sm'>
            <CardHeader className='pb-0'>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums'>{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}

const quickActions = [
  { label: 'Add Kitab', href: '/content/kitabs', icon: Plus },
  { label: 'Add Reminder', href: '/content/reminders', icon: Bell },
  { label: 'Add Audio', href: '/content/audio', icon: Headphones },
  { label: 'Add Video', href: '/content/video', icon: MonitorPlay },
  { label: 'Add PDF', href: '/content/pdfs', icon: FileText },
  { label: 'Media Health', href: '/media/health', icon: HeartPulse },
  { label: 'View Errors', href: '/system/errors', icon: AlertTriangle }
]

const SileDashboard = () => {
  const [stats, setStats] = useState<StatsPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/stats?days=7', { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to load stats')
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })()
  }, [])

  const websiteStats: StatCard[] = [
    { label: 'Visitors (7d)', value: fmt(stats?.website.visitors ?? 0) },
    { label: 'Sessions (7d)', value: fmt(stats?.website.sessions ?? 0) },
    { label: 'Page views (7d)', value: fmt(stats?.website.page_views ?? 0) },
    { label: 'Audio plays (7d)', value: fmt(stats?.website.audio_plays ?? 0) },
    { label: 'Video plays (7d)', value: fmt(stats?.website.video_plays ?? 0) },
    { label: 'PDF opens (7d)', value: fmt(stats?.website.pdf_plays ?? 0) }
  ]

  const mobileStats: StatCard[] = [
    { label: 'Registered', value: fmt(stats?.mobile.registered ?? 0) },
    { label: 'Active (30d)', value: fmt(stats?.mobile.active_30d ?? 0) },
    { label: 'App opens (7d)', value: fmt(stats?.mobile.app_opens ?? 0) },
    { label: 'Audio plays (7d)', value: fmt(stats?.mobile.audio_plays ?? 0) },
    { label: 'Video plays (7d)', value: fmt(stats?.mobile.video_plays ?? 0) },
    { label: 'PDF opens (7d)', value: fmt(stats?.mobile.pdf_plays ?? 0) }
  ]

  const contentCounters = [
    { label: 'Kitabs', value: stats?.content.kitabs ?? 0, href: '/content/kitabs', icon: BookOpen },
    { label: 'Ders', value: stats?.content.ders ?? 0, href: '/content/ders', icon: FileText },
    { label: 'Audio', value: stats?.content.audio ?? 0, href: '/content/audio', icon: FileAudio },
    { label: 'Videos', value: stats?.content.video ?? 0, href: '/content/video', icon: Film },
    { label: 'PDFs', value: stats?.content.pdfs ?? 0, href: '/content/pdfs', icon: FileText },
    {
      label: 'Reminders',
      value: stats?.content.reminders ?? 0,
      href: '/content/reminders',
      icon: Bell
    }
  ]

  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Live overview of your library and website activity from the last 7 days.
        </p>
      </div>

      {error ? <p className='text-destructive text-sm'>{error}</p> : null}

      <StatGroup
        title='Website'
        description='Counts from real visits on the public website (zeros until people browse)'
        icon={Eye}
        stats={websiteStats}
      />

      <StatGroup
        title='Mobile'
        description='Counts from the app when it reports activity (zeros until the app sends events)'
        icon={Smartphone}
        stats={mobileStats}
      />

      <section className='space-y-3'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/15 text-primary flex size-8 items-center justify-center rounded-lg'>
            <Activity className='size-4' />
          </div>
          <div>
            <h2 className='text-lg font-semibold'>Content library</h2>
            <p className='text-muted-foreground text-xs'>Published items in Admin right now</p>
          </div>
        </div>
        <div className='grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6'>
          {contentCounters.map(item => (
            <Link key={item.label} href={item.href} className='block'>
              <Card size='sm' className='hover:ring-primary/40 transition-shadow hover:ring-2'>
                <CardContent className='flex items-center gap-3 pt-1'>
                  <item.icon className='text-primary size-5 shrink-0' />
                  <div>
                    <p className='text-muted-foreground text-xs'>{item.label}</p>
                    <p className='text-xl font-semibold tabular-nums'>{fmt(item.value)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className='space-y-3'>
        <h2 className='text-lg font-semibold'>Quick actions</h2>
        <div className='flex flex-wrap gap-2'>
          {quickActions.map(action => (
            <Button
              key={action.label}
              variant='outline'
              render={<Link href={action.href} />}
              nativeButton={false}
            >
              <action.icon className='size-4' />
              {action.label}
            </Button>
          ))}
        </div>
      </section>
    </div>
  )
}

export default SileDashboard
