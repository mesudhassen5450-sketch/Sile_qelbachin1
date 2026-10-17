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

/** Auth users live in auth.users — separate from staff_profiles. Find by email. */
async function findAuthUserByEmail(
  admin: ReturnType<typeof createServiceClient>,
  email: string
): Promise<{ id: string; email?: string } | null> {
  const target = email.trim().toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) return null
    const users = data?.users || []
    const hit = users.find(u => String(u.email || '').trim().toLowerCase() === target)
    if (hit?.id) return { id: hit.id, email: hit.email || undefined }
    if (users.length < 200) break
  }
  return null
}

function isAlreadyRegisteredAuthError(message?: string | null): boolean {
  return /already|exists|registered|duplicate/i.test(String(message || ''))
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

  // Block duplicate staff emails (Admins list / staff_profiles only)
  const { data: existingProfile } = await admin
    .from('staff_profiles')
    .select('user_id')
    .eq('email', email)
    .maybeSingle()
  if (existingProfile) {
    return NextResponse.json(
      { ok: false, error: 'A staff profile with this email already exists.' },
      { status: 400 }
    )
  }

  // Create Auth user — or reuse one that already exists (e.g. website Google sign-in)
  // without a staff_profiles row. That is why the UI said “exists” while Admins was empty.
  let userId: string | null = null
  let linkedExistingAuth = false

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    // Confirmed so they can sign in immediately; must_change_password forces rotation.
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })

  if (created?.user?.id) {
    userId = created.user.id
  } else if (isAlreadyRegisteredAuthError(createError?.message)) {
    const existingAuth = await findAuthUserByEmail(admin, email)
    if (!existingAuth) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'This email is already in Supabase Auth, but the user could not be found. Open Authentication → Users in Supabase and remove or invite them, then try again.',
        },
        { status: 400 }
      )
    }
    // Already a staff row for this auth id? (email mismatch edge case)
    const { data: byUser } = await admin
      .from('staff_profiles')
      .select('user_id, email')
      .eq('user_id', existingAuth.id)
      .maybeSingle()
    if (byUser) {
      return NextResponse.json(
        {
          ok: false,
          error: `This Auth account is already linked as staff (${byUser.email || email}).`,
        },
        { status: 400 }
      )
    }
    const { error: updateError } = await admin.auth.admin.updateUserById(existingAuth.id, {
      password: tempPassword,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    })
    if (updateError) {
      return NextResponse.json(
        {
          ok: false,
          error: `Auth account exists but password could not be set: ${updateError.message}`,
        },
        { status: 400 }
      )
    }
    userId = existingAuth.id
    linkedExistingAuth = true
  } else {
    return NextResponse.json(
      {
        ok: false,
        error: createError?.message || 'Unable to create Auth user.',
      },
      { status: 400 }
    )
  }

  const { error: profileError } = await admin.from('staff_profiles').insert({
    user_id: userId,
    email,
    display_name: displayName,
    role,
    status,
    must_change_password: true,
    created_by: gate.ctx.user.id,
  })

  if (profileError) {
    // Only delete Auth if we just created it — never wipe a pre-existing website login
    if (!linkedExistingAuth && userId) {
      await admin.auth.admin.deleteUser(userId).catch(() => undefined)
    }
    return NextResponse.json(
      { ok: false, error: `Auth ready but staff profile failed: ${profileError.message}` },
      { status: 500 }
    )
  }

  await writeAuditLog({
    userId: gate.ctx.user.id,
    adminEmail: gate.ctx.user.email,
    action: 'admin_created',
    entityType: 'staff_profiles',
    entityId: userId,
    after: { email, role, status, linked_existing_auth: linkedExistingAuth },
  })

  return NextResponse.json({
    ok: true,
    user_id: userId,
    temporary_password: tempPassword,
    password_auto_generated: autoPassword,
    linked_existing_auth: linkedExistingAuth,
    message: linkedExistingAuth
      ? 'This email already had a website/Auth account — linked as staff. Share the temporary password securely; they must change it on first Admin login.'
      : 'Staff created and can sign in. Share the temporary password securely — they must change it on first login. Published content they manage appears on the website and mobile apps via the public API.',
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

  // Remove Auth so the same email can be added again later.
  // "User not found" is OK (already gone / orphan profile).
  const { error: authError } = await admin.auth.admin.deleteUser(userId)
  const authGone =
    !authError || /not\s*found|does not exist|user.*missing/i.test(authError.message || '')
  if (!authGone) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Staff removed from Admins, but Auth user removal failed. Delete them under Supabase → Authentication → Users, then you can add this email again.',
      },
      { status: 500 }
    )
  }

  await writeAuditLog({
    userId: gate.ctx.user.id,
    adminEmail: gate.ctx.user.email,
    action: 'admin_deleted',
    entityType: 'staff_profiles',
    entityId: userId,
    before,
  })

  return NextResponse.json({
    ok: true,
    message: 'Staff removed from Admin and Auth. You can add this email again anytime.',
  })
}
