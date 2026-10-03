-- =============================================================================
-- Sile Qelbachin — ONE paste for durable Admin content (Supabase SQL Editor)
-- Safe to re-run. Covers: Qur’an/audio/video columns, Marriage, Reminders, Ask inbox.
--
-- After running: Redeploy Admin on Render. New saves stay until you delete them.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A) Audio + Video (+ Qur’an Tilawah/Tafsir uses audio_items) — editorial cols
--    Tables themselves come from migration 001. This adds Featured / Priority.
-- ---------------------------------------------------------------------------
ALTER TABLE kitabs
  ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

ALTER TABLE audio_items
  ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

ALTER TABLE video_items
  ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

ALTER TABLE pdf_items
  ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE ders
  ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_kitabs_priority ON kitabs (priority);
CREATE INDEX IF NOT EXISTS idx_audio_items_priority ON audio_items (priority);
CREATE INDEX IF NOT EXISTS idx_video_items_priority ON video_items (priority);
CREATE INDEX IF NOT EXISTS idx_pdf_items_priority ON pdf_items (priority);
CREATE INDEX IF NOT EXISTS idx_kitabs_featured ON kitabs (featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_audio_items_featured ON audio_items (featured) WHERE featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_video_items_featured ON video_items (featured) WHERE featured = TRUE;

-- ---------------------------------------------------------------------------
-- B) Marriage & Love + Articles + public Youth Q&A (youth_content)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS youth_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL CHECK (kind IN ('marriage', 'articles', 'questions')),
  slug TEXT NOT NULL,
  title_en TEXT,
  title_am TEXT,
  title_ar TEXT,
  excerpt_en TEXT,
  excerpt_am TEXT,
  excerpt_ar TEXT,
  body_en TEXT,
  body_am TEXT,
  body_ar TEXT,
  cover_url TEXT,
  audio_url TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK (status IN ('draft', 'published', 'archived', 'unpublished')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  priority INT NOT NULL DEFAULT 100,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kind, slug)
);

CREATE INDEX IF NOT EXISTS idx_youth_content_kind_status ON youth_content (kind, status);
CREATE INDEX IF NOT EXISTS idx_youth_content_priority ON youth_content (kind, priority);
CREATE INDEX IF NOT EXISTS idx_youth_content_featured ON youth_content (kind, featured)
  WHERE featured = TRUE;

-- ---------------------------------------------------------------------------
-- C) Reminders (Da’wah / Library — optional independent list later)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT,
  title_am TEXT,
  title_ar TEXT,
  description_en TEXT,
  description_am TEXT,
  description_ar TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  sort_order INT NOT NULL DEFAULT 100,
  priority INT NOT NULL DEFAULT 100,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cms_reminders_status ON cms_reminders (status);
CREATE INDEX IF NOT EXISTS idx_cms_reminders_priority ON cms_reminders (priority);
CREATE INDEX IF NOT EXISTS idx_cms_reminders_featured ON cms_reminders (featured)
  WHERE featured = TRUE;

-- ---------------------------------------------------------------------------
-- D) Ask-an-Ustaz inbox (Community → Question Submissions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS question_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  auth_email TEXT NOT NULL,
  name TEXT,
  category TEXT NOT NULL DEFAULT 'General Islamic Question',
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN (
      'new', 'assigned', 'in_review', 'answered', 'user_replied', 'closed', 'archived'
    )),
  assigned_to TEXT,
  greeting TEXT,
  answer TEXT,
  description TEXT,
  cover_url TEXT,
  audio_url TEXT,
  video_url TEXT,
  published_public BOOLEAN NOT NULL DEFAULT FALSE,
  answered_at TIMESTAMPTZ,
  answered_by TEXT,
  closed_at TIMESTAMPTZ,
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_error TEXT,
  admin_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_submissions_email
  ON question_submissions (auth_email);
CREATE INDEX IF NOT EXISTS idx_question_submissions_status
  ON question_submissions (status);
CREATE INDEX IF NOT EXISTS idx_question_submissions_created
  ON question_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_submissions_unseen
  ON question_submissions (status, admin_seen_at)
  WHERE admin_seen_at IS NULL;

NOTIFY pgrst, 'reload schema';

-- Done. Expected:
--   Qur’an Tilawah/Tafsir + Da’wah audio  → audio_items (+ Featured/Priority)
--   Videos / 1-Minute video               → video_items (+ Featured/Priority)
--   Marriage & Love / Articles / Youth Q&A → youth_content
--   Reminders                             → cms_reminders
--   Ask inbox                             → question_submissions
