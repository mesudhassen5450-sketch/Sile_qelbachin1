import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env'

const PUBLIC_PATHS = [
  '/pages/auth/login',
  '/pages/auth/forgot-password',
  '/pages/auth/reset-password',
  '/pages/auth/verify-email',
  '/pages/auth/two-steps'
]

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))) return true
  if (pathname.startsWith('/api/public/')) return true
  if (pathname.startsWith('/_next/')) return true
  if (pathname.startsWith('/images/') || pathname === '/favicon.ico') return true
  return false
}

function publicWebsiteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.PUBLIC_WEBSITE_URL ||
    'http://localhost:3000'
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    return new URL(withProtocol).origin
  } catch {
    return 'http://localhost:3000'
  }
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(c => {
    const n = c.name.toLowerCase()
    return n.includes('sb-') && (n.includes('auth-token') || n.includes('access-token'))
  })
}

async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<null>(resolve => {
        timer = setTimeout(() => resolve(null), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

  // Public Google OAuth must never finish on Admin — send to website callback.
  const oauthCode = request.nextUrl.searchParams.get('code')
  if (oauthCode && pathname.startsWith('/pages/auth/')) {
    const dest = new URL(`${publicWebsiteOrigin()}/auth/callback`)
    dest.searchParams.set('code', oauthCode)
    const next = request.nextUrl.searchParams.get('next') || '/'
    dest.searchParams.set('next', next.startsWith('/') ? next : '/')
    return NextResponse.redirect(dest)
  }

  // Fast path: public pages with no session cookies — do not block on Supabase.
  if (isPublicPath(pathname) && !hasSupabaseAuthCookie(request)) {
    return supabaseResponse
  }

  const url = getSupabaseUrl()
  const key = getSupabasePublishableKey()

  // If Auth is not configured, send UI to login with a clear setup message.
  // There is no local password / unauthenticated Admin bypass.
  if (!url || !key) {
    if (isPublicPath(pathname)) {
      return supabaseResponse
    }
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Supabase Auth is not configured.',
          code: 'auth_not_configured'
        },
        { status: 503 }
      )
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/pages/auth/login'
    loginUrl.searchParams.set('error', 'auth_not_configured')
    return NextResponse.redirect(loginUrl)
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      }
    }
  })

  const userResult = await withTimeout(supabase.auth.getUser(), 4000)
  const user = userResult?.data?.user ?? null

  if (isPublicPath(pathname)) {
    if (user && pathname === '/pages/auth/login') {
      const staffResult = await withTimeout(
        supabase.from('staff_profiles').select('id, status').eq('user_id', user.id).maybeSingle(),
        4000
      )
      const staff = staffResult?.data
      const isActiveStaff = staff?.status === 'active'
      if (isActiveStaff) {
        const dest = request.nextUrl.clone()
        dest.pathname = '/dashboard'
        return NextResponse.redirect(dest)
      }
      // Signed-in visitor (Google) — not staff: return to public site home.
      await withTimeout(supabase.auth.signOut(), 3000)
      return NextResponse.redirect(`${publicWebsiteOrigin()}/`)
    }
    return supabaseResponse
  }

  if (pathname.startsWith('/api/public/')) {
    return supabaseResponse
  }

  // Allow auth session endpoints to return their own 401 JSON
  if (pathname.startsWith('/api/auth/')) {
    return supabaseResponse
  }

  if (pathname.startsWith('/api/admin/')) {
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required.', code: 'unauthenticated' },
        { status: 401 }
      )
    }
    return supabaseResponse
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/pages/auth/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (!user.email_confirmed_at) {
    const verifyUrl = request.nextUrl.clone()
    verifyUrl.pathname = '/pages/auth/verify-email'
    return NextResponse.redirect(verifyUrl)
  }

  return supabaseResponse
}
