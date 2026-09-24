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

function normalizeOrigin(raw: string | undefined | null, fallback: string): string {
  const value = (raw || '').trim()
  if (!value) return fallback

  // Accept bare host or full URL; reject garbage like "localhost3001/pages/..."
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
    const url = new URL(withProtocol)
    if (!url.hostname || url.hostname.includes('/')) return fallback
    // Disallow path-only mistakes (app URL must be origin only)
    return `${url.protocol}//${url.host}`.replace(/\/+$/, '')
  } catch {
    return fallback
  }
}

export function getAppOrigin(): string {
  const fallback = 'http://localhost:3001'
  // Prefer explicit app URL, then Render's auto URL, then localhost
  return normalizeOrigin(
    process.env.NEXT_PUBLIC_APP_URL || process.env.RENDER_EXTERNAL_URL,
    fallback
  )
}

export function getPasswordResetRedirectUrl(): string {
  return `${getAppOrigin()}/pages/auth/reset-password`
}

export function getMetadataBaseUrl(): URL {
  return new URL(getAppOrigin())
}

