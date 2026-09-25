import { randomBytes } from 'crypto'

import { NextResponse } from 'next/server'

import { requireApiPermission, writeAuditLog } from '@/lib/auth/guards'
import { isValidEmail, validatePasswordStrength } from '@/lib/auth/password'
import { STAFF_ROLES, type StaffRole, type StaffStatus } from '@/lib/auth/permissions'
import { createServiceClient } from '@/lib/supabase/admin'
import { isSupabaseAdminConfigured } from '@/lib/supabase/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function generateTempPassword(): string {
  // Strong temp password: upper + lower + digit + special, length >= 14
  const base = randomBytes(12).toString('base64url')
  return `Tmp!${base}9a`
}

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
  const status = ((body.status as StaffStatus) || 'active') as StaffStatus
  let tempPassword = String(body.temporary_password || '')
  const autoPassword = !tempPassword

  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: 'Valid email required.' }, { status: 400 })
  }

  if (autoPassword) {
    tempPassword = generateTempPassword()
  }

  const strength = validatePasswordStrength(tempPassword)
  if (!strength.ok) {
    return NextResponse.json({ ok: false, error: strength.message }, { status: 400 })
  }

  if (!STAFF_ROLES.includes(role)) {
    return NextResponse.json({ ok: false, error: 'Invalid role.' }, { status: 400 })
  }

  const allowedStatus: StaffStatus[] = ['active', 'pending', 'disabled', 'suspended']
  if (!allowedStatus.includes(status)) {
    return NextResponse.json({ ok: false, error: 'Invalid status.' }, { status: 400 })
  }

  // Only super_admin can create another super_admin
  if (role === 'super_admin' && gate.ctx.role !== 'super_admin') {
    return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 })
  }

  const admin = createServiceClient()

  // Block duplicate staff emails
  const { data: existingProfile } = await admin
    .from('staff_profiles')
    .select('user_id')
    .eq('email', email)
    .maybeSingle()
  if (existingProfile) {
    return NextResponse.json({ ok: false, error: 'A staff profile with this email already exists.' }, { status: 400 })
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    // Confirmed so they can sign in immediately; must_change_password forces rotation.
    email_confirm: true,
    user_metadata: { display_name: displayName }
  })

  if (createError || !created.user) {
    return NextResponse.json(
      {
        ok: false,
        error: createError?.message?.includes('already')
          ? 'Unable to create Auth user. The email may already exist in Auth.'
          : 'Unable to create Auth user. The email may already exist.'
      },
      { status: 400 }
    )
  }

  const { error: profileError } = await admin.from('staff_profiles').insert({
    user_id: created.user.id,
    email,
    display_name: displayName,
    role,
    status,
    must_change_password: true,
    created_by: gate.ctx.user.id
  })

  if (profileError) {
    // Best-effort cleanup so we don't leave orphan Auth users
    await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined)
    return NextResponse.json({ ok: false, error: 'Auth user created but profile failed.' }, { status: 500 })
  }

  await writeAuditLog({
    userId: gate.ctx.user.id,
    adminEmail: gate.ctx.user.email,
    action: 'admin_created',
    entityType: 'staff_profiles',
    entityId: created.user.id,
    after: { email, role, status }
  })

  return NextResponse.json({
    ok: true,
    user_id: created.user.id,
    temporary_password: tempPassword,
    password_auto_generated: autoPassword,
    message:
      'Staff created and can sign in. Share the temporary password securely — they must change it on first login. Published content they manage appears on the website and mobile apps via the public API.'
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
    return NextResponse.json({ ok: false, error: 'You cannot change your own role.' }, { status: 403 })
  }

  // Cannot disable yourself
  if (userId === gate.ctx.user.id && body.status && body.status !== 'active') {
    return NextResponse.json({ ok: false, error: 'You cannot disable your own account.' }, { status: 403 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.role) {
    if (!STAFF_ROLES.includes(body.role as StaffRole)) {
      return NextResponse.json({ ok: false, error: 'Invalid role.' }, { status: 400 })
    }
    if (body.role === 'super_admin' && gate.ctx.role !== 'super_admin') {
      return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 })
    }
    patch.role = body.role
  }
  if (body.status) {
    const allowedStatus: StaffStatus[] = ['active', 'pending', 'disabled', 'suspended']
    if (!allowedStatus.includes(body.status as StaffStatus)) {
      return NextResponse.json({ ok: false, error: 'Invalid status.' }, { status: 400 })
    }
    patch.status = body.status
  }
  if (typeof body.display_name === 'string') patch.display_name = body.display_name.trim()

  const admin = createServiceClient()
  const { data: before } = await admin.from('staff_profiles').select('*').eq('user_id', userId).maybeSingle()
  if (!before) {
    return NextResponse.json({ ok: false, error: 'Staff profile not found.' }, { status: 404 })
  }

  const { error } = await admin.from('staff_profiles').update(patch).eq('user_id', userId)
  if (error) {
    return NextResponse.json({ ok: false, error: 'Update failed.' }, { status: 500 })
  }

  // Optional: reset temporary password
  let newTempPassword: string | undefined
  if (body.reset_temporary_password === true) {
    newTempPassword = generateTempPassword()
    const { error: pwError } = await admin.auth.admin.updateUserById(userId, {
      password: newTempPassword,
      email_confirm: true
    })
    if (pwError) {
      return NextResponse.json({ ok: false, error: 'Profile updated but password reset failed.' }, { status: 500 })
    }
    await admin
      .from('staff_profiles')
      .update({ must_change_password: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
  }

  await writeAuditLog({
    userId: gate.ctx.user.id,
    adminEmail: gate.ctx.user.email,
    action: 'admin_updated',
    entityType: 'staff_profiles',
    entityId: userId,
    before,
    after: { ...patch, password_reset: Boolean(newTempPassword) }
  })

  return NextResponse.json({
    ok: true,
    temporary_password: newTempPassword,
    message: newTempPassword
      ? 'Staff updated. Share the new temporary password securely.'
      : 'Staff updated.'
  })
}

export async function DELETE(request: Request) {
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

  if (userId === gate.ctx.user.id) {
    return NextResponse.json({ ok: false, error: 'You cannot delete your own account.' }, { status: 403 })
  }

  const admin = createServiceClient()
  const { data: before } = await admin.from('staff_profiles').select('*').eq('user_id', userId).maybeSingle()
  if (!before) {
    return NextResponse.json({ ok: false, error: 'Staff profile not found.' }, { status: 404 })
  }

  if (before.role === 'super_admin' && gate.ctx.role !== 'super_admin') {
    return NextResponse.json({ ok: false, error: 'Forbidden.' }, { status: 403 })
  }

  const { error: profileError } = await admin.from('staff_profiles').delete().eq('user_id', userId)
  if (profileError) {
    return NextResponse.json({ ok: false, error: 'Unable to delete staff profile.' }, { status: 500 })
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId)
  if (authError) {
    return NextResponse.json(
      { ok: false, error: 'Profile deleted but Auth user removal failed. Remove them in Supabase Auth manually.' },
      { status: 500 }
    )
  }

  await writeAuditLog({
    userId: gate.ctx.user.id,
    adminEmail: gate.ctx.user.email,
    action: 'admin_deleted',
    entityType: 'staff_profiles',
    entityId: userId,
    before
  })

  return NextResponse.json({ ok: true, message: 'Staff removed from Admin and Auth.' })
}
