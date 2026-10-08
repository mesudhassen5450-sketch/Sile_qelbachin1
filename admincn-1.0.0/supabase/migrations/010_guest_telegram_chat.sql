-- Guest Telegram link (no Google login) + save chat_id on each question.
-- Run in Supabase SQL Editor after 009.

-- Allow guest tokens (email) without auth.users
ALTER TABLE telegram_link_tokens
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE telegram_link_tokens
  ADD COLUMN IF NOT EXISTS guest_email TEXT;

CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_guest_email
  ON telegram_link_tokens (guest_email);

-- Email → chat_id for guests (and as lookup when user_id missing)
CREATE TABLE IF NOT EXISTS guest_telegram_links (
  guest_email TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL UNIQUE,
  username TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guest_telegram_links_chat
  ON guest_telegram_links (chat_id);

ALTER TABLE guest_telegram_links ENABLE ROW LEVEL SECURITY;
-- Service role only

-- Persist chat on the question so Admin can answer even without login
ALTER TABLE question_submissions
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

NOTIFY pgrst, 'reload schema';
