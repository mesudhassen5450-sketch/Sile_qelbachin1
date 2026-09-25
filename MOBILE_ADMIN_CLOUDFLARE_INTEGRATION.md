# Mobile ↔ Admin ↔ Cloudflare R2 — Final Integration Guide

**Product:** ስለ ቀልባችን / Sile Qelbachin  
**For:** Flutter / mobile developers + deploy operators  
**Updated:** 2026-09-25

---

## 1. Pipeline (how content reaches the phone)

```text
Staff (Admin UI)
   │  Add / Edit / Publish  (EN + AM titles, cover, PDF, audio…)
   ▼
Admin CMS  (Render)
   │  PutObject → Cloudflare R2
   │  Save metadata → Supabase / store
   ▼
Cloudflare R2  (file bytes + public HTTPS URL)
   │
   ▼
GET /api/public/v1/*   ← published only, CORS *
   │
   ├── Website (Netlify)
   └── Flutter / mobile app
```

**Rules**

| Do | Don’t |
|----|--------|
| Mobile reads **public API** JSON | Mobile must **not** call R2 S3 API |
| Play `audioUrl` / `pdfUrl` / `coverImage` (HTTPS) | Never put `R2_SECRET` / service role in the APK |
| Refresh after Admin publish | Staff login is Admin-only |

---

## 2. Cloudflare DNS — fix Admin subdomain (what you did wrong)

**Important:** `sile-qelbachin1.onrender.com` is the **public website**. Admin is **`sile-qelbachin1-1.onrender.com`**.

In Cloudflare DNS fix the `admin` record:

| Wrong | Correct |
|-------|---------|
| `admin` CNAME → `sile-qelbachin1.onrender.com` (public site) | `admin` CNAME → **`sile-qelbachin1-1.onrender.com`** (Admin CMS) |

**Exact Cloudflare record (DNS only / grey cloud):**

| Field | Value |
|-------|--------|
| Type | **CNAME** |
| Name | **admin** |
| Target | **sile-qelbachin1-1.onrender.com** |
| Proxy | **DNS only** (grey cloud) |
| TTL | Auto |

Then in Render → service **`Sile_qelbachin1-1`** → Custom Domain → add `admin.sileqelbachin1.com` and wait until verification is green.

**Until DNS is fixed, open Admin here:**

- Admin UI: **https://sile-qelbachin1-1.onrender.com/pages/auth/login**
- API: `https://sile-qelbachin1-1.onrender.com/api/public/v1/kitabs`

---

## 3. Mobile app — only these env values (safe in Flutter)

```text
CMS_API_BASE=https://admin.sileqelbachin1.com/api/public/v1
# Until admin DNS points to Sile_qelbachin1-1, use:
# CMS_API_BASE=https://sile-qelbachin1-1.onrender.com/api/public/v1

R2_PUBLIC_BASE=https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
R2_OBJECT_PREFIX=sileqelbachin-meadia
```

Dart sketch:

```dart
const cmsBase = String.fromEnvironment(
  'CMS_API_BASE',
  defaultValue: 'https://admin.sileqelbachin1.com/api/public/v1',
);

Future<List<dynamic>> fetchCms(String resource) async {
  final res = await http.get(Uri.parse('$cmsBase/$resource'));
  final body = jsonDecode(res.body) as Map<String, dynamic>;
  if (body['ok'] != true) throw Exception(body['error']);
  return body['data'] as List<dynamic>;
}
```

### Endpoints

| GET | Use for |
|-----|---------|
| `/kitabs` | Kitab list + ders + `audioUrl` / `pdfUrl` / `coverImage` |
| `/audio` | Audio archive |
| `/muhadara` | Muhadara |
| `/video` | Videos |
| `/pdfs` | Standalone PDFs |
| `/reminders` | Home reminders |
| `/sahabah` | Sahabah |

Example kitab fields:

```json
{
  "slug": "intebih-ante-murakeb",
  "title": { "am": "…", "en": "…", "ar": "…" },
  "coverImage": "https://pub-….r2.dev/sileqelbachin-meadia/…",
  "pdfUrl": "https://pub-….r2.dev/…",
  "dersList": [
    { "title": { "am": "…", "en": "…" }, "audioUrl": "https://pub-….r2.dev/…" }
  ]
}
```

Play `audioUrl` / open `pdfUrl` / show `coverImage` directly — those are already public R2 links.

---

## 4. Admin can add + edit old content (EN + AM)

In Admin → **Content → Kitabs** (same pattern for Audio / Video / PDFs):

| Action | How |
|--------|-----|
| **Add new kitab** | **Add** → titles EN/AM, description EN/AM, cover, PDF, ders audio → Publish |
| **Rename (e.g. Intebih)** | Row → **Edit** → Title EN + Title AM → Save |
| **Change description** | Edit → Description EN + Description AM |
| **Change cover** | Edit → upload new **Cover image** |
| **Change PDF** | Edit → upload new **PDF file** |
| **Change audio (standalone)** | Content → Audio → Edit → replace audio + cover |
| **Delete** | Trash → removes from Admin + public API (+ R2 file when credentials work) |

After Save/Publish, mobile refresh of `/kitabs` (etc.) shows the update.

---

## 5. Admin / Render — full environment (server only)

Copy into **Render → Environment** (never into Flutter):

### Public / app URL

```text
NEXT_PUBLIC_APP_URL=https://admin.sileqelbachin1.com
PORT=10000
```

### Supabase

```text
NEXT_PUBLIC_SUPABASE_URL=https://lsyyezhsqhzcskjbqmco.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_8-CoK12m_oltVdpPjYhMlQ_a5tMDA2m
SUPABASE_URL=https://lsyyezhsqhzcskjbqmco.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_8-CoK12m_oltVdpPjYhMlQ_a5tMDA2m
SUPABASE_SERVICE_ROLE_KEY=<same service-role JWT as in Render — do not paste into mobile>
SUPABASE_SECRET_KEY=<same as service role if you use both>
```

### Cloudflare R2 (Admin uploads / sync)

```text
CLOUDFLARE_ACCOUNT_ID=26e435690c62468180455b796d21b3ab
R2_ACCOUNT_ID=26e435690c62468180455b796d21b3ab
R2_BUCKET_NAME=sileqelbachinmediea
R2_ENDPOINT=https://26e435690c62468180455b796d21b3ab.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
NEXT_PUBLIC_R2_PUBLIC_BASE=https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
NEXT_PUBLIC_R2_OBJECT_PREFIX=sileqelbachin-meadia
R2_ACCESS_KEY_ID=<from Cloudflare R2 API token — 32 chars — Render only>
R2_SECRET_ACCESS_KEY=<from Cloudflare R2 API token — ~64 chars — Render only>
# Optional dashboard token (not required by Admin R2 S3 client):
# CLOUDFLARE_API_TOKEN=<CFAT from Cloudflare — Render only, never Flutter>
```

Copy `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` from your local Admin `.env.local` or Render dashboard — **do not commit them**.
### Super Admin bootstrap (one-time)

```text
SUPER_ADMIN_EMAIL=mesudhassen5450@gmail.com
SUPER_ADMIN_BOOTSTRAP_PASSWORD=<temp password — change after first login>
```

**Render Root Directory:** `admincn-1.0.0`

---

## 6. Website (Netlify) — only 4 public vars

```text
NEXT_PUBLIC_SITE_URL=https://sileqelbachin1.com
NEXT_PUBLIC_CMS_API_BASE=https://admin.sileqelbachin1.com/api/public/v1
NEXT_PUBLIC_R2_PUBLIC_BASE=https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
NEXT_PUBLIC_R2_OBJECT_PREFIX=sileqelbachin-meadia
```

Until Admin DNS works, set:

```text
NEXT_PUBLIC_CMS_API_BASE=https://sile-qelbachin1.onrender.com/api/public/v1
```

---

## 7. Acceptance checklist

1. Cloudflare `admin` CNAME → `sile-qelbachin1-1.onrender.com` (DNS only)  
2. Render verifies `admin.sileqelbachin1.com`  
3. Open Admin → edit Intebih title AM/EN → Save → `/api/public/v1/kitabs` shows new title  
4. Flutter pull-to-refresh shows the same title  
5. New kitab Add + Publish → appears on phone  
6. Replace cover/PDF → new `coverImage` / `pdfUrl` on API  

---

## 8. Security note

- **Flutter:** only `CMS_API_BASE` + public R2 base/prefix  
- **R2 Access Key / Secret / CFAT / Supabase service role:** Admin/Render only  
- If this repo is public, rotate R2 tokens after sharing secrets in chat  

**Bottom line:** Fix the Cloudflare CNAME → Admin works → staff edit EN/AM + files → mobile only GETs `/api/public/v1/*` and plays the R2 URLs inside the JSON.
