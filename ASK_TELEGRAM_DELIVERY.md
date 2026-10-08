# Ask Question — Email + Telegram delivery

Extends the existing **Resend email** Ask / Admin answer flow. Does **not** replace email.

## Architecture

```text
User (website)  →  chooses Email | Telegram  →  question_submissions.answer_channel
Admin (Render)  →  Send Answer via Email (Resend) or Telegram (Bot API)
Telegram connect → deep link → @sileqelbachin1_Bot webhook → user_telegram_links
```

| Secret | Where |
|--------|--------|
| `TELEGRAM_BOT_TOKEN` | Admin Render + `admincn-1.0.0/.env.local` only |
| `RESEND_API_KEY` | Admin Render (unchanged) |

Never put the bot token in website frontend or git.

## One-time setup

1. **Supabase SQL** — run  
   `admincn-1.0.0/supabase/migrations/009_telegram_answer_delivery.sql`
2. **Render env** — add `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME=sileqelbachin1_Bot`,  
   optional `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_WEBHOOK_SETUP_KEY`,  
   `TELEGRAM_WEBHOOK_URL=https://admin.sileqelbachin1.com/api/telegram/webhook`
3. **Register webhook** (after Admin deploy):  
   `GET https://admin.sileqelbachin1.com/api/telegram/webhook?setup=1&key=<TELEGRAM_WEBHOOK_SETUP_KEY>`

## User flow

1. Ask a Question → pick **Email** or **Telegram**
2. Telegram → **Connect Telegram** opens `t.me/sileqelbachin1_Bot?start=c_…`
3. Bot saves `chat_id` to `user_telegram_links` for that website user
4. Submit stores `answer_channel`

## Admin flow

Community → Question Submissions → see requested channel → **Send answer via** Email or Telegram.

- Email → existing `sendUstazAnswerEmail` (Resend)
- Telegram → `sendMessage` to saved `chat_id`
- Failed delivery → clear error; `delivery_status=failed` (not claimed as sent)
