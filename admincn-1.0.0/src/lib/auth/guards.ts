import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

import {
  hasPermission,
  type Permission,
  type StaffProfile,
  type StaffRole
} from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/supabase/env'

export type AuthContext = {
  user: User
  profile: StaffProfile
  role: StaffRole
  emailVerified: boolean
}

export type AuthFailure = {
  status: 401 | 403
  code:
    | 'unauthenticated'
    | 'unverified'
    | 'no_profile'
    | 'disabled'
    | 'forbidden'
    | 'must_change_password'
  message: string
}

export async function resolveStaffAuth(): Promise<
  { ok: true; ctx: AuthContext } | { ok: false; error: AuthFailure }
> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        ok: false,
        error: {
          status: 401,
          code: 'unauthenticated',
          message: 'Authentication required.'
        }
      }
    }

    const emailVerified = Boolean(user.email_confirmed_at)
    if (!emailVerified) {
      return {
        ok: false,
        error: {
          status: 403,
          code: 'unverified',
          message: 'Please verify your email before continuing.'
        }
      }
    }

    let profile: StaffProfile | null = null

    const { data: row } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (row) {
      profile = row as StaffProfile
    } else if (isSupabaseAdminConfigured()) {
      // Service role fallback when RLS blocks (e.g. pending profile not visible)
      const admin = createServiceClient()
      const { data: adminRow } = await admin
        .from('staff_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (adminRow) profile = adminRow as StaffProfile
    }

    if (!profile) {
      return {
        ok: false,
        error: {
          status: 403,
          code: 'no_profile',
          message: 'Access denied. Your account is not authorized for Admin.'
        }
      }
    }

    if (profile.status === 'disabled' || profile.status === 'suspended') {
      return {
        ok: false,
        error: {
          status: 403,
          code: 'disabled',
          message: 'This Admin account is disabled. Contact a Super Admin.'
        }
      }
    }

    if (profile.status === 'pending') {
      return {
        ok: false,
        error: {
          status: 403,
          code: 'disabled',
          message: 'This Admin account is pending approval.'
        }
      }
    }

    return {
      ok: true,
      ctx: {
        user,
        profile,
        role: profile.role,
        emailVerified
      }
    }
  } catch {
    return {
      ok: false,
      error: {
        status: 401,
        code: 'unauthenticated',
        message: 'Authentication required.'
      }
    }
  }
}

export async function requireApiPermission(
  permission: Permission | Permission[]
): Promise<{ ctx: AuthContext } | { response: NextResponse }> {
  const result = await resolveStaffAuth()
  if (!result.ok) {
    return {
      response: NextResponse.json(
        { ok: false, error: result.error.message, code: result.error.code },
        { status: result.error.status }
      )
    }
  }

  const needed = Array.isArray(permission) ? permission : [permission]
  const allowed = needed.some(p => hasPermission(result.ctx.role, p))
  if (!allowed) {
    return {
      response: NextResponse.json(
        { ok: false, error: 'Forbidden.', code: 'forbidden' },
        { status: 403 }
      )
    }
  }

  return { ctx: result.ctx }
}

export async function writeAuditLog(input: {
  userId?: string | null
  adminEmail?: string | null
  action: string
  entityType: string
  entityId?: string | null
  before?: unknown
  after?: unknown
  result?: string
}) {
  try {
    if (!isSupabaseAdminConfigured()) return
    const admin = createServiceClient()
    await admin.from('audit_logs').insert({
      user_id: input.userId || null,
      admin_id: input.userId || null,
      admin_email: input.adminEmail || null,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId || null,
      before_data: input.before ?? null,
      after_data: input.after ?? null,
      result: input.result || 'ok'
    })
  } catch {
    // never block request on audit failure
  }
}
