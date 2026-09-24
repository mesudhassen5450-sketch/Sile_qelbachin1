import type { ComponentType } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  FileAudio,
  FileText,
  Film,
  Headphones,
  MonitorPlay,
  Smartphone,
  Users,
  Eye,
  Activity,
  AlertTriangle,
  Plus,
  HeartPulse
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type StatCard = {
  label: string
  value: string
}

const websiteStats: StatCard[] = [
  { label: 'Visitors', value: '12,480' },
  { label: 'Sessions', value: '18,920' },
  { label: 'Page views', value: '54,310' },
  { label: 'Audio plays', value: '8,240' },
  { label: 'Video plays', value: '5,120' },
  { label: 'PDF plays', value: '1,860' }
]

const mobileStats: StatCard[] = [
  { label: 'Registered', value: '3,420' },
  { label: 'Active (30d)', value: '1,980' },
  { label: 'App opens', value: '22,150' },
  { label: 'Audio plays', value: '6,730' },
  { label: 'Video plays', value: '4,010' },
  { label: 'PDF plays', value: '920' }
]

const combinedStats: StatCard[] = [
  { label: 'Total visitors / opens', value: '34,630' },
  { label: 'Total sessions', value: '41,070' },
  { label: 'Total media plays', value: '26,880' },
  { label: 'Users (not always deduped)', value: '15,900' }
]

const contentCounters = [
  { label: 'Kitabs', value: 7, href: '/content/kitabs', icon: BookOpen },
  { label: 'Ders', value: 69, href: '/content/ders', icon: FileText },
  { label: 'Audio', value: 182, href: '/content/audio', icon: FileAudio },
  { label: 'Videos', value: 130, href: '/content/video', icon: Film },
  { label: 'PDFs', value: 21, href: '/content/pdfs', icon: FileText }
]

const quickActions = [
  { label: 'Add Kitab', href: '/content/kitabs', icon: Plus },
  { label: 'Add Audio', href: '/content/audio', icon: Headphones },
  { label: 'Add Video', href: '/content/video', icon: MonitorPlay },
  { label: 'Add PDF', href: '/content/pdfs', icon: FileText },
  { label: 'Media Health', href: '/media/health', icon: HeartPulse },
  { label: 'View Errors', href: '/system/errors', icon: AlertTriangle }
]

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

const SileDashboard = () => {
  return (
    <div className='space-y-8'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Sile Qelbachin Admin — website, mobile, and content overview (mock data).
        </p>
      </div>

      <StatGroup
        title='Website'
        description='Public site traffic and media engagement'
        icon={Eye}
        stats={websiteStats}
      />

      <StatGroup
        title='Mobile'
        description='App registrations, opens, and plays'
        icon={Smartphone}
        stats={mobileStats}
      />

      <StatGroup
        title='Combined Total'
        description='Labeled totals — users are not always deduplicated across platforms'
        icon={Users}
        stats={combinedStats}
      />

      <section className='space-y-3'>
        <div className='flex items-center gap-2'>
          <div className='bg-primary/15 text-primary flex size-8 items-center justify-center rounded-lg'>
            <Activity className='size-4' />
          </div>
          <div>
            <h2 className='text-lg font-semibold'>Content library</h2>
            <p className='text-muted-foreground text-xs'>Placeholder counts for central content</p>
          </div>
        </div>
        <div className='grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5'>
          {contentCounters.map(item => (
            <Link key={item.label} href={item.href} className='block'>
              <Card size='sm' className='hover:ring-primary/40 transition-shadow hover:ring-2'>
                <CardContent className='flex items-center gap-3 pt-1'>
                  <item.icon className='text-primary size-5 shrink-0' />
                  <div>
                    <p className='text-muted-foreground text-xs'>{item.label}</p>
                    <p className='text-xl font-semibold tabular-nums'>{item.value}</p>
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
