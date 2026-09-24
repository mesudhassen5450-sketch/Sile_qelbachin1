import { NextResponse } from 'next/server'

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
    const rows = store.kitabs
      .filter(k => k.status === 'published')
      .map(k => {
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
          dersList
        }
      })
    return NextResponse.json({ ok: true, source: store.meta.backend, count: rows.length, data: rows })
  }

  if (resource === 'audio' || resource === 'muhadara') {
    const rows = store.audio_items
      .filter(a => a.status === 'published')
      .map(a => {
        const media = a.media_asset_id ? assets.get(a.media_asset_id) : undefined
        return {
          id: a.legacy_id || a.id,
          title: { am: a.title_am, ar: a.title_ar, en: a.title_en },
          description: {
            am: a.description_am,
            ar: a.description_ar,
            en: a.description_en
          },
          fileUrl: media?.public_url || '',
          type: 'audio',
          category: a.category,
          isMuhadara: a.is_muhadara
        }
      })
    return NextResponse.json({ ok: true, source: store.meta.backend, count: rows.length, data: rows })
  }

  if (resource === 'video') {
    const rows = store.video_items
      .filter(v => v.status === 'published')
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
          type: 'video',
          category: v.category
        }
      })
    return NextResponse.json({ ok: true, source: store.meta.backend, count: rows.length, data: rows })
  }

  if (resource === 'pdfs' || resource === 'pdf') {
    const rows = store.pdf_items
      .filter(p => p.status === 'published')
      .map(p => {
        const media = p.media_asset_id ? assets.get(p.media_asset_id) : undefined
        return {
          id: p.legacy_id || p.id,
          title: { am: p.title_am, ar: p.title_ar, en: p.title_en },
          fileUrl: media?.public_url || '',
          type: 'pdf'
        }
      })
    return NextResponse.json({ ok: true, source: store.meta.backend, count: rows.length, data: rows })
  }

  return NextResponse.json({ ok: false, error: `Unknown resource: ${resource}` }, { status: 404 })
}
