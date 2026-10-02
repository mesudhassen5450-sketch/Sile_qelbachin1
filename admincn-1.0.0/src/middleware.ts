import { type NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Skip static assets and large multipart uploads.
     * Media upload must not pass through middleware body limits —
     * auth still runs in the route via requireApiPermission.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/admin/media/upload|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
