import { createHash } from 'crypto'

import {
  appendAudit,
  loadLocalStore,
  nowIso,
  saveLocalStore,
  upsertMediaAsset
} from '@/lib/cms/local-store'
import { detectContentFromPath, detectMediaType } from '@/lib/cms/media-type'
import {
  buildStaffUploadObjectKey,
  getR2Env,
  hasR2ApiCredentials,
  putObjectToR2
} from '@/lib/cms/r2'
import { isSupabaseConfigured, upsertMediaAssetsRemote } from '@/lib/cms/supabase'
import type { ContentStatus, MediaAsset } from '@/lib/cms/types'

export type StaffUploadResult = {
  asset: MediaAsset
  public_url: string
  object_key: string
  backend: 'local' | 'local+supabase'
}

/**
 * Staff upload path: file bytes → Cloudflare R2 PutObject → media_assets row.
 * Not Cloudinary. Website/mobile read public_url after content is published.
 */
export async function uploadStaffMedia(input: {
  fileName: string
  mimeType?: string | null
  bytes: Buffer
  folder?: string
  adminEmail?: string
  publishAsset?: boolean
}): Promise<StaffUploadResult> {
  if (!hasR2ApiCredentials()) {
    throw new Error(
      'Cloudflare R2 credentials missing. Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY on Admin (Render).'
    )
  }

  if (!input.bytes?.length) {
    throw new Error('Empty file.')
  }

  // Soft limit ~200MB for Admin upload (Render / free tiers)
  const maxBytes = 200 * 1024 * 1024
  if (input.bytes.length > maxBytes) {
    throw new Error('File too large (max 200MB). Upload large archives with wrangler/R2 console, then Scan.')
  }

  const mediaType = detectMediaType(input.fileName, input.mimeType)
  const objectKey = buildStaffUploadObjectKey({
    mediaType,
    fileName: input.fileName,
    folder: input.folder
  })

  const put = await putObjectToR2({
    objectKey,
    body: input.bytes,
    contentType: input.mimeType || null
  })

  const env = getR2Env()
  const checksum = createHash('sha256').update(input.bytes).digest('hex')
  const detected = detectContentFromPath(objectKey, env.objectPrefix)
  const status: ContentStatus = input.publishAsset ? 'published' : 'draft'
  const store = loadLocalStore()

  const { asset } = upsertMediaAsset(store, {
    media_type: mediaType,
    storage_provider: 'cloudflare_r2',
    bucket: env.bucket,
    object_key: put.objectKey,
    public_url: put.publicUrl,
    mime_type: input.mimeType || null,
    file_size: input.bytes.length,
    duration_seconds: null,
    checksum,
    etag: put.etag,
    last_modified: nowIso(),
    status,
    health_status: 'healthy',
    is_imported: true,
    is_orphan: true,
    needs_review: Boolean(detected.needsReview),
    detected_content: detected,
    metadata: {
      uploaded_by: input.adminEmail || null,
      upload_source: 'admin_staff_upload'
    },
    last_verified_at: nowIso()
  })

  saveLocalStore(store)
  appendAudit(store, {
    admin_id: null,
    admin_email: input.adminEmail || null,
    action: 'media_uploaded',
    entity_type: 'media_assets',
    entity_id: asset.id,
    before_data: null,
    after_data: { object_key: asset.object_key, public_url: asset.public_url }
  })
  saveLocalStore(store)

  let backend: StaffUploadResult['backend'] = 'local'
  let canonical = asset
  if (isSupabaseConfigured()) {
    const remoteRows = await upsertMediaAssetsRemote([asset])
    canonical = remoteRows[0] || asset
    // Keep local store id aligned with Supabase (public API reads Supabase)
    if (canonical.id && canonical.id !== asset.id) {
      store.media_assets = store.media_assets.map(a =>
        a.id === asset.id ? { ...canonical } : a
      )
      saveLocalStore(store)
    }
    backend = 'local+supabase'
  }

  return {
    asset: canonical,
    public_url: canonical.public_url || put.publicUrl,
    object_key: canonical.object_key,
    backend
  }
}
