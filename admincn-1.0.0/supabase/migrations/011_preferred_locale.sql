-- Preferred UI language from the website (am / en / ar) for Telegram + email chrome.
-- Run in Supabase SQL Editor after 010.

ALTER TABLE telegram_link_tokens
  ADD COLUMN IF NOT EXISTS preferred_locale TEXT;

ALTER TABLE guest_telegram_links
  ADD COLUMN IF NOT EXISTS preferred_locale TEXT;

ALTER TABLE user_telegram_links
  ADD COLUMN IF NOT EXISTS preferred_locale TEXT;

ALTER TABLE question_submissions
  ADD COLUMN IF NOT EXISTS preferred_locale TEXT;

NOTIFY pgrst, 'reload schema';
