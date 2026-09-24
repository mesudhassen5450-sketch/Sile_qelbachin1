import { NextResponse } from 'next/server'

import { requireApiPermission, writeAuditLog } from '@/lib/auth/guards'
import { createServiceClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/supabase/env'
import { isValidEmail, validatePasswordStrength } from '@/lib/auth/password'
import type { StaffRole, StaffStatus } from '@/lib/auth/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const gate = await requireApiPermission(['admins.view', 'security.view'])
  if ('response' in gate) return gate.response

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: 'Service role not configured.' }, { status: 503 })
  }

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('staff_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, error: 'Unable to load admins.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, rows: data || [] })
}

export async function POST(request: Request) {
  const gate = await requireApiPermission('admins.manage')
  if ('response' in gate) return gate.response

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: 'Service role not configured.' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  const displayName = String(body.display_name || '').trim() || email
  const role = (body.role || 'read_only') as StaffRole
  const tempPassword = String(body.temporary_password || '')

  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: 'Valid email required.' }, { status: 400 })
  }

  const strength = validatePasswordStrength(tempPassword)
  if (!strength.ok) {
    return NextResponse.json({ ok: false, error: strength.message }, { status: 400 })
  }

  const allowedRoles: StaffRole[] = [
    'super_admin',
    'content_admin',
    'media_admin',
    'analytics_admin',
    'moderator',
    'read_only'
  ]
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ ok: false, error: 'Invalid role.' }, { status: 400 })
  }

  // Only super_admin can create another super_admin
  if (role === 'super_admin' && gate.ctx.role !== 'super_admin') {
    return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 })
  }

  const admin = createServiceClient()
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: false,
    user_metadata: { display_name: displayName }
  })

  if (createError || !created.user) {
    return NextResponse.json(
      { ok: false, error: 'Unable to create Auth user. The email may already exist.' },
      { status: 400 }
    )
  }

  const { error: profileError } = await admin.from('staff_profiles').insert({
    user_id: created.user.id,
    email,
    display_name: displayName,
    role,
    status: 'pending' as StaffStatus,
    must_change_password: true,
    created_by: gate.ctx.user.id
  })

  if (profileError) {
    return NextResponse.json({ ok: false, error: 'Auth user created but profile failed.' }, { status: 500 })
  }

  await writeAuditLog({
    userId: gate.ctx.user.id,
    adminEmail: gate.ctx.user.email,
    action: 'admin_created',
    entityType: 'staff_profiles',
    entityId: created.user.id,
    after: { email, role, status: 'pending' }
  })

  return NextResponse.json({
    ok: true,
    user_id: created.user.id,
    message: 'Admin created. They must verify email and change the temporary password.'
  })
}

export async function PATCH(request: Request) {
  const gate = await requireApiPermission('admins.manage')
  if ('response' in gate) return gate.response

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: 'Service role not configured.' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const userId = String(body.user_id || '')
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'user_id required.' }, { status: 400 })
  }

  // Role escalation protection: cannot change own role via this endpoint
  if (userId === gate.ctx.user.id && body.role) {
    return NextResponse.json(
      { ok: false, error: 'You cannot change your own role.' },
      { status: 403 }
    )
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.role) {
    if (body.role === 'super_admin' && gate.ctx.role !== 'super_admin') {
      return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 })
    }
    patch.role = body.role
  }
  if (body.status) patch.status = body.status
  if (typeof body.display_name === 'string') patch.display_name = body.display_name

  const admin = createServiceClient()
  const { data: before } = await admin.from('staff_profiles').select('*').eq('user_id', userId).maybeSingle()
  const { error } = await admin.from('staff_profiles').update(patch).eq('user_id', userId)
  if (error) {
    return NextResponse.json({ ok: false, error: 'Update failed.' }, { status: 500 })
  }

  await writeAuditLog({
    userId: gate.ctx.user.id,
    adminEmail: gate.ctx.user.email,
    action: 'admin_updated',
    entityType: 'staff_profiles',
    entityId: userId,
    before,
    after: patch
  })

  return NextResponse.json({ ok: true })
}
