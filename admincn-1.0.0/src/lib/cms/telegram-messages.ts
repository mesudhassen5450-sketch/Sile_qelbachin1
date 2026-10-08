/**
 * Polished Telegram copy for Sile Qelbachin (EN + Amharic).
 */

function escapeHtml(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export type TgLocale = "en" | "am"

/** Prefer Amharic when Telegram language_code is am, or sample text is Ethiopic-heavy. */
export function resolveTgLocale(input?: {
  languageCode?: string | null
  sampleText?: string | null
}): TgLocale {
  const code = String(input?.languageCode || "").toLowerCase()
  if (code.startsWith("am") || code.startsWith("ti")) return "am"
  const sample = String(input?.sampleText || "")
  const eth = (sample.match(/[\u1200-\u137F]/g) || []).length
  if (eth >= 6) return "am"
  return "en"
}

const CONN_AM = "💚 አሰላሙ ዓለይኩም ወራሕመቱላሂ ወበረካቱህ\n\nቴሌግራምዎ ከስለ ቀልባችን (Sile Qelbachin) ጋር በትክክል ተያይዟል።\n\n➡️ አሁን ወደ ድረ-ገጹ ተመልሰው ጥያቄዎን ያቅረቡ / ይላኩ።\nኢንሻአላህ የኡስታዝ ምላሽ ቀጥታ እዚህ በግል ይደርስዎታል።"
const ANS_HEAD_AM = "🌙 <b>ስለ ቀልባችን | Sile Qelbachin</b>"
const ANS_INTRO_AM =
  "አሰላሙ ዓለይኩም ወራሕመቱልላሂ ወበረካቱሁ\n\nለጠየቁት ጥያቄ ምላሽ ተሰጥቷል።"
const Q_LABEL_AM = "❓ <b>የእርስዎ ጥያቄ፦</b>"
const A_LABEL_AM = "💡 <b>የተሰጠው ምላሽ፦</b>"
const DUA_AM =
  "🤲 አላህ ጠቃሚ እውቀትን ይለግስዎ፤ በትክክለኛው መንገድ ላይም ብርሃን ያድርግልዎ። አሚን!"
const BTN_AM = "🌐 ወደ ድረ-ገጹ ተመለስ — ጥያቄዎን ያቅረቡ"
const CAP_IMG_AM = "📷 ከኡስታዝ — ምስል"
const CAP_AUD_AM = "🎧 ከኡስታዝ — ድምጽ"
const CAP_VID_AM = "🎬 ከኡስታዝ — ቪዲዮ"

export function connectionConfirmationText(locale: TgLocale): string {
  if (locale === "am") return CONN_AM
  return [
    "💚 Assalamu alaikum wa rahmatullahi wa barakatuh",
    "",
    "Your Telegram is now connected to Sile Qelbachin.",
    "",
    "➡️ Please return to the website and submit your question.",
    "In shā’ Allāh, the Ustaz reply will be delivered to you privately here.",
  ].join("\n")
}

/** Telegram message hard limit is 4096 — keep room for template chrome. */
function clipTelegramField(s: string, max: number): string {
  const t = String(s || "").trim()
  if (t.length <= max) return t
  return `${t.slice(0, Math.max(0, max - 1))}…`
}

export function formatAnswerDeliveryText(input: {
  locale: TgLocale
  question: string
  answer: string
  greeting?: string | null
}): string {
  const q = escapeHtml(clipTelegramField(input.question, 1200))
  let a = escapeHtml(clipTelegramField(input.answer, 2000))
  if (input.greeting?.trim()) {
    a = `${escapeHtml(clipTelegramField(input.greeting, 400))}\n\n${a}`
  }
  if (input.locale === "am") {
    return [
      ANS_HEAD_AM,
      "",
      ANS_INTRO_AM,
      "",
      "━━━━━━━━━━━━━━━━━━━━━━",
      Q_LABEL_AM,
      q,
      "",
      A_LABEL_AM,
      a,
      "━━━━━━━━━━━━━━━━━━━━━━",
      "",
      DUA_AM,
    ].join("\n")
  }
  return [
    "🌙 <b>Sile Qelbachin</b>",
    "",
    "Assalamu alaikum wa rahmatullahi wa barakatuh.",
    "",
    "A reply has been provided for your question.",
    "",
    "━━━━━━━━━━━━━━━━━━━━━━",
    "❓ <b>Your question:</b>",
    q,
    "",
    "💡 <b>The answer:</b>",
    a,
    "━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "🤲 May Allah grant you beneficial knowledge and make it a light upon the right path. Āmīn!",
  ].join("\n")
}

export function mediaCaption(locale: TgLocale, kind: "image" | "audio" | "video"): string {
  if (locale === "am") {
    if (kind === "image") return CAP_IMG_AM
    if (kind === "audio") return CAP_AUD_AM
    return CAP_VID_AM
  }
  if (kind === "image") return "📷 Attachment from the Ustaz — image"
  if (kind === "audio") return "🎧 Attachment from the Ustaz — audio"
  return "🎬 Attachment from the Ustaz — video"
}


export function bareStartGuidanceText(locale: TgLocale): string {
  if (locale === 'am') return "💚 አሰላሙ ዓለይኩም ወራሕመቱላሂ ወበረካቱህ\n\nቴሌግራም ለማገናኘት ከድረ-ገጹ Ask a Question ላይ ቴሌግራም ይምረጡ፣ ከዚያ Open bot & Start ይጫኑ።\n\n➡️ ከዚያ ወደ ድረ-ገጹ ተመልሰው ጥያቄዎን ያቅረቡ።\nኢንሻአላህ የኡስታዝ ምላሽ ቀጥታ እዚህ በግል ይደርስዎታል።"
  return [
    '💚 Assalamu alaikum wa rahmatullahi wa barakatuh',
    '',
    'To connect this chat, open Ask a Question on the Sile Qelbachin website, choose Telegram, then tap Open bot & Start.',
    '',
    '➡️ Then return to the website and submit your question.',
    'In shā’ Allāh, the Ustaz reply will reach you privately here.',
  ].join('\n')
}

export function alreadyConnectedReturnText(locale: TgLocale): string {
  if (locale === 'am') return "💚 አሰላሙ ዓለይኩም\n\nቴሌግራምዎ አስቀድሞ ተገናኝቷል።\n\n➡️ እባክዎ ወደ ድረ-ገጹ ተመልሰው ጥያቄዎን ያቅረቡ / ይላኩ።\nኢንሻአላህ ምላሱ እዚህ ይደርስዎታል።"
  return [
    '💚 Assalamu alaikum wa rahmatullahi wa barakatuh',
    '',
    'Your Telegram is already connected to Sile Qelbachin.',
    '',
    '➡️ Please return to the website and submit your question.',
    'In shā’ Allāh, the Ustaz reply will be delivered here privately.',
  ].join('\n')
}

export function websiteAskReturnUrl(): string {
  const base = (
    process.env.TELEGRAM_RETURN_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.WEBSITE_PUBLIC_URL ||
    "http://localhost:3000"
  )
    .trim()
    .replace(/\/+$/, "")
  // TELEGRAM_RETURN_URL may already be …/ask-question — never double the path.
  if (/\/ask-question$/i.test(base)) return base
  return `${base}/ask-question`
}

export function returnToWebsiteButton(locale: TgLocale): {
  inline_keyboard: Array<Array<{ text: string; url: string }>>
} {
  const text =
    locale === "am" ? BTN_AM : "🌐 Return to website — submit your question"
  return { inline_keyboard: [[{ text, url: websiteAskReturnUrl() }]] }
}

export const TG_ERR = {
  svc: { en: "Service unavailable. Please try again later.", am: "አገልግሎቱ አሁን አይገኝም። ትንሽ ቆይተው ይሞክሩ።" },
  start: {
    en: "Open Ask a Question on the Sile Qelbachin website, choose Telegram, then tap Start here.",
    am: "እባክዎ ከድረ-ገጹ Ask a Question ላይ ቴሌግራም በመምረጥ ቦቱን ይክፈቱ፣ ከዚያ Start ይጫኑ።",
  },
  invalid: {
    en: "This link is invalid or expired. Start again from the website.",
    am: "ይህ ሊንክ ልክ አይደለም ወይም ጊዜው አልፏል። ከድረ-ገጹ እንደገና ይጀምሩ።",
  },
  used: {
    en: "This link was already used. Start again from the website if needed.",
    am: "ይህ ሊንክ ቀድሞ ጥቅም ላይ ውሏል። ከድረ-ገጹ እንደገና ይጀምሩ።",
  },
  expired: {
    en: "This link expired. Choose Telegram again on the website.",
    am: "ይህ ሊንክ ጊዜው አልፏል። በድረ-ገጹ እንደገና ቴሌግራም ይምረጡ።",
  },
  noAccount: {
    en: "This link has no account. Start again from the website.",
    am: "ይህ ሊንክ መለያ የለውም። ከድረ-ገጹ እንደገና ይጀምሩ።",
  },
} as const
