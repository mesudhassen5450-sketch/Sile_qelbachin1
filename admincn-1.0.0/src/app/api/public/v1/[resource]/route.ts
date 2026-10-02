import { NextResponse } from 'next/server'

import {
  compareByPriorityThenDate,
  isScheduleLive,
  matchesAudioSection,
  matchesVideoSection,
  resolveFeatured,
  resolvePriority,
  resolveScheduledAt,
} from '@/lib/cms/editorial'
import { loadLocalStore, saveLocalStore } from '@/lib/cms/local-store'
import { sortKitabsForDisplay } from '@/lib/cms/kitab-order'
import { isSupabaseConfigured, loadSupabaseSnapshot } from '@/lib/cms/supabase'
import { parseDurationSeconds, syncOneMinuteCategories } from '@/lib/cms/sync-one-minute'
import type { CmsStoreSnapshot } from '@/lib/cms/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function withCors(res: NextResponse) {
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  res.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate')
  return res
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }))
}

async function getStore(): Promise<CmsStoreSnapshot> {
  const local = loadLocalStore()
  let dirty = syncOneMinuteCategories(local) > 0
  const { reindexAllContentPools } = await import('@/lib/cms/priority-cascade')
  if (reindexAllContentPools(local) > 0) dirty = true
  if (dirty) saveLocalStore(local)

  if (isSupabaseConfigured()) {
    try {
      const remote = await loadSupabaseSnapshot()
      if (remote) {
        const localExtra = local as CmsStoreSnapshot & { one_minute_items?: unknown }
        const preferPri = <
          T extends { id: string; priority?: number | null; featured?: boolean | null }
        >(
          rem: T[],
          loc: T[]
        ): T[] => {
          const by = new Map(loc.map(r => [r.id, r]))
          return rem.map(r => {
            const l = by.get(r.id)
            if (!l) return r
            const lp = typeof l.priority === 'number' ? l.priority : null
            const rp = typeof r.priority === 'number' ? r.priority : null
            if (lp != null && lp >= 1 && (rp == null || rp === 100 || rp !== lp)) {
              return { ...r, priority: lp, featured: l.featured ?? r.featured }
            }
            return { ...r, priority: rp ?? lp, featured: r.featured ?? l.featured }
          })
        }
        const merged = {
          ...remote,
          media_assets: (() => {
            const byKey = new Map(
              [...local.media_assets, ...(remote.media_assets || [])].map(a => [
                `${a.storage_provider}:${a.bucket}:${a.object_key}`,
                a,
              ])
            )
            // Also index by id so video_asset_id lookups always resolve
            const byId = new Map<string, (typeof local.media_assets)[0]>()
            for (const a of byKey.values()) byId.set(a.id, a)
            for (const a of local.media_assets) if (!byId.has(a.id)) byId.set(a.id, a)
            for (const a of remote.media_assets || []) if (!byId.has(a.id)) byId.set(a.id, a)
            return Array.from(byId.values())
          })(),
          one_minute_items: localExtra.one_minute_items,
          reminders: remote.reminders?.length ? remote.reminders : local.reminders || [],
          kitabs: preferPri(remote.kitabs, local.kitabs),
          ders: preferPri(remote.ders, local.ders),
          audio_items: preferPri(remote.audio_items, local.audio_items),
          video_items: preferPri(remote.video_items, local.video_items),
          pdf_items: preferPri(remote.pdf_items, local.pdf_items),
        } as CmsStoreSnapshot & { one_minute_items?: unknown }
        if (syncOneMinuteCategories(merged) > 0) {
          saveLocalStore({
            ...local,
            video_items: merged.video_items,
            audio_items: merged.audio_items,
          })
        }
        return merged
      }
    } catch {
      // fall through
    }
  }
  return local
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
      [...store.kitabs]
        .filter(k => k.status === 'published' && isScheduleLive(resolveScheduledAt(k)))
        .sort(compareByPriorityThenDate)
    ).map(k => {
        const cover = k.cover_asset_id ? assets.get(k.cover_asset_id) : undefined
        const pdf = k.pdf_asset_id ? assets.get(k.pdf_asset_id) : undefined
        // Fallback: some older rows store public URL in metadata when asset id drifted
        const coverFallback =
          cover?.public_url ||
          (typeof k.metadata?.cover_url === 'string' ? k.metadata.cover_url : null) ||
          null
        const pdfFallback =
          pdf?.public_url ||
          (typeof k.metadata?.pdf_url === 'string' ? k.metadata.pdf_url : null) ||
          null
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
          coverImage: coverFallback,
          coverBg: k.cover_bg,
          pdfUrl: pdfFallback,
          dersCount: dersList.length,
          dersList,
          featured: resolveFeatured(k),
          priority: resolvePriority(k, 100),
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
      .filter(a => a.status === 'published' && isScheduleLive(resolveScheduledAt(a)))
      .filter(a =>
        resource === 'muhadara'
          ? a.is_muhadara
          : !matchesAudioSection(
              { category: a.category, is_muhadara: a.is_muhadara, metadata: a.metadata },
              'one_minute'
            )
      )
      .sort(compareByPriorityThenDate)
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
          isMuhadara: a.is_muhadara,
          featured: resolveFeatured(a),
          priority: resolvePriority(a, 100)
        }
      })
    return withCors(
      NextResponse.json({ ok: true, source: store.meta.backend, count: rows.length, data: rows })
    )
  }

  if (resource === 'video') {
    const rows = [...store.video_items]
      .filter(v => v.status === 'published' && isScheduleLive(resolveScheduledAt(v)))
      .filter(
        v =>
          !matchesVideoSection({ category: v.category, metadata: v.metadata }, 'one_minute')
      )
      .sort(compareByPriorityThenDate)
      .map(v => {
        const media = v.video_asset_id ? assets.get(v.video_asset_id) : undefined
        const thumb = v.thumbnail_asset_id ? assets.get(v.thumbnail_asset_id) : undefined
        const metaCover =
          typeof v.metadata?.cover_url === 'string' && v.metadata.cover_url
            ? v.metadata.cover_url
            : null
        const cover = thumb?.public_url || metaCover || null
        return {
          id: v.legacy_id || v.id,
          title: { am: v.title_am, ar: v.title_ar, en: v.title_en },
          description: {
            am: v.description_am,
            ar: v.description_ar,
            en: v.description_en
          },
          fileUrl: media?.public_url || '',
          // Prefer real image thumbnail; clients fall back to video-frame preview from fileUrl
          thumbnailUrl: cover,
          coverUrl: cover,
          type: 'video',
          category: v.category,
          featured: resolveFeatured(v),
          priority: v.priority ?? 9999
        }
      })
    return withCors(
      NextResponse.json({ ok: true, source: store.meta.backend, count: rows.length, data: rows })
    )
  }

  if (resource === 'pdfs' || resource === 'pdf') {
    const rows = [...store.pdf_items]
      .filter(p => p.status === 'published' && isScheduleLive(resolveScheduledAt(p)))
      .sort(compareByPriorityThenDate)
      .map(p => {
        const media = p.media_asset_id ? assets.get(p.media_asset_id) : undefined
        const coverId = (p.metadata?.cover_asset_id as string | undefined) || null
        const cover = coverId ? assets.get(coverId) : undefined
        return {
          id: p.legacy_id || p.id,
          title: { am: p.title_am, ar: p.title_ar, en: p.title_en },
          fileUrl: media?.public_url || '',
          coverUrl: cover?.public_url || null,
          type: 'pdf',
          category: p.category || null,
          featured: resolveFeatured(p),
          priority: resolvePriority(p, 100)
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
      .filter(r => r.status === 'published' && isScheduleLive(resolveScheduledAt(r)))
      .sort(
        (a, b) =>
          compareByPriorityThenDate(a, b) ||
          a.sort_order - b.sort_order ||
          Date.parse(b.updated_at) - Date.parse(a.updated_at)
      )
      .map(r => ({
        id: r.id,
        title: { am: r.title_am, ar: r.title_ar, en: r.title_en },
        description: {
          am: r.description_am,
          ar: r.description_ar,
          en: r.description_en
        },
        featured: resolveFeatured(r),
        priority: r.priority ?? r.sort_order ?? 100,
        updatedAt: r.updated_at
      }))
    return withCors(NextResponse.json({ ok: true, count: rows.length, data: rows }))
  }

  if (resource === 'one-minute' || resource === 'one_minute') {
    const videoRows = [...store.video_items]
      .filter(v => v.status === 'published' && isScheduleLive(resolveScheduledAt(v)))
      .filter(v =>
        matchesVideoSection({ category: v.category, metadata: v.metadata }, 'one_minute')
      )
      .sort(compareByPriorityThenDate)
      .map(v => {
        const media = v.video_asset_id ? assets.get(v.video_asset_id) : undefined
        const thumb = v.thumbnail_asset_id ? assets.get(v.thumbnail_asset_id) : undefined
        const metaCover =
          typeof v.metadata?.cover_url === 'string' && v.metadata.cover_url
            ? v.metadata.cover_url
            : null
        const durationSeconds = parseDurationSeconds(v)
        return {
          id: v.legacy_id || v.id,
          kind: 'video' as const,
          title: { am: v.title_am, ar: v.title_ar, en: v.title_en },
          body: {
            am: v.description_am,
            ar: v.description_ar,
            en: v.description_en
          },
          mediaUrl: media?.public_url || null,
          coverUrl: thumb?.public_url || metaCover || null,
          soundUrl: null,
          featured: resolveFeatured(v),
          priority: v.priority ?? 9999,
          sortOrder: v.priority ?? 9999,
          durationSeconds,
          updatedAt: v.updated_at
        }
      })

    const audioRows = [...store.audio_items]
      .filter(a => a.status === 'published' && isScheduleLive(resolveScheduledAt(a)))
      .filter(a =>
        matchesAudioSection(
          { category: a.category, is_muhadara: a.is_muhadara, metadata: a.metadata },
          'one_minute'
        )
      )
      .sort(compareByPriorityThenDate)
      .map(a => {
        const media = a.media_asset_id ? assets.get(a.media_asset_id) : undefined
        const coverId = (a.metadata?.cover_asset_id as string | undefined) || null
        const cover = coverId ? assets.get(coverId) : undefined
        const durationSeconds = parseDurationSeconds(a)
        return {
          id: a.legacy_id || a.id,
          kind: 'audio' as const,
          title: { am: a.title_am, ar: a.title_ar, en: a.title_en },
          body: {
            am: a.description_am,
            ar: a.description_ar,
            en: a.description_en
          },
          mediaUrl: media?.public_url || null,
          coverUrl: cover?.public_url || null,
          soundUrl: media?.public_url || null,
          featured: resolveFeatured(a),
          priority: resolvePriority(a, 100),
          sortOrder: a.priority ?? 100,
          durationSeconds,
          updatedAt: a.updated_at
        }
      })

    // 1-Minute Text = Admin reminders (same CMS records as Content → 1-Minute → Text)
    const local = loadLocalStore()
    const textRows = [...(local.reminders || store.reminders || [])]
      .filter(r => r.status === 'published' && isScheduleLive(resolveScheduledAt(r)))
      .sort(compareByPriorityThenDate)
      .map(r => ({
        id: r.id,
        kind: 'text' as const,
        title: { am: r.title_am, ar: r.title_ar, en: r.title_en },
        body: {
          am: r.description_am,
          ar: r.description_ar,
          en: r.description_en
        },
        mediaUrl: null,
        coverUrl: null,
        soundUrl: null,
        featured: resolveFeatured(r),
        priority: r.priority ?? r.sort_order ?? 100,
        sortOrder: r.priority ?? r.sort_order ?? 100,
        durationSeconds: null as number | null,
        updatedAt: r.updated_at
      }))

    const rows = [...videoRows, ...audioRows, ...textRows].sort((a, b) => {
      const pa = a.priority ?? 100
      const pb = b.priority ?? 100
      if (pa !== pb) return pa - pb
      const fa = a.featured ? 1 : 0
      const fb = b.featured ? 1 : 0
      if (fa !== fb) return fb - fa
      return Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || '')
    })

    return withCors(
      NextResponse.json({
        ok: true,
        source: store.meta.backend,
        count: rows.length,
        data: rows,
      })
    )
  }

  if (resource === 'marriage' || resource === 'articles' || resource === 'questions') {
    // Ask-form pending check: GET /questions?email=user@x.com (not the public Youth Q&A list)
    if (resource === 'questions') {
      const email = new URL(_request.url).searchParams.get('email')
      if (email) {
        const { findOpenQuestionByEmail } = await import('@/lib/cms/question-submissions')
        const pending = findOpenQuestionByEmail(email)
        if (!pending) {
          return withCors(NextResponse.json({ ok: true, pending: false }))
        }
        return withCors(
          NextResponse.json({
            ok: true,
            pending: true,
            id: pending.id,
            created_at: pending.created_at,
            category: pending.category,
            question_preview: pending.question.slice(0, 160),
          })
        )
      }
    }
    const { listPublishedYouthContent } = await import('@/lib/cms/youth-content')
    const kind = resource as 'marriage' | 'articles' | 'questions'
    const rows = listPublishedYouthContent(kind)
    return withCors(NextResponse.json({ ok: true, count: rows.length, data: rows }))
  }

  if (resource === 'quran-recitations' || resource === 'quran_recitations') {
    const rows = [...store.audio_items]
      .filter(a => a.status === 'published' && isScheduleLive(resolveScheduledAt(a)))
      .filter(a =>
        matchesAudioSection(
          {
            category: a.category,
            is_muhadara: a.is_muhadara,
            metadata: a.metadata,
          },
          'quran'
        )
      )
      .sort(compareByPriorityThenDate)
      .map(a => {
        const media = a.media_asset_id ? assets.get(a.media_asset_id) : undefined
        const coverId = (a.metadata?.cover_asset_id as string | undefined) || null
        const cover = coverId ? assets.get(coverId) : undefined
        const tafsirAudio =
          typeof a.metadata?.tafsir_audio_url === 'string' ? a.metadata.tafsir_audio_url : null
        const tafsirVideo =
          typeof a.metadata?.tafsir_video_url === 'string' ? a.metadata.tafsir_video_url : null
        const tafsirTextAm =
          typeof a.metadata?.tafsir_text_am === 'string' ? a.metadata.tafsir_text_am : null
        const tafsirTextEn =
          typeof a.metadata?.tafsir_text_en === 'string' ? a.metadata.tafsir_text_en : a.description_en
        const tafsirTextAr =
          typeof a.metadata?.tafsir_text_ar === 'string' ? a.metadata.tafsir_text_ar : null
        return {
          id: a.legacy_id || a.id,
          title: { am: a.title_am, ar: a.title_ar, en: a.title_en },
          reciter: {
            am: (a.metadata?.reciter_am as string) || '',
            ar: (a.metadata?.reciter_ar as string) || '',
            en: (a.metadata?.reciter_en as string) || '',
          },
          description: {
            am: a.description_am,
            ar: a.description_ar,
            en: a.description_en,
          },
          audioUrl: media?.public_url || null,
          coverUrl: cover?.public_url || null,
          tafsir: {
            text: {
              am: tafsirTextAm || a.description_am,
              ar: tafsirTextAr || a.description_ar,
              en: tafsirTextEn || a.description_en,
            },
            audioUrl: tafsirAudio || media?.public_url || null,
            videoUrl: tafsirVideo,
          },
          duration: a.duration_label || null,
          series: typeof a.metadata?.series === 'string' ? a.metadata.series : null,
          episode:
            typeof a.metadata?.episode === 'number'
              ? a.metadata.episode
              : typeof a.priority === 'number'
                ? a.priority
                : null,
          featured: resolveFeatured(a),
          priority: resolvePriority(a, 100),
          publishedAt: a.published_at || a.updated_at || null,
        }
      })
    return withCors(
      NextResponse.json({ ok: true, source: store.meta.backend, count: rows.length, data: rows })
    )
  }

  return withCors(NextResponse.json({ ok: false, error: `Unknown resource: ${resource}` }, { status: 404 }))
}

/** Public POST: analytics events, or private Ask-an-Ustaz question submissions. */
export async function POST(
  request: Request,
  context: { params: Promise<{ resource: string }> }
) {
  const { resource } = await context.params
  const body = await request.json().catch(() => ({}))

  if (resource === 'questions') {
    try {
      const { createQuestionSubmission } = await import('@/lib/cms/question-submissions')
      const authEmail = String(body.auth_email || body.contact || body.email || '').trim()
      const question = String(body.question || body.question_text || '').trim()
      const row = createQuestionSubmission({
        user_id: typeof body.user_id === 'string' ? body.user_id : null,
        auth_email: authEmail,
        name: typeof body.name === 'string' ? body.name : authEmail,
        category: typeof body.category === 'string' ? body.category : 'General Islamic Question',
        question,
      })
      return withCors(
        NextResponse.json({
          ok: true,
          id: row.id,
          message:
            'Question received. An Ustaz will answer and the reply will be sent to your email.',
        })
      )
    } catch (err) {
      const e = err as Error & { code?: string; pendingId?: string; preview?: string }
      if (e.code === 'PENDING') {
        return withCors(
          NextResponse.json(
            {
              ok: false,
              pending: true,
              id: e.pendingId,
              question_preview: e.preview,
              error: e.message,
              check_email: true,
            },
            { status: 409 }
          )
        )
      }
      return withCors(
        NextResponse.json(
          { ok: false, error: err instanceof Error ? err.message : 'Could not save question.' },
          { status: 400 }
        )
      )
    }
  }

  if (resource !== 'events') {
    return withCors(NextResponse.json({ ok: false, error: 'POST only for events or questions.' }, { status: 404 }))
  }

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
