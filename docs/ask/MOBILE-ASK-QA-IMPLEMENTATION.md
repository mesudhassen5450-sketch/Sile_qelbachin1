# ሞባይል መተግበሪያ — ጥያቄ + ኢሜይል / ቴሌግራም ምላሽ

**Product:** ስለ ቀልባችን / Sile Qelbachin  
**Purpose:** Convert the live website Ask → Email / Telegram bot flow into Flutter (or other mobile).  
**Updated:** 2026-10-08  
**Live Ask (web):** https://sileqelbachin1.com/ask-question  
**Visitor guide (copy):** [`HOW-TO-ASK-GUIDE.md`](./HOW-TO-ASK-GUIDE.md)

---

## 0. አጭር መግለጫ (Amharic)

ተጠቃሚው ጥያቄ ይጽፋል → ምድብ ይመርጣል → **ቴሌግራም** ወይም **ኢሜይል** ይመርጣል።

| መንገድ | መግቢያ | ምላሽ የት ይደርሳል |
|--------|--------|----------------|
| **ቴሌግራም** | Google **አያስፈልግም**። ቦት `@sileqelbachin1_Bot` አንድ ጊዜ **Start** | የግል Telegram chat |
| **ኢሜይል** | **Google ብቻ** (ኢሜይል በእጅ አይሞላም) | Gmail inbox (Resend ከ Admin) |

**አንድ ክፍት ጥያቄ በአንድ ጊዜ** — እስኪመለስ ድረስ ሌላ አዲስ አይቀበልም (HTTP `409`).

Admin (Render) ጥያቄውን ያያል → መልስ ይጽፋል → በተመረጠው መንገድ ይልካል።

---

## 1. Architecture (do not invent a second backend)

```text
Flutter / Mobile
    │
    ├─ Email path ──► Supabase Google OAuth (same project as website)
    │                      │
    │                      ▼
    ├─ POST questions ──► Admin Public API
    │                      https://admin.sileqelbachin1.com/api/public/v1/questions
    │                      │
    ├─ Telegram link ──► https://admin.sileqelbachin1.com/api/public/v1/telegram
    │                      │
    │                      ▼
    │                 Supabase tables (Admin service role writes)
    │                 + Telegram Bot API (Admin only)
    │                      │
    └─ User receives answer ◄── Email (Resend) or Telegram sendMessage
```

| Layer | Host | Role |
|-------|------|------|
| Website | Vercel `sileqelbachin1.com` | Proxies Ask → Admin (`/api/ask-question`) |
| Admin CMS | Render `admin.sileqelbachin1.com` | Inbox, bot, Resend, public `/api/public/v1/*` |
| Auth / DB | Supabase `lsyyezhsqhzcskjbqmco` | Google users, telegram links, questions |
| Bot | `@sileqelbachin1_Bot` | Start → save `chat_id` |

**Mobile should call Admin public API directly** (same as CMS kitabs). Do **not** put the bot token or service role in the app.

Website proxy (optional reference):  
`POST/GET https://sileqelbachin1.com/api/ask-question` → forwards to Admin `/questions`.

---

## 2. Keys & env — what goes WHERE

### 2.1 Mobile app (safe — ship in Flutter `--dart-define` / secure config)

```text
# Supabase (same project as website — Auth + Google)
SUPABASE_URL=https://lsyyezhsqhzcskjbqmco.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_8-CoK12m_oltVdpPjYhMlQ_a5tMDA2m

# Ask / Telegram public API (Admin)
CMS_API_BASE=https://admin.sileqelbachin1.com/api/public/v1
ASK_QUESTIONS_URL=https://admin.sileqelbachin1.com/api/public/v1/questions
ASK_TELEGRAM_URL=https://admin.sileqelbachin1.com/api/public/v1/telegram

# Bot (public username only — never the token)
TELEGRAM_BOT_USERNAME=sileqelbachin1_Bot
TELEGRAM_BOT_URL=https://t.me/sileqelbachin1_Bot

# Optional deep-link return into the app
ASK_RETURN_SCHEME=sileqelbachin://ask
```

> If the publishable key is rotated in Supabase, update both Vercel and the app. Never use the **service_role** JWT in mobile.

### 2.2 Admin / Render only (NEVER in APK / IPA / git)

Copy from Render → Environment (or local `admincn-1.0.0/.env.local`). **Do not paste secret values into this repo or chat.**

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | BotFather token — Admin sends answers + webhook |
| `TELEGRAM_BOT_USERNAME` | `sileqelbachin1_Bot` |
| `TELEGRAM_WEBHOOK_URL` | `https://admin.sileqelbachin1.com/api/telegram/webhook` |
| `TELEGRAM_WEBHOOK_SECRET` | Telegram webhook secret header |
| `TELEGRAM_WEBHOOK_SETUP_KEY` | One-time `?setup=1&key=` register |
| `TELEGRAM_RETURN_URL` | Where bot tells user to return (site or app deep link) |
| `RESEND_API_KEY` | Email answers + “question received” |
| `EMAIL_FROM` | e.g. `Sile Qelbachin Support <noreply@sileqelbachin1.com>` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server writes to link tables / inbox |
| `R2_*` secrets | Media uploads only — **not used by Ask** |

Webhook register (after deploy, from a secure shell):

```text
GET https://admin.sileqelbachin1.com/api/telegram/webhook?setup=1&key=<TELEGRAM_WEBHOOK_SETUP_KEY>
```

### 2.3 Supabase Auth URL (production)

| Setting | Value |
|---------|--------|
| Site URL | `https://sileqelbachin1.com` |
| Redirect URLs | `https://sileqelbachin1.com/auth/callback` · localhost callbacks · **mobile deep link** (add when ready) |

For Flutter Google sign-in, add your app redirect (e.g. `io.supabase.sileqelbachin://login-callback/` or `sileqelbachin://auth/callback`) in Supabase → Authentication → URL Configuration.

---

## 3. Database (already on Supabase — mobile only reads via API)

Migrations (Admin already applies these):

- `admincn-1.0.0/supabase/migrations/009_telegram_answer_delivery.sql`
- `admincn-1.0.0/supabase/migrations/010_guest_telegram_chat.sql`

| Table | Who writes | Meaning |
|-------|------------|---------|
| `question_submissions` | Admin API | Inbox row + `answer_channel` + `telegram_chat_id` |
| `user_telegram_links` | Admin (after Start) | Google user_id → chat_id |
| `guest_telegram_links` | Admin (after Start) | `tg.*@telegram.guest` → chat_id |
| `telegram_link_tokens` | Admin | One-time `t.me/Bot?start=…` tokens |

Mobile **does not** insert into these tables directly.

---

## 4. Categories (copy exactly — send English `en` string as `category`)

Same as website `src/app/ask-question/page.tsx`:

| value | en (send this in API) | am | ar |
|-------|----------------------|----|----|
| `general` | General Islamic Question | አጠቃላይ የእስልምና ጥያቄ | سؤال إسلامي عام |
| `ibadah` | Worship (Ibadah) | ዒባዳ (የአምልኮ ጉዳዮች) | العبادة |
| `family` | Family & Marriage | ቤተሰብ እና ጋብቻ | الأسرة والزواج |
| `counseling` | Personal Advice | የግል ምክር | نصيحة شخصية |
| `quran` | Qur’an & Tafsir | ቁርኣን እና ተፍሲር | القرآن والتفسير |
| `hadith` | Hadith | ሐዲሥ | الحديث |
| `aqeedah` | Aqeedah (Faith) | ዐቂዳ (እምነት) | العقيدة |
| `other` | Other… | ሌላ... | أخرى… |

---

## 5. API — Telegram connect

**Base:** `https://admin.sileqelbachin1.com/api/public/v1/telegram`  
CORS: `*` · Methods: `GET`, `POST`, `OPTIONS`

### 5.1 Start link (guest — no Google)

```http
POST /api/public/v1/telegram
Content-Type: application/json

{
  "action": "link-start",
  "guest_email": "tg.<stable-id>@telegram.guest"
}
```

**Response (need Start):**

```json
{
  "ok": true,
  "deep_link": "https://t.me/sileqelbachin1_Bot?start=c_……",
  "bot_username": "sileqelbachin1_Bot",
  "token": "<poll-token>",
  "expires_at": "…"
}
```

**Response (already linked):**

```json
{
  "ok": true,
  "already_connected": true,
  "connected": true,
  "username": "optional",
  "bot_username": "sileqelbachin1_Bot"
}
```

**App rules**

1. Create **once** a stable guest email: `tg.<uuid16>@telegram.guest` — store in `SharedPreferences` / `secure_storage` (website key name: `sile_tg_guest_email_v1`).
2. Open `deep_link` with `url_launcher` (external Telegram app).
3. Poll status every ~2s until `connected: true` (or `already_connected`).
4. Cache locally: `{ email, username, at }` so next Ask skips Start.

### 5.2 Start link (Google signed-in)

```http
POST /api/public/v1/telegram
Authorization: Bearer <supabase_access_token>
Content-Type: application/json

{ "action": "link-start" }
```

Same response shape. Prefer this when the user already signed in with Google (chat_id bound to `user_id`).

### 5.3 Status

```http
GET /api/public/v1/telegram?email=tg.xxx@telegram.guest&token=<optional>
```

or with Bearer for signed-in users:

```http
GET /api/public/v1/telegram
Authorization: Bearer <supabase_access_token>
```

```json
{
  "ok": true,
  "connected": true,
  "username": "…",
  "connected_at": "…",
  "bot_username": "sileqelbachin1_Bot"
}
```

---

## 6. API — Submit question

**URL:** `POST https://admin.sileqelbachin1.com/api/public/v1/questions`

### 6.1 Telegram channel

```json
{
  "auth_email": "tg.<id>@telegram.guest",
  "name": "Telegram guest",
  "category": "General Islamic Question",
  "question": "…",
  "answer_channel": "telegram",
  "user_id": null
}
```

If Google user is signed in and linked:

```json
{
  "auth_email": "user@gmail.com",
  "user_id": "<supabase-user-uuid>",
  "category": "Worship (Ibadah)",
  "question": "…",
  "answer_channel": "telegram"
}
```

**Requires** a saved `chat_id` (user pressed Start). Otherwise:

```json
{ "ok": false, "need_telegram": true, "error": "Please open the answer bot and press Start first…" }
```
HTTP `400`.

### 6.2 Email channel

```json
{
  "auth_email": "user@gmail.com",
  "user_id": "<supabase-user-uuid>",
  "name": "Display Name",
  "category": "Family & Marriage",
  "question": "…",
  "answer_channel": "email"
}
```

- `auth_email` **must** be the Google account email (no typed email).
- Admin may send a short “question received” email via Resend.

### 6.3 Success

```json
{
  "ok": true,
  "id": "<uuid>",
  "answer_channel": "telegram",
  "message": "Question received. An Ustaz will answer…"
}
```

### 6.4 Already pending (one open question)

HTTP `409`:

```json
{
  "ok": false,
  "pending": true,
  "id": "…",
  "question_preview": "…",
  "answer_channel": "email",
  "check_email": true,
  "check_telegram": false,
  "error": "You already have a question waiting…"
}
```

### 6.5 Pending check (before showing form)

```http
GET https://admin.sileqelbachin1.com/api/public/v1/questions?email=user@gmail.com
```

```json
{ "ok": true, "pending": false }
```

or `pending: true` + preview fields.

---

## 7. Mobile UX flow (mirror website)

### Screen: Ask

1. Title: **ጥያቄዎን ያቅርቡ** / Submit your question  
2. Red link → full guide (copy from `HOW-TO-ASK-GUIDE.md`) with **↗**  
3. Category dropdown  
4. Question text (min ~5 chars)  
5. CTA **ጥያቄውን ላክ** → open channel sheet

### Sheet: Channel

- **ቴሌግራም** card → Path A  
- **ኢሜይል** card → Path B (Google if needed)

### Path A — Telegram

1. `POST link-start` (guest or Bearer)  
2. If `already_connected` → skip to confirm  
3. Else open `deep_link` → user taps **Start** in Telegram  
4. Poll `GET` status until connected  
5. `POST questions` with `answer_channel: "telegram"`  
6. Success UI: wait for private Telegram reply (Basmala / waiting copy from website)

### Path B — Email

1. If no session → Google OAuth via Supabase Flutter SDK  
2. Restore draft after return  
3. `POST questions` with `answer_channel: "email"` and Google email  
4. Success UI: check Gmail

### Local draft (recommended)

Website keys to mirror:

| Key | Use |
|-----|-----|
| `sile_ask_question_draft_v1` | question + category + channel before OAuth |
| `sile_tg_guest_email_v1` | stable guest email |
| `sile_tg_linked_v1` | `{ email, username, at }` after Start |

---

## 8. Flutter sketch (safe)

```dart
const cmsBase = String.fromEnvironment(
  'CMS_API_BASE',
  defaultValue: 'https://admin.sileqelbachin1.com/api/public/v1',
);
const botUser = 'sileqelbachin1_Bot';

Future<Map<String, dynamic>> linkTelegram({
  required String guestEmail,
  String? accessToken,
}) async {
  final headers = <String, String>{'Content-Type': 'application/json'};
  if (accessToken != null) headers['Authorization'] = 'Bearer $accessToken';
  final body = accessToken != null
      ? {'action': 'link-start'}
      : {'action': 'link-start', 'guest_email': guestEmail};
  final res = await http.post(
    Uri.parse('$cmsBase/telegram'),
    headers: headers,
    body: jsonEncode(body),
  );
  return jsonDecode(res.body) as Map<String, dynamic>;
}

Future<Map<String, dynamic>> submitQuestion({
  required String authEmail,
  required String categoryEn,
  required String question,
  required String channel, // 'email' | 'telegram'
  String? userId,
  String? accessToken,
}) async {
  final headers = <String, String>{'Content-Type': 'application/json'};
  if (accessToken != null) headers['Authorization'] = 'Bearer $accessToken';
  final res = await http.post(
    Uri.parse('$cmsBase/questions'),
    headers: headers,
    body: jsonEncode({
      'auth_email': authEmail,
      'category': categoryEn,
      'question': question,
      'answer_channel': channel,
      if (userId != null) 'user_id': userId,
    }),
  );
  return jsonDecode(res.body) as Map<String, dynamic>;
}
```

Open bot:

```dart
await launchUrl(
  Uri.parse(deepLink), // from link-start
  mode: LaunchMode.externalApplication,
);
```

---

## 9. Admin answer side (not in mobile — for QA)

Staff: https://admin.sileqelbachin1.com → Community → Question Submissions

| Channel on row | Send path |
|----------------|-----------|
| `email` | Resend → asker’s Gmail |
| `telegram` | Bot `sendMessage` → stored `telegram_chat_id` |

Failed delivery → `delivery_status=failed` (do not show as sent).

---

## 10. Checklist — mobile ship

- [ ] Flutter uses **only** publishable Supabase key + public CMS URLs  
- [ ] Telegram: guest email persisted; Start once; poll until connected  
- [ ] Email: Google only; no free-text email field  
- [ ] Categories send **English** `category` strings  
- [ ] Handle `409` pending + `need_telegram`  
- [ ] Guide UI = `HOW-TO-ASK-GUIDE.md` (EN/AM/AR)  
- [ ] Supabase redirect URL includes app deep link  
- [ ] Bot token / service role / Resend / R2 secrets **absent** from app binary  
- [ ] QA on device: Telegram Start → submit → Admin answer arrives in chat  
- [ ] QA: Google → email submit → answer in Gmail  

---

## 11. Related docs

| File | Topic |
|------|--------|
| [`HOW-TO-ASK-GUIDE.md`](./HOW-TO-ASK-GUIDE.md) | Visitor wording EN/AM/AR |
| [`ASK_TELEGRAM_DELIVERY.md`](../../ASK_TELEGRAM_DELIVERY.md) | Server Telegram + Resend setup |
| [`MOBILE_ADMIN_CLOUDFLARE_INTEGRATION.md`](../../MOBILE_ADMIN_CLOUDFLARE_INTEGRATION.md) | CMS + R2 for content (not Ask secrets) |
| [`FLUTTER_HANDOFF.md`](../../FLUTTER_HANDOFF.md) | App IA / design |
| Website UI | `src/app/ask-question/page.tsx`, `src/components/AskHowToGuide.tsx` |
| Public API | `admincn-1.0.0/src/app/api/public/v1/telegram/route.ts` · `[resource]/route.ts` (`questions`) |

---

## 12. Security reminder

- **Never** commit `TELEGRAM_BOT_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `R2_SECRET_ACCESS_KEY`, or webhook secrets into git or the mobile repo.  
- If any secret was pasted in chat, **rotate it** in BotFather / Supabase / Resend / Cloudflare.  
- Mobile = public client. All privileged sends stay on **Admin Render**.
