import { NextResponse } from 'next/server'

import { requireApiPermission } from '@/lib/auth/guards'
import { loadLocalStore, saveLocalStore, nowIso, appendAudit } from '@/lib/cms/local-store'
import { buildPublicUrl, headObjectExists } from '@/lib/cms/r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: Request) {
  const gate = await requireApiPermission('media.health')
  if ('response' in gate) return gate.response

  const body = await request.json().catch(() => ({}))
  const limit = typeof body.limit === 'number' ? Math.min(body.limit, 200) : 50
  const store = loadLocalStore()

  const sample = store.media_assets.slice(0, limit)
  let healthy = 0
  let missing = 0
  let unreachable = 0
  const issues: Array<{ id: string; object_key: string; status: string; public_url: string | null }> =
    []

  for (const asset of sample) {
    const exists = await headObjectExists(asset.object_key)
    if (!exists) {
      asset.health_status = 'missing'
      missing += 1
      issues.push({
        id: asset.id,
        object_key: asset.object_key,
        status: 'missing',
        public_url: asset.public_url
      })
    } else {
      // Optional lightweight public URL check
      const url = asset.public_url || buildPublicUrl(asset.object_key)
      try {
        const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
        if (!res.ok && res.status !== 403) {
          asset.health_status = 'unreachable'
          unreachable += 1
          issues.push({
            id: asset.id,
            object_key: asset.object_key,
            status: 'unreachable',
            public_url: url
          })
        } else {
          asset.health_status = 'healthy'
          healthy += 1
        }
      } catch {
        // Mirror-only environments may not reach public URL; treat object existence as healthy
        asset.health_status = 'healthy'
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
    after_data: { checked: sample.length, healthy, missing, unreachable }
  })

  saveLocalStore(store)

  return NextResponse.json({
    ok: true,
    checked: sample.length,
    healthy,
    missing,
    unreachable,
    broken: store.media_assets.filter(a => a.health_status === 'broken').length,
    orphans: store.media_assets.filter(a => a.is_orphan).length,
    issues: issues.slice(0, 100)
  })
}

export async function GET() {
  const gate = await requireApiPermission('media.health')
  if ('response' in gate) return gate.response

  const store = loadLocalStore()
  const rows = store.media_assets
    .filter(a => a.health_status !== 'healthy' || a.is_orphan || a.needs_review)
    .slice(0, 200)
    .map(a => ({
      id: a.id,
      title: a.object_key.split('/').pop(),
      object_key: a.object_key,
      media_type: a.media_type,
      health_status: a.health_status,
      is_orphan: a.is_orphan,
      needs_review: a.needs_review,
      public_url: a.public_url,
      last_verified_at: a.last_verified_at
    }))

  return NextResponse.json({
    ok: true,
    total_assets: store.media_assets.length,
    rows
  })
}
