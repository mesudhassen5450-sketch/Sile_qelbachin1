-- Telegram answer delivery for Ask-an-Ustaz (extends Resend email; does not replace it).
-- Apply once in Supabase SQL Editor (project lsyyezhsqhzcskjbqmco).

-- 1) User ↔ Telegram chat link (service role writes; users may read own row)
CREATE TABLE IF NOT EXISTS user_telegram_links (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL UNIQUE,
  username TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_telegram_links_chat
  ON user_telegram_links (chat_id);

ALTER TABLE user_telegram_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS telegram_links_select_own ON user_telegram_links;
CREATE POLICY telegram_links_select_own ON user_telegram_links
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_super_admin()
    OR public.current_staff_is_active()
  );

-- No INSERT/UPDATE for authenticated clients — Admin service role only.

-- 2) One-time deep-link tokens (t.me/Bot?start=…)
CREATE TABLE IF NOT EXISTS telegram_link_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_user
  ON telegram_link_tokens (user_id);

ALTER TABLE telegram_link_tokens ENABLE ROW LEVEL SECURITY;
-- Service role only (no policies for anon/authenticated)

-- 3) Question inbox: remember requested channel + delivery outcome
ALTER TABLE question_submissions
  ADD COLUMN IF NOT EXISTS answer_channel TEXT NOT NULL DEFAULT 'email';

ALTER TABLE question_submissions
  ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'pending';

ALTER TABLE question_submissions
  ADD COLUMN IF NOT EXISTS delivery_error TEXT;

-- Backfill: answered+email_sent → sent
UPDATE question_submissions
SET delivery_status = 'sent'
WHERE email_sent = TRUE AND (delivery_status IS NULL OR delivery_status = 'pending');

UPDATE question_submissions
SET delivery_status = 'failed'
WHERE email_sent = FALSE
  AND email_error IS NOT NULL
  AND status = 'answered'
  AND (delivery_status IS NULL OR delivery_status = 'pending');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'question_submissions_answer_channel_check'
  ) THEN
    ALTER TABLE question_submissions
      ADD CONSTRAINT question_submissions_answer_channel_check
      CHECK (answer_channel IN ('email', 'telegram'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'question_submissions_delivery_status_check'
  ) THEN
    ALTER TABLE question_submissions
      ADD CONSTRAINT question_submissions_delivery_status_check
      CHECK (delivery_status IN ('pending', 'sent', 'failed'));
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
