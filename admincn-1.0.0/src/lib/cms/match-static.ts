import { readFileSync } from 'fs'
import { join } from 'path'

import {
  appendAudit,
  loadLocalStore,
  newId,
  nowIso,
  saveLocalStore,
  upsertByLegacyId
} from './local-store'
import { catalogPathFromObjectKey } from './media-type'
import { getR2Env } from './r2'
import { getServiceSupabase, isSupabaseConfigured } from './supabase'
import type {
  AudioItemRecord,
  DersRecord,
  KitabRecord,
  LocalizedText,
  MediaAsset,
  PdfItemRecord,
  VideoItemRecord
} from './types'

type LegacyKitab = {
  slug: string
  coverImage?: string
  coverBg?: string
  title: LocalizedText | string
  author: LocalizedText | string
  category: LocalizedText | string
  pdfUrl?: string
  pdfSize?: string
  dersCount: number
  description: LocalizedText | string
  dersList: Array<{
    id: string
    title: LocalizedText | string
    speaker: LocalizedText | string
    duration: string
    audioUrl: string
    kitabId?: string
  }>
}

type LegacyMediaItem = {
  id: string
  title: LocalizedText
  description?: LocalizedText
  fileUrl: string
  type: 'video' | 'audio' | 'pdf' | 'unknown'
  category?: string
  fileSize?: string
  date?: string
  monthYear?: string
  rawFilename?: string
}

function loc(value: LocalizedText | string | undefined): LocalizedText {
  if (!value) return {}
  if (typeof value === 'string') return { am: value, en: value, ar: value }
  return value
}

function safeDecode(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/** Extract catalog-relative path from legacy GitHub/jsDelivr/R2/relative URLs. */
export function extractCatalogPath(url: string): string | null {
  if (!url) return null
  let cleaned = url.trim()

  if (cleaned.startsWith('/covers/') || cleaned.startsWith('/logo')) {
    return null // local public asset, not R2
  }

  // Full-prefix strippers (include scheme/host) so we never leave a dangling https://
  const patterns = [
    /^https?:\/\/cdn\.jsdelivr\.net\/gh\/[^/]+\/sileqelbachin-media@[^/]+\//i,
    /^https?:\/\/raw\.githubusercontent\.com\/[^/]+\/sileqelbachin-media\/[^/]+\//i,
    /^https?:\/\/media\.githubusercontent\.com\/media\/[^/]+\/sileqelbachin-media\/[^/]+\//i,
    /^https?:\/\/pub-[a-f0-9]+\.r2\.dev\/sileqelbachin-meadia\//i,
    /^https?:\/\/[^/]+\.r2\.dev\/sileqelbachin-meadia\//i
  ]

  let stripped = false
  for (const re of patterns) {
    if (re.test(cleaned)) {
      cleaned = cleaned.replace(re, '')
      stripped = true
      break
    }
  }

  if (!stripped && cleaned.startsWith('http')) {
    try {
      const u = new URL(cleaned)
      const parts = u.pathname.replace(/^\/+/, '').split('/')
      const idx = parts.findIndex(
        p =>
          p === 'sileqelbachin-meadia' ||
          p === 'files' ||
          p === 'video_files' ||
          p === 'voice_messages'
      )
      if (idx >= 0) {
        const start = parts[idx] === 'sileqelbachin-meadia' ? idx + 1 : idx
        cleaned = parts.slice(start).join('/')
      } else {
        return null
      }
    } catch {
      return null
    }
  }

  cleaned = cleaned.replace(/^(\.\/|\/)/, '').replace(/^telegram_media\//i, '')
  cleaned = cleaned
    .split('/')
    .map(safeDecode)
    .join('/')
  cleaned = cleaned.replace(/Ad-Da['’]?\s+wa\s+Ad-Dawa['’]?/g, 'Ad-Da_ wa Ad-Dawa_')

  return cleaned || null
}

function normalizeKey(path: string): string {
  return path
    .normalize('NFC')
    .split('/')
    .map(s => safeDecode(s).trim().toLowerCase())
    .join('/')
}

function findAssetForCatalogPath(
  assets: MediaAsset[],
  catalogPath: string,
  objectPrefix: string
): MediaAsset | undefined {
  const want = normalizeKey(catalogPath)
  const wantFile = want.split('/').pop() || want

  // Exact suffix match on catalog portion
  let hit = assets.find(a => {
    const cat = normalizeKey(catalogPathFromObjectKey(a.object_key, objectPrefix))
    return cat === want || a.object_key.toLowerCase().endsWith(want)
  })
  if (hit) return hit

  // Filename + parent folder match
  const wantParts = want.split('/')
  const parent = wantParts.length >= 2 ? wantParts[wantParts.length - 2] : ''
  hit = assets.find(a => {
    const cat = normalizeKey(catalogPathFromObjectKey(a.object_key, objectPrefix))
    const parts = cat.split('/')
    const file = parts[parts.length - 1]
    const folder = parts.length >= 2 ? parts[parts.length - 2] : ''
    return file === wantFile && (!parent || folder.includes(parent) || parent.includes(folder))
  })
  if (hit) return hit

  // Filename-only fallback (weaker)
  const candidates = assets.filter(a => {
    const file = normalizeKey(catalogPathFromObjectKey(a.object_key, objectPrefix)).split('/').pop()
    return file === wantFile
  })
  return candidates.length === 1 ? candidates[0] : undefined
}

function loadLegacyKitabs(): LegacyKitab[] {
  // Prefer copied TS file parsed loosely via JSON bridge if present
  const jsonPath = join(process.cwd(), 'src/data/legacy/kitabs.json')
  try {
    return JSON.parse(readFileSync(jsonPath, 'utf8')) as LegacyKitab[]
  } catch {
    // Fall through to dynamic import of website kitabs via generated json
  }

  // Runtime: try sibling website kitabs export generated at build/seed time
  const alt = join(process.cwd(), '../src/data/kitabs-export.json')
  try {
    return JSON.parse(readFileSync(alt, 'utf8')) as LegacyKitab[]
  } catch {
    return []
  }
}

function loadLegacyMedia(): LegacyMediaItem[] {
  const path = join(process.cwd(), 'src/data/legacy/content.json')
  return JSON.parse(readFileSync(path, 'utf8')) as LegacyMediaItem[]
}

export type MatchStaticResult = {
  kitabs: { imported: number; updated: number; linked_cover: number; linked_pdf: number }
  ders: { imported: number; updated: number; linked_audio: number; unmatched_audio: number }
  audio: { imported: number; updated: number; linked: number; unmatched: number }
  video: { imported: number; updated: number; linked: number; unmatched: number }
  pdfs: { imported: number; updated: number; linked: number; unmatched: number }
  orphans_remaining: number
}

export async function matchStaticContent(options?: {
  adminEmail?: string
  publish?: boolean
}): Promise<MatchStaticResult> {
  const store = loadLocalStore()
  const env = getR2Env()
  const publishStatus = options?.publish === false ? 'draft' : 'published'
  const publishedAt = options?.publish === false ? null : nowIso()

  const kitabs = loadLegacyKitabs()
  const media = loadLegacyMedia()

  const result: MatchStaticResult = {
    kitabs: { imported: 0, updated: 0, linked_cover: 0, linked_pdf: 0 },
    ders: { imported: 0, updated: 0, linked_audio: 0, unmatched_audio: 0 },
    audio: { imported: 0, updated: 0, linked: 0, unmatched: 0 },
    video: { imported: 0, updated: 0, linked: 0, unmatched: 0 },
    pdfs: { imported: 0, updated: 0, linked: 0, unmatched: 0 },
    orphans_remaining: 0
  }

  const linkedAssetIds = new Set<string>()

  for (const k of kitabs) {
    const title = loc(k.title)
    const author = loc(k.author)
    const category = loc(k.category)
    const description = loc(k.description)

    let coverId: string | null = null
    let pdfId: string | null = null

    if (k.coverImage) {
      const path = extractCatalogPath(k.coverImage)
      if (path) {
        const asset = findAssetForCatalogPath(store.media_assets, path, env.objectPrefix)
        if (asset) {
          coverId = asset.id
          linkedAssetIds.add(asset.id)
          result.kitabs.linked_cover += 1
        }
      }
    }

    if (k.pdfUrl) {
      const path = extractCatalogPath(k.pdfUrl)
      if (path) {
        const asset = findAssetForCatalogPath(store.media_assets, path, env.objectPrefix)
        if (asset) {
          pdfId = asset.id
          linkedAssetIds.add(asset.id)
          result.kitabs.linked_pdf += 1
        }
      }
    }

    const existing = store.kitabs.find(row => row.slug === k.slug)
    const kitabRow: KitabRecord = {
      id: existing?.id || newId(),
      slug: k.slug,
      title_am: title.am || null,
      title_ar: title.ar || null,
      title_en: title.en || null,
      author_am: author.am || null,
      author_ar: author.ar || null,
      author_en: author.en || null,
      category_am: category.am || null,
      category_ar: category.ar || null,
      category_en: category.en || null,
      description_am: description.am || null,
      description_ar: description.ar || null,
      description_en: description.en || null,
      cover_bg: k.coverBg || null,
      cover_asset_id: coverId,
      pdf_asset_id: pdfId,
      speaker_id: null,
      ders_count: k.dersList?.length || k.dersCount || 0,
      status: publishStatus,
      legacy_source: 'static',
      metadata: { pdfSize: k.pdfSize || null },
      created_at: existing?.created_at || nowIso(),
      updated_at: nowIso(),
      published_at: publishedAt
    }

    if (existing) {
      store.kitabs = store.kitabs.map(row => (row.id === existing.id ? kitabRow : row))
      result.kitabs.updated += 1
    } else {
      store.kitabs.push(kitabRow)
      result.kitabs.imported += 1
    }

    k.dersList?.forEach((d, index) => {
      let audioAssetId: string | null = null
      const audioPath = extractCatalogPath(d.audioUrl)
      if (audioPath) {
        const asset = findAssetForCatalogPath(store.media_assets, audioPath, env.objectPrefix)
        if (asset) {
          audioAssetId = asset.id
          linkedAssetIds.add(asset.id)
          result.ders.linked_audio += 1
        } else {
          result.ders.unmatched_audio += 1
        }
      } else {
        result.ders.unmatched_audio += 1
      }

      const dTitle = loc(d.title)
      const dSpeaker = loc(d.speaker)
      const dersRow: DersRecord = {
        id: newId(),
        legacy_id: d.id,
        kitab_id: kitabRow.id,
        ders_number: index + 1,
        sort_order: index + 1,
        title_am: dTitle.am || null,
        title_ar: dTitle.ar || null,
        title_en: dTitle.en || null,
        speaker_am: dSpeaker.am || null,
        speaker_ar: dSpeaker.ar || null,
        speaker_en: dSpeaker.en || null,
        duration_label: d.duration || null,
        audio_asset_id: audioAssetId,
        status: publishStatus,
        metadata: {},
        created_at: nowIso(),
        updated_at: nowIso(),
        published_at: publishedAt
      }

      const upsert = upsertByLegacyId(store.ders, dersRow)
      store.ders = upsert.rows
      if (upsert.action === 'imported') result.ders.imported += 1
      else if (upsert.action === 'updated') result.ders.updated += 1
    })
  }

  for (const item of media) {
    const path = extractCatalogPath(item.fileUrl) || (item.rawFilename ? item.rawFilename : null)
    let assetId: string | null = null
    if (path) {
      // content.json relative paths often already catalog-relative
      const asset = findAssetForCatalogPath(store.media_assets, path, env.objectPrefix)
      if (asset) {
        assetId = asset.id
        linkedAssetIds.add(asset.id)
      }
    }

    if (item.type === 'audio') {
      const row: AudioItemRecord = {
        id: newId(),
        legacy_id: item.id,
        title_am: item.title?.am || null,
        title_ar: item.title?.ar || null,
        title_en: item.title?.en || null,
        description_am: item.description?.am || null,
        description_ar: item.description?.ar || null,
        description_en: item.description?.en || null,
        category: item.category || null,
        media_asset_id: assetId,
        duration_label: null,
        play_count: 0,
        download_count: 0,
        is_muhadara: true,
        status: publishStatus,
        metadata: {
          fileSize: item.fileSize,
          date: item.date,
          monthYear: item.monthYear,
          rawFilename: item.rawFilename
        },
        created_at: nowIso(),
        updated_at: nowIso(),
        published_at: publishedAt
      }
      const upsert = upsertByLegacyId(store.audio_items, row)
      store.audio_items = upsert.rows
      if (upsert.action === 'imported') result.audio.imported += 1
      else result.audio.updated += 1
      if (assetId) result.audio.linked += 1
      else result.audio.unmatched += 1
    } else if (item.type === 'video') {
      const row: VideoItemRecord = {
        id: newId(),
        legacy_id: item.id,
        title_am: item.title?.am || null,
        title_ar: item.title?.ar || null,
        title_en: item.title?.en || null,
        description_am: item.description?.am || null,
        description_ar: item.description?.ar || null,
        description_en: item.description?.en || null,
        category: item.category || null,
        video_asset_id: assetId,
        thumbnail_asset_id: null,
        duration_label: null,
        view_count: 0,
        download_count: 0,
        status: publishStatus,
        metadata: {
          fileSize: item.fileSize,
          date: item.date,
          monthYear: item.monthYear,
          rawFilename: item.rawFilename
        },
        created_at: nowIso(),
        updated_at: nowIso(),
        published_at: publishedAt
      }
      const upsert = upsertByLegacyId(store.video_items, row)
      store.video_items = upsert.rows
      if (upsert.action === 'imported') result.video.imported += 1
      else result.video.updated += 1
      if (assetId) result.video.linked += 1
      else result.video.unmatched += 1
    } else if (item.type === 'pdf') {
      const row: PdfItemRecord = {
        id: newId(),
        legacy_id: item.id,
        kitab_id: null,
        title_am: item.title?.am || null,
        title_ar: item.title?.ar || null,
        title_en: item.title?.en || null,
        media_asset_id: assetId,
        version_label: null,
        view_count: 0,
        download_count: 0,
        status: publishStatus,
        metadata: {
          fileSize: item.fileSize,
          date: item.date,
          monthYear: item.monthYear,
          rawFilename: item.rawFilename
        },
        created_at: nowIso(),
        updated_at: nowIso(),
        published_at: publishedAt
      }
      const upsert = upsertByLegacyId(store.pdf_items, row)
      store.pdf_items = upsert.rows
      if (upsert.action === 'imported') result.pdfs.imported += 1
      else result.pdfs.updated += 1
      if (assetId) result.pdfs.linked += 1
      else result.pdfs.unmatched += 1
    }
  }

  // Mark linked assets as non-orphan
  store.media_assets = store.media_assets.map(a => {
    if (!linkedAssetIds.has(a.id)) return a
    return {
      ...a,
      is_orphan: false,
      needs_review: false,
      updated_at: nowIso()
    }
  })

  // Also clear orphan for assets linked via ders/kitabs relations
  const moreLinked = new Set<string>()
  for (const k of store.kitabs) {
    if (k.cover_asset_id) moreLinked.add(k.cover_asset_id)
    if (k.pdf_asset_id) moreLinked.add(k.pdf_asset_id)
  }
  for (const d of store.ders) if (d.audio_asset_id) moreLinked.add(d.audio_asset_id)
  for (const a of store.audio_items) if (a.media_asset_id) moreLinked.add(a.media_asset_id)
  for (const v of store.video_items) {
    if (v.video_asset_id) moreLinked.add(v.video_asset_id)
    if (v.thumbnail_asset_id) moreLinked.add(v.thumbnail_asset_id)
  }
  for (const p of store.pdf_items) if (p.media_asset_id) moreLinked.add(p.media_asset_id)

  store.media_assets = store.media_assets.map(a =>
    moreLinked.has(a.id) ? { ...a, is_orphan: false } : a
  )

  result.orphans_remaining = store.media_assets.filter(a => a.is_orphan).length

  appendAudit(store, {
    admin_id: null,
    admin_email: options?.adminEmail || 'system',
    action: 'match_static_content',
    entity_type: 'content',
    entity_id: null,
    before_data: null,
    after_data: result
  })

  saveLocalStore(store)

  if (isSupabaseConfigured()) {
    const sb = getServiceSupabase()
    if (sb) {
      await sb.from('kitabs').upsert(store.kitabs, { onConflict: 'slug' })
      await sb.from('ders').upsert(store.ders, { onConflict: 'legacy_id' })
      await sb.from('audio_items').upsert(store.audio_items, { onConflict: 'legacy_id' })
      await sb.from('video_items').upsert(store.video_items, { onConflict: 'legacy_id' })
      await sb.from('pdf_items').upsert(store.pdf_items, { onConflict: 'legacy_id' })
      const linked = store.media_assets.filter(a => !a.is_orphan)
      if (linked.length) {
        await sb.from('media_assets').upsert(linked, {
          onConflict: 'storage_provider,bucket,object_key'
        })
      }
    }
  }

  return result
}
