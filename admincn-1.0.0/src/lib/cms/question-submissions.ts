/**
 * Ask-an-Ustaz inbox — durable on Supabase + R2 (local disk alone vanishes on Render).
 * Run migration 007_question_submissions.sql once in Supabase SQL Editor.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

import { getObjectTextFromR2, putObjectToR2 } from '@/lib/cms/r2'
import { getServiceSupabase } from '@/lib/cms/supabase'

const DATA_DIR = join(process.cwd(), '.data')
const PATH = join(DATA_DIR, 'question-submissions.json')
const R2_KEY = 'cms-backups/question-submissions.json'

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

function rowToDb(r: QuestionSubmission) {
  return {
    id: r.id,
    user_id: r.user_id,
    auth_email: r.auth_email,
    name: r.name,
    category: r.category,
    question: r.question,
    status: r.status,
    assigned_to: r.assigned_to,
    greeting: r.greeting,
    answer: r.answer,
    description: r.description,
    cover_url: r.cover_url,
    audio_url: r.audio_url,
    video_url: r.video_url,
    published_public: r.published_public,
    answered_at: r.answered_at,
    answered_by: r.answered_by,
    closed_at: r.closed_at,
    email_sent: r.email_sent,
    email_error: r.email_error,
    admin_seen_at: r.admin_seen_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

function loadLocal(): QuestionSubmission[] {
  ensureDir()
  const paths = [
    PATH,
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

function saveLocal(rows: QuestionSubmission[]) {
  ensureDir()
  writeFileSync(PATH, JSON.stringify(rows, null, 2), 'utf8')
  const mirror = join(process.cwd(), '..', '.data', 'question-submissions.json')
  try {
    const parent = join(process.cwd(), '..', '.data')
    if (!existsSync(parent)) mkdirSync(parent, { recursive: true })
    writeFileSync(mirror, JSON.stringify(rows, null, 2), 'utf8')
  } catch {
    /* ignore */
  }
}

async function loadFromSupabase(): Promise<QuestionSubmission[] | null> {
  const sb = getServiceSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('question_submissions').select('*')
  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message)) return null
    throw new Error(`Could not load questions: ${error.message}`)
  }
  return (data || []).map(r => normalize(r as QuestionSubmission))
}

async function loadFromR2(): Promise<QuestionSubmission[] | null> {
  try {
    const text = await getObjectTextFromR2(R2_KEY)
    if (!text) return null
    const raw = JSON.parse(text)
    if (!Array.isArray(raw)) return null
    return raw.map(r => normalize(r))
  } catch {
    return null
  }
}

async function persistDurable(rows: QuestionSubmission[]): Promise<void> {
  saveLocal(rows)
  try {
    await putObjectToR2({
      objectKey: R2_KEY,
      body: Buffer.from(JSON.stringify(rows, null, 2), 'utf8'),
      contentType: 'application/json',
      cacheControl: 'no-cache',
    })
  } catch (err) {
    console.warn('[questions] R2 backup failed:', err instanceof Error ? err.message : err)
  }

  const sb = getServiceSupabase()
  if (!sb) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SECRET_KEY) {
      console.warn(
        '[questions] No Supabase service key — questions only on local disk (ephemeral on Render).'
      )
    }
    return
  }

  const payload = rows.map(rowToDb)
  if (payload.length) {
    const { error } = await sb.from('question_submissions').upsert(payload, { onConflict: 'id' })
    if (error) {
      if (/relation|does not exist|schema cache/i.test(error.message)) {
        console.warn(
          '[questions] question_submissions table missing — saved to R2 only. Apply migration 007.'
        )
        throw new Error(
          'Supabase table question_submissions is missing. Run migration 007_question_submissions.sql in the Supabase SQL Editor, then save again.'
        )
      }
      throw new Error(`Could not save questions: ${error.message}`)
    }
  }

  const { data: existing, error: listErr } = await sb.from('question_submissions').select('id')
  if (!listErr && existing) {
    const keep = new Set(rows.map(r => r.id))
    const toDelete = existing.map(r => String(r.id)).filter(id => !keep.has(id))
    if (toDelete.length) {
      await sb.from('question_submissions').delete().in('id', toDelete)
    }
  }
}

function dedupe(rows: QuestionSubmission[]): QuestionSubmission[] {
  const seen = new Set<string>()
  const deduped: QuestionSubmission[] = []
  const sorted = [...rows].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
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

/** Sync local-only list (analytics). Prefer listQuestionSubmissions() for Admin UI. */
export function listQuestionSubmissionsLocal(): QuestionSubmission[] {
  return dedupe(loadLocal())
}

/**
 * Load questions: Supabase → R2 → local disk.
 * Survives Render redeploys once migration 007 is applied.
 */
export async function listQuestionSubmissions(): Promise<QuestionSubmission[]> {
  const fromDb = await loadFromSupabase()
  if (fromDb && fromDb.length) {
    saveLocal(fromDb)
    return dedupe(fromDb)
  }

  const fromR2 = await loadFromR2()
  if (fromR2 && fromR2.length) {
    saveLocal(fromR2)
    try {
      await persistDurable(fromR2)
    } catch {
      /* migration may still be missing */
    }
    return dedupe(fromR2)
  }

  // Empty DB is authoritative once the table exists
  if (fromDb) {
    saveLocal([])
    return []
  }

  return dedupe(loadLocal())
}

export async function findOpenQuestionByEmail(
  email: string
): Promise<QuestionSubmission | undefined> {
  const e = String(email || '')
    .trim()
    .toLowerCase()
  if (!e.includes('@')) return undefined
  const rows = await listQuestionSubmissions()
  return rows
    .filter(r => r.auth_email?.toLowerCase() === e && OPEN_QUESTION_STATUSES.includes(r.status))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0]
}

export async function createQuestionSubmission(input: {
  user_id?: string | null
  auth_email: string
  name?: string | null
  category?: string
  question: string
}): Promise<QuestionSubmission> {
  const email = String(input.auth_email || '')
    .trim()
    .toLowerCase()
  const question = String(input.question || '').trim()
  if (!email || !email.includes('@')) throw new Error('Authenticated email is required.')
  if (question.length < 5) throw new Error('Question is too short.')

  const pending = await findOpenQuestionByEmail(email)
  if (pending) {
    const err = new Error(
      'You already have a question waiting for an answer. Please check your email before asking another.'
    ) as Error & { code?: string; pendingId?: string; preview?: string }
    err.code = 'PENDING'
    err.pendingId = pending.id
    err.preview = pending.question.slice(0, 160)
    throw err
  }

  const rows = await listQuestionSubmissions()
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
  const next = [row, ...rows]
  await persistDurable(next)
  return row
}

/** Unseen = open workflow and never opened by admin (drives red sidebar badge). */
export async function countUnseenInbox(): Promise<number> {
  const rows = await listQuestionSubmissions()
  return rows.filter(r => OPEN_QUESTION_STATUSES.includes(r.status) && !r.admin_seen_at).length
}

export async function markQuestionSeen(id: string): Promise<QuestionSubmission | null> {
  const rows = await listQuestionSubmissions()
  const idx = rows.findIndex(r => r.id === id)
  if (idx < 0) return null
  if (rows[idx].admin_seen_at) return normalize(rows[idx])
  const now = new Date().toISOString()
  rows[idx] = { ...rows[idx], admin_seen_at: now, updated_at: now }
  await persistDurable(rows)
  return normalize(rows[idx])
}

/** Mark all current open questions as seen (admin opened the inbox). */
export async function markAllNewSeen(): Promise<number> {
  const rows = await listQuestionSubmissions()
  const now = new Date().toISOString()
  let n = 0
  for (let i = 0; i < rows.length; i++) {
    if (OPEN_QUESTION_STATUSES.includes(rows[i].status) && !rows[i].admin_seen_at) {
      rows[i] = { ...rows[i], admin_seen_at: now, updated_at: now }
      n++
    }
  }
  if (n) await persistDurable(rows)
  return n
}

export async function getQuestionSubmission(id: string): Promise<QuestionSubmission | null> {
  const rows = await listQuestionSubmissions()
  return rows.find(r => r.id === id) || null
}

export async function updateQuestionStatus(input: {
  id: string
  status: QuestionStatus
  assigned_to?: string | null
}): Promise<QuestionSubmission> {
  const status = coerceStatus(input.status)
  if (!QUESTION_STATUSES.includes(status)) throw new Error('Invalid status.')
  const rows = await listQuestionSubmissions()
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
  await persistDurable(rows)
  return normalize(next)
}

export async function answerQuestionSubmission(input: {
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
}): Promise<QuestionSubmission> {
  const rows = await listQuestionSubmissions()
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
  await persistDurable(rows)
  return next
}

export async function archiveQuestionSubmission(id: string): Promise<QuestionSubmission> {
  return updateQuestionStatus({ id, status: 'archived' })
}

export async function deleteQuestionSubmission(id: string): Promise<boolean> {
  const rows = await listQuestionSubmissions()
  const next = rows.filter(r => r.id !== id)
  if (next.length === rows.length) return false
  await persistDurable(next)
  return true
}
