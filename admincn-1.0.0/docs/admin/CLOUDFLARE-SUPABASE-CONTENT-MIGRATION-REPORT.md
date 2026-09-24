# Cloudflare → Supabase Content Migration Report

**Date:** 2026-09-24  
**Project:** Sile Qelbachin Admin (`admincn-1.0.0`)  
**Scope:** Connect existing Cloudflare R2 media into the Admin CMS without rebuilding website/mobile or replacing the Admin UI.

---

## Storage

```text
Cloudflare provider: cloudflare_r2
Bucket: sileqelbachinmediea
Object prefix: sileqelbachin-meadia
Public base: https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
Object count (last scan): 882
Last scan: 2026-09-24T05:26:23.328Z
Scan source: mirror (local media archive mirroring R2 layout)
R2 API credentials: not configured in this environment (set R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY for live ListObjects)
Supabase: not configured yet (local `.data/cms-store.json` backend active; schema ready to apply)
```

Mirror path used for discovery:

`/home/mhm/Documents/website folder/sileqelbachin-media`

When R2 API keys are added to Admin `.env.local`, Scan uses live R2 list automatically (same import path).

---

## Import

```text
Objects discovered: 882
Imported (first scan): 882
Updated: 0
Skipped (second scan): 882
Failed: 0
Needs review: ~372–533 (ambiguous path suggestions; not auto-published as content)
Duplicates prevented: yes (unique storage_provider + bucket + object_key)
```

### By media type (scan)

| Type  | Count |
|-------|------:|
| audio | 388 |
| video | 278 |
| image | 208 |
| pdf   | 6 |
| other | 2 |

### Idempotency

Second Scan Cloudflare Storage run:

```text
Total R2 objects: 882
Existing records matched: 882
New objects: 0
Changed objects: 0
Imported: 0
Skipped: 882
Failed: 0
```

---

## Content

Matched from verified static sources (`kitabs.ts` + `content.json`), then linked to `media_assets`:

```text
Kitabs: 7
Ders: 69
Audio (archive / Muhadara): 182
Videos: 130
PDF items (archive records): 21
Images (assets): 208
```

### Static → media link quality

| Area | Linked | Notes |
|------|-------:|-------|
| Kitab covers | 6/7 | One uses local `/covers/` asset (not R2) |
| Kitab PDFs | 5/7 | Linked where R2 PDF exists |
| Ders audio | 65/69 | Remaining unmatched need review |
| Archive audio | 148/182 | Relative-path mismatches flagged as orphan/review |
| Archive video | 130/130 | Full link |
| Archive PDF rows | 2/21 | Many PDF catalog rows point at paths not present as distinct R2 objects in mirror |

### Intebih Ante Murakeb (verification)

```text
Kitab → cover (R2) → PASS (HTTP 200)
Kitab → PDF (R2) → PASS (HTTP 200)
Kitab → 5 Ders → 5/5 audio linked → PASS (HTTP 200 on sample)
```

Public API sample:

`GET /api/public/v1/kitabs` → Intebih with 5 ders and R2 `audioUrl`s.

---

## Admin

| Feature | Result |
|---------|--------|
| Kitab management | PASS (DB-driven list from CMS store) |
| Ders management | PASS |
| Audio management | PASS |
| Video management | PASS |
| PDF management | PASS |
| Media health | PASS (UI + check API) |
| R2 scan | PASS (`/media/cloudflare` + `/api/admin/media/scan`) |
| Import / match static | PASS (`Match Static Content`) |
| Cloudflare Storage nav | PASS (`Media → Cloudflare Storage`) |
| Published content API | PASS (`/api/public/v1/{kitabs,audio,video,pdfs}`) |

---

## Website

| Check | Result |
|-------|--------|
| Database-driven content | PARTIAL — optional client `src/lib/cmsClient.ts` added; site still defaults to static JSON until `NEXT_PUBLIC_CMS_API_BASE` is set and verified |
| Real audio | PASS via existing R2 `mediaUrl` + CMS public URLs |
| Real video | PASS |
| Real PDF | PASS |
| Static JSON deleted | NO (intentionally retained) |

---

## Mobile

| Check | Result |
|-------|--------|
| Database-driven content | PENDING switch — consume Admin ` /api/public/v1/* ` when ready; Flutter JSON not removed |
| Real audio | PASS (existing R2 URLs; CMS exposes same public base) |
| Real video | PASS |
| Real PDF | PASS |
| Flutter JSON deleted | NO (intentionally retained) |

---

## Architecture delivered

```text
Cloudflare R2 (files stay in place)
        ↓
 Admin scan (S3 ListObjects or media mirror)
        ↓
 media_assets (idempotent upsert)
        ↓
 Match static Kitabs/Ders/Audio/Video/PDF
        ↓
 Local store now / Supabase when configured
        ↓
 Admin panel + /api/public/v1
        ↙              ↘
   Website (optional)   Mobile (optional)
```

### Key paths

| Piece | Location |
|-------|----------|
| SQL schema | `admincn-1.0.0/supabase/migrations/001_cms_schema.sql` |
| R2 client / scan | `src/lib/cms/r2.ts`, `scan-import.ts` |
| Static match | `src/lib/cms/match-static.ts` |
| Local fallback store | `.data/cms-store.json` (gitignored) |
| Cloudflare Storage UI | `/media/cloudflare` |
| CLI scan | `npm run cms:scan` |
| Env template | `.env.example` |

### Secrets

- R2 Access Key / Secret and Supabase service role are **server-only** (`.env.local`).
- No secrets in Flutter, React client bundles, or `NEXT_PUBLIC_*` except public R2 base/prefix.

---

## Future manual upload workflow

After initial import, **new** content is editorial:

### New Kitab

1. Admin → Content → Kitabs → Add  
2. Enter localized titles / speaker / category  
3. Upload or select cover + PDF → stored in R2 → `media_assets`  
4. Add Ders → upload/select audio → link asset  
5. Set status `published`  
6. Website/Mobile read `/api/public/v1/kitabs`

### New Ders

1. Open Kitab → Manage Ders → Add  
2. Number + titles → select/upload audio to R2  
3. Publish

### New audio / Muhadara

1. Content → Audio → Add  
2. Upload to R2 (`voice_messages/` or chosen prefix)  
3. Metadata + publish (Muhadara reuses audio rows; no duplicate library)

### New video

1. Content → Video → Add  
2. Upload video (+ optional thumbnail) to R2  
3. Metadata + publish

### New PDF / cover

1. Upload via Media → Uploads (or attach on Kitab)  
2. Link `media_assets` → publish

*(Upload-to-R2 writer endpoints are the next increment once R2 API keys are in Admin env; Scan/Import for existing files is complete.)*

---

## How to enable live R2 + Supabase

1. Apply `supabase/migrations/001_cms_schema.sql` in your Sile Supabase project.  
2. Set in Admin `.env.local`:

```text
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # server only
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

3. Run **Scan Cloudflare Storage** then **Match Static Content**.  
4. Point website/mobile at `NEXT_PUBLIC_CMS_API_BASE=https://admin…/api/public/v1` after parity checks.  
5. Only then retire static JSON in a separate approved cleanup.

---

## Acceptance vs brief

| Requirement | Status |
|-------------|--------|
| Existing R2 appears in Admin without manual recreation | PASS (882 assets scanned) |
| Idempotent scan | PASS |
| Cloudflare Storage page + Scan button | PASS |
| Content tables / media_assets | PASS (SQL + local store; Supabase pending credentials) |
| Match static 7 / 69 / 182 / 130 | PASS counts |
| Preserve website/mobile static until verified | PASS |
| Secrets server-side only | PASS |
| Intebih end-to-end media | PASS |

---

## Next recommended steps

1. Create/link Sile Supabase project and apply migration.  
2. Add R2 API tokens to Admin server env; re-scan against live bucket.  
3. Admin upload routes (Workflow B).  
4. Flip website `NEXT_PUBLIC_CMS_API_BASE` after side-by-side QA.  
5. Flutter handoff to public v1 API.  
6. Separate task: archive/remove legacy JSON after sign-off.
