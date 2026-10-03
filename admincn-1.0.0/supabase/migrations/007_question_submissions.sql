-- Durable Ask-an-Ustaz inbox (Community → Question Submissions).
-- Fixes: questions were only on ephemeral Render disk and vanished after redeploy.

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
