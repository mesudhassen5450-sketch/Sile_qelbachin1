-- Durable Admin reminders (Articles + Da’wah + Library + home featured titles).
-- Fixes: reminders were only on ephemeral Render disk and vanished after redeploy.

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

NOTIFY pgrst, 'reload schema';
