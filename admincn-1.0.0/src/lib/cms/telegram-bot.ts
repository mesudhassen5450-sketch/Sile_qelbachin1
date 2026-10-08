/**
 * Telegram Bot API helpers (Admin / Render only).
 * Env: TELEGRAM_BOT_TOKEN — never expose to the browser or commit to git.
 */

const API = 'https://api.telegram.org'

export function getTelegramBotToken(): string | null {
  const t = process.env.TELEGRAM_BOT_TOKEN?.trim()
  return t || null
}

export function getTelegramBotUsername(): string {
  return (process.env.TELEGRAM_BOT_USERNAME || 'sileqelbachin1_Bot').replace(/^@/, '')
}

import {
  formatAnswerDeliveryText,
  mediaCaption,
  resolveTgLocale,
  type TgLocale,
} from '@/lib/cms/telegram-messages'

export function formatUstazAnswerTelegramHtml(input: {
  question: string
  answer: string
  greeting?: string | null
  locale?: TgLocale | string | null
  languageCode?: string | null
}): string {
  const locale =
    input.locale === 'am' || input.locale === 'en'
      ? input.locale
      : resolveTgLocale({
          languageCode: input.languageCode,
          sampleText: `${input.question} ${input.answer}`,
        })
  return formatAnswerDeliveryText({
    locale,
    question: input.question,
    answer: input.answer,
    greeting: input.greeting,
  })
}

async function telegramApi(
  method: string,
  body: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const token = getTelegramBotToken()
  if (!token) {
    return {
      ok: false,
      error: 'Telegram is not configured — set TELEGRAM_BOT_TOKEN on Admin Render, then redeploy.',
    }
  }
  try {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      description?: string
    }
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error: data.description || `Telegram ${method} failed (${res.status}).`,
      }
    }
    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : `Telegram ${method} failed.`,
    }
  }
}

function isPublicHttpUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return false
    return true
  } catch {
    return false
  }
}

export async function telegramSendMessage(input: {
  chatId: string | number
  text: string
  parseMode?: 'HTML' | 'MarkdownV2' | null
  replyMarkup?: Record<string, unknown> | null
}): Promise<{ ok: boolean; error?: string }> {
  const body: Record<string, unknown> = {
    chat_id: input.chatId,
    text: input.text,
    disable_web_page_preview: true,
  }
  if (input.parseMode !== null && input.parseMode !== undefined) {
    body.parse_mode = input.parseMode
  } else if (input.parseMode === undefined) {
    body.parse_mode = 'HTML'
  }
  if (input.replyMarkup) {
    body.reply_markup = input.replyMarkup
  }
  return telegramApi('sendMessage', body)
}

/** Send a media file Telegram can fetch by public HTTPS URL (e.g. R2). */
export async function telegramSendMediaByUrl(input: {
  chatId: string | number
  kind: 'photo' | 'audio' | 'video' | 'document'
  url: string
  caption?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const url = String(input.url || '').trim()
  if (!isPublicHttpUrl(url)) {
    return {
      ok: false,
      error: `Media URL is not publicly reachable by Telegram: ${url.slice(0, 80)}`,
    }
  }
  const caption = String(input.caption || '').trim().slice(0, 1024)
  if (input.kind === 'photo') {
    return telegramApi('sendPhoto', {
      chat_id: input.chatId,
      photo: url,
      caption: caption || undefined,
    })
  }
  if (input.kind === 'audio') {
    return telegramApi('sendAudio', {
      chat_id: input.chatId,
      audio: url,
      caption: caption || undefined,
    })
  }
  if (input.kind === 'video') {
    return telegramApi('sendVideo', {
      chat_id: input.chatId,
      video: url,
      caption: caption || undefined,
      supports_streaming: true,
    })
  }
  return telegramApi('sendDocument', {
    chat_id: input.chatId,
    document: url,
    caption: caption || undefined,
  })
}

/**
 * Deliver Ustaz answer text + optional cover/audio/video to Telegram.
 * Text success is required; media failures are reported but do not block text delivery.
 */
export async function telegramDeliverUstazAnswer(input: {
  chatId: string | number
  question: string
  answer: string
  greeting?: string | null
  coverUrl?: string | null
  audioUrl?: string | null
  videoUrl?: string | null
  locale?: TgLocale | string | null
}): Promise<{ ok: boolean; error?: string; media_errors?: string[] }> {
  const locale =
    input.locale === 'am' || input.locale === 'en'
      ? input.locale
      : resolveTgLocale({ sampleText: `${input.question} ${input.answer}` })

  const text = formatUstazAnswerTelegramHtml({
    question: input.question,
    answer: input.answer,
    greeting: input.greeting,
    locale,
  })
  const sent = await telegramSendMessage({ chatId: input.chatId, text, parseMode: 'HTML' })
  if (!sent.ok) return { ok: false, error: sent.error }

  const media_errors: string[] = []
  const cover = String(input.coverUrl || '').trim()
  const audio = String(input.audioUrl || '').trim()
  const video = String(input.videoUrl || '').trim()

  if (cover) {
    const r = await telegramSendMediaByUrl({
      chatId: input.chatId,
      kind: 'photo',
      url: cover,
      caption: mediaCaption(locale, 'image'),
    })
    if (!r.ok) media_errors.push(`image: ${r.error}`)
  }
  if (audio) {
    const r = await telegramSendMediaByUrl({
      chatId: input.chatId,
      kind: 'audio',
      url: audio,
      caption: mediaCaption(locale, 'audio'),
    })
    if (!r.ok) {
      const fallback = await telegramSendMediaByUrl({
        chatId: input.chatId,
        kind: 'document',
        url: audio,
        caption: mediaCaption(locale, 'audio'),
      })
      if (!fallback.ok) media_errors.push(`audio: ${r.error}`)
    }
  }
  if (video) {
    const r = await telegramSendMediaByUrl({
      chatId: input.chatId,
      kind: 'video',
      url: video,
      caption: mediaCaption(locale, 'video'),
    })
    if (!r.ok) {
      const fallback = await telegramSendMediaByUrl({
        chatId: input.chatId,
        kind: 'document',
        url: video,
        caption: mediaCaption(locale, 'video'),
      })
      if (!fallback.ok) media_errors.push(`video: ${r.error}`)
    }
  }

  if (media_errors.length) {
    return {
      ok: true,
      error: `Answer text sent, but some media failed: ${media_errors.join('; ')}`,
      media_errors,
    }
  }
  return { ok: true }
}

export async function telegramAnswerCallbackQuery(id: string, text?: string): Promise<void> {
  const token = getTelegramBotToken()
  if (!token) return
  try {
    await fetch(`${API}/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callback_query_id: id, text: text || 'OK' }),
    })
  } catch {
    /* ignore */
  }
}

/** Local/dev only — use getUpdates when webhook cannot reach localhost. */
export function isTelegramPollingMode(): boolean {
  return /^(1|true|yes)$/i.test(String(process.env.TELEGRAM_POLLING || '').trim())
}

let pollingWebhookCleared = false

export async function ensureTelegramPollingReady(): Promise<void> {
  if (!isTelegramPollingMode()) return
  const token = getTelegramBotToken()
  if (!token || pollingWebhookCleared) return
  try {
    await fetch(`${API}/bot${token}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: false }),
    })
    pollingWebhookCleared = true
  } catch {
    /* ignore */
  }
}

export type TelegramIncomingStart = {
  chatId: number
  username: string | null
  startPayload: string
  languageCode: string | null
}

/** Drain pending /start messages (local polling). Ack offset before returning to avoid races. */
export async function telegramPollStartUpdates(): Promise<TelegramIncomingStart[]> {
  const token = getTelegramBotToken()
  if (!token || !isTelegramPollingMode()) return []
  await ensureTelegramPollingReady()
  try {
    const res = await fetch(
      `${API}/bot${token}/getUpdates?timeout=0&allowed_updates=${encodeURIComponent('["message"]')}`,
      { cache: 'no-store' }
    )
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      result?: Array<{
        update_id: number
        message?: {
          text?: string
          chat?: { id?: number }
          from?: { username?: string; language_code?: string }
        }
      }>
    }
    if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) return []

    let maxId = 0
    for (const u of data.result) {
      maxId = Math.max(maxId, u.update_id || 0)
    }
    // Acknowledge first so concurrent status polls cannot re-read the same updates.
    if (maxId > 0) {
      await fetch(`${API}/bot${token}/getUpdates?offset=${maxId + 1}&timeout=0`, {
        cache: 'no-store',
      })
    }

    const starts: TelegramIncomingStart[] = []
    const seenPayloads = new Set<string>()
    for (const u of data.result) {
      const text = String(u.message?.text || '').trim()
      const chatId = u.message?.chat?.id
      if (chatId == null || !text.startsWith('/start')) continue
      // Include bare /start (empty payload) so we can reply with return-to-website guidance.
      const payload = text.replace(/^\/start(@\w+)?\s*/i, '').trim()
      const dedupe = `${chatId}:${payload || '__bare__'}`
      if (seenPayloads.has(dedupe)) continue
      seenPayloads.add(dedupe)
      starts.push({
        chatId,
        username: u.message?.from?.username || null,
        startPayload: payload,
        languageCode: u.message?.from?.language_code || null,
      })
    }
    return starts
  } catch {
    return []
  }
}
