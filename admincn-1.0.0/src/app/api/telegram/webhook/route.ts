import { NextResponse } from 'next/server'

import {
  consumeTelegramStartPayload,
  notifyTelegramConnected,
} from '@/lib/cms/telegram-link'
import { getTelegramBotToken } from '@/lib/cms/telegram-bot'
import {
  alreadyConnectedReturnText,
  bareStartGuidanceText,
  resolveTgLocale,
  TG_ERR,
} from '@/lib/cms/telegram-messages'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type TgUpdate = {
  update_id?: number
  message?: {
    text?: string
    chat?: { id?: number }
    from?: { username?: string; language_code?: string }
  }
}

/**
 * Telegram Bot webhook — Admin only.
 * Set via: POST https://api.telegram.org/bot<TOKEN>/setWebhook
 *   { "url": "https://admin.sileqelbachin1.com/api/telegram/webhook",
 *     "secret_token": "<TELEGRAM_WEBHOOK_SECRET optional>" }
 */
export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
  if (secret) {
    const hdr = request.headers.get('x-telegram-bot-api-secret-token')
    if (hdr !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 })
    }
  }

  if (!getTelegramBotToken()) {
    return NextResponse.json({ ok: false, error: 'bot not configured' }, { status: 503 })
  }

  const update = (await request.json().catch(() => ({}))) as TgUpdate
  const text = String(update.message?.text || '').trim()
  const chatId = update.message?.chat?.id
  const username = update.message?.from?.username || null
  const languageCode = update.message?.from?.language_code || null
  const locale = resolveTgLocale({ languageCode })

  if (chatId == null) {
    return NextResponse.json({ ok: true })
  }

  if (text.startsWith('/start')) {
    const payload = text.replace(/^\/start(@\w+)?\s*/i, '').trim()
    if (!payload) {
      await notifyTelegramConnected(chatId, bareStartGuidanceText(locale), {
        locale,
        withReturnButton: true,
      })
      return NextResponse.json({ ok: true })
    }

    const result = await consumeTelegramStartPayload({
      chatId,
      username,
      startPayload: payload,
      languageCode,
    })
    const used =
      /already used|ቀድሞ ጥቅም/i.test(result.message) ||
      result.message === TG_ERR.used.en ||
      result.message === TG_ERR.used.am
    await notifyTelegramConnected(
      chatId,
      result.ok
        ? result.message
        : used
          ? alreadyConnectedReturnText(result.locale)
          : result.message,
      {
        locale: result.locale,
        withReturnButton: true,
      }
    )
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: true })
}

/** Health / webhook setup helper for admins with secret. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const setup = url.searchParams.get('setup')
  const token = getTelegramBotToken()
  if (!token) {
    return NextResponse.json({ ok: false, error: 'TELEGRAM_BOT_TOKEN missing' }, { status: 503 })
  }

  if (setup === '1') {
    const setupKey = process.env.TELEGRAM_WEBHOOK_SETUP_KEY?.trim()
    const key = url.searchParams.get('key') || ''
    if (!setupKey || key !== setupKey) {
      return NextResponse.json({ ok: false, error: 'Unauthorized setup' }, { status: 401 })
    }
    const webhookUrl =
      process.env.TELEGRAM_WEBHOOK_URL?.trim() ||
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://admin.sileqelbachin1.com'}/api/telegram/webhook`
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
    const body: Record<string, unknown> = {
      url: webhookUrl,
      allowed_updates: ['message'],
      drop_pending_updates: true,
    }
    if (secret) body.secret_token = secret
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json({ ok: Boolean(data.ok), webhookUrl, telegram: data })
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    hint: 'POST updates from Telegram. Use ?setup=1&key=TELEGRAM_WEBHOOK_SETUP_KEY to register webhook.',
  })
}
