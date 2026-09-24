-- Sile Qelbachin CMS schema
-- Cloudflare R2 = file storage; Supabase PostgreSQL = metadata + publishing

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE content_status AS ENUM (
    'draft', 'review', 'approved', 'published', 'unpublished', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE media_type AS ENUM ('audio', 'video', 'pdf', 'image', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE media_health_status AS ENUM (
    'healthy', 'broken', 'missing', 'unreachable', 'needs_review', 'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type media_type NOT NULL DEFAULT 'other',
  storage_provider TEXT NOT NULL DEFAULT 'cloudflare_r2',
  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,
  public_url TEXT,
  mime_type TEXT,
  file_size BIGINT,
  duration_seconds NUMERIC,
  checksum TEXT,
  etag TEXT,
  last_modified TIMESTAMPTZ,
  status content_status NOT NULL DEFAULT 'draft',
  health_status media_health_status NOT NULL DEFAULT 'unknown',
  is_imported BOOLEAN NOT NULL DEFAULT TRUE,
  is_orphan BOOLEAN NOT NULL DEFAULT TRUE,
  needs_review BOOLEAN NOT NULL DEFAULT FALSE,
  detected_content JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ,
  UNIQUE (storage_provider, bucket, object_key)
);

CREATE INDEX IF NOT EXISTS idx_media_assets_type ON media_assets (media_type);
CREATE INDEX IF NOT EXISTS idx_media_assets_orphan ON media_assets (is_orphan);
CREATE INDEX IF NOT EXISTS idx_media_assets_health ON media_assets (health_status);

CREATE TABLE IF NOT EXISTS speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_am TEXT,
  name_ar TEXT,
  name_en TEXT,
  bio JSONB DEFAULT '{}'::jsonb,
  status content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_am TEXT,
  name_ar TEXT,
  name_en TEXT,
  kind TEXT DEFAULT 'general',
  status content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kitabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_am TEXT,
  title_ar TEXT,
  title_en TEXT,
  author_am TEXT,
  author_ar TEXT,
  author_en TEXT,
  category_am TEXT,
  category_ar TEXT,
  category_en TEXT,
  description_am TEXT,
  description_ar TEXT,
  description_en TEXT,
  cover_bg TEXT,
  cover_asset_id UUID REFERENCES media_assets (id) ON DELETE SET NULL,
  pdf_asset_id UUID REFERENCES media_assets (id) ON DELETE SET NULL,
  speaker_id UUID REFERENCES speakers (id) ON DELETE SET NULL,
  ders_count INT NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'draft',
  legacy_source TEXT DEFAULT 'static',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  kitab_id UUID NOT NULL REFERENCES kitabs (id) ON DELETE CASCADE,
  ders_number INT,
  sort_order INT NOT NULL DEFAULT 0,
  title_am TEXT,
  title_ar TEXT,
  title_en TEXT,
  speaker_am TEXT,
  speaker_ar TEXT,
  speaker_en TEXT,
  duration_label TEXT,
  audio_asset_id UUID REFERENCES media_assets (id) ON DELETE SET NULL,
  status content_status NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ders_kitab ON ders (kitab_id, sort_order);

CREATE TABLE IF NOT EXISTS audio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  title_am TEXT,
  title_ar TEXT,
  title_en TEXT,
  description_am TEXT,
  description_ar TEXT,
  description_en TEXT,
  category TEXT,
  media_asset_id UUID REFERENCES media_assets (id) ON DELETE SET NULL,
  duration_label TEXT,
  play_count BIGINT NOT NULL DEFAULT 0,
  download_count BIGINT NOT NULL DEFAULT 0,
  is_muhadara BOOLEAN NOT NULL DEFAULT FALSE,
  status content_status NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS video_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  title_am TEXT,
  title_ar TEXT,
  title_en TEXT,
  description_am TEXT,
  description_ar TEXT,
  description_en TEXT,
  category TEXT,
  video_asset_id UUID REFERENCES media_assets (id) ON DELETE SET NULL,
  thumbnail_asset_id UUID REFERENCES media_assets (id) ON DELETE SET NULL,
  duration_label TEXT,
  view_count BIGINT NOT NULL DEFAULT 0,
  download_count BIGINT NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pdf_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id TEXT UNIQUE,
  kitab_id UUID REFERENCES kitabs (id) ON DELETE SET NULL,
  title_am TEXT,
  title_ar TEXT,
  title_en TEXT,
  media_asset_id UUID REFERENCES media_assets (id) ON DELETE SET NULL,
  version_label TEXT,
  view_count BIGINT NOT NULL DEFAULT 0,
  download_count BIGINT NOT NULL DEFAULT 0,
  status content_status NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS scan_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'r2',
  total_objects INT NOT NULL DEFAULT 0,
  matched INT NOT NULL DEFAULT 0,
  imported INT NOT NULL DEFAULT 0,
  updated INT NOT NULL DEFAULT 0,
  skipped INT NOT NULL DEFAULT 0,
  failed INT NOT NULL DEFAULT 0,
  needs_review INT NOT NULL DEFAULT 0,
  new_objects INT NOT NULL DEFAULT 0,
  changed_objects INT NOT NULL DEFAULT 0,
  missing_objects INT NOT NULL DEFAULT 0,
  orphan_objects INT NOT NULL DEFAULT 0,
  by_type JSONB DEFAULT '{}'::jsonb,
  error_log JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'running'
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT,
  admin_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_data JSONB,
  after_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb
);

INSERT INTO admin_roles (slug, label, permissions) VALUES
  ('super_admin', 'Super Admin', '["*"]'::jsonb),
  ('content_admin', 'Content Admin', '["content.*","media.read"]'::jsonb),
  ('media_admin', 'Media Admin', '["media.*"]'::jsonb),
  ('analytics_admin', 'Analytics Admin', '["analytics.*"]'::jsonb),
  ('read_only', 'Read Only', '["*.read"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_media_assets_updated BEFORE UPDATE ON media_assets
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_kitabs_updated BEFORE UPDATE ON kitabs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_ders_updated BEFORE UPDATE ON ders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
