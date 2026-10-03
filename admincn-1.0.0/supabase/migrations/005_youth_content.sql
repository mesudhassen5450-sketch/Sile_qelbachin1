-- Durable Youth & Heart content (marriage | articles | questions).
-- Fixes: Admin Q&A was only on ephemeral Render disk and vanished after redeploy.

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

NOTIFY pgrst, 'reload schema';
