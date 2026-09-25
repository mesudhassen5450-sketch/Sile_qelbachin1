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
    groupLabel: 'CMS',
    items: [
      {
        icon: 'BookOpen',
        label: 'Content',
        childItems: [
          { label: 'Kitabs', href: '/content/kitabs' },
          { label: 'Ders', href: '/content/ders' },
          { label: 'Audio', href: '/content/audio' },
          { label: 'Video', href: '/content/video' },
          { label: 'PDFs', href: '/content/pdfs' },
          { label: 'Muhadara', href: '/content/muhadara' },
          { label: 'Reminders', href: '/content/reminders' },
          { label: 'Knowledge', href: '/content/knowledge' },
          { label: 'Sahabah', href: '/content/sahabah' },
          { label: 'Speakers', href: '/content/speakers' },
          { label: 'Categories', href: '/content/categories' }
        ]
      },
      {
        icon: 'Image',
        label: 'Media',
        childItems: [
          { label: 'Storage sync', href: '/media/cloudflare' },
          { label: 'Library', href: '/media/library' },
          { label: 'Uploads', href: '/media/uploads' },
          { label: 'Media Health', href: '/media/health' }
        ]
      },
      {
        icon: 'Users',
        label: 'Users',
        childItems: [
          { label: 'Website Users', href: '/users/website' },
          { label: 'Mobile Users', href: '/users/mobile' }
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
        childItems: [
          { label: 'Health', href: '/system/health' }
        ]
      }
    ]
  }
]
