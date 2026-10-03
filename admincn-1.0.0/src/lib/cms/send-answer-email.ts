/**
 * Send Ustaz answer email via Resend API.
 * Env (Admin / Render only — never Netlify):
 *   RESEND_API_KEY=re_...
 *   EMAIL_FROM=Sile Qelbachin Support <noreply@sileqelbachin1.com>
 *     MUST be a verified domain on Resend — onboarding@resend.dev only delivers
 *     to your own Resend login email, not to askers.
 *   EMAIL_FROM_NAME=Sile Qelbachin Support  (optional display override)
 */

const SALAM_LINE =
  /^\s*(?:as[- ]?salamu?[- ]?alaikum|assalamu[- ]?alaikum|salam(?:u)?[- ]?alaykum|wa[- ]?alaikum(?:u)?[- ]?as[- ]?salam|wealeykum[- ]?selam|w[aä][- ]?alaykum[- ]?as[- ]?salam|አሰላሙ(?:ዓ|ዐ)?ለይኩም|ወዐለይኩሙ(?:ስ|ስሰ)?ላም|ሰላም(?:\s*ዓለይኩም)?)\s*[,.!]?\s*$/i

function isAmharicDominant(text: string): boolean {
  const eth = (text.match(/[\u1200-\u137F]/g) || []).length
  const latin = (text.match(/[A-Za-z]/g) || []).length
  return eth >= 8 || eth > latin
}

/** Strip leading duplicate islamic greetings from the answer body. */
function stripLeadingSalams(body: string): string {
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) {
      i++
      continue
    }
    if (SALAM_LINE.test(line) || /^(wealeykum|waalaykum|w[aä]alaykum)/i.test(line.replace(/\s+/g, ''))) {
      i++
      continue
    }
    break
  }
  return lines.slice(i).join('\n').trim()
}

function resolveFromAddress(): string | null {
  const fromRaw = process.env.EMAIL_FROM?.trim() || process.env.RESEND_FROM?.trim()
  if (fromRaw) return fromRaw
  const name = (process.env.EMAIL_FROM_NAME || 'Sile Qelbachin Support').trim().replace(/"/g, '')
  return `${name} <onboarding@resend.dev>`
}

function isResendTestSender(from: string): boolean {
  return /onboarding@resend\.dev/i.test(from)
}

async function resendSend(input: {
  from: string
  to: string
  subject: string
  text: string
  html: string
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return {
      ok: false,
      error:
        'Email is not set up — set RESEND_API_KEY (and EMAIL_FROM with a verified domain) on Admin Render, then redeploy.',
    }
  }

  if (isResendTestSender(input.from)) {
    return {
      ok: false,
      error:
        'EMAIL_FROM still uses onboarding@resend.dev (test only). In Resend, verify sileqelbachin1.com, then set EMAIL_FROM=Sile Qelbachin Support <noreply@sileqelbachin1.com> on Render and redeploy. Until then emails are not sent to users.',
    }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: input.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      id?: string
      message?: string
      error?: { message?: string }
    }
    if (!res.ok) {
      const msg =
        data.error?.message ||
        data.message ||
        `Resend error (${res.status}). Check RESEND_API_KEY and that EMAIL_FROM is a verified sender.`
      if (/only send testing emails|verify a domain/i.test(msg)) {
        return {
          ok: false,
          error:
            'Resend blocked delivery: verify your domain (sileqelbachin1.com) in Resend, set EMAIL_FROM to that domain on Render, then redeploy.',
        }
      }
      return { ok: false, error: msg }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Email send failed.' }
  }
}

export async function sendUstazAnswerEmail(input: {
  to: string
  question: string
  answer: string
  greeting?: string | null
  description?: string | null
  category?: string
  coverUrl?: string | null
  audioUrl?: string | null
  videoUrl?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  const to = input.to.trim()
  if (!to || !to.includes('@')) return { ok: false, error: 'Missing recipient email.' }

  const from = resolveFromAddress()
  if (!from) {
    return { ok: false, error: 'EMAIL_FROM is missing.' }
  }

  const am = isAmharicDominant(`${input.question}\n${input.answer}\n${input.greeting || ''}`)
  const rawGreeting = (input.greeting || '').trim()
  const greeting = am
    ? rawGreeting || 'አሰላሙዓለይኩም ወረሕመቱላሂ ወበረካቱሁ፣'
    : rawGreeting || 'Assalamu alaikum wa rahmatullahi wa barakatuh,'

  let answerBody = stripLeadingSalams(input.answer.trim())
  if (rawGreeting && answerBody) {
    const first = answerBody.split('\n')[0]?.trim() || ''
    if (first && (SALAM_LINE.test(first) || first.toLowerCase() === rawGreeting.toLowerCase())) {
      answerBody = stripLeadingSalams(answerBody.split('\n').slice(1).join('\n'))
    }
  }

  const subject = am
    ? 'ለጥያቄዎ መልስ — ስለ ቀልባችን'
    : 'Answer to your question — Sile Qelbachin'

  const mediaLines = [
    input.coverUrl ? (am ? `ሽፋን፦ ${input.coverUrl}` : `Cover: ${input.coverUrl}`) : null,
    input.audioUrl ? (am ? `ኦዲዮ፦ ${input.audioUrl}` : `Audio: ${input.audioUrl}`) : null,
    input.videoUrl ? (am ? `ቪዲዮ፦ ${input.videoUrl}` : `Video: ${input.videoUrl}`) : null,
  ].filter(Boolean)

  const copy = am
    ? {
        category: 'ምድብ',
        yourQuestion: 'ጥያቄዎ',
        answer: 'መልስ',
        note: 'ማስታወሻ',
        closing: 'አላህ ትክክለኛውን እውቀት ይስጠን።',
        sign: 'ስለ ቀልባችን ድጋፍ',
        audioLink: 'ኦዲዮ መልስ ይክፈቱ',
        videoLink: 'ቪዲዮ መልስ ይክፈቱ',
      }
    : {
        category: 'Category',
        yourQuestion: 'Your question',
        answer: 'Answer',
        note: 'Note',
        closing: 'May Allah grant us beneficial knowledge.',
        sign: 'Sile Qelbachin Support',
        audioLink: 'Open audio answer',
        videoLink: 'Open video answer',
      }

  const text = [
    greeting,
    '',
    input.category ? `${copy.category}: ${input.category}` : null,
    '',
    `${copy.yourQuestion}:`,
    input.question,
    '',
    `${copy.answer}:`,
    answerBody,
    input.description ? '' : null,
    input.description ? `${copy.note}:` : null,
    input.description || null,
    mediaLines.length ? '' : null,
    ...mediaLines,
    '',
    copy.closing,
    '',
    `— ${copy.sign}`,
    'ስለ ቀልባችን · sileqelbachin',
  ]
    .filter(line => line !== null)
    .join('\n')

  const mediaHtml = [
    input.coverUrl
      ? `<p style="margin:16px 0 0"><img src="${escapeAttr(input.coverUrl)}" alt="" style="max-width:100%;border-radius:8px"/></p>`
      : '',
    input.audioUrl
      ? `<p style="margin:10px 0 0"><a href="${escapeAttr(input.audioUrl)}" style="color:#1b5e20;font-weight:600">${escapeHtml(copy.audioLink)}</a></p>`
      : '',
    input.videoUrl
      ? `<p style="margin:10px 0 0"><a href="${escapeAttr(input.videoUrl)}" style="color:#1b5e20;font-weight:600">${escapeHtml(copy.videoLink)}</a></p>`
      : '',
  ].join('')

  const html = `
<!DOCTYPE html>
<html lang="${am ? 'am' : 'en'}">
<body style="margin:0;padding:0;background:#f4f4f5">
  <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#1a1a1a;max-width:600px;margin:24px auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden">
    <div style="background:#1b5e20;color:#ffffff;padding:18px 24px">
      <div style="font-size:18px;font-weight:700;letter-spacing:0.02em">ስለ ቀልባችን</div>
      <div style="font-size:12px;opacity:0.9;margin-top:2px">Sile Qelbachin · Islamic Q&amp;A</div>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 16px;font-size:15px">${escapeHtml(greeting)}</p>
      ${
        input.category
          ? `<p style="margin:0 0 16px;font-size:13px;color:#555"><strong>${escapeHtml(copy.category)}:</strong> ${escapeHtml(input.category)}</p>`
          : ''
      }
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#666">${escapeHtml(copy.yourQuestion)}</p>
      <blockquote style="margin:0 0 20px;padding:12px 16px;border-left:3px solid #1b5e20;background:#f7faf7;color:#333;font-size:14px">${escapeHtml(input.question).replace(/\n/g, '<br/>')}</blockquote>
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;color:#666">${escapeHtml(copy.answer)}</p>
      <div style="margin:0 0 16px;padding:16px 18px;background:#fafafa;border:1px solid #eee;border-radius:6px;font-size:15px">${escapeHtml(answerBody).replace(/\n/g, '<br/>')}</div>
      ${
        input.description
          ? `<p style="margin:0 0 12px;font-size:13px;color:#555"><strong>${escapeHtml(copy.note)}:</strong> ${escapeHtml(input.description).replace(/\n/g, '<br/>')}</p>`
          : ''
      }
      ${mediaHtml}
      <p style="margin:28px 0 0;font-size:13px;color:#555">${escapeHtml(copy.closing)}</p>
      <p style="margin:16px 0 0;font-size:13px;color:#1b5e20;font-weight:600">— ${escapeHtml(copy.sign)}</p>
    </div>
    <div style="padding:12px 24px;background:#f9faf9;border-top:1px solid #eee;font-size:11px;color:#888;text-align:center">
      ስለ ቀልባችን · Sile Qelbachin Support
    </div>
  </div>
</body>
</html>`

  return resendSend({ from, to, subject, text, html })
}

/** Confirmation that the asker’s question was received (inbox). */
export async function sendQuestionReceivedEmail(input: {
  to: string
  question: string
  category?: string
}): Promise<{ ok: boolean; error?: string }> {
  const to = input.to.trim()
  if (!to || !to.includes('@')) return { ok: false, error: 'Missing recipient email.' }

  const from = resolveFromAddress()
  if (!from) return { ok: false, error: 'EMAIL_FROM is missing.' }

  const am = isAmharicDominant(input.question)
  const subject = am
    ? 'ጥያቄዎ ደርሶናል — ስለ ቀልባችን'
    : 'We received your question — Sile Qelbachin'
  const greeting = am
    ? 'አሰላሙዓለይኩም ወረሕመቱላሂ ወበረካቱሁ፣'
    : 'Assalamu alaikum wa rahmatullahi wa barakatuh,'
  const body = am
    ? [
        greeting,
        '',
        'ጥያቄዎ በስኬት ተቀብለናል። ኡስታዝ መልስ ሲሰጥ ወደዚህ ኢሜይል እንልካለን — እባክዎ ኢሜይልዎን ይከታተሉ።',
        input.category ? `\nምድብ፦ ${input.category}` : '',
        '',
        'ጥያቄዎ፦',
        input.question,
        '',
        '— ስለ ቀልባችን ድጋፍ',
      ].join('\n')
    : [
        greeting,
        '',
        'We received your question. An Ustaz will reply to this email — please watch your inbox.',
        input.category ? `\nCategory: ${input.category}` : '',
        '',
        'Your question:',
        input.question,
        '',
        '— Sile Qelbachin Support',
      ].join('\n')

  const html = `
<!DOCTYPE html>
<html lang="${am ? 'am' : 'en'}">
<body style="margin:0;padding:0;background:#f4f4f5">
  <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#1a1a1a;max-width:600px;margin:24px auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden">
    <div style="background:#1b5e20;color:#ffffff;padding:18px 24px">
      <div style="font-size:18px;font-weight:700">ስለ ቀልባችን</div>
      <div style="font-size:12px;opacity:0.9;margin-top:2px">Sile Qelbachin · Ask an Ustaz</div>
    </div>
    <div style="padding:24px;white-space:pre-wrap;font-size:15px">${escapeHtml(body).replace(/\n/g, '<br/>')}</div>
  </div>
</body>
</html>`

  return resendSend({ from, to, subject, text: body, html })
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(s: string) {
  return escapeHtml(s).replace(/'/g, '&#39;')
}
