import { NextResponse, type NextRequest } from 'next/server'

/**
 * Lightweight gate — full session validation happens in AuthProvider + pages.
 * Avoids bundling Supabase into Edge Middleware.
 */
const PROTECTED_PREFIXES = ['/ask-question', '/my-questions', '/account']

function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(c => {
    const n = c.name
    return n.includes('sb-') && (n.includes('auth-token') || n.includes('access-token'))
  })
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some(p => path === p || path.startsWith(`${p}/`))
  if (!isProtected) return NextResponse.next()

  // Allow recovery / password-change pages that may arrive via email link
  // before cookies settle — pages still enforce auth.
  if (path.startsWith('/account/change-password')) {
    return NextResponse.next()
  }

  if (!hasSupabaseSessionCookie(request)) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', path)
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/ask-question/:path*', '/my-questions/:path*', '/account/:path*'],
}
