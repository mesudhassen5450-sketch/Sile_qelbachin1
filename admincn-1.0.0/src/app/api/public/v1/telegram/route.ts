import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

import {
  createTelegramLinkStart,
  createTelegramLinkStartForGuest,
  disconnectTelegramForUser,
  ensureTelegramBackgroundPolling,
  getTelegramStatusForGuest,
  getTelegramStatusForUser,
} from '@/lib/cms/telegram-link'
import { getTelegramBotUsername } from '@/lib/cms/telegram-bot'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

ensureTelegramBackgroundPolling()

function cors(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return res
}

export async function OPTIONS() {
  return cors(new NextResponse(null, { status: 204 }))
}

async function userFromBearer(request: Request): Promise<{ id: string; email?: string } | null> {
  const auth = request.headers.get('authorization') || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  const jwt = m?.[1]?.trim()
  if (!jwt) return null

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null

  const sb = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  })
  const { data, error } = await sb.auth.getUser(jwt)
  if (error || !data.user) return null
  return { id: data.user.id, email: data.user.email || undefined }
}

/** GET — status for signed-in user, or guest via ?email=&token= */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const guestEmail = String(url.searchParams.get('email') || '').trim().toLowerCase()
  const guestToken = String(url.searchParams.get('token') || '').trim()

  const user = await userFromBearer(request)
  if (user) {
    const status = await getTelegramStatusForUser(user.id)
    // Also check guest table if email matches (local skip-auth hybrid)
    if (!status.connected && user.email) {
      const g = await getTelegramStatusForGuest(user.email, guestToken || null)
      if (g.connected) {
        return cors(
          NextResponse.json({
            ok: true,
            connected: true,
            username: g.username,
            connected_at: g.connected_at,
            bot_username: getTelegramBotUsername(),
          })
        )
      }
    }
    return cors(
      NextResponse.json({
        ok: true,
        connected: status.connected,
        username: status.username,
        connected_at: status.connected_at,
        bot_username: getTelegramBotUsername(),
      })
    )
  }

  if (guestEmail.includes('@') && guestToken) {
    const status = await getTelegramStatusForGuest(guestEmail, guestToken)
    return cors(
      NextResponse.json({
        ok: true,
        connected: status.connected,
        username: status.username,
        connected_at: status.connected_at,
        bot_username: getTelegramBotUsername(),
      })
    )
  }

  return cors(NextResponse.json({ ok: false, error: 'Sign in or guest email+token required.' }, { status: 401 }))
}

/**
 * POST actions:
 *   { action: "link-start" } — auth user
 *   { action: "link-start", guest_email } — guest (local test / no Google)
 *   { action: "status", guest_email, token }
 *   { action: "disconnect" } — auth only
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const action = String(body.action || 'link-start')
  const user = await userFromBearer(request)

  if (action === 'disconnect') {
    if (!user) {
      return cors(NextResponse.json({ ok: false, error: 'Sign in required.' }, { status: 401 }))
    }
    const ok = await disconnectTelegramForUser(user.id)
    return cors(NextResponse.json({ ok, connected: false }))
  }

  if (action === 'status') {
    if (user) {
      const status = await getTelegramStatusForUser(user.id)
      if (!status.connected && (body.guest_email || user.email)) {
        const g = await getTelegramStatusForGuest(
          String(body.guest_email || user.email),
          body.token ? String(body.token) : null
        )
        if (g.connected) {
          return cors(
            NextResponse.json({
              ok: true,
              connected: true,
              username: g.username,
              connected_at: g.connected_at,
              bot_username: getTelegramBotUsername(),
            })
          )
        }
      }
      return cors(
        NextResponse.json({
          ok: true,
          connected: status.connected,
          username: status.username,
          connected_at: status.connected_at,
          bot_username: getTelegramBotUsername(),
        })
      )
    }
    const email = String(body.guest_email || body.email || '').trim()
    const token = String(body.token || '').trim()
    if (!email.includes('@') || !token) {
      return cors(NextResponse.json({ ok: false, error: 'guest_email and token required.' }, { status: 400 }))
    }
    const status = await getTelegramStatusForGuest(email, token)
    return cors(
      NextResponse.json({
        ok: true,
        connected: status.connected,
        username: status.username,
        connected_at: status.connected_at,
        bot_username: getTelegramBotUsername(),
      })
    )
  }

  // link-start — prefer signed-in user_id so chat_id is cached on the account
  if (user) {
    const started = await createTelegramLinkStart(user.id, user.email)
    if (!started.ok) {
      return cors(NextResponse.json({ ok: false, error: started.error }, { status: 400 }))
    }
    if ('already_connected' in started && started.already_connected) {
      return cors(
        NextResponse.json({
          ok: true,
          already_connected: true,
          connected: true,
          username: started.username,
          connected_at: started.connected_at,
          bot_username: started.bot_username,
        })
      )
    }
    return cors(
      NextResponse.json({
        ok: true,
        deep_link: started.deep_link,
        bot_username: started.bot_username,
        expires_at: started.expires_at,
        token: started.token,
      })
    )
  }

  const guestEmail = String(body.guest_email || body.email || '').trim()
  const started = await createTelegramLinkStartForGuest(guestEmail)
  if (!started.ok) {
    return cors(NextResponse.json({ ok: false, error: started.error }, { status: 400 }))
  }
  if ('already_connected' in started && started.already_connected) {
    return cors(
      NextResponse.json({
        ok: true,
        already_connected: true,
        connected: true,
        username: started.username,
        connected_at: started.connected_at,
        bot_username: started.bot_username,
      })
    )
  }
  return cors(
    NextResponse.json({
      ok: true,
      deep_link: started.deep_link,
      bot_username: started.bot_username,
      expires_at: started.expires_at,
      token: started.token,
    })
  )
}
