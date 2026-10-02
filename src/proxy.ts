import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env'

/**
 * Refresh Supabase auth cookies on protected routes so sessions stay alive
 * across page navigations (avoids false "sign in again" after a few minutes).
 */
const PROTECTED_PREFIXES = ['/ask-question', '/my-questions', '/account']

function isProtected(path: string): boolean {
  return PROTECTED_PREFIXES.some(p => path === p || path.startsWith(`${p}/`))
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Password recovery may arrive before cookies settle
  if (path.startsWith('/account/change-password')) {
    return NextResponse.next()
  }

  if (!isProtected(path)) {
    return NextResponse.next()
  }

  const url = getSupabaseUrl()
  const key = getSupabasePublishableKey()
  if (!url || !key) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', path)
    return NextResponse.redirect(login)
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // Refreshes the session if needed — critical for Google OAuth cookie chunks
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', path)
    return NextResponse.redirect(login)
  }

  return response
}

export const config = {
  matcher: [
    '/ask-question',
    '/ask-question/:path*',
    '/my-questions',
    '/my-questions/:path*',
    '/account',
    '/account/:path*',
  ],
}
