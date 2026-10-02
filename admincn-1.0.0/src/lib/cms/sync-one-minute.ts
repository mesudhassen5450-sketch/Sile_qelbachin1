/**
 * Align Admin Content → 1-Minute sections with the public short feed.
 *
 * Public site falls back to src/data/oneMinuteCatalog.json when /api/public/v1/one-minute
 * is missing. Shorts also exist as video_items/audio_items (same R2 assets) but with
 * categories like "Video Lecture" / "General" — so Admin's category filter showed 0.
 *
 * This retags those records to category `one_minute` and stamps duration metadata.
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

import { isSupabaseConfigured, getServiceSupabase } from '@/lib/cms/supabase'
import type { AudioItemRecord, CmsStoreSnapshot, VideoItemRecord } from '@/lib/cms/types'

type OneMinuteSeedItem = {
  id?: string
  kind?: string
  sourceId?: string
  media_asset_id?: string | null
  mediaUrl?: string | null
  rawFilename?: string | null
  durationSeconds?: number | null
  metadata?: Record<string, unknown> | null
}

type CatalogFile = { items?: OneMinuteSeedItem[] }

const ONE_MINUTE_CAT = 'one_minute'

function fname(urlOrKey: string | null | undefined): string | null {
  if (!urlOrKey) return null
  try {
    const cleaned = decodeURIComponent(String(urlOrKey).split('?')[0].trim())
    const base = cleaned.replace(/\/+$/, '').split('/').pop() || ''
    return base.toLowerCase() || null
  } catch {
    return null
  }
}

function loadWebsiteCatalog(): OneMinuteSeedItem[] {
  const candidates = [
    join(process.cwd(), '../src/data/oneMinuteCatalog.json'),
    join(process.cwd(), '../../src/data/oneMinuteCatalog.json'),
    join(process.cwd(), 'src/data/oneMinuteCatalog.json'),
  ]
  for (const p of candidates) {
    if (!existsSync(p)) continue
    try {
      const raw = JSON.parse(readFileSync(p, 'utf8')) as CatalogFile
      return Array.isArray(raw.items) ? raw.items : []
    } catch {
      /* try next */
    }
  }
  return []
}

function storeOneMinuteItems(store: CmsStoreSnapshot): OneMinuteSeedItem[] {
  const extra = store as CmsStoreSnapshot & { one_minute_items?: OneMinuteSeedItem[] }
  const rows = extra.one_minute_items
  if (!Array.isArray(rows) || !rows.length) return []
  return rows.map(r => ({
    id: r.id,
    kind: r.kind,
    media_asset_id: r.media_asset_id,
    durationSeconds:
      typeof r.metadata?.duration_seconds === 'number'
        ? (r.metadata.duration_seconds as number)
        : null,
    metadata: r.metadata || null,
  }))
}

function formatDurationLabel(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return null
  const s = Math.round(seconds)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return rem ? `${m}m ${rem}s` : `${m}m`
}

function isAlreadyOneMinute(category: string | null | undefined): boolean {
  const cat = String(category || '')
    .trim()
    .toLowerCase()
  return cat === 'one_minute' || cat === '1-minute' || cat === 'oneminute'
}

/**
 * Mutates store video/audio categories to `one_minute` for known short clips.
 * Returns number of rows updated.
 */
export function syncOneMinuteCategories(store: CmsStoreSnapshot): number {
  const assets = new Map(store.media_assets.map(a => [a.id, a]))
  const videoByAsset = new Map<string, VideoItemRecord>()
  const audioByAsset = new Map<string, AudioItemRecord>()
  const videoByLegacy = new Map<string, VideoItemRecord>()
  const audioByLegacy = new Map<string, AudioItemRecord>()
  const videoByFile = new Map<string, VideoItemRecord>()
  const audioByFile = new Map<string, AudioItemRecord>()

  for (const v of store.video_items) {
    if (v.video_asset_id) videoByAsset.set(v.video_asset_id, v)
    if (v.legacy_id) videoByLegacy.set(v.legacy_id, v)
    const asset = v.video_asset_id ? assets.get(v.video_asset_id) : undefined
    const n = fname(asset?.public_url) || fname(asset?.object_key)
    if (n) videoByFile.set(n, v)
  }
  for (const a of store.audio_items) {
    if (a.media_asset_id) audioByAsset.set(a.media_asset_id, a)
    if (a.legacy_id) audioByLegacy.set(a.legacy_id, a)
    const asset = a.media_asset_id ? assets.get(a.media_asset_id) : undefined
    const n = fname(asset?.public_url) || fname(asset?.object_key)
    if (n) audioByFile.set(n, a)
  }

  const seeds = [...storeOneMinuteItems(store), ...loadWebsiteCatalog()]
  const touched = new Set<string>()
  let updated = 0

  const markVideo = (v: VideoItemRecord, duration: number | null) => {
    if (touched.has(`v:${v.id}`)) return
    touched.add(`v:${v.id}`)
    let changed = false
    if (!isAlreadyOneMinute(v.category)) {
      v.category = ONE_MINUTE_CAT
      changed = true
    }
    const label = formatDurationLabel(duration)
    if (label && v.duration_label !== label) {
      v.duration_label = label
      changed = true
    }
    const meta = { ...(v.metadata || {}) }
    if (meta.feed !== 'one-minute') {
      meta.feed = 'one-minute'
      changed = true
    }
    if (duration != null && meta.duration_seconds !== duration) {
      meta.duration_seconds = duration
      changed = true
    }
    if (changed) {
      v.metadata = meta
      v.updated_at = new Date().toISOString()
      updated += 1
    }
    // Ensure editorial defaults exist for Admin control
    if (v.priority == null || !Number.isFinite(Number(v.priority))) {
      // Leave nulls for claim/reindex on next edit; use count-based temp so UI is not P100
      const peers = store.video_items.filter(x => isAlreadyOneMinute(x.category))
      v.priority = peers.length
      updated += 1
    }
    if (typeof v.featured !== 'boolean') {
      v.featured = false
      updated += 1
    }
    if (v.scheduled_at === undefined) {
      v.scheduled_at = null
    }
  }

  const markAudio = (a: AudioItemRecord, duration: number | null) => {
    if (touched.has(`a:${a.id}`)) return
    touched.add(`a:${a.id}`)
    let changed = false
    if (!isAlreadyOneMinute(a.category)) {
      a.category = ONE_MINUTE_CAT
      changed = true
    }
    const label = formatDurationLabel(duration)
    if (label && a.duration_label !== label) {
      a.duration_label = label
      changed = true
    }
    const meta = { ...(a.metadata || {}) }
    if (meta.feed !== 'one-minute') {
      meta.feed = 'one-minute'
      changed = true
    }
    if (duration != null && meta.duration_seconds !== duration) {
      meta.duration_seconds = duration
      changed = true
    }
    // Keep Quran/Dawah pools clean — shorts are not muhadara lectures
    if (a.is_muhadara) {
      a.is_muhadara = false
      changed = true
    }
    if (changed) {
      a.metadata = meta
      a.updated_at = new Date().toISOString()
      updated += 1
    }
    if (a.priority == null || !Number.isFinite(Number(a.priority))) {
      const peers = store.audio_items.filter(x => isAlreadyOneMinute(x.category))
      a.priority = peers.length
      updated += 1
    }
    if (typeof a.featured !== 'boolean') {
      a.featured = false
      updated += 1
    }
    if (a.scheduled_at === undefined) {
      a.scheduled_at = null
    }
  }

  for (const seed of seeds) {
    const kind = String(seed.kind || '').toLowerCase()
    const duration =
      typeof seed.durationSeconds === 'number'
        ? seed.durationSeconds
        : typeof seed.metadata?.duration_seconds === 'number'
          ? (seed.metadata.duration_seconds as number)
          : null
    const mediaId = seed.media_asset_id || null
    const sourceId = seed.sourceId || null
    const file = fname(seed.mediaUrl) || fname(seed.rawFilename)

    if (kind === 'video' || (!kind && mediaId && videoByAsset.has(mediaId))) {
      const v =
        (mediaId && videoByAsset.get(mediaId)) ||
        (sourceId && videoByLegacy.get(sourceId)) ||
        (file && videoByFile.get(file)) ||
        null
      if (v) markVideo(v, duration)
      continue
    }

    if (kind === 'audio' || (!kind && mediaId && audioByAsset.has(mediaId))) {
      const a =
        (mediaId && audioByAsset.get(mediaId)) ||
        (sourceId && audioByLegacy.get(sourceId)) ||
        (file && audioByFile.get(file)) ||
        null
      if (a) markAudio(a, duration)
    }
  }

  return updated
}

/** Persist category fixes to local JSON + Supabase when rows were retagged. */
export async function syncOneMinuteCategoriesAndPersist(
  store: CmsStoreSnapshot,
  saveLocal: (s: CmsStoreSnapshot) => void
): Promise<number> {
  const updated = syncOneMinuteCategories(store)
  if (updated <= 0) return 0
  saveLocal(store)

  if (isSupabaseConfigured()) {
    const sb = getServiceSupabase()
    if (sb) {
      const videos = store.video_items.filter(v => isAlreadyOneMinute(v.category))
      const audios = store.audio_items.filter(a => isAlreadyOneMinute(a.category))
      // Upsert only the retagged shorts (bounded)
      for (const chunk of chunkArr(videos, 40)) {
        await sb.from('video_items').upsert(chunk, { onConflict: 'id' })
      }
      for (const chunk of chunkArr(audios, 40)) {
        await sb.from('audio_items').upsert(chunk, { onConflict: 'id' })
      }
    }
  }
  return updated
}

function chunkArr<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export function parseDurationSeconds(row: {
  duration_label?: string | null
  metadata?: Record<string, unknown> | null
}): number | null {
  const meta = row.metadata?.duration_seconds
  if (typeof meta === 'number' && Number.isFinite(meta) && meta > 0) return meta
  const label = String(row.duration_label || '').trim().toLowerCase()
  if (!label) return null
  const secOnly = label.match(/^(\d+(?:\.\d+)?)\s*s$/)
  if (secOnly) return Number(secOnly[1])
  const m = label.match(/^(\d+)\s*m(?:\s*(\d+)\s*s)?$/)
  if (m) return Number(m[1]) * 60 + Number(m[2] || 0)
  const n = Number(label)
  return Number.isFinite(n) && n > 0 ? n : null
}
