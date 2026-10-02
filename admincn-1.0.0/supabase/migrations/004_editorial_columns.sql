-- Editorial columns used by Admin priority / featured / schedule control.
-- Safe to re-run: IF NOT EXISTS guards.

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

NOTIFY pgrst, 'reload schema';
