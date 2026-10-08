import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function adminTelegramBase(): string {
  const candidates = [
    process.env.CMS_REWRITE_TARGET,
    process.env.CMS_API_BASE,
    process.env.NEXT_PUBLIC_CMS_API_BASE,
    'https://admin.sileqelbachin1.com/api/public/v1',
  ]
  for (const c of candidates) {
    const v = String(c || '')
      .trim()
      .replace(/\/+$/, '')
    if (!v) continue
    if (/\/api\/cms$/i.test(v) || v.includes('/api/cms')) continue
    if (/^https?:\/\//i.test(v)) {
      return v.replace(/\/api\/public\/v1$/i, '') + '/api/public/v1/telegram'
    }
  }
  return 'https://admin.sileqelbachin1.com/api/public/v1/telegram'
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const action = String(body.action || 'link-start')
    const guestEmail = String(body.guest_email || body.email || '').trim().toLowerCase()

    let token: string | undefined
    try {
      const supabase = await createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      token = sessionData.session?.access_token
    } catch {
      /* guest ok */
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
    if (token) headers.Authorization = `Bearer ${token}`

    const res = await fetch(adminTelegramBase(), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action,
        guest_email: guestEmail || undefined,
        email: guestEmail || undefined,
        token: body.token ? String(body.token) : undefined,
      }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Connect failed' },
      { status: 502 }
    )
  }
}
