/** Website Supabase env — publishable/anon key only (never service role). */

export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).replace(/\/+$/, '')
}

function looksLikeClientKey(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  if (/^https?:\/\//i.test(v)) return false
  if (v.includes('supabase.co')) return false
  return v.startsWith('eyJ') || v.startsWith('sb_publishable_')
}

export function getSupabasePublishableKey(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ]
  for (const c of candidates) {
    if (c && looksLikeClientKey(c)) return c.trim()
  }
  return ''
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublishableKey())
}

export function getSiteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '') ||
    'http://localhost:3000'
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    const url = new URL(withProtocol)
    return `${url.protocol}//${url.host}`.replace(/\/+$/, '')
  } catch {
    return 'http://localhost:3000'
  }
}

/** Email confirmation redirect after register. */
export function getEmailConfirmRedirectUrl(): string {
  return `${getSiteOrigin()}/auth/callback?next=/account`
}

/** Password recovery redirect. */
export function getPasswordResetRedirectUrl(): string {
  return `${getSiteOrigin()}/auth/callback?next=/reset-password`
}

/** Google OAuth redirect (PKCE). Must match Supabase Auth redirect allowlist. */
export function getGoogleOAuthRedirectUrl(next = '/'): string {
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/'
  return `${getSiteOrigin()}/auth/callback?next=${encodeURIComponent(safe)}`
}
