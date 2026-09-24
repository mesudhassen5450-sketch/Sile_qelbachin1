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

const CONTENT_PERMS: Permission[] = [
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
  'account.view',
  'notifications.view'
]

const MEDIA_PERMS: Permission[] = [
  'dashboard.view',
  'media.view',
  'media.scan',
  'media.health',
  'media.upload',
  'audio.view',
  'video.view',
  'pdf.view',
  'kitabs.view',
  'ders.view',
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
  super_admin: ALL_PERMISSIONS,
  content_admin: CONTENT_PERMS,
  media_admin: MEDIA_PERMS,
  analytics_admin: ANALYTICS_PERMS,
  moderator: MODERATOR_PERMS,
  read_only: READ_ONLY_PERMS
}

export function permissionsForRole(role: StaffRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

export function hasPermission(role: StaffRole, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission)
}

export function hasAnyPermission(role: StaffRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

/** Map nav href prefixes to required permissions (any match grants visibility). */
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
