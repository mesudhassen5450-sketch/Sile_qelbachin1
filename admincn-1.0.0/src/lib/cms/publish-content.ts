import {
  loadLocalStore,
  newId,
  nowIso,
  saveLocalStore,
  upsertByLegacyId
} from '@/lib/cms/local-store'
import { isSupabaseConfigured, getServiceSupabase } from '@/lib/cms/supabase'
import type {
  AudioItemRecord,
  ContentStatus,
  PdfItemRecord,
  VideoItemRecord
} from '@/lib/cms/types'

export type PublishContentInput = {
  type: 'audio' | 'video' | 'pdfs'
  title_am?: string
  title_ar?: string
  title_en?: string
  description_am?: string
  description_ar?: string
  description_en?: string
  category?: string
  is_muhadara?: boolean
  media_asset_id: string
  thumbnail_asset_id?: string | null
  status?: ContentStatus
  id?: string
}

/**
 * Create or update a content row linked to an R2 media_asset, then optionally publish
 * so website + mobile public API expose it.
 */
export async function upsertPublishableContent(input: PublishContentInput) {
  const store = loadLocalStore()
  const asset = store.media_assets.find(a => a.id === input.media_asset_id)
  if (!asset) {
    throw new Error('media_asset_id not found. Upload to Cloudflare R2 first.')
  }

  const now = nowIso()
  const status: ContentStatus = input.status || 'published'
  const publishedAt = status === 'published' ? now : null

  // Mark asset as linked (not orphan) when attached to content
  store.media_assets = store.media_assets.map(a =>
    a.id === asset.id
      ? { ...a, is_orphan: false, status: status === 'published' ? 'published' : a.status, updated_at: now }
      : a
  )

  let row: AudioItemRecord | VideoItemRecord | PdfItemRecord

  if (input.type === 'audio') {
    const next: AudioItemRecord = {
      id: input.id || newId(),
      legacy_id: input.id ? null : `staff-${Date.now()}`,
      title_am: input.title_am || null,
      title_ar: input.title_ar || null,
      title_en: input.title_en || input.title_am || asset.object_key.split('/').pop() || null,
      description_am: input.description_am || null,
      description_ar: input.description_ar || null,
      description_en: input.description_en || null,
      category: input.category || 'archive',
      media_asset_id: asset.id,
      duration_label: null,
      play_count: 0,
      download_count: 0,
      is_muhadara: Boolean(input.is_muhadara),
      status,
      metadata: { source: 'staff_publish' },
      created_at: now,
      updated_at: now,
      published_at: publishedAt
    }
    if (input.id) {
      const idx = store.audio_items.findIndex(r => r.id === input.id)
      if (idx >= 0) {
        next.id = store.audio_items[idx].id
        next.legacy_id = store.audio_items[idx].legacy_id
        next.created_at = store.audio_items[idx].created_at
        next.play_count = store.audio_items[idx].play_count
        store.audio_items[idx] = next
      } else {
        store.audio_items.push(next)
      }
    } else {
      const up = upsertByLegacyId(store.audio_items, next)
      store.audio_items = up.rows
    }
    row = next
  } else if (input.type === 'video') {
    const next: VideoItemRecord = {
      id: input.id || newId(),
      legacy_id: input.id ? null : `staff-${Date.now()}`,
      title_am: input.title_am || null,
      title_ar: input.title_ar || null,
      title_en: input.title_en || input.title_am || asset.object_key.split('/').pop() || null,
      description_am: input.description_am || null,
      description_ar: input.description_ar || null,
      description_en: input.description_en || null,
      category: input.category || 'archive',
      video_asset_id: asset.id,
      thumbnail_asset_id: input.thumbnail_asset_id || null,
      duration_label: null,
      view_count: 0,
      download_count: 0,
      status,
      metadata: { source: 'staff_publish' },
      created_at: now,
      updated_at: now,
      published_at: publishedAt
    }
    if (input.id) {
      const idx = store.video_items.findIndex(r => r.id === input.id)
      if (idx >= 0) {
        next.id = store.video_items[idx].id
        next.legacy_id = store.video_items[idx].legacy_id
        next.created_at = store.video_items[idx].created_at
        store.video_items[idx] = next
      } else {
        store.video_items.push(next)
      }
    } else {
      const up = upsertByLegacyId(store.video_items, next)
      store.video_items = up.rows
    }
    row = next
  } else {
    const next: PdfItemRecord = {
      id: input.id || newId(),
      legacy_id: input.id ? null : `staff-${Date.now()}`,
      kitab_id: null,
      title_am: input.title_am || null,
      title_ar: input.title_ar || null,
      title_en: input.title_en || input.title_am || asset.object_key.split('/').pop() || null,
      media_asset_id: asset.id,
      version_label: null,
      view_count: 0,
      download_count: 0,
      status,
      metadata: { source: 'staff_publish' },
      created_at: now,
      updated_at: now,
      published_at: publishedAt
    }
    if (input.id) {
      const idx = store.pdf_items.findIndex(r => r.id === input.id)
      if (idx >= 0) {
        next.id = store.pdf_items[idx].id
        next.legacy_id = store.pdf_items[idx].legacy_id
        next.created_at = store.pdf_items[idx].created_at
        store.pdf_items[idx] = next
      } else {
        store.pdf_items.push(next)
      }
    } else {
      const up = upsertByLegacyId(store.pdf_items, next)
      store.pdf_items = up.rows
    }
    row = next
  }

  saveLocalStore(store)

  if (isSupabaseConfigured()) {
    const sb = getServiceSupabase()
    if (sb) {
      if (input.type === 'audio') {
        await sb.from('audio_items').upsert(row as AudioItemRecord, { onConflict: 'id' })
      } else if (input.type === 'video') {
        await sb.from('video_items').upsert(row as VideoItemRecord, { onConflict: 'id' })
      } else {
        await sb.from('pdf_items').upsert(row as PdfItemRecord, { onConflict: 'id' })
      }
      await sb.from('media_assets').upsert(asset, {
        onConflict: 'storage_provider,bucket,object_key'
      })
    }
  }

  return {
    row,
    public_url: asset.public_url,
    published: status === 'published'
  }
}

export async function setContentStatus(input: {
  type: 'audio' | 'video' | 'pdfs' | 'kitabs' | 'ders' | 'sahabah'
  id: string
  status: ContentStatus
}) {
  const store = loadLocalStore()
  const now = nowIso()
  const publishedAt = input.status === 'published' ? now : null

  const patch = <T extends { id: string; status: ContentStatus; updated_at: string; published_at: string | null }>(
    rows: T[]
  ): T[] =>
    rows.map(r =>
      r.id === input.id
        ? { ...r, status: input.status, updated_at: now, published_at: publishedAt ?? r.published_at }
        : r
    )

  if (input.type === 'audio') store.audio_items = patch(store.audio_items)
  else if (input.type === 'video') store.video_items = patch(store.video_items)
  else if (input.type === 'pdfs') store.pdf_items = patch(store.pdf_items)
  else if (input.type === 'kitabs') store.kitabs = patch(store.kitabs)
  else if (input.type === 'ders') store.ders = patch(store.ders)
  else if (input.type === 'sahabah') {
    store.sahabah_items = patch(store.sahabah_items || [])
  }

  saveLocalStore(store)

  if (isSupabaseConfigured() && input.type !== 'sahabah') {
    const sb = getServiceSupabase()
    if (sb) {
      const table =
        input.type === 'audio'
          ? 'audio_items'
          : input.type === 'video'
            ? 'video_items'
            : input.type === 'pdfs'
              ? 'pdf_items'
              : input.type === 'kitabs'
                ? 'kitabs'
                : 'ders'
      await sb
        .from(table)
        .update({ status: input.status, updated_at: now, published_at: publishedAt })
        .eq('id', input.id)
    }
  }

  return { ok: true as const }
}
