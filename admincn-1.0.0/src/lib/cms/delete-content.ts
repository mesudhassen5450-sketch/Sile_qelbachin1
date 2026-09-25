import {
  appendAudit,
  loadLocalStore,
  nowIso,
  saveLocalStore
} from '@/lib/cms/local-store'
import { deleteObjectFromR2, hasR2ApiCredentials } from '@/lib/cms/r2'
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/cms/supabase'

export type DeletableContentType = 'kitabs' | 'audio' | 'video' | 'pdfs' | 'sahabah' | 'ders'

function collectAssetIds(
  store: ReturnType<typeof loadLocalStore>,
  type: DeletableContentType,
  id: string
): string[] {
  const ids = new Set<string>()
  if (type === 'kitabs') {
    const kitab = store.kitabs.find(k => k.id === id)
    if (!kitab) return []
    if (kitab.cover_asset_id) ids.add(kitab.cover_asset_id)
    if (kitab.pdf_asset_id) ids.add(kitab.pdf_asset_id)
    for (const d of store.ders.filter(d => d.kitab_id === id)) {
      if (d.audio_asset_id) ids.add(d.audio_asset_id)
    }
  } else if (type === 'audio') {
    const row = store.audio_items.find(a => a.id === id)
    if (!row) return []
    if (row.media_asset_id) ids.add(row.media_asset_id)
    const coverId = row.metadata?.cover_asset_id
    if (typeof coverId === 'string' && coverId) ids.add(coverId)
  } else if (type === 'video') {
    const row = store.video_items.find(v => v.id === id)
    if (!row) return []
    if (row.video_asset_id) ids.add(row.video_asset_id)
    if (row.thumbnail_asset_id) ids.add(row.thumbnail_asset_id)
  } else if (type === 'pdfs') {
    const row = store.pdf_items.find(p => p.id === id)
    if (!row) return []
    if (row.media_asset_id) ids.add(row.media_asset_id)
    const coverId = row.metadata?.cover_asset_id
    if (typeof coverId === 'string' && coverId) ids.add(coverId)
  } else if (type === 'sahabah') {
    const row = (store.sahabah_items || []).find(s => s.id === id)
    if (!row) return []
    if (row.cover_asset_id) ids.add(row.cover_asset_id)
  } else if (type === 'ders') {
    const row = store.ders.find(d => d.id === id)
    if (!row) return []
    if (row.audio_asset_id) ids.add(row.audio_asset_id)
  }
  return Array.from(ids)
}

/**
 * Delete CMS row + linked R2 objects. Official website/mobile stop showing it
 * because public API only returns remaining published rows.
 */
export async function deleteContentItem(input: {
  type: DeletableContentType
  id: string
  adminEmail?: string | null
  deleteR2Files?: boolean
}): Promise<{
  ok: true
  deleted_r2_keys: string[]
  skipped_r2: string[]
}> {
  const store = loadLocalStore()
  const id = input.id
  const deleteR2 = input.deleteR2Files !== false
  const assetIds = collectAssetIds(store, input.type, id)

  if (input.type === 'kitabs' && !store.kitabs.some(k => k.id === id)) {
    throw new Error('Kitab not found.')
  }
  if (input.type === 'audio' && !store.audio_items.some(a => a.id === id)) {
    throw new Error('Audio item not found.')
  }
  if (input.type === 'video' && !store.video_items.some(v => v.id === id)) {
    throw new Error('Video item not found.')
  }
  if (input.type === 'pdfs' && !store.pdf_items.some(p => p.id === id)) {
    throw new Error('PDF item not found.')
  }
  if (input.type === 'sahabah' && !(store.sahabah_items || []).some(s => s.id === id)) {
    throw new Error('Sahabah item not found.')
  }
  if (input.type === 'ders' && !store.ders.some(d => d.id === id)) {
    throw new Error('Ders not found.')
  }

  const assets = store.media_assets.filter(a => assetIds.includes(a.id))
  const deletedKeys: string[] = []
  const skipped: string[] = []

  if (deleteR2 && hasR2ApiCredentials()) {
    for (const asset of assets) {
      try {
        await deleteObjectFromR2(asset.object_key)
        deletedKeys.push(asset.object_key)
      } catch (err) {
        skipped.push(
          `${asset.object_key}: ${err instanceof Error ? err.message : 'delete failed'}`
        )
      }
    }
  } else if (deleteR2) {
    skipped.push('R2 credentials missing — CMS row deleted but files left on Cloudflare.')
  }

  const assetIdSet = new Set(assetIds)
  store.media_assets = store.media_assets.filter(a => !assetIdSet.has(a.id))

  if (input.type === 'kitabs') {
    store.ders = store.ders.filter(d => d.kitab_id !== id)
    store.kitabs = store.kitabs.filter(k => k.id !== id)
  } else if (input.type === 'audio') {
    store.audio_items = store.audio_items.filter(a => a.id !== id)
  } else if (input.type === 'video') {
    store.video_items = store.video_items.filter(v => v.id !== id)
  } else if (input.type === 'pdfs') {
    store.pdf_items = store.pdf_items.filter(p => p.id !== id)
  } else if (input.type === 'sahabah') {
    store.sahabah_items = (store.sahabah_items || []).filter(s => s.id !== id)
  } else if (input.type === 'ders') {
    store.ders = store.ders.filter(d => d.id !== id)
  }

  appendAudit(store, {
    admin_id: null,
    admin_email: input.adminEmail || null,
    action: 'content_deleted',
    entity_type: input.type,
    entity_id: id,
    before_data: { asset_ids: assetIds, r2_keys: assets.map(a => a.object_key) },
    after_data: { deleted_r2_keys: deletedKeys, skipped_r2: skipped, at: nowIso() }
  })
  saveLocalStore(store)

  if (isSupabaseConfigured()) {
    const sb = getServiceSupabase()
    if (sb) {
      if (input.type === 'kitabs') {
        await sb.from('ders').delete().eq('kitab_id', id)
        await sb.from('kitabs').delete().eq('id', id)
      } else if (input.type === 'audio') {
        await sb.from('audio_items').delete().eq('id', id)
      } else if (input.type === 'video') {
        await sb.from('video_items').delete().eq('id', id)
      } else if (input.type === 'pdfs') {
        await sb.from('pdf_items').delete().eq('id', id)
      } else if (input.type === 'ders') {
        await sb.from('ders').delete().eq('id', id)
      }
      for (const asset of assets) {
        await sb
          .from('media_assets')
          .delete()
          .eq('storage_provider', asset.storage_provider)
          .eq('bucket', asset.bucket)
          .eq('object_key', asset.object_key)
      }
    }
  }

  return { ok: true, deleted_r2_keys: deletedKeys, skipped_r2: skipped }
}

export async function updateContentMeta(input: {
  type: DeletableContentType
  id: string
  title_en?: string | null
  title_am?: string | null
  author_en?: string | null
  description_en?: string | null
  description_am?: string | null
}): Promise<{ ok: true }> {
  const store = loadLocalStore()
  const now = nowIso()
  let found = false

  if (input.type === 'kitabs') {
    store.kitabs = store.kitabs.map(k => {
      if (k.id !== input.id) return k
      found = true
      return {
        ...k,
        title_en: input.title_en !== undefined ? input.title_en : k.title_en,
        title_am: input.title_am !== undefined ? input.title_am : k.title_am,
        author_en: input.author_en !== undefined ? input.author_en : k.author_en,
        description_en:
          input.description_en !== undefined ? input.description_en : k.description_en,
        description_am:
          input.description_am !== undefined ? input.description_am : k.description_am,
        updated_at: now
      }
    })
  } else if (input.type === 'audio') {
    store.audio_items = store.audio_items.map(a => {
      if (a.id !== input.id) return a
      found = true
      return {
        ...a,
        title_en: input.title_en !== undefined ? input.title_en : a.title_en,
        title_am: input.title_am !== undefined ? input.title_am : a.title_am,
        description_en:
          input.description_en !== undefined ? input.description_en : a.description_en,
        description_am:
          input.description_am !== undefined ? input.description_am : a.description_am,
        updated_at: now
      }
    })
  } else if (input.type === 'video') {
    store.video_items = store.video_items.map(v => {
      if (v.id !== input.id) return v
      found = true
      return {
        ...v,
        title_en: input.title_en !== undefined ? input.title_en : v.title_en,
        title_am: input.title_am !== undefined ? input.title_am : v.title_am,
        description_en:
          input.description_en !== undefined ? input.description_en : v.description_en,
        description_am:
          input.description_am !== undefined ? input.description_am : v.description_am,
        updated_at: now
      }
    })
  } else if (input.type === 'pdfs') {
    store.pdf_items = store.pdf_items.map(p => {
      if (p.id !== input.id) return p
      found = true
      return {
        ...p,
        title_en: input.title_en !== undefined ? input.title_en : p.title_en,
        title_am: input.title_am !== undefined ? input.title_am : p.title_am,
        updated_at: now
      }
    })
  } else if (input.type === 'sahabah') {
    store.sahabah_items = (store.sahabah_items || []).map(s => {
      if (s.id !== input.id) return s
      found = true
      return {
        ...s,
        name_en: input.title_en !== undefined ? input.title_en : s.name_en,
        name_am: input.title_am !== undefined ? input.title_am : s.name_am,
        description_en:
          input.description_en !== undefined ? input.description_en : s.description_en,
        description_am:
          input.description_am !== undefined ? input.description_am : s.description_am,
        updated_at: now
      }
    })
  }

  if (!found) throw new Error('Item not found.')
  saveLocalStore(store)

  if (isSupabaseConfigured() && input.type !== 'sahabah') {
    const sb = getServiceSupabase()
    if (sb) {
      const table =
        input.type === 'kitabs'
          ? 'kitabs'
          : input.type === 'audio'
            ? 'audio_items'
            : input.type === 'video'
              ? 'video_items'
              : 'pdf_items'
      const patch: Record<string, unknown> = { updated_at: now }
      if (input.title_en !== undefined) patch.title_en = input.title_en
      if (input.title_am !== undefined) patch.title_am = input.title_am
      if (input.author_en !== undefined && input.type === 'kitabs') patch.author_en = input.author_en
      if (input.description_en !== undefined) patch.description_en = input.description_en
      if (input.description_am !== undefined) patch.description_am = input.description_am
      await sb.from(table).update(patch).eq('id', input.id)
    }
  }

  return { ok: true }
}
