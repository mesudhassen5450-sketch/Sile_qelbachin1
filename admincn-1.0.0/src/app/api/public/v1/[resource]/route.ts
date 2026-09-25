import { NextResponse } from 'next/server'

import { loadLocalStore } from '@/lib/cms/local-store'
import { sortKitabsForDisplay } from '@/lib/cms/kitab-order'
import { isSupabaseConfigured, loadSupabaseSnapshot } from '@/lib/cms/supabase'
import type { CmsStoreSnapshot } from '@/lib/cms/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function withCors(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return res
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }))
}

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

/**
 * Published content API for website + mobile.
 * Only returns status === 'published'.
 * Legacy static JSON remains until consumers switch after verification.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ resource: string }> }
) {
  const { resource } = await context.params
  const store = await getStore()
  const assets = new Map(store.media_assets.map(a => [a.id, a]))

  if (resource === 'kitabs') {
    const rows = sortKitabsForDisplay(
      [...store.kitabs].filter(k => k.status === 'published')
    ).map(k => {
        const cover = k.cover_asset_id ? assets.get(k.cover_asset_id) : undefined
        const pdf = k.pdf_asset_id ? assets.get(k.pdf_asset_id) : undefined
        const dersList = store.ders
          .filter(d => d.kitab_id === k.id && d.status === 'published')
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(d => {
            const audio = d.audio_asset_id ? assets.get(d.audio_asset_id) : undefined
            return {
              id: d.legacy_id || d.id,
              title: { am: d.title_am, ar: d.title_ar, en: d.title_en },
              speaker: { am: d.speaker_am, ar: d.speaker_ar, en: d.speaker_en },
              duration: d.duration_label || '',
              audioUrl: audio?.public_url || '',
              kitabId: k.slug
            }
          })
        return {
          slug: k.slug,
          title: { am: k.title_am, ar: k.title_ar, en: k.title_en },
          author: { am: k.author_am, ar: k.author_ar, en: k.author_en },
          category: { am: k.category_am, ar: k.category_ar, en: k.category_en },
          description: {
            am: k.description_am,
            ar: k.description_ar,
            en: k.description_en
          },
          coverImage: cover?.public_url || null,
          coverBg: k.cover_bg,
          pdfUrl: pdf?.public_url || null,
          dersCount: dersList.length,
          dersList,
          legacy_source: k.legacy_source,
          created_at: k.created_at,
          updated_at: k.updated_at
        }
      })
    return withCors(
      NextResponse.json({ ok: true, source: store.meta.backend, count: rows.length, data: rows })
    )
  }

  if (resource === 'audio' || resource === 'muhadara') {
    const rows = [...store.audio_items]
      .filter(a => a.status === 'published')
      .sort((a, b) => Date.parse(b.updated_at || b.created_at) - Date.parse(a.updated_at || a.created_at))
      .map(a => {
        const media = a.media_asset_id ? assets.get(a.media_asset_id) : undefined
        const coverId = (a.metadata?.cover_asset_id as string | undefined) || null
        const cover = coverId ? assets.get(coverId) : undefined
        return {
          id: a.legacy_id || a.id,
          title: { am: a.title_am, ar: a.title_ar, en: a.title_en },
          description: {
            am: a.description_am,
            ar: a.description_ar,
            en: a.description_en
          },
          fileUrl: media?.public_url || '',
          coverUrl: cover?.public_url || null,
          type: 'audio',
          category: a.category,
          isMuhadara: a.is_muhadara
        }
      })
    return NextResponse.json({ ok: true, source: store.meta.backend, count: rows.length, data: rows })
  }

  if (resource === 'video') {
    const rows = [...store.video_items]
      .filter(v => v.status === 'published')
      .sort((a, b) => Date.parse(b.updated_at || b.created_at) - Date.parse(a.updated_at || a.created_at))
      .map(v => {
        const media = v.video_asset_id ? assets.get(v.video_asset_id) : undefined
        const thumb = v.thumbnail_asset_id ? assets.get(v.thumbnail_asset_id) : undefined
        return {
          id: v.legacy_id || v.id,
          title: { am: v.title_am, ar: v.title_ar, en: v.title_en },
          description: {
            am: v.description_am,
            ar: v.description_ar,
            en: v.description_en
          },
          fileUrl: media?.public_url || '',
          thumbnailUrl: thumb?.public_url || null,
          coverUrl: thumb?.public_url || null,
          type: 'video',
          category: v.category
        }
      })
    return NextResponse.json({ ok: true, source: store.meta.backend, count: rows.length, data: rows })
  }

  if (resource === 'pdfs' || resource === 'pdf') {
    const rows = [...store.pdf_items]
      .filter(p => p.status === 'published')
      .sort((a, b) => Date.parse(b.updated_at || b.created_at) - Date.parse(a.updated_at || a.created_at))
      .map(p => {
        const media = p.media_asset_id ? assets.get(p.media_asset_id) : undefined
        const coverId = (p.metadata?.cover_asset_id as string | undefined) || null
        const cover = coverId ? assets.get(coverId) : undefined
        return {
          id: p.legacy_id || p.id,
          title: { am: p.title_am, ar: p.title_ar, en: p.title_en },
          fileUrl: media?.public_url || '',
          coverUrl: cover?.public_url || null,
          type: 'pdf'
        }
      })
    return NextResponse.json({ ok: true, source: store.meta.backend, count: rows.length, data: rows })
  }

  if (resource === 'sahabah') {
    const local = loadLocalStore()
    const rows = [...(local.sahabah_items || store.sahabah_items || [])]
      .filter(s => s.status === 'published')
      .sort((a, b) => Date.parse(b.updated_at || b.created_at) - Date.parse(a.updated_at || a.created_at))
      .map(s => {
        const cover = s.cover_asset_id ? assets.get(s.cover_asset_id) : undefined
        return {
          slug: s.slug,
          name: { am: s.name_am, ar: s.name_ar, en: s.name_en },
          title: { am: s.title_am, ar: s.title_ar, en: s.title_en },
          shortDescription: {
            am: s.description_am,
            ar: s.description_ar,
            en: s.description_en
          },
          fullBiography: {
            am: s.biography_am,
            ar: s.biography_ar,
            en: s.biography_en
          },
          coverImage: cover?.public_url || null
        }
      })
    return NextResponse.json({ ok: true, source: 'local', count: rows.length, data: rows })
  }

  if (resource === 'reminders') {
    const local = loadLocalStore()
    const rows = [...(local.reminders || [])]
      .filter(r => r.status === 'published')
      .sort((a, b) => a.sort_order - b.sort_order || Date.parse(b.updated_at) - Date.parse(a.updated_at))
      .map(r => ({
        id: r.id,
        title: { am: r.title_am, ar: r.title_ar, en: r.title_en },
        description: {
          am: r.description_am,
          ar: r.description_ar,
          en: r.description_en
        },
        updatedAt: r.updated_at
      }))
    return withCors(NextResponse.json({ ok: true, count: rows.length, data: rows }))
  }

  return withCors(NextResponse.json({ ok: false, error: `Unknown resource: ${resource}` }, { status: 404 }))
}

/** Public website/app can POST analytics events (page_view, audio_play, …). No auth. */
export async function POST(
  request: Request,
  context: { params: Promise<{ resource: string }> }
) {
  const { resource } = await context.params
  if (resource !== 'events') {
    return withCors(NextResponse.json({ ok: false, error: 'POST only for events.' }, { status: 404 }))
  }

  const body = await request.json().catch(() => ({}))
  const event = String(body.event || '').trim()
  if (!event) {
    return withCors(NextResponse.json({ ok: false, error: 'event required.' }, { status: 400 }))
  }

  const { recordAnalyticsEvent } = await import('@/lib/cms/reminders')
  const platform =
    body.platform === 'mobile' ? 'mobile' : body.platform === 'unknown' ? 'unknown' : 'website'
  recordAnalyticsEvent({
    event,
    path: typeof body.path === 'string' ? body.path : null,
    platform,
    meta: typeof body.meta === 'object' && body.meta ? body.meta : undefined
  })
  return withCors(NextResponse.json({ ok: true }))
}
