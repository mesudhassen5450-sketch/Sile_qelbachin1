import { NextResponse } from 'next/server'

import { requireApiPermission } from '@/lib/auth/guards'
import { getContentStats, loadLocalStore } from '@/lib/cms/local-store'
import { getR2Env, hasR2ApiCredentials } from '@/lib/cms/r2'
import { isSupabaseConfigured, loadSupabaseSnapshot } from '@/lib/cms/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const gate = await requireApiPermission(['media.view', 'media.scan'])
  if ('response' in gate) return gate.response

  const env = getR2Env()
  let store = loadLocalStore()

  if (isSupabaseConfigured()) {
    try {
      const remote = await loadSupabaseSnapshot()
      if (remote) store = remote
    } catch {
      // keep local
    }
  }

  const stats = getContentStats(store)
  const last = store.scan_runs[0] || null

  return NextResponse.json({
    storage: {
      provider: 'cloudflare_r2',
      bucket: env.bucket,
      object_prefix: env.objectPrefix,
      public_base_url: env.publicBaseUrl,
      api_credentials_configured: hasR2ApiCredentials(env),
      media_mirror_path: env.mediaMirrorPath,
      supabase_configured: isSupabaseConfigured()
    },
    stats: {
      total_objects: stats.media_total,
      audio: stats.by_type.audio || 0,
      video: stats.by_type.video || 0,
      pdf: stats.by_type.pdf || 0,
      images: stats.by_type.image || 0,
      other: stats.by_type.other || 0,
      new_files: last?.new_objects ?? 0,
      changed_files: last?.changed_objects ?? 0,
      missing_files: last?.missing_objects ?? 0,
      broken_files: store.media_assets.filter(a => a.health_status === 'broken').length,
      orphan_files: stats.orphans,
      needs_review: stats.needs_review,
      last_scan: stats.last_scan_at,
      kitabs: stats.kitabs,
      ders: stats.ders,
      audio_items: stats.audio,
      video_items: stats.video,
      pdf_items: stats.pdfs,
      backend: stats.backend
    },
    last_scan_run: last
  })
}
