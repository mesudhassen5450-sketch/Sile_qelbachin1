import { NextResponse } from 'next/server'

import { resolveStaffAuth, writeAuditLog } from '@/lib/auth/guards'
import { permissionsForRole } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/supabase/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await resolveStaffAuth()
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error.message, code: result.error.code },
      { status: result.error.status }
    )
  }

  const { ctx } = result

  // Touch last activity
  try {
    if (isSupabaseAdminConfigured()) {
      const admin = createServiceClient()
      await admin
        .from('staff_profiles')
        .update({
          last_activity_at: new Date().toISOString(),
          last_login_at: ctx.profile.last_login_at || new Date().toISOString()
        })
        .eq('user_id', ctx.user.id)
    } else {
      const supabase = await createClient()
      await supabase
        .from('staff_profiles')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('user_id', ctx.user.id)
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: ctx.user.id,
      email: ctx.user.email,
      email_verified: ctx.emailVerified
    },
    profile: ctx.profile,
    permissions: permissionsForRole(ctx.role)
  })
}

export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()
  await supabase.auth.signOut()
  if (user) {
    await writeAuditLog({
      userId: user.id,
      adminEmail: user.email,
      action: 'logout',
      entityType: 'auth',
      entityId: user.id
    })
  }
  return NextResponse.json({ ok: true })
}
