import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

const DATA_DIR = join(process.cwd(), '.data')
const PATH = join(DATA_DIR, 'question-submissions.json')

/** Private Ask-an-Ustaz workflow statuses (never public by default). */
export type QuestionStatus =
  | 'new'
  | 'assigned'
  | 'in_review'
  | 'answered'
  | 'user_replied'
  | 'closed'
  | 'archived'

export const QUESTION_STATUSES: QuestionStatus[] = [
  'new',
  'assigned',
  'in_review',
  'answered',
  'user_replied',
  'closed',
  'archived',
]

/** Still waiting on Admin/Ustaz — blocks a second public ask. */
export const OPEN_QUESTION_STATUSES: QuestionStatus[] = [
  'new',
  'assigned',
  'in_review',
  'user_replied',
]

const LEGACY_STATUS: Record<string, QuestionStatus> = {
  new: 'new',
  assigned: 'assigned',
  in_review: 'in_review',
  answered: 'answered',
  user_replied: 'user_replied',
  closed: 'closed',
  archived: 'archived',
}

export type QuestionSubmission = {
  id: string
  user_id: string | null
  auth_email: string
  name: string | null
  category: string
  question: string
  status: QuestionStatus
  assigned_to: string | null
  /** Optional greeting the Ustaz chooses (e.g. As-salamu alaykum) */
  greeting: string | null
  answer: string | null
  description: string | null
  cover_url: string | null
  audio_url: string | null
  video_url: string | null
  published_public: boolean
  answered_at: string | null
  answered_by: string | null
  closed_at: string | null
  email_sent: boolean
  email_error: string | null
  /** Set when an admin opens the inbox / views this question — clears sidebar badge */
  admin_seen_at: string | null
  created_at: string
  updated_at: string
}

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
}

function coerceStatus(raw: unknown): QuestionStatus {
  const key = String(raw || 'new').toLowerCase().replace(/\s+/g, '_')
  return LEGACY_STATUS[key] || 'new'
}

function normalize(row: Partial<QuestionSubmission> & { id: string }): QuestionSubmission {
  return {
    id: row.id,
    user_id: row.user_id ?? null,
    auth_email: row.auth_email || '',
    name: row.name ?? null,
    category: row.category || 'General',
    question: row.question || '',
    status: coerceStatus(row.status),
    assigned_to: row.assigned_to ?? null,
    greeting: row.greeting ?? null,
    answer: row.answer ?? null,
    description: row.description ?? null,
    cover_url: row.cover_url ?? null,
    audio_url: row.audio_url ?? null,
    video_url: row.video_url ?? null,
    published_public: Boolean(row.published_public),
    answered_at: row.answered_at ?? null,
    answered_by: row.answered_by ?? null,
    closed_at: row.closed_at ?? null,
    email_sent: Boolean(row.email_sent),
    email_error: row.email_error ?? null,
    admin_seen_at: row.admin_seen_at ?? null,
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  }
}

function loadAll(): QuestionSubmission[] {
  ensureDir()
  const paths = [
    PATH,
    // Website monorepo root store (written by /api/ask-question)
    join(process.cwd(), '..', '.data', 'question-submissions.json'),
  ]
  const byId = new Map<string, QuestionSubmission>()
  for (const p of paths) {
    if (!existsSync(p)) continue
    try {
      const raw = JSON.parse(readFileSync(p, 'utf8'))
      if (!Array.isArray(raw)) continue
      for (const row of raw as QuestionSubmission[]) {
        if (row?.id && !byId.has(row.id)) byId.set(row.id, normalize(row))
      }
    } catch {
      /* skip */
    }
  }
  return [...byId.values()]
}

function saveAll(rows: QuestionSubmission[]) {
  ensureDir()
  writeFileSync(PATH, JSON.stringify(rows, null, 2), 'utf8')
  // Mirror to website monorepo store when present
  const mirror = join(process.cwd(), '..', '.data', 'question-submissions.json')
  try {
    const parent = join(process.cwd(), '..', '.data')
    if (!existsSync(parent)) mkdirSync(parent, { recursive: true })
    writeFileSync(mirror, JSON.stringify(rows, null, 2), 'utf8')
  } catch {
    /* ignore mirror errors */
  }
}

export function listQuestionSubmissions(): QuestionSubmission[] {
  const rows = loadAll()
  // Collapse accidental duplicates (same asker + same text within 2 minutes)
  const seen = new Set<string>()
  const deduped: QuestionSubmission[] = []
  const sorted = rows.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  for (const row of sorted) {
    const key = `${row.auth_email}|${row.question.trim().toLowerCase()}`
    if (seen.has(key)) {
      const first = deduped.find(
        d =>
          d.auth_email === row.auth_email &&
          d.question.trim().toLowerCase() === row.question.trim().toLowerCase()
      )
      if (
        first &&
        Math.abs(Date.parse(first.created_at) - Date.parse(row.created_at)) < 120_000
      ) {
        continue
      }
    }
    seen.add(key)
    deduped.push(row)
  }
  return deduped
}

export function createQuestionSubmission(input: {
  user_id?: string | null
  auth_email: string
  name?: string | null
  category?: string
  question: string
}): QuestionSubmission {
  const email = String(input.auth_email || '').trim().toLowerCase()
  const question = String(input.question || '').trim()
  if (!email || !email.includes('@')) throw new Error('Authenticated email is required.')
  if (question.length < 5) throw new Error('Question is too short.')

  const rows = loadAll()
  const nowMs = Date.now()
  const existing = rows.find(
    r =>
      r.auth_email === email &&
      r.question.trim().toLowerCase() === question.toLowerCase() &&
      Math.abs(nowMs - Date.parse(r.created_at)) < 120_000
  )
  if (existing) return existing

  const now = new Date().toISOString()
  const row: QuestionSubmission = {
    id: randomUUID(),
    user_id: input.user_id || null,
    auth_email: email,
    name: input.name?.trim() || null,
    category: (input.category || 'General Islamic Question').trim(),
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
    closed_at: null,
    email_sent: false,
    email_error: null,
    admin_seen_at: null,
    created_at: now,
    updated_at: now,
  }
  rows.unshift(row)
  saveAll(rows)
  return row
}

/** Unseen = open/new workflow and never opened by admin */
export function countUnseenInbox(): number {
  return listQuestionSubmissions().filter(
    r => OPEN_QUESTION_STATUSES.includes(r.status) && !r.admin_seen_at
  ).length
}

export function markQuestionSeen(id: string): QuestionSubmission | null {
  const rows = loadAll()
  const idx = rows.findIndex(r => r.id === id)
  if (idx < 0) return null
  if (rows[idx].admin_seen_at) return normalize(rows[idx])
  const now = new Date().toISOString()
  rows[idx] = { ...rows[idx], admin_seen_at: now, updated_at: now }
  saveAll(rows)
  return normalize(rows[idx])
}

/** Mark all current open questions as seen (admin opened the inbox). */
export function markAllNewSeen(): number {
  const rows = loadAll()
  const now = new Date().toISOString()
  let n = 0
  for (let i = 0; i < rows.length; i++) {
    if (OPEN_QUESTION_STATUSES.includes(rows[i].status) && !rows[i].admin_seen_at) {
      rows[i] = { ...rows[i], admin_seen_at: now, updated_at: now }
      n++
    }
  }
  if (n) saveAll(rows)
  return n
}

export function getQuestionSubmission(id: string): QuestionSubmission | null {
  return loadAll().find(r => r.id === id) || null
}

export function updateQuestionStatus(input: {
  id: string
  status: QuestionStatus
  assigned_to?: string | null
}): QuestionSubmission {
  const status = coerceStatus(input.status)
  if (!QUESTION_STATUSES.includes(status)) throw new Error('Invalid status.')
  const rows = loadAll()
  const idx = rows.findIndex(r => r.id === input.id)
  if (idx < 0) throw new Error('Question not found.')
  const now = new Date().toISOString()
  const prev = rows[idx]
  const next: QuestionSubmission = {
    ...prev,
    status,
    assigned_to:
      input.assigned_to !== undefined
        ? String(input.assigned_to || '').trim() || null
        : prev.assigned_to,
    closed_at: status === 'closed' || status === 'archived' ? prev.closed_at || now : null,
    updated_at: now,
  }
  rows[idx] = next
  saveAll(rows)
  return normalize(next)
}

export function answerQuestionSubmission(input: {
  id: string
  greeting?: string | null
  answer: string
  description?: string | null
  cover_url?: string | null
  audio_url?: string | null
  video_url?: string | null
  published_public?: boolean
  answered_by?: string | null
  email_sent?: boolean
  email_error?: string | null
}): QuestionSubmission {
  const rows = loadAll()
  const idx = rows.findIndex(r => r.id === input.id)
  if (idx < 0) throw new Error('Question not found.')
  const answer = String(input.answer || '').trim()
  if (answer.length < 2) throw new Error('Answer is required.')
  const now = new Date().toISOString()
  const next: QuestionSubmission = {
    ...rows[idx],
    greeting: String(input.greeting || '').trim() || null,
    answer,
    description: String(input.description || '').trim() || null,
    cover_url: String(input.cover_url || '').trim() || null,
    audio_url: String(input.audio_url || '').trim() || null,
    video_url: String(input.video_url || '').trim() || null,
    published_public: Boolean(input.published_public),
    status: 'answered',
    answered_at: now,
    answered_by: input.answered_by || null,
    email_sent: Boolean(input.email_sent),
    email_error: input.email_error || null,
    updated_at: now,
  }
  rows[idx] = next
  saveAll(rows)
  return next
}

export function archiveQuestionSubmission(id: string): QuestionSubmission {
  return updateQuestionStatus({ id, status: 'archived' })
}

export function deleteQuestionSubmission(id: string): boolean {
  const rows = loadAll()
  const next = rows.filter(r => r.id !== id)
  if (next.length === rows.length) return false
  saveAll(next)
  return true
}
