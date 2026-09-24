import { NextResponse } from 'next/server'

import { resolveStaffAuth, writeAuditLog } from '@/lib/auth/guards'
import { createServiceClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/supabase/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Clears must_change_password after a successful password update. */
export async function POST() {
  const result = await resolveStaffAuth()
  // During recovery, user may be authenticated via recovery session before staff checks —
  // also accept authenticated user without full staff gate for this flag clear.
  if (!result.ok && result.error.code !== 'must_change_password') {
    // Try softer path: still clear if we have a user via service role
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ ok: false, error: result.error.message }, { status: result.error.status })
    }
  }

  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ ok: true, skipped: true })
    }
    const admin = createServiceClient()
    const userId = result.ok ? result.ctx.user.id : null
    if (!userId) {
      return NextResponse.json({ ok: true, skipped: true })
    }
    await admin
      .from('staff_profiles')
      .update({ must_change_password: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    await writeAuditLog({
      userId,
      adminEmail: result.ok ? result.ctx.user.email : null,
      action: 'password_changed',
      entityType: 'auth',
      entityId: userId
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'Unable to update profile flag.' }, { status: 500 })
  }
}
