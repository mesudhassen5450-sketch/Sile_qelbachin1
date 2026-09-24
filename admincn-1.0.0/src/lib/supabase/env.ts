export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  ).replace(/\/+$/, '')
}

function looksLikeJwtOrPublishableKey(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  // Reject accidental paste of project URL into a key field
  if (/^https?:\/\//i.test(v)) return false
  if (v.includes('supabase.co')) return false
  return v.startsWith('eyJ') || v.startsWith('sb_publishable_') || v.startsWith('sb_secret_')
}

/** Publishable / anon key only — safe for browser when prefixed NEXT_PUBLIC_. */
export function getSupabasePublishableKey(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.SUPABASE_ANON_KEY
  ]
  for (const c of candidates) {
    if (c && looksLikeJwtOrPublishableKey(c)) return c.trim()
  }
  return ''
}

export function getSupabaseServiceRoleKey(): string {
  const candidates = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY
  ]
  for (const c of candidates) {
    if (!c) continue
    const v = c.trim()
    // Must not be the anon JWT (payload role=anon) pasted by mistake into service role
    if (!looksLikeJwtOrPublishableKey(v)) continue
    if (v.startsWith('sb_secret_')) return v
    if (v.startsWith('eyJ')) {
      try {
        const payload = JSON.parse(Buffer.from(v.split('.')[1], 'base64url').toString('utf8')) as {
          role?: string
        }
        if (payload.role === 'anon') continue
        if (payload.role === 'service_role') return v
        // Unknown JWT role — allow only if explicitly named SERVICE_ROLE env
        if (c === process.env.SUPABASE_SERVICE_ROLE_KEY) return v
      } catch {
        continue
      }
    }
  }
  return ''
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

