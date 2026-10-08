import { NextResponse } from 'next/server'
import { safePublicNextPath } from '@/lib/auth/redirect'
import { createClient } from '@/lib/supabase/server'
import { getSiteOrigin } from '@/lib/supabase/env'

/**
 * OAuth / Magic Link / PKCE callback.
 * Google OAuth and email confirm both land here with `?code=…`.
 * Success → exchange code for session cookies → redirect to `next`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Preserve full relative path + query (Ask draft embeds `d=` for OAuth host hops).
  const next = safePublicNextPath(searchParams.get('next'), '/')
  const siteOrigin = getSiteOrigin()

  const errorDescription =
    searchParams.get('error_description') ||
    searchParams.get('error') ||
    searchParams.get('error_code') ||
    ''

  if (errorDescription) {
    const lower = errorDescription.toLowerCase()
    const login = new URL('/login', origin)
    login.searchParams.set('next', next)
    if (lower.includes('access_denied') || lower.includes('oauth')) {
      login.searchParams.set('error', 'oauth_failed')
    } else if (
      lower.includes('expired') ||
      lower.includes('otp') ||
      lower.includes('invalid')
    ) {
      login.searchParams.set('error', 'otp_expired')
    } else {
      login.searchParams.set('error', 'link_invalid')
    }
    return NextResponse.redirect(login)
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        // Stay on the host that received the callback (localhost / 127.0.0.1 / production).
        // Do NOT force NEXT_PUBLIC_SITE_URL here — that sent local logins to the wrong site.
        let base = origin.replace(/\/+$/, '')
        if (/onrender\.com|:3001\b|admin\./i.test(base)) {
          base = (siteOrigin || 'http://localhost:3000').replace(/\/+$/, '')
        }
        return NextResponse.redirect(`${base}${next}`)
      }
      const login = new URL('/login', origin)
      const msg = (error.message || '').toLowerCase()
      login.searchParams.set(
        'error',
        msg.includes('expired') || msg.includes('otp') || msg.includes('invalid')
          ? 'otp_expired'
          : 'oauth_failed'
      )
      login.searchParams.set('next', next)
      return NextResponse.redirect(login)
    } catch {
      // fall through
    }
  }

  const login = new URL('/login', origin)
  login.searchParams.set('error', 'oauth_failed')
  login.searchParams.set('next', next)
  return NextResponse.redirect(login)
}
