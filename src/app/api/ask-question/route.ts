import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Row = {
  id: string
  user_id: string | null
  auth_email: string
  name: string | null
  category: string
  question: string
  status: 'new' | 'assigned' | 'in_review' | 'answered' | 'user_replied' | 'closed' | 'archived'
  assigned_to?: string | null
  greeting: string | null
  answer: string | null
  description: string | null
  cover_url: string | null
  audio_url: string | null
  video_url: string | null
  published_public: boolean
  answered_at: string | null
  answered_by: string | null
  answer_channel?: 'email' | 'telegram'
  delivery_status?: 'pending' | 'sent' | 'failed'
  email_sent: boolean
  email_error: string | null
  admin_seen_at?: string | null
  created_at: string
  updated_at: string
}

const OPEN_STATUSES = new Set(['new', 'assigned', 'in_review', 'user_replied'])

function adminCmsBase(): string {
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
    // Never call the same-origin proxy from this server route (loop / wrong host)
    if (/\/api\/cms$/i.test(v) || v.includes('/api/cms')) continue
    if (/^https?:\/\//i.test(v)) return v
  }
  return 'https://admin.sileqelbachin1.com/api/public/v1'
}

function storePaths(): string[] {
  const cwd = process.cwd()
  return [
    join(cwd, '.data', 'question-submissions.json'),
    // Admin CMS sibling folder (local monorepo only)
    join(cwd, 'admincn-1.0.0', '.data', 'question-submissions.json'),
  ]
}

function ensureWrite(path: string, rows: Row[]) {
  const dir = dirname(path)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(rows, null, 2), 'utf8')
}

function loadFrom(path: string): Row[] {
  if (!existsSync(path)) return []
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8'))
    return Array.isArray(raw) ? (raw as Row[]) : []
  } catch {
    return []
  }
}

function loadAllMerged(): Row[] {
  const byId = new Map<string, Row>()
  for (const path of storePaths()) {
    for (const row of loadFrom(path)) {
      if (row?.id && !byId.has(row.id)) byId.set(row.id, row)
    }
  }
  return [...byId.values()]
}

function findPendingForEmail(email: string): Row | undefined {
  const e = email.trim().toLowerCase()
  return loadAllMerged()
    .filter(r => r.auth_email?.toLowerCase() === e && OPEN_STATUSES.has(r.status))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0]
}

function saveLocalMirror(row: Row) {
  // Best-effort local mirror for monorepo / local admin — production Admin is authoritative via API.
  for (const path of storePaths()) {
    try {
      const rows = loadFrom(path)
      if (rows.some(r => r.id === row.id)) continue
      const dup = rows.find(
        r =>
          r.auth_email === row.auth_email &&
          r.question.trim().toLowerCase() === row.question.trim().toLowerCase() &&
          Math.abs(Date.parse(r.created_at) - Date.parse(row.created_at)) < 120_000
      )
      if (dup) continue
      rows.unshift(row)
      ensureWrite(path, rows)
    } catch {
      /* ignore one path */
    }
  }
}

/**
 * Check whether the signed-in email already has an unanswered question.
 * Prefers Admin CMS (production). Falls back to local files for offline/dev.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = String(url.searchParams.get('email') || '')
    .trim()
    .toLowerCase()
  if (!email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'email required' }, { status: 400 })
  }

  try {
    const res = await fetch(`${adminCmsBase()}/questions?email=${encodeURIComponent(email)}&t=${Date.now()}`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data && typeof data.pending === 'boolean') {
        return NextResponse.json(data)
      }
    }
  } catch {
    /* fall through to local */
  }

  const pending = findPendingForEmail(email)
  if (!pending) {
    return NextResponse.json({ ok: true, pending: false })
  }
  return NextResponse.json({
    ok: true,
    pending: true,
    id: pending.id,
    created_at: pending.created_at,
    category: pending.category,
    question_preview: pending.question.slice(0, 160),
    answer_channel: pending.answer_channel === 'telegram' ? 'telegram' : 'email',
  })
}

/**
 * Public Ask-an-Ustaz intake — forwards to Admin CMS so the inbox on Render receives it.
 * Also mirrors locally when possible (dev monorepo).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const authEmail = String(body.auth_email || body.contact || body.email || '')
    .trim()
    .toLowerCase()
  const question = String(body.question || body.question_text || '').trim()
  const category = String(body.category || 'General Islamic Question').trim()
  const userId = typeof body.user_id === 'string' ? body.user_id : null
  const name = typeof body.name === 'string' ? body.name.trim() : authEmail
  const channelRaw = String(body.answer_channel || 'email')
    .trim()
    .toLowerCase()
  const answer_channel = channelRaw === 'telegram' ? 'telegram' : 'email'

  if (!authEmail.includes('@')) {
    return NextResponse.json({ ok: false, error: 'Authenticated email required.' }, { status: 400 })
  }
  if (question.length < 5) {
    return NextResponse.json({ ok: false, error: 'Question is too short.' }, { status: 400 })
  }

  const payload = {
    name,
    contact: authEmail,
    category,
    question,
    user_id: userId,
    auth_email: authEmail,
    answer_channel,
  }

  // Production path: Admin on Render is the inbox source of truth
  try {
    const res = await fetch(`${adminCmsBase()}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json().catch(() => ({}))
    if (res.status === 409 || data.pending) {
      const answer_channel =
        data.answer_channel === 'telegram' ? 'telegram' : 'email'
      return NextResponse.json(
        {
          ok: false,
          pending: true,
          id: data.id,
          question_preview: data.question_preview,
          answer_channel,
          error:
            data.error ||
            (answer_channel === 'telegram'
              ? 'You already have a question waiting. In shā’ Allāh the Ustaz will reply on Telegram — please wait before asking another.'
              : 'You already have a question waiting. In shā’ Allāh the Ustaz will reply by email — please wait before asking another.'),
          check_email: answer_channel === 'email',
          check_telegram: answer_channel === 'telegram',
        },
        { status: 409 }
      )
    }
    if (res.ok && data.ok) {
      // Local mirror (best effort)
      const now = new Date().toISOString()
      saveLocalMirror({
        id: String(data.id || randomUUID()),
        user_id: userId,
        auth_email: authEmail,
        name,
        category,
        question,
        status: 'new',
        assigned_to: null,
        greeting: null,
        answer: null,
        description: null,
        cover_url: null,
        audio_url: null,
        video_url: null,
        published_public: false,
        answered_at: null,
        answered_by: null,
        answer_channel,
        delivery_status: 'pending',
        email_sent: false,
        email_error: null,
        admin_seen_at: null,
        created_at: now,
        updated_at: now,
      })
      return NextResponse.json({
        ok: true,
        id: data.id,
        answer_channel,
        message:
          data.message ||
          (answer_channel === 'telegram'
            ? 'Question received. An Ustaz will answer on Telegram.'
            : 'Question received. An Ustaz will answer and the reply will be sent to your email. Please stay alert.'),
      })
    }
    // If Admin returned a hard error, surface it
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: data.error || `Admin inbox error (${res.status}).` },
        { status: 502 }
      )
    }
  } catch {
    /* Admin unreachable — try local fallback for offline/dev */
  }

  // Local/dev fallback when Admin API is unreachable
  const pending = findPendingForEmail(authEmail)
  if (pending) {
    const answer_channel =
      pending.answer_channel === 'telegram' ? 'telegram' : 'email'
    return NextResponse.json(
      {
        ok: false,
        pending: true,
        id: pending.id,
        question_preview: pending.question.slice(0, 160),
        answer_channel,
        error:
          answer_channel === 'telegram'
            ? 'You already have a question waiting. In shā’ Allāh the Ustaz will reply on Telegram — please wait before asking another.'
            : 'You already have a question waiting. In shā’ Allāh the Ustaz will reply by email — please wait before asking another.',
        check_email: answer_channel === 'email',
        check_telegram: answer_channel === 'telegram',
      },
      { status: 409 }
    )
  }

  const now = new Date().toISOString()
  const row: Row = {
    id: randomUUID(),
    user_id: userId,
    auth_email: authEmail,
    name,
    category,
    question,
    status: 'new',
    assigned_to: null,
    greeting: null,
    answer: null,
    description: null,
    cover_url: null,
    audio_url: null,
    video_url: null,
    published_public: false,
    answered_at: null,
    answered_by: null,
    answer_channel,
    delivery_status: 'pending',
    email_sent: false,
    email_error: null,
    admin_seen_at: null,
    created_at: now,
    updated_at: now,
  }

  try {
    saveLocalMirror(row)
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Could not save.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    id: row.id,
    message:
      'Question received (saved locally). Deploy Admin CMS to sync inbox in production.',
  })
}
