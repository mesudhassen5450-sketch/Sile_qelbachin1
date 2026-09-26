# Mobile ↔ Admin ↔ Cloudflare R2 — Final Integration Guide

**Product:** ስለ ቀልባችን / Sile Qelbachin  
**Canonical file:** this document (repo root)  
**Updated:** 2026-09-26

Also see (older / internal): `admincn-1.0.0/docs/admin/CMS-WEBSITE-MOBILE-WORKFLOW.md`

---

## 1. Pipeline

```text
Staff (Admin UI)  https://admin.sileqelbachin1.com
        │  Add / Edit / Publish  (EN + AM, cover, PDF, audio…)
        ▼
Admin CMS (Render · rootDir admincn-1.0.0)
        │  PutObject → Cloudflare R2
        │  Metadata → Supabase
        ▼
Cloudflare R2  (public HTTPS file URLs)
        │
        ▼
GET /api/public/v1/*   (published only, CORS *)
        ├── Website (Netlify)
        └── Flutter / mobile
```

| Do | Don’t |
|----|--------|
| Mobile reads **public API** JSON | Mobile must **not** call R2 S3 API |
| Use `coverImage` / `pdfUrl` / `audioUrl` HTTPS links | Never put `R2_SECRET` / service role in the APK |
| Refresh after Admin publish | Staff login is Admin-only |

---

## 2. Live URLs

| Surface | URL |
|---------|-----|
| **Admin login** | https://admin.sileqelbachin1.com/pages/auth/login |
| **Admin API (mobile)** | https://admin.sileqelbachin1.com/api/public/v1 |
| Render fallback Admin | https://sile-qelbachin1-1.onrender.com |
| Public website | Netlify / `sileqelbachin1.com` |
| Local Admin | http://localhost:3001/pages/auth/login |

DNS: Cloudflare `admin` CNAME → `sile-qelbachin1-1.onrender.com` (DNS only).

---

## 3. Mobile (Flutter) — safe env only

```text
CMS_API_BASE=https://admin.sileqelbachin1.com/api/public/v1
R2_PUBLIC_BASE=https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
R2_OBJECT_PREFIX=sileqelbachin-meadia
```

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

### Public API endpoints

| GET | Use |
|-----|-----|
| `/kitabs` | Kitabs + ders + `audioUrl` / `pdfUrl` / `coverImage` |
| `/audio` | Audio archive |
| `/muhadara` | Muhadara |
| `/video` | Videos |
| `/pdfs` | PDFs |
| `/reminders` | Home reminders |
| `/sahabah` | Sahabah |

Play / open the HTTPS URLs inside the JSON directly (already public R2 links).

---

## 4. Render — R2 access (fix “Unauthorized” / uploads)

Paste into **Render → Sile_qelbachin1-1 → Environment**, then **Manual Deploy**.

### Fixed public values (safe to copy)

```text
NEXT_PUBLIC_APP_URL=https://admin.sileqelbachin1.com
PORT=10000
CLOUDFLARE_ACCOUNT_ID=26e435690c62468180455b796d21b3ab
R2_ACCOUNT_ID=26e435690c62468180455b796d21b3ab
R2_BUCKET_NAME=sileqelbachinmediea
R2_ENDPOINT=https://26e435690c62468180455b796d21b3ab.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
NEXT_PUBLIC_R2_PUBLIC_BASE=https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
NEXT_PUBLIC_R2_OBJECT_PREFIX=sileqelbachin-meadia
SUPER_ADMIN_EMAIL=mesudhassen5450@gmail.com
```

### Secrets (Render only — never Flutter, never commit)

From Cloudflare → R2 → **Manage R2 API Tokens** → create token (Object Read & Write):

```text
R2_ACCESS_KEY_ID=<32-char Access Key ID>
R2_SECRET_ACCESS_KEY=<~64-char Secret Access Key>
```

On your laptop (after updating `admincn-1.0.0/.env.local`):

```bash
cd admincn-1.0.0
npm run r2:print-render-env
```

Or open the local helper file (gitignored):

`admincn-1.0.0/.env.render.r2.local`

Copy those two keys into Render.

Also keep Supabase on Render:

```text
NEXT_PUBLIC_SUPABASE_URL=https://lsyyezhsqhzcskjbqmco.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable>
SUPABASE_URL=https://lsyyezhsqhzcskjbqmco.supabase.co
SUPABASE_PUBLISHABLE_KEY=<same publishable>
SUPABASE_SERVICE_ROLE_KEY=<service_role JWT>
```

**Do not set on Render:** `R2_MEDIA_MIRROR_PATH`

---

## 5. Netlify (website) — 4 public vars

```text
NEXT_PUBLIC_SITE_URL=https://sileqelbachin1.com
NEXT_PUBLIC_CMS_API_BASE=https://admin.sileqelbachin1.com/api/public/v1
NEXT_PUBLIC_R2_PUBLIC_BASE=https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
NEXT_PUBLIC_R2_OBJECT_PREFIX=sileqelbachin-meadia
```

---

## 6. Admin content for mobile

Admin → **Content → Kitabs** (same for Audio / Video / PDFs / Sahabah):

| Action | How |
|--------|-----|
| Add | **Add** → EN/AM titles, cover, PDF/audio → Publish |
| Edit title/desc | Row → **Edit** → Save |
| Replace cover/PDF | Edit → upload → Save |
| Delete | Trash |

Mobile refresh of `/api/public/v1/kitabs` shows updates.

---

## 7. Checklist

1. Render has correct `R2_ACCESS_KEY_ID` (32) + `R2_SECRET_ACCESS_KEY` (~64) → no red “Unauthorized”  
2. Admin Sahabah/Kitab cover upload works  
3. `GET https://admin.sileqelbachin1.com/api/public/v1/kitabs` returns `ok: true`  
4. Flutter uses `CMS_API_BASE` only  
5. Super Admin: `mesudhassen5450@gmail.com`

---

## 8. Security

- **Flutter:** `CMS_API_BASE` + public R2 base/prefix only  
- **R2 Access Key / Secret / Supabase service role:** Admin + Render only  
- If secrets were shown in chat/screenshots, rotate the R2 token after Render is updated  

**Bottom line:** Mobile only GETs `/api/public/v1/*` and plays the R2 HTTPS URLs in the JSON. R2 S3 keys stay on Render.
