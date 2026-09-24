export type ContentStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'published'
  | 'unpublished'
  | 'archived'

export type MediaType = 'audio' | 'video' | 'pdf' | 'image' | 'other'

export type MediaHealthStatus =
  | 'healthy'
  | 'broken'
  | 'missing'
  | 'unreachable'
  | 'needs_review'
  | 'unknown'

export type LocalizedText = {
  am?: string
  ar?: string
  en?: string
}

export type DetectedContent = {
  kind?: 'kitab_audio' | 'kitab_pdf' | 'kitab_cover' | 'archive_audio' | 'archive_video' | 'unknown'
  kitabSlug?: string
  kitabFolder?: string
  dersHint?: string
  confidence?: 'high' | 'medium' | 'low'
  needsReview?: boolean
}

export type MediaAsset = {
  id: string
  media_type: MediaType
  storage_provider: string
  bucket: string
  object_key: string
  public_url: string | null
  mime_type: string | null
  file_size: number | null
  duration_seconds: number | null
  checksum: string | null
  etag: string | null
  last_modified: string | null
  status: ContentStatus
  health_status: MediaHealthStatus
  is_imported: boolean
  is_orphan: boolean
  needs_review: boolean
  detected_content: DetectedContent
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  last_verified_at: string | null
}

export type KitabRecord = {
  id: string
  slug: string
  title_am: string | null
  title_ar: string | null
  title_en: string | null
  author_am: string | null
  author_ar: string | null
  author_en: string | null
  category_am: string | null
  category_ar: string | null
  category_en: string | null
  description_am: string | null
  description_ar: string | null
  description_en: string | null
  cover_bg: string | null
  cover_asset_id: string | null
  pdf_asset_id: string | null
  speaker_id: string | null
  ders_count: number
  status: ContentStatus
  legacy_source: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  published_at: string | null
}

export type DersRecord = {
  id: string
  legacy_id: string | null
  kitab_id: string
  ders_number: number | null
  sort_order: number
  title_am: string | null
  title_ar: string | null
  title_en: string | null
  speaker_am: string | null
  speaker_ar: string | null
  speaker_en: string | null
  duration_label: string | null
  audio_asset_id: string | null
  status: ContentStatus
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  published_at: string | null
}

export type AudioItemRecord = {
  id: string
  legacy_id: string | null
  title_am: string | null
  title_ar: string | null
  title_en: string | null
  description_am: string | null
  description_ar: string | null
  description_en: string | null
  category: string | null
  media_asset_id: string | null
  duration_label: string | null
  play_count: number
  download_count: number
  is_muhadara: boolean
  status: ContentStatus
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  published_at: string | null
}

export type VideoItemRecord = {
  id: string
  legacy_id: string | null
  title_am: string | null
  title_ar: string | null
  title_en: string | null
  description_am: string | null
  description_ar: string | null
  description_en: string | null
  category: string | null
  video_asset_id: string | null
  thumbnail_asset_id: string | null
  duration_label: string | null
  view_count: number
  download_count: number
  status: ContentStatus
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  published_at: string | null
}

export type PdfItemRecord = {
  id: string
  legacy_id: string | null
  kitab_id: string | null
  title_am: string | null
  title_ar: string | null
  title_en: string | null
  media_asset_id: string | null
  version_label: string | null
  view_count: number
  download_count: number
  status: ContentStatus
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
  published_at: string | null
}

export type ScanRun = {
  id: string
  started_at: string
  finished_at: string | null
  source: string
  total_objects: number
  matched: number
  imported: number
  updated: number
  skipped: number
  failed: number
  needs_review: number
  new_objects: number
  changed_objects: number
  missing_objects: number
  orphan_objects: number
  by_type: Record<string, number>
  error_log: Array<{ object_key?: string; message: string }>
  status: string
}

export type AuditLog = {
  id: string
  admin_id: string | null
  admin_email: string | null
  action: string
  entity_type: string
  entity_id: string | null
  before_data: unknown
  after_data: unknown
  created_at: string
}

export type R2ObjectInfo = {
  object_key: string
  size: number | null
  last_modified: string | null
  etag: string | null
  mime_type: string | null
}

export type CmsStoreSnapshot = {
  media_assets: MediaAsset[]
  kitabs: KitabRecord[]
  ders: DersRecord[]
  audio_items: AudioItemRecord[]
  video_items: VideoItemRecord[]
  pdf_items: PdfItemRecord[]
  scan_runs: ScanRun[]
  audit_logs: AuditLog[]
  meta: {
    last_scan_at: string | null
    backend: 'local' | 'supabase'
  }
}
