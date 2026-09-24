export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).replace(/\/+$/, '')
}

/** Publishable / anon key only — safe for browser when prefixed NEXT_PUBLIC_. */
export function getSupabasePublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  )
}

export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ''
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey())
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey())
}

export function getAppOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    'http://localhost:3001'
  ).replace(/\/+$/, '')
}

export function getPasswordResetRedirectUrl(): string {
  return `${getAppOrigin()}/pages/auth/reset-password`
}
