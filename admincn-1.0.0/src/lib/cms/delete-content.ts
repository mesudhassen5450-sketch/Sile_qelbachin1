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
  author_am?: string | null
  description_en?: string | null
  description_am?: string | null
  cover_asset_id?: string | null
  pdf_asset_id?: string | null
  media_asset_id?: string | null
  video_asset_id?: string | null
  thumbnail_asset_id?: string | null
  cover_url?: string | null
  pdf_url?: string | null
}): Promise<{ ok: true; row?: Record<string, unknown> | null }> {
  const store = loadLocalStore()
  const now = nowIso()
  let found = false

  if (input.type === 'kitabs') {
    store.kitabs = store.kitabs.map(k => {
      if (k.id !== input.id) return k
      found = true
      const coverId =
        input.cover_asset_id !== undefined ? input.cover_asset_id : k.cover_asset_id
      const pdfId = input.pdf_asset_id !== undefined ? input.pdf_asset_id : k.pdf_asset_id
      const coverAsset = coverId ? store.media_assets.find(a => a.id === coverId) : undefined
      const pdfAsset = pdfId ? store.media_assets.find(a => a.id === pdfId) : undefined
      return {
        ...k,
        title_en: input.title_en !== undefined ? input.title_en : k.title_en,
        title_am: input.title_am !== undefined ? input.title_am : k.title_am,
        author_en: input.author_en !== undefined ? input.author_en : k.author_en,
        author_am: input.author_am !== undefined ? input.author_am : k.author_am,
        description_en:
          input.description_en !== undefined ? input.description_en : k.description_en,
        description_am:
          input.description_am !== undefined ? input.description_am : k.description_am,
        cover_asset_id: coverId,
        pdf_asset_id: pdfId,
        metadata: {
          ...(k.metadata || {}),
          ...(coverAsset?.public_url ? { cover_url: coverAsset.public_url } : {}),
          ...(pdfAsset?.public_url ? { pdf_url: pdfAsset.public_url } : {})
        },
        updated_at: now
      }
    })
  } else if (input.type === 'audio') {
    store.audio_items = store.audio_items.map(a => {
      if (a.id !== input.id) return a
      found = true
      const nextMeta = { ...(a.metadata || {}) }
      if (input.cover_asset_id !== undefined) {
        nextMeta.cover_asset_id = input.cover_asset_id
      }
      return {
        ...a,
        title_en: input.title_en !== undefined ? input.title_en : a.title_en,
        title_am: input.title_am !== undefined ? input.title_am : a.title_am,
        description_en:
          input.description_en !== undefined ? input.description_en : a.description_en,
        description_am:
          input.description_am !== undefined ? input.description_am : a.description_am,
        media_asset_id:
          input.media_asset_id !== undefined ? input.media_asset_id : a.media_asset_id,
        metadata: nextMeta,
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
        video_asset_id:
          input.video_asset_id !== undefined ? input.video_asset_id : v.video_asset_id,
        thumbnail_asset_id:
          input.thumbnail_asset_id !== undefined
            ? input.thumbnail_asset_id
            : input.cover_asset_id !== undefined
              ? input.cover_asset_id
              : v.thumbnail_asset_id,
        updated_at: now
      }
    })
  } else if (input.type === 'pdfs') {
    store.pdf_items = store.pdf_items.map(p => {
      if (p.id !== input.id) return p
      found = true
      const nextMeta = { ...(p.metadata || {}) }
      if (input.cover_asset_id !== undefined) {
        nextMeta.cover_asset_id = input.cover_asset_id
      }
      return {
        ...p,
        title_en: input.title_en !== undefined ? input.title_en : p.title_en,
        title_am: input.title_am !== undefined ? input.title_am : p.title_am,
        media_asset_id:
          input.pdf_asset_id !== undefined
            ? input.pdf_asset_id
            : input.media_asset_id !== undefined
              ? input.media_asset_id
              : p.media_asset_id,
        metadata: nextMeta,
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
        cover_asset_id:
          input.cover_asset_id !== undefined ? input.cover_asset_id : s.cover_asset_id,
        updated_at: now
      }
    })
  }

  // If the row lives only in Supabase (common on Render), pull it into local then patch.
  if (!found && isSupabaseConfigured() && input.type !== 'sahabah' && input.type !== 'ders') {
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
      const { data: remote, error } = await sb.from(table).select('*').eq('id', input.id).maybeSingle()
      if (error) throw new Error(`Load failed: ${error.message}`)
      if (remote) {
        if (input.type === 'kitabs') {
          store.kitabs = [...store.kitabs.filter(k => k.id !== input.id), remote as (typeof store.kitabs)[0]]
        } else if (input.type === 'audio') {
          store.audio_items = [
            ...store.audio_items.filter(a => a.id !== input.id),
            remote as (typeof store.audio_items)[0]
          ]
        } else if (input.type === 'video') {
          store.video_items = [
            ...store.video_items.filter(v => v.id !== input.id),
            remote as (typeof store.video_items)[0]
          ]
        } else if (input.type === 'pdfs') {
          store.pdf_items = [
            ...store.pdf_items.filter(p => p.id !== input.id),
            remote as (typeof store.pdf_items)[0]
          ]
        }
        // Re-apply patch on the newly imported local row
        return updateContentMeta(input)
      }
    }
  }

  if (!found) throw new Error('Item not found.')
  saveLocalStore(store)

  if (isSupabaseConfigured()) {
    const sb = getServiceSupabase()
    if (sb) {
      if (input.type === 'sahabah') {
        // Sahabah may be local-only until a table exists; local save already done.
      } else {
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
        if (input.author_am !== undefined && input.type === 'kitabs') patch.author_am = input.author_am
        if (input.description_en !== undefined) patch.description_en = input.description_en
        if (input.description_am !== undefined) patch.description_am = input.description_am
        if (input.type === 'kitabs') {
          if (input.cover_asset_id !== undefined) patch.cover_asset_id = input.cover_asset_id
          if (input.pdf_asset_id !== undefined) patch.pdf_asset_id = input.pdf_asset_id
          const localKitab = store.kitabs.find(k => k.id === input.id)
          const meta: Record<string, unknown> = { ...(localKitab?.metadata || {}) }
          if (input.cover_url) meta.cover_url = input.cover_url
          if (input.pdf_url) meta.pdf_url = input.pdf_url
          // Resolve public URLs from media_assets so website can show cover even if join lags
          if (input.cover_asset_id) {
            const { data: coverRow } = await sb
              .from('media_assets')
              .select('public_url')
              .eq('id', input.cover_asset_id)
              .maybeSingle()
            if (coverRow?.public_url) meta.cover_url = coverRow.public_url
          }
          if (input.pdf_asset_id) {
            const { data: pdfRow } = await sb
              .from('media_assets')
              .select('public_url')
              .eq('id', input.pdf_asset_id)
              .maybeSingle()
            if (pdfRow?.public_url) meta.pdf_url = pdfRow.public_url
          }
          patch.metadata = meta
          if (localKitab) {
            localKitab.metadata = meta
            saveLocalStore(store)
          }
        }
        if (input.type === 'audio') {
          if (input.media_asset_id !== undefined) patch.media_asset_id = input.media_asset_id
          if (input.cover_asset_id !== undefined) {
            const { data: existing } = await sb
              .from('audio_items')
              .select('metadata')
              .eq('id', input.id)
              .maybeSingle()
            const meta = {
              ...((existing?.metadata as Record<string, unknown>) || {}),
              cover_asset_id: input.cover_asset_id
            }
            patch.metadata = meta
          }
        }
        if (input.type === 'video') {
          if (input.video_asset_id !== undefined) patch.video_asset_id = input.video_asset_id
          if (input.thumbnail_asset_id !== undefined || input.cover_asset_id !== undefined) {
            patch.thumbnail_asset_id = input.thumbnail_asset_id ?? input.cover_asset_id
          }
        }
        if (input.type === 'pdfs') {
          if (input.pdf_asset_id !== undefined || input.media_asset_id !== undefined) {
            patch.media_asset_id = input.pdf_asset_id ?? input.media_asset_id
          }
          if (input.cover_asset_id !== undefined) {
            const { data: existing } = await sb
              .from('pdf_items')
              .select('metadata')
              .eq('id', input.id)
              .maybeSingle()
            const meta = {
              ...((existing?.metadata as Record<string, unknown>) || {}),
              cover_asset_id: input.cover_asset_id
            }
            patch.metadata = meta
          }
        }

        const { data, error } = await sb
          .from(table)
          .update(patch)
          .eq('id', input.id)
          .select('*')
          .maybeSingle()
        if (error) throw new Error(`Save failed (database): ${error.message}`)
        if (!data) {
          // Row exists only in Supabase under a different path — try upsert from local row
          const localRow =
            input.type === 'kitabs'
              ? store.kitabs.find(k => k.id === input.id)
              : input.type === 'audio'
                ? store.audio_items.find(a => a.id === input.id)
                : input.type === 'video'
                  ? store.video_items.find(v => v.id === input.id)
                  : store.pdf_items.find(p => p.id === input.id)
          if (localRow) {
            const { data: upData, error: upErr } = await sb
              .from(table)
              .upsert(localRow as Record<string, unknown>)
              .select('*')
              .maybeSingle()
            if (upErr) throw new Error(`Save failed (database upsert): ${upErr.message}`)
            return { ok: true, row: (upData as Record<string, unknown>) || null }
          } else {
            throw new Error('Item not found in database. Refresh Admin and try again.')
          }
        }
        // Keep local mirror in sync with what Supabase actually stored
        if (input.type === 'kitabs' && data) {
          store.kitabs = store.kitabs.map(k =>
            k.id === input.id ? { ...k, ...(data as object), updated_at: now } : k
          )
          saveLocalStore(store)
        }
        return { ok: true, row: data as Record<string, unknown> }
      }
    }
  }

  return { ok: true, row: null }
}

