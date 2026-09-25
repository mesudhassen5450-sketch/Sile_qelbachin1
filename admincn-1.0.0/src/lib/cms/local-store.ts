import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

import type {
  AudioItemRecord,
  AuditLog,
  CmsStoreSnapshot,
  DersRecord,
  KitabRecord,
  MediaAsset,
  PdfItemRecord,
  ReminderRecord,
  SahabahRecord,
  ScanRun,
  VideoItemRecord
} from './types'

const DATA_DIR = join(process.cwd(), '.data')
const STORE_PATH = join(DATA_DIR, 'cms-store.json')

function emptyStore(): CmsStoreSnapshot {
  return {
    media_assets: [],
    kitabs: [],
    ders: [],
    audio_items: [],
    video_items: [],
    pdf_items: [],
    sahabah_items: [],
    reminders: [],
    analytics_events: [],
    scan_runs: [],
    audit_logs: [],
    meta: { last_scan_at: null, backend: 'local' }
  }
}

export function loadLocalStore(): CmsStoreSnapshot {
  if (!existsSync(STORE_PATH)) return emptyStore()
  try {
    const raw = JSON.parse(readFileSync(STORE_PATH, 'utf8')) as CmsStoreSnapshot
    return {
      ...emptyStore(),
      ...raw,
      sahabah_items: raw.sahabah_items || [],
      reminders: raw.reminders || [],
      analytics_events: Array.isArray(raw.analytics_events) ? raw.analytics_events.slice(0, 50000) : [],
      meta: { ...emptyStore().meta, ...(raw.meta || {}), backend: 'local' }
    }
  } catch {
    return emptyStore()
  }
}

export function saveLocalStore(store: CmsStoreSnapshot): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  const payload: CmsStoreSnapshot = {
    ...store,
    meta: { ...store.meta, backend: 'local' }
  }
  writeFileSync(STORE_PATH, JSON.stringify(payload, null, 2), 'utf8')
}

export function newId(): string {
  return randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

export type UpsertMediaResult = {
  asset: MediaAsset
  action: 'imported' | 'updated' | 'skipped'
}

export function upsertMediaAsset(
  store: CmsStoreSnapshot,
  input: Omit<MediaAsset, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): UpsertMediaResult {
  const existing = store.media_assets.find(
    a =>
      a.storage_provider === input.storage_provider &&
      a.bucket === input.bucket &&
      a.object_key === input.object_key
  )

  if (existing) {
    const changed =
      existing.file_size !== input.file_size ||
      existing.etag !== input.etag ||
      existing.last_modified !== input.last_modified ||
      existing.mime_type !== input.mime_type

    if (!changed) {
      return { asset: existing, action: 'skipped' }
    }

    const updated: MediaAsset = {
      ...existing,
      ...input,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: nowIso()
    }
    store.media_assets = store.media_assets.map(a => (a.id === existing.id ? updated : a))
    return { asset: updated, action: 'updated' }
  }

  const created: MediaAsset = {
    ...input,
    id: input.id || newId(),
    created_at: nowIso(),
    updated_at: nowIso()
  }
  store.media_assets.push(created)
  return { asset: created, action: 'imported' }
}

export function appendAudit(
  store: CmsStoreSnapshot,
  entry: Omit<AuditLog, 'id' | 'created_at'> & { id?: string; created_at?: string }
) {
  store.audit_logs.unshift({
    id: entry.id || newId(),
    admin_id: entry.admin_id,
    admin_email: entry.admin_email,
    action: entry.action,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id,
    before_data: entry.before_data,
    after_data: entry.after_data,
    created_at: entry.created_at || nowIso()
  })
  if (store.audit_logs.length > 2000) store.audit_logs = store.audit_logs.slice(0, 2000)
}

export function upsertBySlug<T extends { id: string; slug: string }>(
  rows: T[],
  row: T
): { rows: T[]; action: 'imported' | 'updated' } {
  const idx = rows.findIndex(r => r.slug === row.slug)
  if (idx >= 0) {
    const next = [...rows]
    next[idx] = { ...rows[idx], ...row, id: rows[idx].id }
    return { rows: next, action: 'updated' }
  }
  return { rows: [...rows, row], action: 'imported' }
}

export function upsertByLegacyId<T extends { id: string; legacy_id: string | null }>(
  rows: T[],
  row: T
): { rows: T[]; action: 'imported' | 'updated' | 'skipped' } {
  if (!row.legacy_id) {
    return { rows: [...rows, row], action: 'imported' }
  }
  const idx = rows.findIndex(r => r.legacy_id === row.legacy_id)
  if (idx >= 0) {
    const next = [...rows]
    next[idx] = { ...rows[idx], ...row, id: rows[idx].id }
    return { rows: next, action: 'updated' }
  }
  return { rows: [...rows, row], action: 'imported' }
}

export type ContentBundle = {
  kitabs: KitabRecord[]
  ders: DersRecord[]
  audio_items: AudioItemRecord[]
  video_items: VideoItemRecord[]
  pdf_items: PdfItemRecord[]
}

export function getContentStats(store: CmsStoreSnapshot) {
  const byType = store.media_assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.media_type] = (acc[a.media_type] || 0) + 1
    return acc
  }, {})

  return {
    media_total: store.media_assets.length,
    by_type: byType,
    orphans: store.media_assets.filter(a => a.is_orphan).length,
    needs_review: store.media_assets.filter(a => a.needs_review).length,
    kitabs: store.kitabs.length,
    ders: store.ders.length,
    audio: store.audio_items.length,
    video: store.video_items.length,
    pdfs: store.pdf_items.length,
    last_scan_at: store.meta.last_scan_at,
    backend: store.meta.backend,
    last_scan_run: store.scan_runs[0] || null
  }
}

export function findAssetByKey(
  store: CmsStoreSnapshot,
  objectKey: string
): MediaAsset | undefined {
  return store.media_assets.find(a => a.object_key === objectKey)
}

export type { ScanRun }
