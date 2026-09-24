/**
 * Bootstrap initial Super Admin (server-side only).
 *
 * Required env (never commit real values):
 *   SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SUPER_ADMIN_EMAIL=mesudhassen5450@gmail.com
 *   SUPER_ADMIN_BOOTSTRAP_PASSWORD=<temporary strong password>
 *
 * Usage:
 *   npx tsx scripts/bootstrap-super-admin.ts
 *
 * Does not print the password. Does not write passwords to the CMS database.
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

async function main() {
  const email = (process.env.SUPER_ADMIN_EMAIL || 'mesudhassen5450@gmail.com').trim().toLowerCase()
  const password = process.env.SUPER_ADMIN_BOOTSTRAP_PASSWORD || ''
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!url || !serviceKey) {
    console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
    process.exit(1)
  }
  if (!password || password.length < 10) {
    console.error('Set SUPER_ADMIN_BOOTSTRAP_PASSWORD to a strong temporary password (min 10 chars).')
    process.exit(1)
  }

  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  console.log(`Bootstrapping Super Admin for ${email}…`)

  // Find existing user by email
  const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  let user = listed?.users?.find(u => u.email?.toLowerCase() === email)

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // bootstrap only — future admins must verify via email
      user_metadata: { display_name: 'Super Admin' }
    })
    if (error || !data.user) {
      console.error('Failed to create Auth user:', error?.message)
      process.exit(1)
    }
    user = data.user
    console.log('Created Auth user:', user.id)
  } else {
    console.log('Auth user already exists:', user.id)
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true
    })
    if (error) {
      console.error('Failed to update Auth user password:', error.message)
      process.exit(1)
    }
    console.log('Updated temporary bootstrap password for existing user.')
  }

  const { data: existingProfile } = await admin
    .from('staff_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingProfile) {
    const { error } = await admin
      .from('staff_profiles')
      .update({
        email,
        display_name: 'Super Admin',
        role: 'super_admin',
        status: 'active',
        must_change_password: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
    if (error) {
      console.error('Failed to update staff_profiles:', error.message)
      process.exit(1)
    }
    console.log('Updated staff_profiles → super_admin (must_change_password=true).')
  } else {
    const { error } = await admin.from('staff_profiles').insert({
      user_id: user.id,
      email,
      display_name: 'Super Admin',
      role: 'super_admin',
      status: 'active',
      must_change_password: true
    })
    if (error) {
      console.error('Failed to insert staff_profiles:', error.message)
      process.exit(1)
    }
    console.log('Inserted staff_profiles → super_admin (must_change_password=true).')
  }

  console.log('Done. Sign in with the bootstrap email, then change the password immediately.')
  console.log('(Password was not printed.)')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
