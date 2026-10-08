import { safePublicNextPath } from '@/lib/auth/redirect'
import { getSiteOrigin } from '@/lib/supabase/env'

/** Safe relative path for post-login redirect. */
export function safeNextPath(next: string | null | undefined, fallback = '/'): string {
  return safePublicNextPath(next, fallback)
}

/** Supabase OAuth callback URL (must be allowlisted in Supabase Dashboard). */
export function getGoogleOAuthRedirectTo(next?: string | null): string {
  const path = safeNextPath(next)
  // Prefer the browser’s real origin so local login stays on this machine.
  // Never Admin (onrender / :3001).
  let origin =
    (typeof window !== 'undefined' && window.location?.origin) || getSiteOrigin()
  origin = origin.replace(/\/+$/, '')
  if (
    /onrender\.com/i.test(origin) ||
    /:3001\b/.test(origin) ||
    /admin\./i.test(origin)
  ) {
    origin = getSiteOrigin().replace(/\/+$/, '') || 'http://localhost:3000'
  }
  // Keep the exact browser host (localhost vs 127.0.0.1). Rewriting hosts
  // drops sessionStorage drafts and looks like a “wrong page” after Google.
  // Both callback URLs must stay in the Supabase Redirect allowlist.
  return `${origin}/auth/callback?next=${encodeURIComponent(path)}`
}

/**
 * Starts real Google OAuth via Supabase Auth (PKCE).
 * Browser navigates to Google; returns after /auth/callback exchanges the code.
 */
export async function signInWithGoogle(next?: string | null): Promise<{ error: string | null }> {
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()
  const redirectTo = getGoogleOAuthRedirectTo(next)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    const msg = (error.message || '').toLowerCase()
    if (msg.includes('provider is not enabled') || msg.includes('unsupported provider')) {
      return { error: 'Google sign-in is not enabled yet. Please try email sign-in.' }
    }
    return { error: 'Could not start Google sign-in. Please try again.' }
  }

  if (data?.url) {
    window.location.assign(data.url)
    return { error: null }
  }

  return { error: 'Could not start Google sign-in. Please try again.' }
}

export function googleDisplayName(user: {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
  identities?: Array<{ identity_data?: Record<string, unknown> | null }> | null
}): string {
  const meta = user.user_metadata || {}
  const idMeta = user.identities?.find(i => i.identity_data)?.identity_data || {}
  const name =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    (typeof meta.display_name === 'string' && meta.display_name) ||
    (typeof idMeta.full_name === 'string' && idMeta.full_name) ||
    (typeof idMeta.name === 'string' && idMeta.name) ||
    ''
  return name.trim()
}

export function googleAvatarUrl(user: {
  user_metadata?: Record<string, unknown> | null
  identities?: Array<{ identity_data?: Record<string, unknown> | null }> | null
}): string | null {
  const meta = user.user_metadata || {}
  const idMeta = user.identities?.find(i => i.identity_data)?.identity_data || {}
  const candidates = [
    meta.avatar_url,
    meta.picture,
    idMeta.avatar_url,
    idMeta.picture,
  ]
  for (const c of candidates) {
    if (typeof c === 'string' && /^https?:\/\//i.test(c.trim())) return c.trim()
  }
  return null
}
