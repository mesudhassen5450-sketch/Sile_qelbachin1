import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { CmsStoreSnapshot, MediaAsset, ScanRun } from './types'

/** In-memory snapshot cache — cuts Free-plan egress (full table dumps were uncached). */
const SNAPSHOT_TTL_MS = 45_000
let snapshotCache: { at: number; data: CmsStoreSnapshot } | null = null
let snapshotInflight: Promise<CmsStoreSnapshot | null> | null = null

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
  )
}

export function getServiceSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null
  const url = process.env.SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}

/** Call after Admin publish / edit / delete so the next public read is fresh. */
export function invalidateSupabaseSnapshotCache(): void {
  snapshotCache = null
}

async function fetchSupabaseSnapshot(): Promise<CmsStoreSnapshot | null> {
  const sb = getServiceSupabase()
  if (!sb) return null

  // Public CMS does not need audit_logs / scan_runs — skip them to cut egress.
  const [media, kitabs, ders, audio, video, pdfs] = await Promise.all([
    sb.from('media_assets').select('*'),
    sb.from('kitabs').select('*'),
    sb.from('ders').select('*'),
    sb.from('audio_items').select('*'),
    sb.from('video_items').select('*'),
    sb.from('pdf_items').select('*'),
  ])

  const err =
    media.error || kitabs.error || ders.error || audio.error || video.error || pdfs.error
  if (err) throw new Error(`Supabase load failed: ${err.message}`)

  return {
    media_assets: (media.data || []) as MediaAsset[],
    kitabs: kitabs.data || [],
    ders: ders.data || [],
    audio_items: audio.data || [],
    video_items: video.data || [],
    pdf_items: pdfs.data || [],
    sahabah_items: [],
    reminders: [],
    analytics_events: [],
    scan_runs: [],
    audit_logs: [],
    meta: { last_scan_at: null, backend: 'supabase' },
  }
}

/**
 * Load CMS snapshot from Supabase.
 * Cached ~45s by default (shared across concurrent public API hits).
 * Pass `{ bypassCache: true }` for Admin after writes, or call invalidateSupabaseSnapshotCache().
 */
export async function loadSupabaseSnapshot(opts?: {
  bypassCache?: boolean
}): Promise<CmsStoreSnapshot | null> {
  if (!isSupabaseConfigured()) return null

  const now = Date.now()
  if (!opts?.bypassCache && snapshotCache && now - snapshotCache.at < SNAPSHOT_TTL_MS) {
    return snapshotCache.data
  }

  if (!opts?.bypassCache && snapshotInflight) {
    return snapshotInflight
  }

  const run = (async () => {
    try {
      const data = await fetchSupabaseSnapshot()
      if (data) {
        snapshotCache = { at: Date.now(), data }
      }
      return data
    } finally {
      snapshotInflight = null
    }
  })()

  if (!opts?.bypassCache) snapshotInflight = run
  return run
}

export async function upsertMediaAssetsRemote(assets: MediaAsset[]): Promise<MediaAsset[]> {
  const sb = getServiceSupabase()
  if (!sb || assets.length === 0) return assets

  const resolved: MediaAsset[] = []
  const chunkSize = 200
  for (let i = 0; i < assets.length; i += chunkSize) {
    const chunk = assets.slice(i, i + chunkSize)
    const { error } = await sb.from('media_assets').upsert(chunk, {
      onConflict: 'storage_provider,bucket,object_key'
    })
    if (error) throw new Error(`media_assets upsert failed: ${error.message}`)

    // Re-read by object key so cover_asset_id matches the row id in Supabase
    for (const asset of chunk) {
      const { data, error: readErr } = await sb
        .from('media_assets')
        .select('*')
        .eq('storage_provider', asset.storage_provider)
        .eq('bucket', asset.bucket)
        .eq('object_key', asset.object_key)
        .maybeSingle()
      if (readErr) throw new Error(`media_assets read failed: ${readErr.message}`)
      resolved.push((data as MediaAsset) || asset)
    }
  }
  invalidateSupabaseSnapshotCache()
  return resolved
}

export async function insertScanRunRemote(run: ScanRun): Promise<void> {
  const sb = getServiceSupabase()
  if (!sb) return
  const { error } = await sb.from('scan_runs').upsert(run)
  if (error) throw new Error(`scan_runs upsert failed: ${error.message}`)
}
