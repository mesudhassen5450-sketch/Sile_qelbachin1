import { NextResponse } from 'next/server'

import { requireApiPermission } from '@/lib/auth/guards'
import { sortKitabsForDisplay } from '@/lib/cms/kitab-order'
import { loadLocalStore } from '@/lib/cms/local-store'
import { isSupabaseConfigured, loadSupabaseSnapshot } from '@/lib/cms/supabase'
import type { CmsStoreSnapshot } from '@/lib/cms/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getStore(): Promise<CmsStoreSnapshot> {
  const local = loadLocalStore()
  if (isSupabaseConfigured()) {
    try {
      const remote = await loadSupabaseSnapshot()
      if (remote) {
        // Media: union by object key (local uploads may be seconds ahead of remote)
        const mediaByKey = new Map(
          [...local.media_assets, ...remote.media_assets].map(a => [
            `${a.storage_provider}:${a.bucket}:${a.object_key}`,
            a
          ])
        )
        return {
          ...remote,
          media_assets: Array.from(mediaByKey.values()),
          sahabah_items: local.sahabah_items?.length
            ? local.sahabah_items
            : remote.sahabah_items || [],
          reminders: remote.reminders?.length ? remote.reminders : local.reminders || [],
          // Supabase is source of truth for published content (local must not hide Admin saves)
          kitabs: mergePreferRemote(remote.kitabs, local.kitabs),
          ders: mergePreferRemote(remote.ders, local.ders),
          audio_items: mergePreferRemote(remote.audio_items, local.audio_items),
          video_items: mergePreferRemote(remote.video_items, local.video_items),
          pdf_items: mergePreferRemote(remote.pdf_items, local.pdf_items)
        }
      }
    } catch {
      // fall through
    }
  }
  return local
}

/** Remote (Supabase) always wins for the same id. Local-only rows (not yet in DB) are kept. */
function mergePreferRemote<T extends { id: string }>(remote: T[], local: T[]): T[] {
  const map = new Map<string, T>()
  for (const row of local) map.set(row.id, row)
  for (const row of remote) map.set(row.id, row)
  return Array.from(map.values())
}

function mergeById<T extends { id: string; updated_at?: string; created_at?: string }>(
  remote: T[],
  local: T[]
): T[] {
  return mergePreferRemote(remote, local)
}

function sortRecent<T extends { updated_at?: string | null; created_at?: string | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const ta = Date.parse(a.updated_at || a.created_at || '') || 0
    const tb = Date.parse(b.updated_at || b.created_at || '') || 0
    return tb - ta
  })
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
    let rows = sortKitabsForDisplay(store.kitabs).map(k => {
      const cover = k.cover_asset_id ? assets.get(k.cover_asset_id) : undefined
      const pdf = k.pdf_asset_id ? assets.get(k.pdf_asset_id) : undefined
      const coverFromMeta =
        typeof k.metadata?.cover_url === 'string' ? k.metadata.cover_url : null
      const pdfFromMeta = typeof k.metadata?.pdf_url === 'string' ? k.metadata.pdf_url : null
      const dersCount = store.ders.filter(d => d.kitab_id === k.id).length
      return {
        ...k,
        ders_count_live: dersCount,
        cover_url: cover?.public_url || coverFromMeta || null,
        cover_key: cover?.object_key || null,
        pdf_url: pdf?.public_url || pdfFromMeta || null,
        pdf_key: pdf?.object_key || null,
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
    let rows = sortRecent(store.audio_items).map(a => {
      const media = a.media_asset_id ? assets.get(a.media_asset_id) : undefined
      const coverId = (a.metadata?.cover_asset_id as string | undefined) || null
      const cover = coverId ? assets.get(coverId) : undefined
      return {
        ...a,
        media_url: media?.public_url || null,
        cover_url: cover?.public_url || null,
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
    let rows = sortRecent(store.video_items).map(v => {
      const media = v.video_asset_id ? assets.get(v.video_asset_id) : undefined
      const thumb = v.thumbnail_asset_id ? assets.get(v.thumbnail_asset_id) : undefined
      return {
        ...v,
        media_url: media?.public_url || null,
        object_key: media?.object_key || null,
        cover_url: thumb?.public_url || null,
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
    let rows = sortRecent(store.pdf_items).map(p => {
      const media = p.media_asset_id ? assets.get(p.media_asset_id) : undefined
      const kitab = p.kitab_id ? store.kitabs.find(k => k.id === p.kitab_id) : undefined
      const coverId = (p.metadata?.cover_asset_id as string | undefined) || null
      const cover = coverId ? assets.get(coverId) : undefined
      return {
        ...p,
        media_url: media?.public_url || null,
        cover_url: cover?.public_url || null,
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

  if (type === 'sahabah') {
    let rows = sortRecent(store.sahabah_items || []).map(s => {
      const cover = s.cover_asset_id ? assets.get(s.cover_asset_id) : undefined
      return {
        ...s,
        cover_url: cover?.public_url || null,
        title: s.name_en || s.name_am || s.title_en || s.slug
      }
    })
    if (status) rows = rows.filter(r => r.status === status)
    if (q) {
      rows = rows.filter(r =>
        [r.slug, r.name_en, r.name_am, r.title_en, r.description_en]
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

export async function POST(
  request: Request,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params
  const body = await request.json().catch(() => ({}))

  try {
    if (type === 'kitabs') {
      const gate = await requireApiPermission(['kitabs.create', 'kitabs.publish'])
      if ('response' in gate) return gate.response
      const { createKitabWithDers } = await import('@/lib/cms/create-content')
      const result = await createKitabWithDers({
        title_am: body.title_am,
        title_ar: body.title_ar,
        title_en: body.title_en,
        author_am: body.author_am,
        author_ar: body.author_ar,
        author_en: body.author_en,
        description_am: body.description_am,
        description_ar: body.description_ar,
        description_en: body.description_en,
        category_en: body.category_en,
        cover_asset_id: body.cover_asset_id || null,
        pdf_asset_id: body.pdf_asset_id || null,
        slug: body.slug,
        status: body.status || 'published',
        ders: Array.isArray(body.ders) ? body.ders : []
      })
      return NextResponse.json({
        ok: true,
        kitab: result.kitab,
        ders: result.ders,
        message: 'Kitab published. Media is stored online; website/mobile read the public API.'
      })
    }

    if (type === 'sahabah') {
      const gate = await requireApiPermission(['kitabs.create', 'kitabs.publish', 'audio.create'])
      if ('response' in gate) return gate.response
      const { createSahabahItem } = await import('@/lib/cms/create-content')
      const row = await createSahabahItem({
        name_am: body.name_am,
        name_ar: body.name_ar,
        name_en: body.name_en,
        title_am: body.title_am,
        title_ar: body.title_ar,
        title_en: body.title_en,
        description_am: body.description_am,
        description_ar: body.description_ar,
        description_en: body.description_en,
        biography_am: body.biography_am,
        biography_ar: body.biography_ar,
        biography_en: body.biography_en,
        cover_asset_id: body.cover_asset_id || null,
        slug: body.slug,
        status: body.status || 'published'
      })
      return NextResponse.json({ ok: true, row, message: 'Sahabah published.' })
    }

    if (type === 'audio') {
      const gate = await requireApiPermission(['audio.create', 'audio.publish'])
      if ('response' in gate) return gate.response
      const { createAudioItem } = await import('@/lib/cms/create-content')
      const mediaAssetId = String(body.media_asset_id || '')
      if (!mediaAssetId) {
        return NextResponse.json({ ok: false, error: 'media_asset_id required.' }, { status: 400 })
      }
      const row = await createAudioItem({
        title_am: body.title_am,
        title_ar: body.title_ar,
        title_en: body.title_en,
        description_am: body.description_am,
        description_ar: body.description_ar,
        description_en: body.description_en,
        category: body.category,
        is_muhadara: Boolean(body.is_muhadara),
        media_asset_id: mediaAssetId,
        cover_asset_id: body.cover_asset_id || null,
        status: body.status || 'published'
      })
      return NextResponse.json({ ok: true, row, published: true })
    }

    if (type === 'video') {
      const gate = await requireApiPermission(['video.create', 'video.publish'])
      if ('response' in gate) return gate.response
      const { createVideoItem } = await import('@/lib/cms/create-content')
      const videoAssetId = String(body.video_asset_id || body.media_asset_id || '')
      if (!videoAssetId) {
        return NextResponse.json({ ok: false, error: 'video_asset_id required.' }, { status: 400 })
      }
      const row = await createVideoItem({
        title_am: body.title_am,
        title_ar: body.title_ar,
        title_en: body.title_en,
        description_am: body.description_am,
        description_ar: body.description_ar,
        description_en: body.description_en,
        category: body.category,
        video_asset_id: videoAssetId,
        cover_asset_id: body.cover_asset_id || body.thumbnail_asset_id || null,
        status: body.status || 'published'
      })
      return NextResponse.json({ ok: true, row, published: true })
    }

    if (type === 'pdfs' || type === 'pdf') {
      const gate = await requireApiPermission(['pdf.create', 'pdf.publish'])
      if ('response' in gate) return gate.response
      const { createPdfItem } = await import('@/lib/cms/create-content')
      const mediaAssetId = String(body.media_asset_id || '')
      if (!mediaAssetId) {
        return NextResponse.json({ ok: false, error: 'media_asset_id required.' }, { status: 400 })
      }
      const row = await createPdfItem({
        title_am: body.title_am,
        title_ar: body.title_ar,
        title_en: body.title_en,
        media_asset_id: mediaAssetId,
        cover_asset_id: body.cover_asset_id || null,
        status: body.status || 'published'
      })
      return NextResponse.json({ ok: true, row, published: true })
    }

    return NextResponse.json({ ok: false, error: `POST not supported for ${type}` }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Create failed.' },
      { status: 400 }
    )
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params
  const allowed = ['audio', 'video', 'pdfs', 'pdf', 'kitabs', 'ders', 'sahabah'] as const
  if (!allowed.includes(type as (typeof allowed)[number])) {
    return NextResponse.json({ ok: false, error: 'Unsupported type.' }, { status: 400 })
  }

  const perm =
    type === 'kitabs' || type === 'sahabah'
      ? (['kitabs.publish', 'kitabs.edit'] as const)
      : type === 'ders'
        ? (['ders.publish', 'ders.edit'] as const)
        : type === 'video'
          ? (['video.publish', 'video.edit'] as const)
          : type === 'audio'
            ? (['audio.publish', 'audio.edit'] as const)
            : (['pdf.publish', 'pdf.edit'] as const)

  const gate = await requireApiPermission([...perm])
  if ('response' in gate) return gate.response

  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '')
  if (!id) {
    return NextResponse.json({ ok: false, error: 'id required.' }, { status: 400 })
  }

  const normalized =
    type === 'pdf' ? 'pdfs' : (type as 'audio' | 'video' | 'pdfs' | 'kitabs' | 'ders' | 'sahabah')

  try {
    const status = body.status as string | undefined
    if (status) {
      const { setContentStatus } = await import('@/lib/cms/publish-content')
      await setContentStatus({
        type: normalized,
        id,
        status: status as import('@/lib/cms/types').ContentStatus
      })
      return NextResponse.json({
        ok: true,
        message:
          status === 'published'
            ? 'Published to public API (website + mobile).'
            : `Status set to ${status}.`
      })
    }

    const { updateContentMeta } = await import('@/lib/cms/delete-content')
    const result = await updateContentMeta({
      type: normalized as import('@/lib/cms/delete-content').DeletableContentType,
      id,
      title_en: body.title_en,
      title_am: body.title_am,
      author_en: body.author_en,
      author_am: body.author_am,
      description_en: body.description_en,
      description_am: body.description_am,
      cover_asset_id: body.cover_asset_id,
      pdf_asset_id: body.pdf_asset_id,
      media_asset_id: body.media_asset_id,
      video_asset_id: body.video_asset_id,
      thumbnail_asset_id: body.thumbnail_asset_id,
      cover_url: body.cover_url,
      pdf_url: body.pdf_url
    })
    return NextResponse.json({
      ok: true,
      message: 'Saved to database. Website / mobile will show this update.',
      row: result.row || null
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Update failed.' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params
  const allowed = ['audio', 'video', 'pdfs', 'pdf', 'kitabs', 'ders', 'sahabah'] as const
  if (!allowed.includes(type as (typeof allowed)[number])) {
    return NextResponse.json({ ok: false, error: 'Unsupported type.' }, { status: 400 })
  }

  const perm =
    type === 'kitabs' || type === 'sahabah'
      ? (['kitabs.archive', 'kitabs.edit'] as const)
      : type === 'ders'
        ? (['ders.edit', 'ders.publish'] as const)
        : type === 'video'
          ? (['video.archive', 'video.edit'] as const)
          : type === 'audio'
            ? (['audio.archive', 'audio.edit'] as const)
            : (['pdf.edit', 'pdf.publish'] as const)

  const gate = await requireApiPermission([...perm])
  if ('response' in gate) return gate.response

  const url = new URL(request.url)
  const body = await request.json().catch(() => ({}))
  const id = String(body.id || url.searchParams.get('id') || '')
  if (!id) {
    return NextResponse.json({ ok: false, error: 'id required.' }, { status: 400 })
  }

  const deleteR2Files = body.delete_r2 !== false && url.searchParams.get('delete_r2') !== '0'
  const normalized =
    type === 'pdf' ? 'pdfs' : (type as 'audio' | 'video' | 'pdfs' | 'kitabs' | 'ders' | 'sahabah')

  try {
    const { deleteContentItem } = await import('@/lib/cms/delete-content')
    const result = await deleteContentItem({
      type: normalized as import('@/lib/cms/delete-content').DeletableContentType,
      id,
      adminEmail: gate.ctx.user.email,
      deleteR2Files
    })
    return NextResponse.json({
      ...result,
      message:
        'Deleted from Admin CMS and public API (official website/mobile). Linked media files removed when storage credentials work.'
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Delete failed.' },
      { status: 400 }
    )
  }
}

