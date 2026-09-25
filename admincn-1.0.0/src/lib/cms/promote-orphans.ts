import {
  appendAudit,
  loadLocalStore,
  newId,
  nowIso,
  saveLocalStore,
  upsertByLegacyId
} from '@/lib/cms/local-store'
import { catalogPathFromObjectKey } from '@/lib/cms/media-type'
import { getR2Env } from '@/lib/cms/r2'
import type { AudioItemRecord, PdfItemRecord, VideoItemRecord } from '@/lib/cms/types'

function titleFromKey(objectKey: string, prefix: string): string {
  const rel = catalogPathFromObjectKey(objectKey, prefix)
  const base = rel.split('/').pop() || objectKey
  return base.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || base
}

function isLinked(store: ReturnType<typeof loadLocalStore>, assetId: string): boolean {
  if (store.kitabs.some(k => k.cover_asset_id === assetId || k.pdf_asset_id === assetId)) return true
  if (store.ders.some(d => d.audio_asset_id === assetId)) return true
  if (store.audio_items.some(a => a.media_asset_id === assetId)) return true
  if (store.video_items.some(v => v.video_asset_id === assetId || v.thumbnail_asset_id === assetId)) {
    return true
  }
  if (store.pdf_items.some(p => p.media_asset_id === assetId)) return true
  return false
}

export type PromoteOrphansResult = {
  audio_created: number
  video_created: number
  pdf_created: number
  skipped_linked: number
  skipped_other: number
}

/**
 * Turn orphan R2 audio/video/pdf objects into manageable CMS rows
 * so existing Cloudflare files appear under Content → Audio / Video / PDFs.
 */
export async function promoteOrphanMedia(options?: {
  adminEmail?: string | null
  publish?: boolean
}): Promise<PromoteOrphansResult> {
  const store = loadLocalStore()
  const env = getR2Env()
  const now = nowIso()
  const status = options?.publish === false ? 'draft' : 'published'
  const publishedAt = options?.publish === false ? null : now

  const result: PromoteOrphansResult = {
    audio_created: 0,
    video_created: 0,
    pdf_created: 0,
    skipped_linked: 0,
    skipped_other: 0
  }

  for (const asset of store.media_assets) {
    if (asset.storage_provider !== 'cloudflare_r2') {
      result.skipped_other += 1
      continue
    }
    // Skip git / probe noise
    if (
      asset.object_key.includes('/.git/') ||
      asset.object_key.endsWith('_admin-probe.txt') ||
      asset.object_key.includes('/staff-uploads/_')
    ) {
      result.skipped_other += 1
      continue
    }

    if (isLinked(store, asset.id)) {
      result.skipped_linked += 1
      continue
    }

    const legacyId = `r2-orphan:${asset.object_key}`
    const title = titleFromKey(asset.object_key, env.objectPrefix)

    if (asset.media_type === 'audio') {
      const next: AudioItemRecord = {
        id: newId(),
        legacy_id: legacyId,
        title_am: null,
        title_ar: null,
        title_en: title,
        description_am: null,
        description_ar: null,
        description_en: null,
        category: 'archive',
        media_asset_id: asset.id,
        duration_label: null,
        play_count: 0,
        download_count: 0,
        is_muhadara: /muhadara|home\s*page\s*audio/i.test(asset.object_key),
        status,
        metadata: { source: 'r2_orphan_promote', object_key: asset.object_key },
        created_at: now,
        updated_at: now,
        published_at: publishedAt
      }
      const up = upsertByLegacyId(store.audio_items, next)
      store.audio_items = up.rows
      if (up.action === 'imported') result.audio_created += 1
      asset.is_orphan = false
      asset.status = status
      asset.updated_at = now
      continue
    }

    if (asset.media_type === 'video') {
      const next: VideoItemRecord = {
        id: newId(),
        legacy_id: legacyId,
        title_am: null,
        title_ar: null,
        title_en: title,
        description_am: null,
        description_ar: null,
        description_en: null,
        category: 'archive',
        video_asset_id: asset.id,
        thumbnail_asset_id: null,
        duration_label: null,
        view_count: 0,
        download_count: 0,
        status,
        metadata: { source: 'r2_orphan_promote', object_key: asset.object_key },
        created_at: now,
        updated_at: now,
        published_at: publishedAt
      }
      const up = upsertByLegacyId(store.video_items, next)
      store.video_items = up.rows
      if (up.action === 'imported') result.video_created += 1
      asset.is_orphan = false
      asset.status = status
      asset.updated_at = now
      continue
    }

    if (asset.media_type === 'pdf') {
      const next: PdfItemRecord = {
        id: newId(),
        legacy_id: legacyId,
        kitab_id: null,
        title_am: null,
        title_ar: null,
        title_en: title,
        media_asset_id: asset.id,
        version_label: null,
        view_count: 0,
        download_count: 0,
        status,
        metadata: { source: 'r2_orphan_promote', object_key: asset.object_key },
        created_at: now,
        updated_at: now,
        published_at: publishedAt
      }
      const up = upsertByLegacyId(store.pdf_items, next)
      store.pdf_items = up.rows
      if (up.action === 'imported') result.pdf_created += 1
      asset.is_orphan = false
      asset.status = status
      asset.updated_at = now
      continue
    }

    result.skipped_other += 1
  }

  // Re-save media_assets with orphan flags cleared
  store.media_assets = [...store.media_assets]

  appendAudit(store, {
    admin_id: null,
    admin_email: options?.adminEmail || null,
    action: 'promote_r2_orphans',
    entity_type: 'content',
    entity_id: 'bulk',
    before_data: null,
    after_data: result
  })
  saveLocalStore(store)
  return result
}
