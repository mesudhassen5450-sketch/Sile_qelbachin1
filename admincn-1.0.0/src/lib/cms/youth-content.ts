import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

import {
  applyPriorityAssignments,
  claimPriority,
  compareByPriorityThenDate,
  insertAtFrontPriorities,
} from '@/lib/cms/editorial'

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

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
}

function load(kind: YouthKind): YouthContentItem[] {
  ensureDir()
  const p = pathFor(kind)
  if (!existsSync(p)) return []
  try {
    const raw = JSON.parse(readFileSync(p, 'utf8'))
    if (!Array.isArray(raw)) return []
    return (raw as YouthContentItem[]).map(r => ({
      ...r,
      cover_url: r.cover_url || null,
      audio_url: r.audio_url || null,
      video_url: r.video_url || null,
      featured: Boolean(r.featured),
      priority: typeof r.priority === 'number' && r.priority >= 1 ? r.priority : Math.max(1, raw.length),
      scheduled_at: r.scheduled_at || null,
    }))
  } catch {
    return []
  }
}

function save(kind: YouthKind, rows: YouthContentItem[]) {
  ensureDir()
  writeFileSync(pathFor(kind), JSON.stringify(rows, null, 2), 'utf8')
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || randomUUID().slice(0, 8)
}

export function listYouthContent(kind: YouthKind): YouthContentItem[] {
  return load(kind).sort(compareByPriorityThenDate)
}

export function listPublishedYouthContent(kind: YouthKind) {
  const now = Date.now()
  return listYouthContent(kind)
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
    }))
}

export function upsertYouthContent(
  kind: YouthKind,
  input: Partial<YouthContentItem> & { title_en?: string; title_am?: string }
): YouthContentItem {
  let rows = load(kind)
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
    save(kind, rows)
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
  save(kind, rows)
  return rows.find(r => r.id === row.id) || row
}

export function deleteYouthContent(kind: YouthKind, id: string) {
  const rows = load(kind).filter(r => r.id !== id)
  save(kind, rows)
}
