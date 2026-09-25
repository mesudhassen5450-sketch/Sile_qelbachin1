import type { User } from '@supabase/supabase-js'

import type { StaffProfile } from '@/lib/auth/permissions'
import { createServiceClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/supabase/env'

/** Default owner email — always Super Admin when present in env or fallback. */
export function defaultSuperAdminEmail(): string {
  return (process.env.SUPER_ADMIN_EMAIL || 'mesudhassen5450@gmail.com').trim().toLowerCase()
}

/**
 * If the signed-in user is the configured default Super Admin email,
 * force staff_profiles.role = super_admin (active). Idempotent.
 */
export async function ensureDefaultSuperAdmin(
  user: User,
  profile: StaffProfile | null
): Promise<StaffProfile | null> {
  const email = (user.email || '').trim().toLowerCase()
  if (!email || email !== defaultSuperAdminEmail()) return profile
  if (!isSupabaseAdminConfigured()) return profile

  const already =
    profile &&
    profile.role === 'super_admin' &&
    profile.status === 'active' &&
    !profile.must_change_password

  if (already) return profile

  const admin = createServiceClient()
  const now = new Date().toISOString()

  if (profile) {
    const { data, error } = await admin
      .from('staff_profiles')
      .update({
        email,
        display_name: profile.display_name || 'Super Admin',
        role: 'super_admin',
        status: 'active',
        must_change_password: false,
        updated_at: now
      })
      .eq('user_id', user.id)
      .select('*')
      .maybeSingle()
    if (error || !data) return profile
    return data as StaffProfile
  }

  const { data, error } = await admin
    .from('staff_profiles')
    .insert({
      user_id: user.id,
      email,
      display_name: 'Super Admin',
      role: 'super_admin',
      status: 'active',
      must_change_password: false
    })
    .select('*')
    .maybeSingle()

  if (error || !data) return profile
  return data as StaffProfile
}
