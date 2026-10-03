// Third-party Imports
import type * as Icon from 'lucide-react'

type IconName = keyof typeof Icon

export type MenuLeafSubItem = {
  label: string
  href: string
  activePath?: string
  badge?: string
  badgeClassName?: string
  target?: '_blank' | '_self' | '_parent' | '_top'
}

export type MenuGroupSubItem = {
  label: string
  childItems: MenuLeafSubItem[]
}

export type MenuSubItem = MenuLeafSubItem | MenuGroupSubItem

export type MenuItem = {
  icon: IconName
  label: string
} & (
  | {
      href: string
      badge?: string
      badgeClassName?: string
      childItems?: never
      target?: '_blank' | '_self' | '_parent' | '_top'
    }
  | {
      href?: never
      badge?: string
      badgeClassName?: string
      childItems: MenuSubItem[]
    }
)

export type NavItem = {
  groupLabel?: string
  items: MenuItem[]
}

/**
 * Client Admin IA — each public section has independent sub-types.
 * Old Muhadara / Reminders / Sahabah / Ders routes redirect into these.
 */
export const navItems: NavItem[] = [
  {
    groupLabel: 'Overview',
    items: [
      {
        icon: 'LayoutDashboard',
        label: 'Dashboard',
        href: '/dashboard'
      }
    ]
  },
  {
    groupLabel: 'Content',
    items: [
      {
        icon: 'BookOpen',
        label: "Qur'an Recitations",
        href: '/content/quran-recitations'
      },
      {
        icon: 'Mic',
        label: "Da'wah",
        childItems: [
          {
            label: 'Talks (audio 1 min+)',
            href: '/content/dawah/talks',
            activePath: '/content/dawah/talks'
          },
          {
            label: 'Reminders',
            href: '/content/dawah/reminders',
            activePath: '/content/dawah/reminders'
          }
        ]
      },
      {
        icon: 'Timer',
        label: '1-Minute (under 1 min)',
        childItems: [
          { label: 'Video', href: '/content/one-minute/video', activePath: '/content/one-minute/video' },
          { label: 'Audio', href: '/content/one-minute/audio', activePath: '/content/one-minute/audio' },
          { label: 'Text', href: '/content/one-minute/text', activePath: '/content/one-minute/text' }
        ]
      },
      {
        icon: 'Film',
        label: 'Videos (1 min+)',
        href: '/content/videos'
      },
      {
        icon: 'Library',
        label: 'Library',
        childItems: [
          { label: 'Kitabs', href: '/content/library/kitabs', activePath: '/content/library/kitabs' },
          { label: 'PDFs', href: '/content/library/pdfs', activePath: '/content/library/pdfs' },
          {
            label: 'Reminders',
            href: '/content/dawah/reminders',
            activePath: '/content/dawah/reminders'
          }
        ]
      },
      {
        icon: 'Heart',
        label: 'Youth & Heart',
        childItems: [
          {
            label: 'Marriage & Love',
            href: '/content/marriage',
            activePath: '/content/marriage'
          },
          {
            label: 'Articles',
            href: '/content/articles',
            activePath: '/content/articles'
          },
          {
            label: 'Q & A',
            href: '/content/questions',
            activePath: '/content/questions'
          }
        ]
      }
    ]
  },
  {
    groupLabel: 'Community',
    items: [
      {
        icon: 'Inbox',
        label: 'Question Submissions',
        href: '/community/questions'
      }
    ]
  },
  {
    groupLabel: 'Media',
    items: [
      {
        icon: 'Image',
        label: 'Cloudflare media',
        childItems: [
          { label: 'Media Library', href: '/media/library' },
          { label: 'Uploads', href: '/media/uploads' },
          { label: 'Storage Sync', href: '/media/cloudflare' },
          { label: 'Media Health', href: '/media/health' }
        ]
      }
    ]
  },
  {
    groupLabel: 'Insights',
    items: [
      {
        icon: 'BarChart3',
        label: 'Analytics',
        childItems: [
          { label: 'Overview', href: '/analytics/overview' },
          { label: 'Website', href: '/analytics/website' },
          { label: 'Mobile', href: '/analytics/mobile' },
          { label: 'Content', href: '/analytics/content' }
        ]
      }
    ]
  },
  {
    groupLabel: 'Admin',
    items: [
      {
        icon: 'Shield',
        label: 'Security',
        childItems: [
          { label: 'Admins', href: '/security/admins' },
          { label: 'Roles & Permissions', href: '/security/roles' },
          { label: 'Activity log', href: '/security/audit-logs' }
        ]
      },
      {
        icon: 'Settings',
        label: 'System',
        childItems: [{ label: 'Health', href: '/system/health' }]
      }
    ]
  }
]
