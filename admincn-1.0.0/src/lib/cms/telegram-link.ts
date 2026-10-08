/**
 * Link website users OR guests (email) to Telegram chat_id via deep-link tokens.
 * Never return chat_id to browsers.
 */
import { randomBytes } from 'crypto'

import { getServiceSupabase } from '@/lib/cms/supabase'
import {
  getTelegramBotUsername,
  isTelegramPollingMode,
  telegramPollStartUpdates,
  telegramSendMessage,
} from '@/lib/cms/telegram-bot'
import {
  alreadyConnectedReturnText,
  bareStartGuidanceText,
  connectionConfirmationText,
  resolveTgLocale,
  returnToWebsiteButton,
  TG_ERR,
} from '@/lib/cms/telegram-messages'

const TOKEN_TTL_MS = 30 * 60 * 1000

export type TelegramLinkStatus = {
  connected: boolean
  username: string | null
  connected_at: string | null
}

function normalizeEmail(email: string): string {
  return String(email || '')
    .trim()
    .toLowerCase()
}

/** Prevent concurrent getUpdates races (status poll every 2s). */
let pollingInFlight: Promise<number> | null = null
let backgroundPollingStarted = false

/** Local polling: keep answering /start even when the website is not open. */
export function ensureTelegramBackgroundPolling(): void {
  if (!isTelegramPollingMode() || backgroundPollingStarted) return
  if (typeof setInterval === 'undefined') return
  backgroundPollingStarted = true
  setInterval(() => {
    void processTelegramPollingStarts().catch(() => {})
  }, 2500)
}

/** Local: pull /start from Telegram getUpdates and link accounts. */
export async function processTelegramPollingStarts(): Promise<number> {
  if (!isTelegramPollingMode()) return 0
  ensureTelegramBackgroundPolling()
  if (pollingInFlight) return pollingInFlight

  pollingInFlight = (async () => {
    const updates = await telegramPollStartUpdates()
    let n = 0
    for (const u of updates) {
      const locale = resolveTgLocale({ languageCode: u.languageCode })

      // Bare /start (no deep-link token) — still guide user back to the website.
      if (!String(u.startPayload || '').trim()) {
        await notifyTelegramConnected(u.chatId, bareStartGuidanceText(locale), {
          locale,
          withReturnButton: true,
        })
        continue
      }

      const result = await consumeTelegramStartPayload({
        chatId: u.chatId,
        username: u.username,
        startPayload: u.startPayload,
        languageCode: u.languageCode,
      })
      const used =
        /already used|ቀድሞ ጥቅም/i.test(result.message) ||
        result.message === TG_ERR.used.en ||
        result.message === TG_ERR.used.am

      if (!result.ok && used) {
        // Already linked — still tell them to return and submit (do not stay silent).
        await notifyTelegramConnected(u.chatId, alreadyConnectedReturnText(result.locale), {
          locale: result.locale,
          withReturnButton: true,
        })
        continue
      }

      await notifyTelegramConnected(u.chatId, result.message, {
        locale: result.locale,
        withReturnButton: true,
      })
      if (result.ok) n++
    }
    return n
  })().finally(() => {
    pollingInFlight = null
  })

  return pollingInFlight
}

export async function getTelegramStatusForUser(userId: string): Promise<TelegramLinkStatus> {
  if (isTelegramPollingMode()) {
    await processTelegramPollingStarts()
  }
  const sb = getServiceSupabase()
  if (!sb) return { connected: false, username: null, connected_at: null }
  const { data } = await sb
    .from('user_telegram_links')
    .select('username, connected_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (!data?.connected_at) {
    return { connected: false, username: null, connected_at: null }
  }
  return {
    connected: true,
    username: data.username || null,
    connected_at: data.connected_at,
  }
}

export async function getTelegramStatusForGuest(
  email: string,
  token?: string | null
): Promise<TelegramLinkStatus> {
  if (isTelegramPollingMode()) {
    await processTelegramPollingStarts()
  }
  const sb = getServiceSupabase()
  const e = normalizeEmail(email)
  if (!sb || !e.includes('@')) {
    return { connected: false, username: null, connected_at: null }
  }

  // Optional: if token still pending unused, not connected yet
  if (token) {
    const { data: tok } = await sb
      .from('telegram_link_tokens')
      .select('used_at, guest_email')
      .eq('token', token)
      .maybeSingle()
    if (tok && !tok.used_at) {
      // still waiting for Start — also check if already linked by email
    }
  }

  const { data } = await sb
    .from('guest_telegram_links')
    .select('username, connected_at')
    .eq('guest_email', e)
    .maybeSingle()

  if (!data?.connected_at) {
    return { connected: false, username: null, connected_at: null }
  }
  return {
    connected: true,
    username: data.username || null,
    connected_at: data.connected_at,
  }
}

/** Never return chat_id to end-user clients. */
export async function getTelegramChatIdForUser(userId: string): Promise<string | null> {
  const sb = getServiceSupabase()
  if (!sb) return null
  const { data } = await sb
    .from('user_telegram_links')
    .select('chat_id')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.chat_id ? String(data.chat_id) : null
}

export async function getTelegramChatIdForEmail(email: string): Promise<string | null> {
  const sb = getServiceSupabase()
  const e = normalizeEmail(email)
  if (!sb || !e.includes('@')) return null
  const { data } = await sb
    .from('guest_telegram_links')
    .select('chat_id')
    .eq('guest_email', e)
    .maybeSingle()
  return data?.chat_id ? String(data.chat_id) : null
}

async function insertLinkToken(input: {
  userId?: string | null
  guestEmail?: string | null
}): Promise<{ ok: boolean; token?: string; deep_link?: string; bot_username?: string; expires_at?: string; error?: string }> {
  const sb = getServiceSupabase()
  if (!sb) {
    return { ok: false, error: 'Supabase is not configured on Admin.' }
  }
  const token = `c_${randomBytes(16).toString('hex')}`
  const expires = new Date(Date.now() + TOKEN_TTL_MS).toISOString()
  const { error } = await sb.from('telegram_link_tokens').upsert(
    {
      token,
      user_id: input.userId || null,
      guest_email: input.guestEmail ? normalizeEmail(input.guestEmail) : null,
      expires_at: expires,
      used_at: null,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'token' }
  )
  if (error) {
    if (/relation|does not exist|schema cache|guest_email|null value/i.test(error.message)) {
      return {
        ok: false,
        error:
          'Telegram guest tables missing. Run migration 010_guest_telegram_chat.sql in the Supabase SQL Editor.',
      }
    }
    return { ok: false, error: error.message }
  }
  const bot = getTelegramBotUsername()
  return {
    ok: true,
    token,
    bot_username: bot,
    deep_link: `https://t.me/${bot}?start=${token}`,
    expires_at: expires,
  }
}

export async function createTelegramLinkStart(userId: string, email?: string | null) {
  const bot = getTelegramBotUsername()
  const existing = await getTelegramStatusForUser(userId)
  if (existing.connected) {
    return {
      ok: true as const,
      already_connected: true as const,
      bot_username: bot,
      username: existing.username,
      connected_at: existing.connected_at,
    }
  }

  // Migrate a prior guest link (same Google email) onto the signed-in account.
  const e = normalizeEmail(email || '')
  if (e.includes('@')) {
    const guest = await getTelegramStatusForGuest(e, null)
    const chatId = await getTelegramChatIdForEmail(e)
    if (guest.connected && chatId) {
      const sb = getServiceSupabase()
      if (sb) {
        const now = new Date().toISOString()
        await sb.from('user_telegram_links').upsert(
          {
            user_id: userId,
            chat_id: chatId,
            username: guest.username,
            connected_at: guest.connected_at || now,
            updated_at: now,
          },
          { onConflict: 'user_id' }
        )
      }
      return {
        ok: true as const,
        already_connected: true as const,
        bot_username: bot,
        username: guest.username,
        connected_at: guest.connected_at,
      }
    }
  }

  return insertLinkToken({ userId })
}

export async function createTelegramLinkStartForGuest(email: string) {
  const e = normalizeEmail(email)
  if (!e.includes('@')) {
    return { ok: false as const, error: 'Valid email required to connect Telegram.' }
  }
  const existing = await getTelegramStatusForGuest(e, null)
  if (existing.connected) {
    const bot = getTelegramBotUsername()
    return {
      ok: true as const,
      already_connected: true as const,
      bot_username: bot,
      username: existing.username,
      connected_at: existing.connected_at,
    }
  }
  return insertLinkToken({ guestEmail: e })
}

export async function consumeTelegramStartPayload(input: {
  chatId: string | number
  username?: string | null
  startPayload: string
  languageCode?: string | null
}): Promise<{ ok: boolean; message: string; locale: 'en' | 'am' }> {
  const locale = resolveTgLocale({ languageCode: input.languageCode })
  const err = (key: keyof typeof TG_ERR) => TG_ERR[key][locale]
  const sb = getServiceSupabase()
  if (!sb) {
    return { ok: false, locale, message: err('svc') }
  }

  const token = String(input.startPayload || '').trim()
  if (!/^c_[a-f0-9]{32}$/i.test(token)) {
    return { ok: false, locale, message: err('start') }
  }

  const { data: row, error } = await sb
    .from('telegram_link_tokens')
    .select('token, user_id, guest_email, expires_at, used_at')
    .eq('token', token)
    .maybeSingle()

  if (error || !row) {
    return { ok: false, locale, message: err('invalid') }
  }
  if (row.used_at) {
    return { ok: false, locale, message: err('used') }
  }
  if (Date.parse(row.expires_at) < Date.now()) {
    return { ok: false, locale, message: err('expired') }
  }

  const chatId = String(input.chatId)
  const now = new Date().toISOString()

  if (row.user_id) {
    await sb.from('user_telegram_links').delete().eq('chat_id', chatId)
    const { error: linkErr } = await sb.from('user_telegram_links').upsert(
      {
        user_id: row.user_id,
        chat_id: chatId,
        username: input.username || null,
        connected_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    )
    if (linkErr) {
      return { ok: false, locale, message: `Could not save connection: ${linkErr.message}` }
    }
  } else if (row.guest_email) {
    await sb.from('guest_telegram_links').delete().eq('chat_id', chatId)
    const { error: linkErr } = await sb.from('guest_telegram_links').upsert(
      {
        guest_email: normalizeEmail(row.guest_email),
        chat_id: chatId,
        username: input.username || null,
        connected_at: now,
        updated_at: now,
      },
      { onConflict: 'guest_email' }
    )
    if (linkErr) {
      return {
        ok: false,
        locale,
        message: /relation|does not exist/i.test(linkErr.message)
          ? 'Run migration 010_guest_telegram_chat.sql in Supabase, then try again.'
          : `Could not save connection: ${linkErr.message}`,
      }
    }
  } else {
    return { ok: false, locale, message: err('noAccount') }
  }

  await sb.from('telegram_link_tokens').update({ used_at: now }).eq('token', token)

  return {
    ok: true,
    locale,
    message: connectionConfirmationText(locale),
  }
}

export async function notifyTelegramConnected(
  chatId: string | number,
  text: string,
  opts?: { locale?: 'en' | 'am'; withReturnButton?: boolean }
) {
  const locale = opts?.locale || 'en'
  await telegramSendMessage({
    chatId,
    text,
    parseMode: null,
    replyMarkup: opts?.withReturnButton ? returnToWebsiteButton(locale) : null,
  })
}

export async function disconnectTelegramForUser(userId: string): Promise<boolean> {
  const sb = getServiceSupabase()
  if (!sb) return false
  const { error } = await sb.from('user_telegram_links').delete().eq('user_id', userId)
  return !error
}
