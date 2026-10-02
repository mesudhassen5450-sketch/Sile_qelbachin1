import { NextResponse } from 'next/server'

import { requireApiPermission } from '@/lib/auth/guards'
import { loadLocalStore, saveLocalStore, nowIso, appendAudit } from '@/lib/cms/local-store'
import { buildPublicUrl, headObjectExists } from '@/lib/cms/r2'
import type { MediaAsset, MediaType } from '@/lib/cms/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function countByType(assets: MediaAsset[], type: MediaType) {
  return assets.filter(a => a.media_type === type).length
}

function buildSummary(assets: MediaAsset[], lastScan: string | null) {
  return {
    total_objects: assets.length,
    audio: countByType(assets, 'audio'),
    video: countByType(assets, 'video'),
    pdf: countByType(assets, 'pdf'),
    images: countByType(assets, 'image'),
    healthy: assets.filter(a => a.health_status === 'healthy').length,
    broken: assets.filter(a => a.health_status === 'broken').length,
    missing: assets.filter(a => a.health_status === 'missing').length,
    unreachable: assets.filter(a => a.health_status === 'unreachable').length,
    needs_review: assets.filter(a => a.needs_review || a.health_status === 'needs_review').length,
    orphaned: assets.filter(a => a.is_orphan).length,
    last_scan: lastScan,
  }
}

function contentLinks(store: ReturnType<typeof loadLocalStore>, assetId: string) {
  const links: Array<{ kind: string; id: string; title: string }> = []
  for (const k of store.kitabs) {
    if (k.pdf_asset_id === assetId || k.cover_asset_id === assetId) {
      links.push({
        kind: 'kitab',
        id: k.id,
        title: k.title_en || k.title_am || k.slug,
      })
    }
  }
  for (const d of store.ders) {
    if (d.audio_asset_id === assetId) {
      links.push({
        kind: 'ders',
        id: d.id,
        title: d.title_en || d.title_am || `Ders ${d.ders_number}`,
      })
    }
  }
  for (const a of store.audio_items) {
    if (a.media_asset_id === assetId) {
      links.push({
        kind: 'audio',
        id: a.id,
        title: a.title_en || a.title_am || a.id,
      })
    }
  }
  for (const v of store.video_items) {
    if (v.video_asset_id === assetId || v.thumbnail_asset_id === assetId) {
      links.push({
        kind: 'video',
        id: v.id,
        title: v.title_en || v.title_am || v.id,
      })
    }
  }
  for (const p of store.pdf_items) {
    if (p.media_asset_id === assetId) {
      links.push({
        kind: 'pdf',
        id: p.id,
        title: p.title_en || p.title_am || p.id,
      })
    }
  }
  return links
}

export async function POST(request: Request) {
  const gate = await requireApiPermission('media.health')
  if ('response' in gate) return gate.response

  const body = await request.json().catch(() => ({}))
  const limit = typeof body.limit === 'number' ? Math.min(body.limit, 200) : 80
  const store = loadLocalStore()

  const sample = store.media_assets.slice(0, limit)
  let healthy = 0
  let missing = 0
  let unreachable = 0
  const issues: Array<{
    id: string
    object_key: string
    status: string
    public_url: string | null
    error_message: string | null
  }> = []

  for (const asset of sample) {
    const exists = await headObjectExists(asset.object_key)
    if (!exists) {
      asset.health_status = 'missing'
      asset.metadata = {
        ...asset.metadata,
        last_health_error: 'Object key not found in Cloudflare R2',
      }
      missing += 1
      issues.push({
        id: asset.id,
        object_key: asset.object_key,
        status: 'missing',
        public_url: asset.public_url,
        error_message: 'Object key not found in Cloudflare R2',
      })
    } else {
      const url = asset.public_url || buildPublicUrl(asset.object_key)
      try {
        const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
        if (!res.ok && res.status !== 403) {
          asset.health_status = 'unreachable'
          asset.metadata = {
            ...asset.metadata,
            last_health_error: `HTTP ${res.status} on public URL`,
          }
          unreachable += 1
          issues.push({
            id: asset.id,
            object_key: asset.object_key,
            status: 'unreachable',
            public_url: url,
            error_message: `HTTP ${res.status} on public URL`,
          })
        } else {
          asset.health_status = 'healthy'
          asset.metadata = { ...asset.metadata, last_health_error: null }
          healthy += 1
        }
      } catch {
        asset.health_status = 'healthy'
        asset.metadata = { ...asset.metadata, last_health_error: null }
        healthy += 1
      }
    }
    asset.last_verified_at = nowIso()
    asset.updated_at = nowIso()
  }

  appendAudit(store, {
    admin_id: null,
    admin_email: 'admin',
    action: 'media_health_check',
    entity_type: 'media_assets',
    entity_id: null,
    before_data: null,
    after_data: { checked: sample.length, healthy, missing, unreachable },
  })

  saveLocalStore(store)
  const summary = buildSummary(store.media_assets, store.meta.last_scan_at)

  return NextResponse.json({
    ok: true,
    checked: sample.length,
    healthy,
    missing,
    unreachable,
    broken: summary.broken,
    orphans: summary.orphaned,
    summary,
    issues: issues.slice(0, 100),
  })
}

export async function GET(request: Request) {
  const gate = await requireApiPermission('media.health')
  if ('response' in gate) return gate.response

  const url = new URL(request.url)
  const q = String(url.searchParams.get('q') || '')
    .trim()
    .toLowerCase()
  const health = String(url.searchParams.get('health') || '').trim()
  const type = String(url.searchParams.get('type') || '').trim()
  const showAll = url.searchParams.get('all') === '1'

  const store = loadLocalStore()
  const summary = buildSummary(store.media_assets, store.meta.last_scan_at)

  let assets = store.media_assets
  if (!showAll) {
    assets = assets.filter(
      a => a.health_status !== 'healthy' || a.is_orphan || a.needs_review
    )
  }
  if (health && health !== 'all') {
    if (health === 'orphaned') assets = assets.filter(a => a.is_orphan)
    else assets = assets.filter(a => a.health_status === health)
  }
  if (type && type !== 'all') {
    assets = assets.filter(a => a.media_type === type)
  }
  if (q) {
    assets = assets.filter(
      a =>
        a.object_key.toLowerCase().includes(q) ||
        (a.public_url || '').toLowerCase().includes(q) ||
        (a.mime_type || '').toLowerCase().includes(q)
    )
  }

  const rows = assets.slice(0, 300).map(a => ({
    id: a.id,
    title: a.object_key.split('/').pop(),
    object_key: a.object_key,
    media_type: a.media_type,
    mime_type: a.mime_type,
    file_size: a.file_size,
    health_status: a.health_status,
    is_orphan: a.is_orphan,
    needs_review: a.needs_review,
    public_url: a.public_url,
    last_verified_at: a.last_verified_at,
    error_message:
      typeof a.metadata?.last_health_error === 'string' ? a.metadata.last_health_error : null,
    linked_content: contentLinks(store, a.id),
  }))

  return NextResponse.json({
    ok: true,
    total_assets: store.media_assets.length,
    summary,
    rows,
  })
}
