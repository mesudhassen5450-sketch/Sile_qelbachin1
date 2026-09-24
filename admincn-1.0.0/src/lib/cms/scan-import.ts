import {
  appendAudit,
  getContentStats,
  loadLocalStore,
  newId,
  nowIso,
  saveLocalStore,
  upsertMediaAsset
} from './local-store'
import { detectContentFromPath, detectMediaType } from './media-type'
import { buildPublicUrl, listStorageObjects } from './r2'
import { insertScanRunRemote, isSupabaseConfigured, upsertMediaAssetsRemote } from './supabase'
import type { MediaAsset, ScanRun } from './types'

export type ScanImportResult = {
  run: ScanRun
  stats: ReturnType<typeof getContentStats>
  preview_new: Array<{
    object_key: string
    media_type: string
    detected_content: MediaAsset['detected_content']
    public_url: string | null
    status: string
  }>
  backend: 'local' | 'supabase' | 'local+supabase'
}

/**
 * Idempotent R2 → media_assets sync.
 * Same object (provider+bucket+key) never creates duplicates.
 */
export async function scanAndImportMedia(options?: {
  adminEmail?: string
}): Promise<ScanImportResult> {
  const startedAt = nowIso()
  const runId = newId()
  const store = loadLocalStore()

  const errorLog: ScanRun['error_log'] = []
  let imported = 0
  let updated = 0
  let skipped = 0
  let failed = 0
  let needsReview = 0
  let newObjects = 0
  let changedObjects = 0

  const { objects, source, env } = await listStorageObjects()
  const seenKeys = new Set<string>()
  const touched: MediaAsset[] = []
  const previewNew: ScanImportResult['preview_new'] = []

  for (const obj of objects) {
    try {
      seenKeys.add(obj.object_key)
      const mediaType = detectMediaType(obj.object_key, obj.mime_type)
      const detected = detectContentFromPath(obj.object_key, env.objectPrefix)
      const publicUrl = buildPublicUrl(obj.object_key, env)

      const existing = store.media_assets.find(
        a =>
          a.storage_provider === 'cloudflare_r2' &&
          a.bucket === env.bucket &&
          a.object_key === obj.object_key
      )

      const result = upsertMediaAsset(store, {
        media_type: mediaType,
        storage_provider: 'cloudflare_r2',
        bucket: env.bucket,
        object_key: obj.object_key,
        public_url: publicUrl,
        mime_type: obj.mime_type,
        file_size: obj.size,
        duration_seconds: existing?.duration_seconds ?? null,
        checksum: existing?.checksum ?? null,
        etag: obj.etag,
        last_modified: obj.last_modified,
        status: existing?.status ?? 'draft',
        health_status: 'healthy',
        is_imported: true,
        is_orphan: existing?.is_orphan ?? true,
        needs_review: Boolean(detected.needsReview),
        detected_content: detected,
        metadata: {
          ...(existing?.metadata || {}),
          scan_source: source
        },
        last_verified_at: nowIso()
      })

      if (result.action === 'imported') {
        imported += 1
        newObjects += 1
        previewNew.push({
          object_key: result.asset.object_key,
          media_type: result.asset.media_type,
          detected_content: result.asset.detected_content,
          public_url: result.asset.public_url,
          status: result.asset.needs_review ? 'Needs Review' : 'New'
        })
      } else if (result.action === 'updated') {
        updated += 1
        changedObjects += 1
      } else {
        skipped += 1
      }

      if (result.asset.needs_review) needsReview += 1
      touched.push(result.asset)
    } catch (err) {
      failed += 1
      errorLog.push({
        object_key: obj.object_key,
        message: err instanceof Error ? err.message : String(err)
      })
    }
  }

  // Mark DB assets missing from storage
  let missingObjects = 0
  for (const asset of store.media_assets) {
    if (asset.storage_provider !== 'cloudflare_r2' || asset.bucket !== env.bucket) continue
    if (!seenKeys.has(asset.object_key)) {
      missingObjects += 1
      asset.health_status = 'missing'
      asset.updated_at = nowIso()
      asset.last_verified_at = nowIso()
    }
  }

  const byType = objects.reduce<Record<string, number>>((acc, o) => {
    const t = detectMediaType(o.object_key, o.mime_type)
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})

  const orphanObjects = store.media_assets.filter(a => a.is_orphan).length
  const matched = skipped + updated

  const run: ScanRun = {
    id: runId,
    started_at: startedAt,
    finished_at: nowIso(),
    source,
    total_objects: objects.length,
    matched,
    imported,
    updated,
    skipped,
    failed,
    needs_review: needsReview,
    new_objects: newObjects,
    changed_objects: changedObjects,
    missing_objects: missingObjects,
    orphan_objects: orphanObjects,
    by_type: byType,
    error_log: errorLog,
    status: failed && imported === 0 && updated === 0 ? 'failed' : 'completed'
  }

  store.scan_runs.unshift(run)
  if (store.scan_runs.length > 50) store.scan_runs = store.scan_runs.slice(0, 50)
  store.meta.last_scan_at = run.finished_at

  appendAudit(store, {
    admin_id: null,
    admin_email: options?.adminEmail || 'system',
    action: 'scan_import_media',
    entity_type: 'media_assets',
    entity_id: runId,
    before_data: null,
    after_data: {
      total_objects: run.total_objects,
      imported,
      updated,
      skipped,
      failed,
      source
    }
  })

  saveLocalStore(store)

  let backend: ScanImportResult['backend'] = 'local'
  if (isSupabaseConfigured()) {
    try {
      await upsertMediaAssetsRemote(touched)
      await insertScanRunRemote(run)
      backend = 'local+supabase'
    } catch (err) {
      errorLog.push({
        message: `Supabase sync warning: ${err instanceof Error ? err.message : String(err)}`
      })
      run.error_log = errorLog
      saveLocalStore(store)
    }
  }

  return {
    run,
    stats: getContentStats(store),
    preview_new: previewNew.slice(0, 100),
    backend
  }
}
