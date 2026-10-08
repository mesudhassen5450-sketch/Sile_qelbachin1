# How client UI + Admin + Supabase + Render + Cloudflare connect

**Product:** ስለ ቀልባችን / Sile Qelbachin  
**Updated:** 2026-10-07  

This is the map for: *“UI is updated for client interest — how does Admin change still update the live site and app?”*

Related docs:

| Doc | Role |
|-----|------|
| `MOBILE_APP_CATEGORY_UI.md` | **What** the app Home/nav looks like (Daily priority, Archive, Youth) |
| `MOBILE_ADMIN_CLOUDFLARE_INTEGRATION.md` | Env vars + Flutter CMS base |
| `CLOUDFLARE_R2.md` | Media bucket / public URLs |
| `admincn-1.0.0/docs/admin/CMS-WEBSITE-MOBILE-WORKFLOW.md` | Staff publish workflow |

---

## 1. Two layers (do not mix them)

| Layer | Who owns it | Where it lives | Admin can change it? |
|-------|-------------|----------------|----------------------|
| **A. Shell / UI structure** | Developers | Website: `src/config/siteNav.ts`, `src/app/page.tsx` · App: `MOBILE_APP_CATEGORY_UI.md` | **No** — nav groups, Daily cards, section order, icons |
| **B. Content inside those screens** | Staff (Admin) | Supabase rows + R2 files | **Yes** — titles, audio, PDF, video, featured, publish/unpublish |

**Example**

- Client wants Home: **Daily** (Qur’an · Azan · Athkar · Qibla) then **Educational Archive** → that is **layer A** (mobile UI spec).  
- Client wants a new PDF in Library → staff **Publish** in Admin → that is **layer B** (same pipeline as today).

Admin never redesigns the app layout. Admin fills the **content slots** the UI already opens.

---

## 2. Live systems (who runs where)

```text
┌─────────────────────────────────────────────────────────────┐
│  Staff browser                                              │
│  https://admin.sileqelbachin1.com                           │
└───────────────────────────┬─────────────────────────────────┘
                            │ login + edit + Publish
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Admin CMS  (Render)                                        │
│  Service: Sile_qelbachin1-1                                 │
│  Code root: admincn-1.0.0                                   │
│  Public host: admin.sileqelbachin1.com  (CNAME → Render)    │
│  Fallback:    sile-qelbachin1-1.onrender.com                │
└───────────────┬─────────────────────────────┬───────────────┘
                │ metadata                    │ file bytes
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────┐
│  Supabase                 │   │  Cloudflare R2              │
│  project: lsyyezhsqhzc…   │   │  bucket: sileqelbachinmediea│
│  CMS tables + Auth/RBAC   │   │  prefix: sileqelbachin-meadia│
│  status = draft|published │   │  public: pub-….r2.dev       │
└───────────────┬───────────┘   └──────────────┬──────────────┘
                │                              │
                │   GET /api/public/v1/*       │ HTTPS fileUrl
                │   (published only)           │
                └──────────────┬───────────────┘
                               ▼
              ┌────────────────┴────────────────┐
              ▼                                 ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│  Public website         │       │  Flutter / mobile app   │
│  https://sileqelbachin1.com     │  CMS_API_BASE =         │
│  (Vercel)               │       │  admin…/api/public/v1   │
│  reads via /api/cms →   │       │  plays R2 HTTPS URLs    │
│  Admin public API       │       │  Daily UI = app-only    │
└─────────────────────────┘       └─────────────────────────┘
```

| Piece | Job |
|-------|-----|
| **Supabase** | Stores CMS rows (kitabs, audio, video, PDFs, reminders, questions…). Staff Auth + roles. |
| **Cloudflare R2** | Stores the actual audio/PDF/video/image files. Public HTTPS links in API JSON. |
| **Render** | Runs the Admin Next.js app. Upload/scan APIs write R2; content APIs write Supabase; public API reads published rows. |
| **Cloudflare DNS** | `admin` → Render; site domain → Vercel (website). |
| **Vercel (website)** | Serves `sileqelbachin1.com`. Fetches published CMS (proxy `/api/cms`). Does **not** hold staff secrets. |
| **Mobile** | Same public JSON + R2 URLs. Layout from `MOBILE_APP_CATEGORY_UI.md` (Daily first). |

---

## 3. What happens when Admin changes something

```text
1. Staff opens Admin → Content (Kitab / Audio / PDF / Video / Reminders / Youth…)
2. Edit title / attach media / set Featured / priority
3. Click Publish  (status = published)
4. Admin writes:
      • row → Supabase
      • file (if new upload) → PutObject → R2  → public_url saved on row
5. Public API filters status === published
6. Website refresh / mobile pull-to-refresh → new item appears in the matching screen
```

| Admin action | Where it shows |
|--------------|----------------|
| Publish audio | Website Da’wah + home featured · App Audio |
| Publish PDF | Website Library PDF tab · App Library |
| Publish kitab + ders | Library / kitab detail (both) |
| Publish reminder | Home titles / Da’wah Reminders tab |
| Publish Q&A / marriage / articles | Matching Youth screens |
| **Unpublish** | Disappears from public API (both apps stop listing it) |
| Draft only | **Never** on website or mobile |

**Nothing special is required** for the new category UI: screens still call the **same** endpoints. Only the **order of sections** on mobile Home changed (Daily first).

---

## 4. UI slots ↔ Admin ↔ API (content wire-up)

| UI place (client interest) | Admin area | Public API |
|----------------------------|------------|------------|
| Educational Archive → Qur’an | Content → Qur’an / recitations | `GET /quran-recitations` |
| Archive → Audio Lessons | Content → Audio | `GET /audio` |
| Archive → 1-Minute | Content → One-minute | `GET /one-minute` |
| Archive → Videos | Content → Video | `GET /video` |
| Archive → Library (Kitab/PDF/Notes) | Kitabs / PDFs / Reminders | `GET /kitabs` · `/pdfs` · `/reminders` |
| Youth → Q&A | Youth → Questions | `GET /questions` |
| Youth → Marriage | Youth → Marriage | `GET /marriage` |
| Youth → Articles | Youth → Articles | `GET /articles` |
| Home featured / priority | Featured + priority fields on rows | Same GETs; clients sort featured first |
| **Daily · Azan / Athkar / Qibla** | *(not CMS content)* | App-local tools (times / athkar / compass) |
| Daily · Qur’an card | Same as Qur’an above | Opens tilawah screen |

Website home section order stays the **existing** site layout. Mobile Home adds **Daily priority** first (`MOBILE_APP_CATEGORY_UI.md`).

---

## 5. How the website talks to Admin (already built)

```text
Browser  →  https://sileqelbachin1.com/api/cms/audio
                │
                ▼
         Website /api/cms/[...path]  (Vercel)
                │  proxies to
                ▼
         https://admin.sileqelbachin1.com/api/public/v1/audio
                │
                ▼
         Admin (Render) reads Supabase → returns published + R2 URLs
```

Code: `src/lib/cmsClient.ts` + `src/app/api/cms/[...path]/route.ts`.

Local dev: `.env.local` can set `CMS_REWRITE_TARGET=http://127.0.0.1:3001/api/public/v1` so website hits local Admin.

---

## 6. Env map (no secrets in website or mobile)

| Where | Needs |
|-------|--------|
| **Render (Admin)** | Supabase URL + service role · R2 access key + secret · public R2 base/prefix · `NEXT_PUBLIC_APP_URL=https://admin.sileqelbachin1.com` |
| **Vercel (website)** | `NEXT_PUBLIC_CMS_API_BASE` (or rely on default admin public URL) · `NEXT_PUBLIC_R2_PUBLIC_BASE` · `NEXT_PUBLIC_R2_OBJECT_PREFIX` · `NEXT_PUBLIC_SITE_URL` |
| **Flutter** | `CMS_API_BASE=https://admin.sileqelbachin1.com/api/public/v1` · public R2 base/prefix only |
| **Supabase Auth (site login)** | Site URL production = `https://sileqelbachin1.com` (not Admin/Render) — see project Auth URL rules |

Secrets (`R2_SECRET_*`, `SUPABASE_SERVICE_ROLE_KEY`) stay on **Render only**.

---

## 7. Checklist — “Admin change reached the apps”

1. Item is **Published** in Admin (not draft).  
2. `GET https://admin.sileqelbachin1.com/api/public/v1/<resource>` includes it (`ok: true`).  
3. `fileUrl` / `pdfUrl` / `audioUrl` is `https://pub-….r2.dev/sileqelbachin-meadia/...`.  
4. Hard-refresh website or pull-to-refresh mobile.  
5. If missing: check Render logs, Supabase row `status`, R2 object exists, Featured/priority if you expected home pin.

---

## 8. One-line summary

**UI shell (categories, Daily, card layout) = code/spec. Living content = Admin → Supabase + R2 via Render → public API → website + mobile.** Changing Admin publish still updates the existing system the same way; the new client UI only decides *where* that content is shown.
