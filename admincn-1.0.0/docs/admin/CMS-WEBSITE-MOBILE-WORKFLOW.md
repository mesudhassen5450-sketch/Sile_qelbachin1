# Sile Qelbachin — Full CMS → Cloudflare R2 → Website → Mobile Workflow

**Product:** ስለ ቀልባችን / Sile Qelbachin  
**Date:** 2026-09-24  
**Media backend:** Cloudflare R2 only — **not Cloudinary**

This document is the exact contract for Admin staff, the website, and the Flutter mobile app.

---

## 1. Architecture (one pipeline)

```text
Staff (role-based Admin)
        │
        ▼
┌───────────────────────────┐
│  Admin (Next.js / Render) │
│  • Auth + staff_profiles  │
│  • Upload / Scan / Publish│
└─────────────┬─────────────┘
              │ PutObject / ListObjects
              ▼
┌───────────────────────────┐
│  Cloudflare R2 (bytes)    │
│  bucket + public URL      │
└─────────────┬─────────────┘
              │ public_url on media_assets
              ▼
┌───────────────────────────┐
│  CMS metadata             │
│  local store + Supabase   │
│  status = published       │
└─────────────┬─────────────┘
              │ GET (no auth)
              ▼
┌───────────────────────────┐
│  /api/public/v1/*         │
│  published only           │
└──────┬──────────────┬─────┘
       ▼              ▼
  Website          Flutter app
  (cmsClient)      (HTTP JSON)
```

**Rules**

1. Media files live in **Cloudflare R2**. Never Cloudinary.
2. Staff **do not** log into website or mobile. Only Admin uses staff roles.
3. Website and mobile only read **published** content from the public API (or static JSON until cutover).
4. Changing a draft in Admin does **not** appear on website/mobile until **Publish**.

---

## 2. Role-based access (who can change what)

| Role | Admin powers | Affects website/mobile? |
|------|----------------|-------------------------|
| **Super Admin** | Staff + all content + R2 upload/scan | Yes — can publish everything |
| **Content Admin** | Kitabs/ders/audio/video/PDF + upload | Yes — publishes content |
| **Media Admin** | R2 scan/health/upload | Yes — media that gets published |
| **Analytics Admin** | Reports only | No |
| **Moderator** | Review/view | No (unless later given publish) |
| **Read Only** | View | No |

Staff management: **Security → Admins** (create role, activate, reset password).

---

## 3. Exact staff workflow (add content that reaches apps)

### A) New audio / video / PDF (recommended)

1. Sign in to Admin as Content Admin / Media Admin / Super Admin.  
2. Open **Media → Uploads**.  
3. Choose file → choose **Publish as Audio / Video / PDF**.  
4. Submit.  
5. System does:
   - `PutObject` → Cloudflare R2 under `…/staff-uploads/{type}/…`
   - Creates `media_assets` row with `public_url`
   - Creates content row with `status=published`
6. Verify:
   - `GET https://<admin-host>/api/public/v1/audio` (or `video` / `pdfs`) includes the item  
   - `fileUrl` is an `https://pub-….r2.dev/…` URL  

### B) Existing R2 library (legacy kitabs / archive)

1. **Media → Cloudflare Storage → Scan R2** (needs `R2_ACCESS_KEY_ID` + secret on Render).  
2. **Match Static Content** — links legacy JSON to R2 objects and publishes matched rows.  
3. Public API serves those published rows.

### C) Publish / unpublish later

- **Content → Audio / Video / PDFs / Kitabs / Ders** → **Publish** or **Unpublish**.  
- Unpublish removes from public API immediately (website/mobile stop seeing it after cache TTL).

---

## 4. Cloudflare R2 configuration (required for uploads)

On Admin Render service:

| Variable | Purpose |
|----------|---------|
| `R2_BUCKET_NAME` | e.g. `sileqelbachinmediea` |
| `R2_ENDPOINT` | `https://<accountid>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_PUBLIC_BASE_URL` / `NEXT_PUBLIC_R2_PUBLIC_BASE` | Public base e.g. `https://pub-….r2.dev` |
| `NEXT_PUBLIC_R2_OBJECT_PREFIX` | e.g. `sileqelbachin-meadia` |

Bucket must allow **public read** via the public base (R2 public bucket / custom domain).  
Admin never exposes secret keys to the browser — upload goes through `POST /api/admin/media/upload`.

Without access keys: Scan can use a local mirror; **staff upload will fail** until keys are set.

---

## 5. Public API contract (website + Flutter)

**Base URL (production Admin):**  
`https://sile-qelbachin1-1.onrender.com/api/public/v1`

| Method | Path | Returns |
|--------|------|---------|
| GET | `/kitabs` | Published kitabs + nested published ders + R2 URLs |
| GET | `/audio` | Published audio (`fileUrl`, titles, `isMuhadara`) |
| GET | `/muhadara` | Alias of audio (filter client-side by `isMuhadara` if needed) |
| GET | `/video` | Published videos (`fileUrl`, `thumbnailUrl`) |
| GET | `/pdfs` | Published PDFs (`fileUrl`) |

**Common response:**

```json
{
  "ok": true,
  "source": "local" | "supabase",
  "count": 12,
  "data": [ /* resource-specific objects */ ]
}
```

**Audio item shape:**

```json
{
  "id": "…",
  "title": { "am": "…", "ar": "…", "en": "…" },
  "description": { "am": null, "ar": null, "en": null },
  "fileUrl": "https://pub-….r2.dev/sileqelbachin-meadia/…",
  "type": "audio",
  "category": "archive",
  "isMuhadara": false
}
```

**Kitab shape:** see `GET /kitabs` — includes `coverImage`, `pdfUrl`, `dersList[].audioUrl` (all R2 public URLs when matched).

**Auth:** none on public API.  
**Filter:** only `status === "published"`.  
**Cache:** website `cmsClient` revalidates ~60s; Flutter should cache sensibly and pull-to-refresh.

---

## 6. Website cutover

File: `Sile_qelbachin1/src/lib/cmsClient.ts`

1. Set on website Render/Netlify env:

```env
NEXT_PUBLIC_CMS_API_BASE=https://sile-qelbachin1-1.onrender.com/api/public/v1
```

2. Use `fetchPublishedKitabs()`, `fetchPublishedAudio()`, `fetchPublishedVideos()`, `fetchPublishedPdfs()` in pages instead of static JSON once verified.  
3. Keep R2 URL encoding rules from `mediaUrl.ts` if you still build keys locally; prefer API `fileUrl` as-is.

Until env is set, website stays on static JSON (legacy).

---

## 7. Flutter mobile app — exact build guide

### 7.1 Do not invent content

Only show what the public API (or shipped snapshot) returns. Do not invent religious text.

### 7.2 Networking

```dart
const cmsBase = String.fromEnvironment(
  'CMS_API_BASE',
  defaultValue: 'https://sile-qelbachin1-1.onrender.com/api/public/v1',
);

Future<List<dynamic>> fetchResource(String path) async {
  final res = await http.get(Uri.parse('$cmsBase/$path'));
  if (res.statusCode != 200) throw Exception('CMS $path failed');
  final body = jsonDecode(res.body) as Map<String, dynamic>;
  if (body['ok'] != true) throw Exception(body['error'] ?? 'CMS error');
  return (body['data'] as List?) ?? [];
}
```

Screens:

| Screen | Endpoint |
|--------|----------|
| Kitab library / detail | `GET kitabs` |
| Audio archive | `GET audio` |
| Muhadara | `GET audio` then `where isMuhadara == true` |
| Videos | `GET video` |
| PDFs | `GET pdfs` |

Playback: use `fileUrl` / `audioUrl` / `coverImage` directly (HTTPS R2). Prefer `just_audio` / `video_player` / PDF viewer.

### 7.3 Deep links (preserve)

```text
/kitab/{slug}?ders={1-based-number}
```

Match website behavior from `FLUTTER_HANDOFF.md` (colors, screens, social links).

### 7.4 Offline

Optional: cache last successful JSON + R2 progressive download. Never invent missing ders.

### 7.5 What Flutter must NOT do

- No staff login / Supabase service role in the app  
- No direct R2 write credentials  
- No Cloudinary SDK  

---

## 8. Admin API (staff only — cookie session)

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| POST | `/api/admin/media/upload` | `media.upload` | Multipart file → R2 + media_assets |
| POST | `/api/admin/media/scan` | `media.scan` | List R2 → media_assets |
| POST | `/api/admin/media/import` | `media.scan` | Match Static publish |
| GET | `/api/admin/content/{type}` | view perms | List CMS rows |
| POST | `/api/admin/content/audio\|video\|pdfs` | create/publish | Link asset + publish |
| PATCH | `/api/admin/content/{type}` | publish/edit | `{ id, status }` |
| GET/POST/PATCH/DELETE | `/api/admin/staff` | admins.* | Staff RBAC |

---

## 9. End-to-end verification checklist

1. R2 keys set on Admin Render; Uploads page succeeds.  
2. `GET /api/public/v1/audio` shows new item with R2 `fileUrl`.  
3. Open `fileUrl` in browser — file plays/downloads.  
4. Website with `NEXT_PUBLIC_CMS_API_BASE` shows the item.  
5. Flutter with same base shows the item.  
6. Unpublish in Admin → item disappears from public API.  
7. Staff without role cannot open Uploads / Publish (403).

---

## 10. What is Cloudinary?

**Nothing.** This system uses **Cloudflare R2** only. Older notes mentioning Cloudinary are obsolete.

---

## 11. Related docs

| Doc | Path |
|-----|------|
| Flutter UI/screens (design) | `Sile_qelbachin1/FLUTTER_HANDOFF.md` |
| R2 ops | `Sile_qelbachin1/CLOUDFLARE_R2.md` |
| Auth/RBAC | `admincn-1.0.0/docs/admin/SUPABASE-AUTH-RBAC-IMPLEMENTATION.md` |
| Admin overview | `admincn-1.0.0/ADMIN.md` |
