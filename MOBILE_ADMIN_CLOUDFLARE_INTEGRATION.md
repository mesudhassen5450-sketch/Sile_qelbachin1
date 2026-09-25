# Mobile App Integration — Admin → Cloudflare R2 → Flutter

**Product:** ስለ ቀልባችን / Sile Qelbachin  
**Audience:** Flutter / mobile developers  
**Goal:** Every change staff publish in Admin appears in the mobile app through Cloudflare R2 + the public CMS API.

---

## 1. How the pipeline works (nothing left out)

```text
┌────────────────────────────┐
│  Admin staff (browser)     │
│  Super / Content / Media   │
│  Upload · Edit · Publish   │
│  (Super: Storage sync too) │
└─────────────┬──────────────┘
              │ 1. Staff action
              ▼
┌────────────────────────────┐
│  Admin server (Next.js)    │
│  Auth + CMS metadata DB    │
│  (Supabase / local store)  │
└──────┬─────────────┬───────┘
       │             │
       │ 2a PutObject│ 2b Save row
       ▼             ▼
┌──────────────┐  ┌──────────────────┐
│ Cloudflare   │  │ media_assets +   │
│ R2 bucket    │  │ kitabs / ders /  │
│ (file bytes) │  │ audio / video…   │
│ public URL   │──│ public_url field │
└──────┬───────┘  └────────┬─────────┘
       │                   │
       │ 3. Public HTTPS   │ 4. GET published JSON
       │    media URL      │
       ▼                   ▼
┌────────────────────────────────────┐
│  GET /api/public/v1/{resource}     │
│  CORS * · no staff login required  │
│  Only status === "published"       │
└─────────────────┬──────────────────┘
                  │ 5. App fetches JSON
                  ▼
┌────────────────────────────────────┐
│  Flutter / mobile app              │
│  Lists titles → plays fileUrl from │
│  R2 (coverImage, pdfUrl, audioUrl) │
└────────────────────────────────────┘
```

**Important rules**

| Rule | Detail |
|------|--------|
| Files live in R2 | Audio, PDF, video, covers are Cloudflare R2 objects |
| Metadata lives in Admin CMS | Titles, order, publish status, which R2 URL |
| Mobile never talks to R2 S3 API | App only uses **public HTTPS URLs** from the JSON |
| Mobile never uses staff Auth | No Supabase staff login in the app |
| Only published content | Draft / archived items are hidden from `/api/public/v1/*` |
| Website same contract | Same public API as Flutter |

---

## 2. What mobile must configure (app secrets)

Put these in Flutter `--dart-define` / `.env` (safe for the client):

```text
CMS_API_BASE=https://YOUR-ADMIN-HOST/api/public/v1
R2_PUBLIC_BASE=https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
R2_OBJECT_PREFIX=sileqelbachin-meadia
```

**Do not put in the mobile app:**

- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_API_TOKEN` / CFAT tokens
- `SUPABASE_SERVICE_ROLE_KEY`
- Staff passwords

Those stay on the **Admin server only**. Mobile only reads public JSON + public R2 URLs.

**Production Admin API (current):**

```text
https://sile-qelbachin1-1.onrender.com/api/public/v1
```

Local Admin for testing:

```text
http://127.0.0.1:3001/api/public/v1
```

---

## 3. Public API endpoints (Flutter must call)

All: `GET`, JSON, CORS enabled (`Access-Control-Allow-Origin: *`).

| Endpoint | Returns |
|----------|---------|
| `/kitabs` | Published kitabs + ders list with `audioUrl`, `pdfUrl`, `coverImage` |
| `/audio` | Published audio items (`fileUrl`, `coverUrl`) |
| `/muhadara` | Same shape as audio (muhadara filter) |
| `/video` | Published videos (`fileUrl`, `thumbnailUrl`) |
| `/pdfs` | Published PDFs (`fileUrl`, `coverUrl`) |
| `/reminders` | Home reminder cards (title + description) |
| `/sahabah` | Sahabah biographies |
| `POST /events` | Optional analytics (`page_view`, `session_start`) |

Example:

```http
GET https://YOUR-ADMIN-HOST/api/public/v1/kitabs
```

Response shape (simplified):

```json
{
  "ok": true,
  "source": "supabase",
  "count": 12,
  "data": [
    {
      "slug": "intebih-ante-murakeb",
      "title": { "am": "…", "ar": "…", "en": "…" },
      "coverImage": "https://pub-….r2.dev/sileqelbachin-meadia/…/cover.jpg",
      "pdfUrl": "https://pub-….r2.dev/sileqelbachin-meadia/…/book.pdf",
      "dersList": [
        {
          "id": "…",
          "title": { "am": "…", "ar": "…", "en": "…" },
          "audioUrl": "https://pub-….r2.dev/sileqelbachin-meadia/…/ders-1.m4a",
          "duration": "12:30"
        }
      ]
    }
  ]
}
```

**Playback:** use `audioUrl` / `fileUrl` / `pdfUrl` / `coverImage` directly in `AudioPlayer` / `VideoPlayer` / PDF viewer / `Image.network`. Those URLs are already public R2 links.

---

## 4. Admin → Cloudflare → phone (step by step)

### A. Staff publishes in Admin

1. Sign in to Admin (staff only).
2. **Media → Uploads** (or Kitab editor): upload audio/PDF/cover → Admin writes the file to **Cloudflare R2** and stores `public_url` on `media_assets`.
3. **Content → Kitabs** (or Audio / Video / Reminders): attach media, set titles, set status **Published**.
4. Optional (Super Admin only): **Media → Storage sync** scans existing R2 objects into the CMS library.

### B. What Cloudflare holds

- Bucket: `sileqelbachinmediea`
- Object prefix: `sileqelbachin-meadia/…`
- Public base: `https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev`
- Full file URL example:  
  `https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev/sileqelbachin-meadia/kitabs/.../file.m4a`

### C. What the phone does

1. On launch / pull-to-refresh: `GET {CMS_API_BASE}/kitabs` (and other resources).
2. Cache JSON briefly if you want offline titles (optional).
3. When user taps a ders: play `ders.audioUrl` (R2 HTTPS).
4. When user opens PDF: open `pdfUrl` (R2 HTTPS).
5. Images: `coverImage` / `coverUrl` / `thumbnailUrl`.

**No extra Cloudflare login on the phone.** Accepting content from Cloudflare = accepting the `https://pub-….r2.dev/…` URLs that Admin already put in the API response.

---

## 5. Flutter integration checklist

- [ ] Set `CMS_API_BASE` to production Admin `/api/public/v1`
- [ ] Fetch `/kitabs`, `/audio`, `/video`, `/pdfs`, `/reminders` on app start / refresh
- [ ] Prefer API data over any bundled static JSON once cutover is approved
- [ ] Play / show only URLs from the API (R2 public)
- [ ] Handle empty `audioUrl` / `pdfUrl` gracefully (show “coming soon”)
- [ ] Support deep link: `kitab/{slug}?ders={1-based index}` same as website
- [ ] Do **not** embed R2 Access Key / Secret / CFAT in the APK/IPA
- [ ] Use HTTPS only; trust system CA store
- [ ] Optional: `POST /events` with `{ "type": "page_view", "path": "/kitab/…" }` for Admin analytics

### Suggested Dart client sketch

```dart
final base = const String.fromEnvironment(
  'CMS_API_BASE',
  defaultValue: 'https://sile-qelbachin1-1.onrender.com/api/public/v1',
);

Future<List<dynamic>> fetchResource(String name) async {
  final res = await http.get(Uri.parse('$base/$name'));
  final body = jsonDecode(res.body) as Map<String, dynamic>;
  if (body['ok'] != true) throw Exception(body['error']);
  return body['data'] as List<dynamic>;
}
```

---

## 6. Staff roles (who can change what mobile sees)

| Role | Can publish content / uploads | Storage sync (R2 scan) | Add/remove staff |
|------|-------------------------------|-------------------------|------------------|
| **Super Admin** | Yes | Yes | Yes |
| **Content Admin** | Yes (same as Super except storage) | No | Yes |
| **Media Admin** | Upload + edit + analytics | No | No |

Mobile users are **not** staff. They only consume published JSON.

---

## 7. Admin server env (for deploy — not for Flutter)

These belong on Render/Vercel Admin only (see `admincn-1.0.0/.env.deploy.example`):

```text
R2_BUCKET_NAME=sileqelbachinmediea
R2_ENDPOINT=https://26e435690c62468180455b796d21b3ab.r2.cloudflarestorage.com
CLOUDFLARE_ACCOUNT_ID=26e435690c62468180455b796d21b3ab
R2_ACCESS_KEY_ID=<server-only>
R2_SECRET_ACCESS_KEY=<server-only>
R2_PUBLIC_BASE_URL=https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
NEXT_PUBLIC_R2_PUBLIC_BASE=https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
NEXT_PUBLIC_R2_OBJECT_PREFIX=sileqelbachin-meadia
SUPABASE_* / SUPER_ADMIN_* = Auth for staff
```

After Admin env is set and staff publish:

1. File lands in R2  
2. Metadata is published  
3. `/api/public/v1/kitabs` (etc.) includes new item  
4. Mobile refresh shows it  

---

## 8. Acceptance test (Admin change → phone)

1. Super/Media Admin uploads a short audio in Admin and publishes a kitab ders.  
2. Open `https://YOUR-ADMIN-HOST/api/public/v1/kitabs` in a browser — new ders `audioUrl` is an `r2.dev` link.  
3. Open that `audioUrl` in the phone browser — audio plays.  
4. Pull-to-refresh in Flutter — same ders appears and plays inside the app.  
5. Unpublish in Admin → refresh API → item gone from app.

If step 2 fails: Admin R2 credentials / publish status.  
If step 2 works but app fails: wrong `CMS_API_BASE` or caching in Flutter.

---

## 9. Related docs

- Website/Admin workflow: `admincn-1.0.0/docs/admin/CMS-WEBSITE-MOBILE-WORKFLOW.md`
- Older UI handoff: `FLUTTER_HANDOFF.md` (screens/colors; prefer **this** file for live CMS + R2)

---

**Bottom line for mobile:**  
Configure `CMS_API_BASE` → fetch published JSON → play the R2 `https://pub-….r2.dev/…` URLs Admin already attached. That is the full Admin → Cloudflare → mobile path.
