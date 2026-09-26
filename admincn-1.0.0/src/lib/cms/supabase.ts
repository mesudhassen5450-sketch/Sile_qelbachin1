import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { CmsStoreSnapshot, MediaAsset, ScanRun } from './types'

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

/** Load a snapshot-compatible view from Supabase for Admin UI / matching. */
export async function loadSupabaseSnapshot(): Promise<CmsStoreSnapshot | null> {
  const sb = getServiceSupabase()
  if (!sb) return null

  const [
    media,
    kitabs,
    ders,
    audio,
    video,
    pdfs,
    scans,
    audits
  ] = await Promise.all([
    sb.from('media_assets').select('*'),
    sb.from('kitabs').select('*'),
    sb.from('ders').select('*'),
    sb.from('audio_items').select('*'),
    sb.from('video_items').select('*'),
    sb.from('pdf_items').select('*'),
    sb.from('scan_runs').select('*').order('started_at', { ascending: false }).limit(20),
    sb.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200)
  ])

  const err =
    media.error ||
    kitabs.error ||
    ders.error ||
    audio.error ||
    video.error ||
    pdfs.error ||
    scans.error ||
    audits.error
  if (err) throw new Error(`Supabase load failed: ${err.message}`)

  const lastScan = (scans.data?.[0] as ScanRun | undefined)?.finished_at || null

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
    scan_runs: (scans.data || []) as ScanRun[],
    audit_logs: audits.data || [],
    meta: { last_scan_at: lastScan, backend: 'supabase' }
  }
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
  return resolved
}

export async function insertScanRunRemote(run: ScanRun): Promise<void> {
  const sb = getServiceSupabase()
  if (!sb) return
  const { error } = await sb.from('scan_runs').upsert(run)
  if (error) throw new Error(`scan_runs upsert failed: ${error.message}`)
}
