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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

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

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (isPublicPath(pathname)) {
    if (user && pathname === '/pages/auth/login') {
      const dest = request.nextUrl.clone()
      dest.pathname = '/dashboard'
      return NextResponse.redirect(dest)
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
