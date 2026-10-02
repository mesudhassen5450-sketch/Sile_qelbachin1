import {
  loadLocalStore,
  newId,
  nowIso,
  saveLocalStore,
  upsertBySlug
} from '@/lib/cms/local-store'
import { insertNewAtFront } from '@/lib/cms/priority-cascade'
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/cms/supabase'
import type {
  AudioItemRecord,
  ContentStatus,
  DersRecord,
  KitabRecord,
  PdfItemRecord,
  SahabahRecord,
  VideoItemRecord
} from '@/lib/cms/types'

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9\u1200-\u137F]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `item-${Date.now()}`
}

function markAssetLinked(store: ReturnType<typeof loadLocalStore>, assetId: string | null | undefined) {
  if (!assetId) return
  const now = nowIso()
  store.media_assets = store.media_assets.map(a =>
    a.id === assetId
      ? { ...a, is_orphan: false, status: 'published' as ContentStatus, updated_at: now }
      : a
  )
}

/** Supabase `ders` has no featured / priority / scheduled_at columns. */
function dersPayloadForSupabase(row: DersRecord) {
  const { featured: _f, priority: _p, scheduled_at: _s, ...rest } = row
  return {
    ...rest,
    metadata: {
      ...(row.metadata || {}),
      featured: row.featured,
      priority: row.priority,
      scheduled_at: row.scheduled_at
    }
  }
}

export type CreateKitabInput = {
  title_am?: string
  title_ar?: string
  title_en?: string
  author_am?: string
  author_ar?: string
  author_en?: string
  description_am?: string
  description_ar?: string
  description_en?: string
  category_en?: string
  cover_asset_id?: string | null
  pdf_asset_id?: string | null
  slug?: string
  status?: ContentStatus
  ders?: Array<{
    title_am?: string
    title_ar?: string
    title_en?: string
    speaker_en?: string
    audio_asset_id: string
    ders_number?: number
  }>
}

export async function createKitabWithDers(input: CreateKitabInput) {
  const store = loadLocalStore()
  const now = nowIso()
  const status: ContentStatus = input.status || 'published'
  const slug = input.slug?.trim() || slugify(input.title_en || input.title_am || `kitab-${Date.now()}`)

  if (store.kitabs.some(k => k.slug === slug)) {
    throw new Error(`Kitab slug already exists: ${slug}`)
  }

  const kitab: KitabRecord = {
    id: newId(),
    slug,
    title_am: input.title_am || null,
    title_ar: input.title_ar || null,
    title_en: input.title_en || null,
    author_am: input.author_am || null,
    author_ar: input.author_ar || null,
    author_en: input.author_en || null,
    category_am: null,
    category_ar: null,
    category_en: input.category_en || null,
    description_am: input.description_am || null,
    description_ar: input.description_ar || null,
    description_en: input.description_en || null,
    cover_bg: null,
    cover_asset_id: input.cover_asset_id || null,
    pdf_asset_id: input.pdf_asset_id || null,
    speaker_id: null,
    ders_count: input.ders?.length || 0,
    status,
    priority: 1,
    featured: false,
    scheduled_at: null,
    legacy_source: 'admin_create',
    metadata: { source: 'admin_ui' },
    created_at: now,
    updated_at: now,
    published_at: status === 'published' ? now : null
  }

  markAssetLinked(store, kitab.cover_asset_id)
  markAssetLinked(store, kitab.pdf_asset_id)

  const dersRows: DersRecord[] = (input.ders || []).map((d, i) => {
    markAssetLinked(store, d.audio_asset_id)
    return {
      id: newId(),
      legacy_id: `admin-ders-${Date.now()}-${i}`,
      kitab_id: kitab.id,
      ders_number: d.ders_number ?? i + 1,
      sort_order: i + 1,
      title_am: d.title_am || null,
      title_ar: d.title_ar || null,
      title_en: d.title_en || d.title_am || `Ders ${i + 1}`,
      speaker_am: null,
      speaker_ar: null,
      speaker_en: d.speaker_en || input.author_en || null,
      duration_label: null,
      audio_asset_id: d.audio_asset_id,
      status,
      priority: i + 1,
      featured: false,
      scheduled_at: null,
      metadata: { source: 'admin_ui' },
      created_at: now,
      updated_at: now,
      published_at: status === 'published' ? now : null
    }
  })

  const up = upsertBySlug(store.kitabs, kitab)
  store.kitabs = up.rows
  store.ders = [...store.ders, ...dersRows]
  await insertNewAtFront(store, 'kitabs', kitab.id, now, { persist: false })
  saveLocalStore(store)

  if (isSupabaseConfigured()) {
    const sb = getServiceSupabase()
    if (sb) {
      const fresh = store.kitabs.find(k => k.id === kitab.id) || kitab
      await sb.from('kitabs').upsert(fresh, { onConflict: 'slug' })
      // Cascade sibling kitabs that shifted down
      for (const k of store.kitabs) {
        if (k.id === kitab.id) continue
        await sb.from('kitabs').update({ priority: k.priority, updated_at: now }).eq('id', k.id)
      }
      if (dersRows.length)
        await sb.from('ders').upsert(dersRows.map(dersPayloadForSupabase), { onConflict: 'id' })
    }
  }

  return { kitab: store.kitabs.find(k => k.id === kitab.id) || kitab, ders: dersRows }
}

export async function createAudioItem(input: {
  title_am?: string
  title_ar?: string
  title_en?: string
  description_am?: string
  description_ar?: string
  description_en?: string
  category?: string
  is_muhadara?: boolean
  media_asset_id: string
  cover_asset_id?: string | null
  status?: ContentStatus
}) {
  const store = loadLocalStore()
  const now = nowIso()
  const status: ContentStatus = input.status || 'published'
  markAssetLinked(store, input.media_asset_id)
  markAssetLinked(store, input.cover_asset_id)

  const categoryRaw = String(input.category || '')
    .trim()
    .toLowerCase()
  const category =
    categoryRaw || (input.is_muhadara ? 'dawah' : 'archive')
  const row: AudioItemRecord = {
    id: newId(),
    legacy_id: `admin-audio-${Date.now()}`,
    title_am: input.title_am || null,
    title_ar: input.title_ar || null,
    title_en: input.title_en || input.title_am || 'Audio',
    description_am: input.description_am || null,
    description_ar: input.description_ar || null,
    description_en: input.description_en || null,
    category,
    media_asset_id: input.media_asset_id,
    duration_label: null,
    play_count: 0,
    download_count: 0,
    is_muhadara:
      category === 'one_minute' ? false : Boolean(input.is_muhadara ?? category === 'dawah'),
    status,
    priority: 1,
    featured: false,
    scheduled_at: null,
    metadata: {
      source: 'admin_ui',
      cover_asset_id: input.cover_asset_id || null,
      // Pins item to the Admin sidebar section it was created in
      audio_section: category,
    },
    created_at: now,
    updated_at: now,
    published_at: status === 'published' ? now : null
  }

  store.audio_items = [row, ...store.audio_items]
  await insertNewAtFront(store, 'audio', row.id, now, { persist: false })
  saveLocalStore(store)

  if (isSupabaseConfigured()) {
    const sb = getServiceSupabase()
    if (sb) {
      const fresh = store.audio_items.find(a => a.id === row.id) || row
      await sb.from('audio_items').upsert(fresh, { onConflict: 'id' })
      for (const a of store.audio_items) {
        if (a.id === row.id) continue
        await sb.from('audio_items').update({ priority: a.priority, updated_at: now }).eq('id', a.id)
      }
    }
  }

  return store.audio_items.find(a => a.id === row.id) || row
}

export async function createVideoItem(input: {
  title_am?: string
  title_ar?: string
  title_en?: string
  description_am?: string
  description_ar?: string
  description_en?: string
  category?: string
  video_asset_id: string
  cover_asset_id?: string | null
  status?: ContentStatus
}) {
  const store = loadLocalStore()
  const now = nowIso()
  const status: ContentStatus = input.status || 'published'
  markAssetLinked(store, input.video_asset_id)
  markAssetLinked(store, input.cover_asset_id)

  const row: VideoItemRecord = {
    id: newId(),
    legacy_id: `admin-video-${Date.now()}`,
    title_am: input.title_am || null,
    title_ar: input.title_ar || null,
    title_en: input.title_en || input.title_am || 'Video',
    description_am: input.description_am || null,
    description_ar: input.description_ar || null,
    description_en: input.description_en || null,
    category: input.category || 'archive',
    video_asset_id: input.video_asset_id,
    thumbnail_asset_id: input.cover_asset_id || null,
    duration_label: null,
    view_count: 0,
    download_count: 0,
    status,
    priority: 1,
    featured: false,
    scheduled_at: null,
    metadata: { source: 'admin_ui' },
    created_at: now,
    updated_at: now,
    published_at: status === 'published' ? now : null
  }

  store.video_items = [row, ...store.video_items]
  await insertNewAtFront(store, 'video', row.id, now, { persist: false })
  saveLocalStore(store)

  if (isSupabaseConfigured()) {
    const sb = getServiceSupabase()
    if (sb) {
      const fresh = store.video_items.find(v => v.id === row.id) || row
      await sb.from('video_items').upsert(fresh, { onConflict: 'id' })
      for (const v of store.video_items) {
        if (v.id === row.id) continue
        await sb.from('video_items').update({ priority: v.priority, updated_at: now }).eq('id', v.id)
      }
    }
  }

  return store.video_items.find(v => v.id === row.id) || row
}

export async function createPdfItem(input: {
  title_am?: string
  title_ar?: string
  title_en?: string
  media_asset_id: string
  cover_asset_id?: string | null
  category?: string | null
  status?: ContentStatus
}) {
  const store = loadLocalStore()
  const now = nowIso()
  const status: ContentStatus = input.status || 'published'
  markAssetLinked(store, input.media_asset_id)
  markAssetLinked(store, input.cover_asset_id)

  const row: PdfItemRecord = {
    id: newId(),
    legacy_id: `admin-pdf-${Date.now()}`,
    kitab_id: null,
    title_am: input.title_am || null,
    title_ar: input.title_ar || null,
    title_en: input.title_en || input.title_am || 'PDF',
    media_asset_id: input.media_asset_id,
    version_label: null,
    view_count: 0,
    download_count: 0,
    status,
    category: input.category || 'pdf',
    priority: 1,
    featured: false,
    scheduled_at: null,
    metadata: { source: 'admin_ui', cover_asset_id: input.cover_asset_id || null },
    created_at: now,
    updated_at: now,
    published_at: status === 'published' ? now : null
  }

  store.pdf_items = [row, ...store.pdf_items]
  await insertNewAtFront(store, 'pdfs', row.id, now, { persist: false })
  saveLocalStore(store)

  if (isSupabaseConfigured()) {
    const sb = getServiceSupabase()
    if (sb) {
      const fresh = store.pdf_items.find(p => p.id === row.id) || row
      await sb.from('pdf_items').upsert(fresh, { onConflict: 'id' })
      for (const p of store.pdf_items) {
        if (p.id === row.id) continue
        await sb.from('pdf_items').update({ priority: p.priority, updated_at: now }).eq('id', p.id)
      }
    }
  }

  return store.pdf_items.find(p => p.id === row.id) || row
}

export async function createSahabahItem(input: {
  name_am?: string
  name_ar?: string
  name_en?: string
  title_am?: string
  title_ar?: string
  title_en?: string
  description_am?: string
  description_ar?: string
  description_en?: string
  biography_am?: string
  biography_ar?: string
  biography_en?: string
  cover_asset_id?: string | null
  slug?: string
  status?: ContentStatus
}) {
  const store = loadLocalStore()
  const now = nowIso()
  const status: ContentStatus = input.status || 'published'
  const slug =
    input.slug?.trim() ||
    slugify(input.name_en || input.name_am || input.title_en || `sahabah-${Date.now()}`)

  if (!store.sahabah_items) store.sahabah_items = []
  if (store.sahabah_items.some(s => s.slug === slug)) {
    throw new Error(`Sahabah slug already exists: ${slug}`)
  }

  markAssetLinked(store, input.cover_asset_id)

  const row: SahabahRecord = {
    id: newId(),
    slug,
    name_am: input.name_am || null,
    name_ar: input.name_ar || null,
    name_en: input.name_en || null,
    title_am: input.title_am || null,
    title_ar: input.title_ar || null,
    title_en: input.title_en || null,
    description_am: input.description_am || null,
    description_ar: input.description_ar || null,
    description_en: input.description_en || null,
    biography_am: input.biography_am || null,
    biography_ar: input.biography_ar || null,
    biography_en: input.biography_en || null,
    cover_asset_id: input.cover_asset_id || null,
    status,
    metadata: { source: 'admin_ui' },
    created_at: now,
    updated_at: now,
    published_at: status === 'published' ? now : null
  }

  store.sahabah_items = [row, ...store.sahabah_items]
  saveLocalStore(store)

  if (isSupabaseConfigured()) {
    const sb = getServiceSupabase()
    if (sb) {
      try {
        await sb.from('sahabah_items').upsert(row, { onConflict: 'slug' })
      } catch {
        // optional table
      }
    }
  }

  return row
}

/** Append one child ders (audio) to an existing kitab. */
export async function createDersForKitab(input: {
  kitab_id: string
  title_am?: string | null
  title_ar?: string | null
  title_en?: string | null
  speaker_en?: string | null
  audio_asset_id: string
  status?: ContentStatus
}) {
  if (!input.audio_asset_id) {
    throw new Error('audio_asset_id required.')
  }

  const store = loadLocalStore()
  const now = nowIso()
  const status: ContentStatus = input.status || 'published'
  const sb = isSupabaseConfigured() ? getServiceSupabase() : null

  let kitab = store.kitabs.find(k => k.id === input.kitab_id) || null
  if (!kitab && sb) {
    const { data: remote, error } = await sb
      .from('kitabs')
      .select('*')
      .eq('id', input.kitab_id)
      .maybeSingle()
    if (error) throw new Error(`Load kitab failed: ${error.message}`)
    if (remote) {
      kitab = remote as KitabRecord
      store.kitabs = [...store.kitabs.filter(k => k.id !== kitab!.id), kitab]
    }
  }
  if (!kitab) throw new Error('Kitab not found.')

  let maxOrder = store.ders
    .filter(d => d.kitab_id === kitab!.id)
    .reduce((m, d) => Math.max(m, d.sort_order || 0), 0)
  if (sb) {
    const { data: remoteDers } = await sb
      .from('ders')
      .select('sort_order')
      .eq('kitab_id', kitab.id)
    if (Array.isArray(remoteDers)) {
      for (const d of remoteDers) {
        maxOrder = Math.max(maxOrder, Number(d.sort_order) || 0)
      }
    }
  }

  const nextNum = maxOrder + 1
  markAssetLinked(store, input.audio_asset_id)

  const row: DersRecord = {
    id: newId(),
    legacy_id: `admin-ders-${Date.now()}`,
    kitab_id: kitab.id,
    ders_number: nextNum,
    sort_order: nextNum,
    title_am: input.title_am || null,
    title_ar: input.title_ar || null,
    title_en: input.title_en || input.title_am || `Ders ${nextNum}`,
    speaker_am: null,
    speaker_ar: null,
    speaker_en: input.speaker_en || kitab.author_en || null,
    duration_label: null,
    audio_asset_id: input.audio_asset_id,
    status,
    priority: nextNum,
    featured: false,
    scheduled_at: null,
    metadata: { source: 'admin_ui' },
    created_at: now,
    updated_at: now,
    published_at: status === 'published' ? now : null
  }

  store.ders = [...store.ders.filter(d => d.id !== row.id), row]
  const dersCount =
    (sb
      ? maxOrder
      : store.ders.filter(d => d.kitab_id === kitab!.id && d.id !== row.id).length) + 1
  store.kitabs = store.kitabs.map(k =>
    k.id === kitab!.id ? { ...k, ders_count: dersCount, updated_at: now } : k
  )
  saveLocalStore(store)

  if (sb) {
    const { error: dersErr } = await sb
      .from('ders')
      .upsert(dersPayloadForSupabase(row), { onConflict: 'id' })
    if (dersErr) {
      throw new Error(`Could not save new ders to database: ${dersErr.message}`)
    }
    const { error: kitabErr } = await sb
      .from('kitabs')
      .update({ ders_count: dersCount, updated_at: now })
      .eq('id', kitab.id)
    if (kitabErr) {
      // ders row is saved; count mismatch is non-fatal
      console.warn('[createDersForKitab] ders_count update:', kitabErr.message)
    }
  }

  return row
}
