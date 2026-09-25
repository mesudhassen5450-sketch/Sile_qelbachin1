export type StaffRole =
  | 'super_admin'
  | 'content_admin'
  | 'media_admin'
  | 'analytics_admin'
  | 'moderator'
  | 'read_only'

export type StaffStatus = 'active' | 'pending' | 'disabled' | 'suspended'

export type Permission =
  | 'dashboard.view'
  | 'kitabs.view'
  | 'kitabs.create'
  | 'kitabs.edit'
  | 'kitabs.publish'
  | 'kitabs.archive'
  | 'ders.view'
  | 'ders.create'
  | 'ders.edit'
  | 'ders.reorder'
  | 'ders.publish'
  | 'audio.view'
  | 'audio.create'
  | 'audio.edit'
  | 'audio.publish'
  | 'audio.archive'
  | 'video.view'
  | 'video.create'
  | 'video.edit'
  | 'video.publish'
  | 'video.archive'
  | 'pdf.view'
  | 'pdf.create'
  | 'pdf.edit'
  | 'pdf.publish'
  | 'media.view'
  | 'media.scan'
  | 'media.health'
  | 'media.upload'
  | 'analytics.view'
  | 'users.view'
  | 'users.manage'
  | 'admins.view'
  | 'admins.manage'
  | 'security.view'
  | 'audit.view'
  | 'notifications.view'
  | 'reports.view'
  | 'system.view'
  | 'account.view'

const ALL_PERMISSIONS: Permission[] = [
  'dashboard.view',
  'kitabs.view',
  'kitabs.create',
  'kitabs.edit',
  'kitabs.publish',
  'kitabs.archive',
  'ders.view',
  'ders.create',
  'ders.edit',
  'ders.reorder',
  'ders.publish',
  'audio.view',
  'audio.create',
  'audio.edit',
  'audio.publish',
  'audio.archive',
  'video.view',
  'video.create',
  'video.edit',
  'video.publish',
  'video.archive',
  'pdf.view',
  'pdf.create',
  'pdf.edit',
  'pdf.publish',
  'media.view',
  'media.scan',
  'media.health',
  'media.upload',
  'analytics.view',
  'users.view',
  'users.manage',
  'admins.view',
  'admins.manage',
  'security.view',
  'audit.view',
  'notifications.view',
  'reports.view',
  'system.view',
  'account.view'
]

/** Super Admin — everything, including Storage sync. */
const SUPER_ADMIN_PERMS: Permission[] = [...ALL_PERMISSIONS]

/** Content Admin — same as Super Admin except Storage sync. */
const CONTENT_PERMS: Permission[] = ALL_PERMISSIONS.filter(p => p !== 'media.scan')

/** Media Admin — upload/edit content + analytics. No staff, no Storage sync. */
const MEDIA_PERMS: Permission[] = [
  'dashboard.view',
  'kitabs.view',
  'kitabs.create',
  'kitabs.edit',
  'kitabs.publish',
  'kitabs.archive',
  'ders.view',
  'ders.create',
  'ders.edit',
  'ders.reorder',
  'ders.publish',
  'audio.view',
  'audio.create',
  'audio.edit',
  'audio.publish',
  'audio.archive',
  'video.view',
  'video.create',
  'video.edit',
  'video.publish',
  'video.archive',
  'pdf.view',
  'pdf.create',
  'pdf.edit',
  'pdf.publish',
  'media.view',
  'media.upload',
  'media.health',
  'analytics.view',
  'account.view'
]

const ANALYTICS_PERMS: Permission[] = [
  'dashboard.view',
  'analytics.view',
  'reports.view',
  'account.view'
]

const MODERATOR_PERMS: Permission[] = [
  'dashboard.view',
  'kitabs.view',
  'ders.view',
  'audio.view',
  'video.view',
  'pdf.view',
  'media.view',
  'users.view',
  'account.view'
]

const READ_ONLY_PERMS: Permission[] = [
  'dashboard.view',
  'kitabs.view',
  'ders.view',
  'audio.view',
  'video.view',
  'pdf.view',
  'media.view',
  'analytics.view',
  'reports.view',
  'account.view',
  'audit.view'
]

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  super_admin: SUPER_ADMIN_PERMS,
  content_admin: CONTENT_PERMS,
  media_admin: MEDIA_PERMS,
  analytics_admin: ANALYTICS_PERMS,
  moderator: MODERATOR_PERMS,
  read_only: READ_ONLY_PERMS
}

export const STAFF_ROLE_META: Record<
  StaffRole,
  { label: string; summary: string; surfaces: string[] }
> = {
  super_admin: {
    label: 'Super Admin',
    summary: 'Full power: staff, content, media, analytics, system, and Storage sync.',
    surfaces: ['Staff', 'Content', 'Media', 'Analytics', 'Storage sync', 'System']
  },
  content_admin: {
    label: 'Content Admin',
    summary: 'Same as Super Admin except Storage sync (cannot run R2 storage sync).',
    surfaces: ['Staff', 'Content', 'Media', 'Analytics', 'System']
  },
  media_admin: {
    label: 'Media Admin',
    summary: 'Upload/edit kitabs & media, and view analytics. Cannot add staff or use Storage sync.',
    surfaces: ['Kitabs', 'Media uploads', 'Analytics']
  },
  analytics_admin: {
    label: 'Analytics Admin',
    summary: 'View analytics and reports only.',
    surfaces: ['Analytics']
  },
  moderator: {
    label: 'Moderator',
    summary: 'Review content and users; no publish or staff management.',
    surfaces: ['Admin review']
  },
  read_only: {
    label: 'Read Only',
    summary: 'View dashboards and content; cannot edit or publish.',
    surfaces: ['Admin (view)']
  }
}

export const STAFF_ROLES: StaffRole[] = [
  'super_admin',
  'content_admin',
  'media_admin',
  'analytics_admin',
  'moderator',
  'read_only'
]

export const STAFF_STATUSES: StaffStatus[] = ['active', 'pending', 'disabled', 'suspended']

export function permissionsForRole(role: StaffRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

export function hasPermission(role: StaffRole, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission)
}

export function hasAnyPermission(role: StaffRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

export const NAV_PERMISSION_MAP: Array<{ match: RegExp; permissions: Permission[] }> = [
  { match: /^\/dashboard/, permissions: ['dashboard.view'] },
  { match: /^\/content\/kitabs/, permissions: ['kitabs.view'] },
  { match: /^\/content\/ders/, permissions: ['ders.view'] },
  { match: /^\/content\/audio/, permissions: ['audio.view'] },
  { match: /^\/content\/video/, permissions: ['video.view'] },
  { match: /^\/content\/pdfs/, permissions: ['pdf.view'] },
  { match: /^\/content\/muhadara/, permissions: ['audio.view'] },
  { match: /^\/content\//, permissions: ['kitabs.view', 'audio.view', 'video.view'] },
  { match: /^\/media\/cloudflare/, permissions: ['media.scan'] },
  { match: /^\/media\/health/, permissions: ['media.health'] },
  { match: /^\/media\/uploads/, permissions: ['media.upload'] },
  { match: /^\/media\//, permissions: ['media.view'] },
  { match: /^\/users\//, permissions: ['users.view'] },
  { match: /^\/analytics\//, permissions: ['analytics.view'] },
  { match: /^\/notifications/, permissions: ['notifications.view'] },
  { match: /^\/reports/, permissions: ['reports.view'] },
  { match: /^\/security\/admins/, permissions: ['admins.view'] },
  { match: /^\/security\/roles/, permissions: ['admins.manage'] },
  { match: /^\/security\/audit/, permissions: ['audit.view'] },
  { match: /^\/security\//, permissions: ['security.view'] },
  { match: /^\/system\//, permissions: ['system.view'] },
  { match: /^\/account/, permissions: ['account.view'] }
]

export function canAccessPath(role: StaffRole, path: string): boolean {
  const entry = NAV_PERMISSION_MAP.find(e => e.match.test(path))
  if (!entry) return hasPermission(role, 'dashboard.view')
  return hasAnyPermission(role, entry.permissions)
}

export type StaffProfile = {
  id: string
  user_id: string
  display_name: string | null
  email: string
  role: StaffRole
  status: StaffStatus
  must_change_password: boolean
  last_login_at: string | null
  last_activity_at: string | null
  created_at: string
  updated_at: string
}
