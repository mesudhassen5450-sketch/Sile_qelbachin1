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
  email_sent: boolean
  email_error: string | null
  admin_seen_at?: string | null
  created_at: string
  updated_at: string
}

const OPEN_STATUSES = new Set(['new', 'assigned', 'in_review', 'user_replied'])

function storePaths(): string[] {
  const cwd = process.cwd()
  return [
    join(cwd, '.data', 'question-submissions.json'),
    // Admin CMS sibling folder (local monorepo)
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

function saveEverywhere(row: Row) {
  // Write once to website store, then mirror same id to Admin store.
  // Do NOT also POST to Admin public API — that created duplicate inbox rows.
  const paths = storePaths()
  for (const path of paths) {
    try {
      const rows = loadFrom(path)
      if (rows.some(r => r.id === row.id)) continue
      // Dedupe near-identical recent submissions
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
 * GET /api/ask-question?email=user@example.com
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = String(url.searchParams.get('email') || '')
    .trim()
    .toLowerCase()
  if (!email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'email required' }, { status: 400 })
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
  })
}

/**
 * Public Ask-an-Ustaz intake — stores authenticated email + question for Admin inbox.
 * Blocks a second question while the first is still unanswered (open statuses).
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

  if (!authEmail.includes('@')) {
    return NextResponse.json({ ok: false, error: 'Authenticated email required.' }, { status: 400 })
  }
  if (question.length < 5) {
    return NextResponse.json({ ok: false, error: 'Question is too short.' }, { status: 400 })
  }

  const pending = findPendingForEmail(authEmail)
  if (pending) {
    return NextResponse.json(
      {
        ok: false,
        pending: true,
        id: pending.id,
        error:
          'You already have a question waiting for an answer. Please check your email for the Ustaz reply before asking another.',
        check_email: true,
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
    email_sent: false,
    email_error: null,
    admin_seen_at: null,
    created_at: now,
    updated_at: now,
  }

  try {
    saveEverywhere(row)
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
      'Question received. An Ustaz will answer and the reply will be sent to your email. Please stay alert.',
  })
}
