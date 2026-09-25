'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  ROLE_PERMISSIONS,
  STAFF_ROLE_META,
  STAFF_ROLES,
  type Permission,
  type StaffRole
} from '@/lib/auth/permissions'

const PERMISSION_GROUPS: Array<{ label: string; permissions: Permission[] }> = [
  {
    label: 'Content (website & mobile)',
    permissions: [
      'kitabs.view',
      'kitabs.create',
      'kitabs.edit',
      'kitabs.publish',
      'ders.view',
      'ders.create',
      'ders.edit',
      'ders.publish',
      'audio.view',
      'audio.create',
      'audio.publish',
      'video.view',
      'video.create',
      'video.publish',
      'pdf.view',
      'pdf.create',
      'pdf.publish'
    ]
  },
  {
    label: 'Media library, uploads & Storage sync',
    permissions: ['media.view', 'media.upload', 'media.health', 'media.scan']
  },
  {
    label: 'Staff & security',
    permissions: ['admins.view', 'admins.manage', 'security.view', 'audit.view']
  },
  {
    label: 'Analytics & system',
    permissions: ['dashboard.view', 'analytics.view', 'reports.view', 'users.view', 'system.view']
  }
]

function roleHas(role: StaffRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

const RolesPage = () => {
  const { can } = useAuth()

  if (!can('admins.manage') && !can('admins.view')) {
    return (
      <Card>
        <CardContent className='text-destructive py-6 text-sm'>Access denied.</CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Roles & Permissions</h1>
        <p className='text-muted-foreground mt-1 max-w-3xl text-sm'>
          <strong>Super Admin</strong> — everything, including Storage sync.{' '}
          <strong>Content Admin</strong> — same as Super Admin except Storage sync.{' '}
          <strong>Media Admin</strong> — upload/edit + analytics (no staff, no Storage sync).
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {STAFF_ROLES.map(role => {
          const meta = STAFF_ROLE_META[role]
          return (
            <Card key={role}>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base'>{meta.label}</CardTitle>
                <CardDescription>{meta.summary}</CardDescription>
              </CardHeader>
              <CardContent className='flex flex-wrap gap-1.5'>
                {meta.surfaces.map(s => (
                  <Badge key={s} variant='outline'>
                    {s}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {PERMISSION_GROUPS.map(group => (
        <Card key={group.label}>
          <CardHeader>
            <CardTitle className='text-base'>{group.label}</CardTitle>
            <CardDescription>Checkmarks show which roles may perform each action.</CardDescription>
          </CardHeader>
          <CardContent className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='min-w-40'>Permission</TableHead>
                  {STAFF_ROLES.map(role => (
                    <TableHead key={role} className='text-center text-xs'>
                      {STAFF_ROLE_META[role].label.replace(' Admin', '')}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.permissions.map(permission => (
                  <TableRow key={permission}>
                    <TableCell className='font-mono text-xs'>
                      {permission === 'media.scan' ? 'media.scan (Storage sync)' : permission}
                    </TableCell>
                    {STAFF_ROLES.map(role => (
                      <TableCell key={role} className='text-center'>
                        {roleHas(role, permission) ? (
                          <span className='text-primary font-medium'>✓</span>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default RolesPage
