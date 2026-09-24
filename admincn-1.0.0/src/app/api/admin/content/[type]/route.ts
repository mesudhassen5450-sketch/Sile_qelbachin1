import { NextResponse } from 'next/server'

import { requireApiPermission } from '@/lib/auth/guards'
import { loadLocalStore } from '@/lib/cms/local-store'
import { isSupabaseConfigured, loadSupabaseSnapshot } from '@/lib/cms/supabase'
import type { CmsStoreSnapshot } from '@/lib/cms/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getStore(): Promise<CmsStoreSnapshot> {
  if (isSupabaseConfigured()) {
    try {
      const remote = await loadSupabaseSnapshot()
      if (remote) return remote
    } catch {
      // fall through
    }
  }
  return loadLocalStore()
}

function assetMap(store: CmsStoreSnapshot) {
  return new Map(store.media_assets.map(a => [a.id, a]))
}

export async function GET(
  request: Request,
  context: { params: Promise<{ type: string }> }
) {
  const gate = await requireApiPermission([
    'kitabs.view',
    'ders.view',
    'audio.view',
    'video.view',
    'pdf.view',
    'media.view'
  ])
  if ('response' in gate) return gate.response

  const { type } = await context.params
  const store = await getStore()
  const assets = assetMap(store)
  const url = new URL(request.url)
  const q = (url.searchParams.get('q') || '').toLowerCase()
  const status = url.searchParams.get('status')

  if (type === 'kitabs') {
    let rows = store.kitabs.map(k => {
      const cover = k.cover_asset_id ? assets.get(k.cover_asset_id) : undefined
      const pdf = k.pdf_asset_id ? assets.get(k.pdf_asset_id) : undefined
      const dersCount = store.ders.filter(d => d.kitab_id === k.id).length
      return {
        ...k,
        ders_count_live: dersCount,
        cover_url: cover?.public_url || null,
        pdf_url: pdf?.public_url || null,
        title: k.title_en || k.title_am || k.slug
      }
    })
    if (status) rows = rows.filter(r => r.status === status)
    if (q) {
      rows = rows.filter(r =>
        [r.slug, r.title_am, r.title_en, r.title_ar, r.author_en]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(q))
      )
    }
    return NextResponse.json({ ok: true, count: rows.length, rows })
  }

  if (type === 'ders') {
    const kitabSlug = url.searchParams.get('kitab')
    let kitabs = store.kitabs
    if (kitabSlug) kitabs = kitabs.filter(k => k.slug === kitabSlug)
    const kitabIds = new Set(kitabs.map(k => k.id))
    let rows = store.ders
      .filter(d => kitabIds.has(d.kitab_id))
      .map(d => {
        const kitab = store.kitabs.find(k => k.id === d.kitab_id)
        const audio = d.audio_asset_id ? assets.get(d.audio_asset_id) : undefined
        return {
          ...d,
          kitab_slug: kitab?.slug || null,
          kitab_title: kitab?.title_en || kitab?.title_am || null,
          audio_url: audio?.public_url || null,
          audio_key: audio?.object_key || null,
          title: d.title_en || d.title_am || d.legacy_id
        }
      })
    if (status) rows = rows.filter(r => r.status === status)
    if (q) {
      rows = rows.filter(r =>
        [r.title_am, r.title_en, r.legacy_id, r.kitab_slug, r.audio_key]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(q))
      )
    }
    rows.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    return NextResponse.json({ ok: true, count: rows.length, rows })
  }

  if (type === 'audio') {
    let rows = store.audio_items.map(a => {
      const media = a.media_asset_id ? assets.get(a.media_asset_id) : undefined
      return {
        ...a,
        media_url: media?.public_url || null,
        object_key: media?.object_key || null,
        file_size: media?.file_size || null,
        media_health: media?.health_status || 'unknown',
        title: a.title_en || a.title_am || a.legacy_id
      }
    })
    if (status) rows = rows.filter(r => r.status === status)
    if (q) {
      rows = rows.filter(r =>
        [r.title_am, r.title_en, r.category, r.object_key]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(q))
      )
    }
    return NextResponse.json({ ok: true, count: rows.length, rows })
  }

  if (type === 'video') {
    let rows = store.video_items.map(v => {
      const media = v.video_asset_id ? assets.get(v.video_asset_id) : undefined
      const thumb = v.thumbnail_asset_id ? assets.get(v.thumbnail_asset_id) : undefined
      return {
        ...v,
        media_url: media?.public_url || null,
        object_key: media?.object_key || null,
        thumbnail_url: thumb?.public_url || null,
        file_size: media?.file_size || null,
        media_health: media?.health_status || 'unknown',
        title: v.title_en || v.title_am || v.legacy_id
      }
    })
    if (status) rows = rows.filter(r => r.status === status)
    if (q) {
      rows = rows.filter(r =>
        [r.title_am, r.title_en, r.category, r.object_key]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(q))
      )
    }
    return NextResponse.json({ ok: true, count: rows.length, rows })
  }

  if (type === 'pdfs' || type === 'pdf') {
    let rows = store.pdf_items.map(p => {
      const media = p.media_asset_id ? assets.get(p.media_asset_id) : undefined
      const kitab = p.kitab_id ? store.kitabs.find(k => k.id === p.kitab_id) : undefined
      return {
        ...p,
        media_url: media?.public_url || null,
        object_key: media?.object_key || null,
        file_size: media?.file_size || null,
        kitab_slug: kitab?.slug || null,
        media_health: media?.health_status || 'unknown',
        title: p.title_en || p.title_am || p.legacy_id
      }
    })
    if (status) rows = rows.filter(r => r.status === status)
    if (q) {
      rows = rows.filter(r =>
        [r.title_am, r.title_en, r.object_key, r.kitab_slug]
          .filter(Boolean)
          .some(v => String(v).toLowerCase().includes(q))
      )
    }
    return NextResponse.json({ ok: true, count: rows.length, rows })
  }

  if (type === 'media' || type === 'library') {
    let rows = store.media_assets
    if (q) {
      rows = rows.filter(r => r.object_key.toLowerCase().includes(q))
    }
    const mapped = rows.slice(0, 500).map(a => ({
      id: a.id,
      title: a.object_key.split('/').pop(),
      object_key: a.object_key,
      media_type: a.media_type,
      status: a.status,
      health_status: a.health_status,
      is_orphan: a.is_orphan,
      needs_review: a.needs_review,
      public_url: a.public_url,
      file_size: a.file_size,
      updated_at: a.updated_at
    }))
    return NextResponse.json({ ok: true, count: rows.length, rows: mapped })
  }

  return NextResponse.json({ ok: false, error: `Unknown type: ${type}` }, { status: 404 })
}
