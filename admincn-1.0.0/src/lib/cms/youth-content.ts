import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

import {
  applyPriorityAssignments,
  claimPriority,
  compareByPriorityThenDate,
  insertAtFrontPriorities,
} from '@/lib/cms/editorial'
import { getObjectTextFromR2, putObjectToR2 } from '@/lib/cms/r2'
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/cms/supabase'

/** Published Youth & Heart content: marriage | articles | questions (public Q&A). */

export type YouthKind = 'marriage' | 'articles' | 'questions'

export type YouthContentItem = {
  id: string
  slug: string
  title_en: string
  title_am: string
  title_ar: string
  excerpt_en: string
  excerpt_am: string
  excerpt_ar: string
  body_en: string
  body_am: string
  body_ar: string
  cover_url: string | null
  audio_url: string | null
  video_url: string | null
  status: 'draft' | 'published' | 'archived'
  featured: boolean
  /** 1 = highest on public lists */
  priority: number
  scheduled_at: string | null
  created_at: string
  updated_at: string
}

const DATA_DIR = join(process.cwd(), '.data')

function pathFor(kind: YouthKind) {
  return join(DATA_DIR, `youth-${kind}.json`)
}

function r2KeyFor(kind: YouthKind) {
  return `cms-backups/youth-${kind}.json`
}

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
}

function normalizeRows(raw: unknown): YouthContentItem[] {
  if (!Array.isArray(raw)) return []
  return (raw as YouthContentItem[]).map(r => ({
    ...r,
    cover_url: r.cover_url || null,
    audio_url: r.audio_url || null,
    video_url: r.video_url || null,
    featured: Boolean(r.featured),
    priority: typeof r.priority === 'number' && r.priority >= 1 ? r.priority : 100,
    scheduled_at: r.scheduled_at || null,
  }))
}

function loadLocal(kind: YouthKind): YouthContentItem[] {
  ensureDir()
  const p = pathFor(kind)
  if (!existsSync(p)) return []
  try {
    return normalizeRows(JSON.parse(readFileSync(p, 'utf8')))
  } catch {
    return []
  }
}

function saveLocal(kind: YouthKind, rows: YouthContentItem[]) {
  ensureDir()
  writeFileSync(pathFor(kind), JSON.stringify(rows, null, 2), 'utf8')
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || randomUUID().slice(0, 8)
  )
}

function rowToDb(kind: YouthKind, r: YouthContentItem) {
  return {
    id: r.id,
    kind,
    slug: r.slug,
    title_en: r.title_en,
    title_am: r.title_am,
    title_ar: r.title_ar,
    excerpt_en: r.excerpt_en,
    excerpt_am: r.excerpt_am,
    excerpt_ar: r.excerpt_ar,
    body_en: r.body_en,
    body_am: r.body_am,
    body_ar: r.body_ar,
    cover_url: r.cover_url,
    audio_url: r.audio_url,
    video_url: r.video_url,
    status: r.status,
    featured: r.featured,
    priority: r.priority,
    scheduled_at: r.scheduled_at,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

function dbToRow(r: Record<string, unknown>): YouthContentItem {
  return {
    id: String(r.id),
    slug: String(r.slug || ''),
    title_en: String(r.title_en || ''),
    title_am: String(r.title_am || ''),
    title_ar: String(r.title_ar || ''),
    excerpt_en: String(r.excerpt_en || ''),
    excerpt_am: String(r.excerpt_am || ''),
    excerpt_ar: String(r.excerpt_ar || ''),
    body_en: String(r.body_en || ''),
    body_am: String(r.body_am || ''),
    body_ar: String(r.body_ar || ''),
    cover_url: (r.cover_url as string) || null,
    audio_url: (r.audio_url as string) || null,
    video_url: (r.video_url as string) || null,
    status: (r.status as YouthContentItem['status']) || 'published',
    featured: Boolean(r.featured),
    priority: typeof r.priority === 'number' ? r.priority : 100,
    scheduled_at: (r.scheduled_at as string) || null,
    created_at: String(r.created_at || new Date().toISOString()),
    updated_at: String(r.updated_at || new Date().toISOString()),
  }
}

async function loadFromSupabase(kind: YouthKind): Promise<YouthContentItem[] | null> {
  const sb = getServiceSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('youth_content').select('*').eq('kind', kind)
  if (error) {
    // Table missing until migration 005 is applied
    if (/relation|does not exist|schema cache/i.test(error.message)) return null
    throw new Error(`Could not load youth content: ${error.message}`)
  }
  return normalizeRows((data || []).map(dbToRow))
}

async function loadFromR2(kind: YouthKind): Promise<YouthContentItem[] | null> {
  try {
    const text = await getObjectTextFromR2(r2KeyFor(kind))
    if (!text) return null
    return normalizeRows(JSON.parse(text))
  } catch {
    return null
  }
}

async function persistDurable(kind: YouthKind, rows: YouthContentItem[]): Promise<{ backend: string }> {
  saveLocal(kind, rows)

  let r2Ok = false
  try {
    await putObjectToR2({
      objectKey: r2KeyFor(kind),
      body: Buffer.from(JSON.stringify(rows, null, 2), 'utf8'),
      contentType: 'application/json',
      cacheControl: 'no-cache',
    })
    r2Ok = true
  } catch (err) {
    console.warn('[youth-content] R2 backup failed:', err instanceof Error ? err.message : err)
  }

  const sb = getServiceSupabase()
  if (!sb) {
    if (r2Ok) return { backend: 'r2' }
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      throw new Error(
        'Could not save permanently (Supabase + R2 unavailable). Check Admin env on Render.'
      )
    }
    return { backend: 'local' }
  }

  const payload = rows.map(r => rowToDb(kind, r))
  if (payload.length) {
    const { error } = await sb.from('youth_content').upsert(payload, { onConflict: 'id' })
    if (error) {
      if (/relation|does not exist|schema cache/i.test(error.message)) {
        if (r2Ok) {
          console.warn(
            '[youth-content] youth_content table missing — saved to R2 only. Apply migration 005.'
          )
          return { backend: 'r2' }
        }
        throw new Error(
          'Supabase table youth_content is missing. Run migration 005_youth_content.sql in the Supabase SQL Editor, then save again.'
        )
      }
      throw new Error(`Could not save youth content: ${error.message}`)
    }
  } else {
    // Empty list: clear kind in DB if table exists
    const { error } = await sb.from('youth_content').delete().eq('kind', kind)
    if (error && !/relation|does not exist|schema cache/i.test(error.message)) {
      throw new Error(`Could not clear youth content: ${error.message}`)
    }
  }

  const { data: existing, error: listErr } = await sb
    .from('youth_content')
    .select('id')
    .eq('kind', kind)
  if (!listErr && existing) {
    const keep = new Set(rows.map(r => r.id))
    const toDelete = existing.map(r => String(r.id)).filter(id => !keep.has(id))
    if (toDelete.length) {
      await sb.from('youth_content').delete().in('id', toDelete)
    }
  }

  return { backend: 'supabase' }
}

/**
 * Load youth content: Supabase → R2 backup → local disk.
 * Local disk alone is ephemeral on Render and must not be the only source.
 */
export async function listYouthContent(kind: YouthKind): Promise<YouthContentItem[]> {
  const fromDb = await loadFromSupabase(kind)
  if (fromDb && fromDb.length) {
    saveLocal(kind, fromDb)
    return [...fromDb].sort(compareByPriorityThenDate)
  }

  const fromR2 = await loadFromR2(kind)
  if (fromR2 && fromR2.length) {
    saveLocal(kind, fromR2)
    // Best-effort hydrate Supabase after migration
    if (isSupabaseConfigured()) {
      try {
        await persistDurable(kind, fromR2)
      } catch {
        /* migration may still be missing */
      }
    }
    return [...fromR2].sort(compareByPriorityThenDate)
  }

  // Empty DB is authoritative once the table exists
  if (fromDb) {
    saveLocal(kind, [])
    return []
  }

  const local = loadLocal(kind)
  return [...local].sort(compareByPriorityThenDate)
}

export async function listPublishedYouthContent(kind: YouthKind) {
  const now = Date.now()
  const rows = await listYouthContent(kind)
  return rows
    .filter(r => {
      if (r.status !== 'published') return false
      if (!r.scheduled_at) return true
      const t = Date.parse(r.scheduled_at)
      return !Number.isFinite(t) || t <= now
    })
    .map(r => ({
      id: r.id,
      slug: r.slug,
      title: { en: r.title_en, am: r.title_am, ar: r.title_ar },
      excerpt: { en: r.excerpt_en, am: r.excerpt_am, ar: r.excerpt_ar },
      body: { en: r.body_en, am: r.body_am, ar: r.body_ar },
      coverUrl: r.cover_url || null,
      audioUrl: r.audio_url || null,
      videoUrl: r.video_url || null,
      featured: r.featured,
      priority: r.priority || 1,
      createdAt: r.created_at || null,
      updatedAt: r.updated_at || null,
    }))
}

export async function upsertYouthContent(
  kind: YouthKind,
  input: Partial<YouthContentItem> & { title_en?: string; title_am?: string }
): Promise<YouthContentItem> {
  let rows = await listYouthContent(kind)
  const now = new Date().toISOString()
  const titleEn = (input.title_en || '').trim()
  const titleAm = (input.title_am || '').trim()
  if (!titleEn && !titleAm) throw new Error('Title is required.')

  if (input.id) {
    const idx = rows.findIndex(r => r.id === input.id)
    if (idx < 0) throw new Error('Item not found.')
    const prev = rows[idx]
    const next: YouthContentItem = {
      ...prev,
      ...input,
      title_en: titleEn || prev.title_en,
      title_am: titleAm || prev.title_am,
      title_ar: String(input.title_ar ?? prev.title_ar ?? '').trim(),
      excerpt_en: String(input.excerpt_en ?? prev.excerpt_en ?? '').trim(),
      excerpt_am: String(input.excerpt_am ?? prev.excerpt_am ?? '').trim(),
      excerpt_ar: String(input.excerpt_ar ?? prev.excerpt_ar ?? '').trim(),
      body_en: String(input.body_en ?? prev.body_en ?? '').trim(),
      body_am: String(input.body_am ?? prev.body_am ?? '').trim(),
      body_ar: String(input.body_ar ?? prev.body_ar ?? '').trim(),
      cover_url:
        input.cover_url !== undefined ? String(input.cover_url || '').trim() || null : prev.cover_url || null,
      audio_url:
        input.audio_url !== undefined ? String(input.audio_url || '').trim() || null : prev.audio_url || null,
      video_url:
        input.video_url !== undefined ? String(input.video_url || '').trim() || null : prev.video_url || null,
      status: input.status || prev.status,
      featured: input.featured ?? prev.featured,
      priority:
        input.priority !== undefined
          ? Math.max(1, Number(input.priority) || 1)
          : prev.priority || 1,
      scheduled_at:
        input.scheduled_at !== undefined
          ? String(input.scheduled_at || '').trim() || null
          : prev.scheduled_at || null,
      slug: input.slug?.trim() || prev.slug,
      updated_at: now,
    }
    rows[idx] = next
    if (input.priority !== undefined) {
      const assignments = claimPriority(rows, next.id, next.priority)
      rows = applyPriorityAssignments(rows, assignments, now)
    }
    await persistDurable(kind, rows)
    return rows.find(r => r.id === next.id) || next
  }

  const row: YouthContentItem = {
    id: randomUUID(),
    slug: input.slug?.trim() || slugify(titleEn || titleAm),
    title_en: titleEn,
    title_am: titleAm,
    title_ar: (input.title_ar || '').trim(),
    excerpt_en: (input.excerpt_en || '').trim(),
    excerpt_am: (input.excerpt_am || '').trim(),
    excerpt_ar: (input.excerpt_ar || '').trim(),
    body_en: (input.body_en || '').trim(),
    body_am: (input.body_am || '').trim(),
    body_ar: (input.body_ar || '').trim(),
    cover_url: String(input.cover_url || '').trim() || null,
    audio_url: String(input.audio_url || '').trim() || null,
    video_url: String(input.video_url || '').trim() || null,
    status: input.status || 'published',
    featured: Boolean(input.featured),
    priority: 1,
    scheduled_at: String(input.scheduled_at || '').trim() || null,
    created_at: now,
    updated_at: now,
  }
  rows = [row, ...rows]
  const assignments = insertAtFrontPriorities(
    rows.filter(r => r.id !== row.id),
    row.id
  )
  rows = applyPriorityAssignments(rows, assignments, now)
  await persistDurable(kind, rows)
  return rows.find(r => r.id === row.id) || row
}

export async function deleteYouthContent(kind: YouthKind, id: string) {
  const rows = (await listYouthContent(kind)).filter(r => r.id !== id)
  await persistDurable(kind, rows)
}
