# ስለ ቀልባችን · Sile Qelbachin

### Islamic educational platform — Kitab · Audio · Muhadara · Reminders

<p align="center">
  <a href="https://sileqelbachin1.com">
    <img src="https://img.shields.io/badge/🌐_Live_Website-sileqelbachin1.com-B71C1C?style=for-the-badge" alt="Live Website" />
  </a>
  <a href="https://admin.sileqelbachin1.com">
    <img src="https://img.shields.io/badge/🛠_Admin_CMS-admin.sileqelbachin1.com-1B5E20?style=for-the-badge" alt="Admin CMS" />
  </a>
  <a href="https://t.me/Sle_qelbachn1">
    <img src="https://img.shields.io/badge/Telegram-Sle__qelbachn1-26A5E4?style=for-the-badge&logo=telegram" alt="Telegram" />
  </a>
</p>

<p align="center">
  <b><a href="https://sileqelbachin1.com">→ Open the live site: https://sileqelbachin1.com</a></b>
</p>

<p align="center">
  <img src="public/assets/heart-hero.jpg" alt="Sile Qelbachin — heart of knowledge" width="720" />
</p>

---

## Start here

| I want to… | Go here |
|------------|---------|
| **Visit the public website** | [https://sileqelbachin1.com](https://sileqelbachin1.com) |
| **Open Admin (staff only)** | [https://admin.sileqelbachin1.com](https://admin.sileqelbachin1.com) |
| **Join Telegram** | [t.me/Sle_qelbachn1](https://t.me/Sle_qelbachn1) |
| **TikTok** | [@sle_qelbachn1](https://www.tiktok.com/@sle_qelbachn1) |
| **YouTube** | [@sle_qelbachn1](https://youtube.com/@sle_qelbachn1) |
| **Deploy Netlify + Render** | [DEPLOY_BLUEPRINT.md](./DEPLOY_BLUEPRINT.md) |
| **Connect Flutter / mobile** | [MOBILE_ADMIN_CLOUDFLARE_INTEGRATION.md](./MOBILE_ADMIN_CLOUDFLARE_INTEGRATION.md) |

---

## What this project is

**ስለ ቀልባችን** (Sile Qelbachin) is a multilingual Islamic learning home:

- **Kitab** — books with organized audio ders + PDF where available  
- **Audio & Muhadara** — lessons and discourses  
- **Video** — educational clips  
- **Reminders** — short reflections managed from Admin  
- **Knowledge & Sahabah** — Qur’an, Hadith, companion biographies  
- **AM / AR / EN** interface  

Staff publish in **Admin** → files live on **Cloudflare R2** → **website** and **mobile** read the public API.

```text
Staff  →  Admin CMS  →  Cloudflare R2 (media)
                ↓
         /api/public/v1/*
                ↓
     Website + Flutter app
```

---

## Live surfaces

| Surface | URL | Host |
|---------|-----|------|
| **Website** | [sileqelbachin1.com](https://sileqelbachin1.com) | Netlify |
| **Admin CMS** | [admin.sileqelbachin1.com](https://admin.sileqelbachin1.com) | Render |
| **Public API** | […/api/public/v1/kitabs](https://admin.sileqelbachin1.com/api/public/v1/kitabs) | Render |
| **Media** | Cloudflare R2 public URLs | R2 |

---

## For visitors

1. Open **[https://sileqelbachin1.com](https://sileqelbachin1.com)**  
2. Browse Kitab, listen to ders, read reminders  
3. First visit plays a short intro recitation **once** in that browser (phone or desktop), then never auto-repeats  

---

## For staff (Admin)

| Role | Can do |
|------|--------|
| **Super Admin** | Everything, including Storage sync |
| **Content Admin** | Same as Super **except** Storage sync |
| **Media Admin** | Upload / edit / analytics — no staff, no Storage sync |

Admin app lives in [`admincn-1.0.0/`](./admincn-1.0.0/).

---

## For mobile developers

Point the app at the public CMS API (no R2 secrets in the APK):

```text
CMS_API_BASE=https://admin.sileqelbachin1.com/api/public/v1
```

Then `GET /kitabs`, `/audio`, `/video`, `/pdfs`, `/reminders` and play the `audioUrl` / `fileUrl` / `pdfUrl` fields (already public R2 links).

Full contract → **[MOBILE_ADMIN_CLOUDFLARE_INTEGRATION.md](./MOBILE_ADMIN_CLOUDFLARE_INTEGRATION.md)**

---

## Deploy (final map)

| Host | What | Env guide |
|------|------|-----------|
| **Netlify** | Frontend website | 4 `NEXT_PUBLIC_*` vars — see [DEPLOY_BLUEPRINT.md](./DEPLOY_BLUEPRINT.md) |
| **Render** (`admincn-1.0.0`) | Admin + API + R2 uploads | Supabase + R2 secrets — same blueprint |

**Netlify (website) — only these:**

```bash
NEXT_PUBLIC_SITE_URL=https://sileqelbachin1.com
NEXT_PUBLIC_CMS_API_BASE=https://admin.sileqelbachin1.com/api/public/v1
NEXT_PUBLIC_R2_PUBLIC_BASE=https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
NEXT_PUBLIC_R2_OBJECT_PREFIX=sileqelbachin-meadia
```

---

## Local development

```bash
# Website (port 3000)
npm install
npm run dev

# Admin (port 3001) — from admincn-1.0.0/
cd admincn-1.0.0
npm install
npm run dev -- -p 3001
```

Copy env templates:

- Website: [`.env.deploy.example`](./.env.deploy.example) → `.env.local`  
- Admin: [`admincn-1.0.0/.env.deploy.example`](./admincn-1.0.0/.env.deploy.example) → `.env.local`  

Never commit real secrets.

---

## Repo map

```text
Sile_qelbachin1/
├── src/                    # Public Next.js website
├── public/                 # Assets, hero video, heart image
├── admincn-1.0.0/          # Admin CMS (Render root directory)
├── DEPLOY_BLUEPRINT.md     # Netlify + Render env checklist
├── MOBILE_ADMIN_CLOUDFLARE_INTEGRATION.md
└── README.md               # You are here
```

---

## Stack

- **Website / Admin:** Next.js · TypeScript · Tailwind  
- **Auth & CMS metadata:** Supabase  
- **Media:** Cloudflare R2  
- **Website host:** Netlify  
- **Admin host:** Render  

---

<p align="center">
  <b>Live now → <a href="https://sileqelbachin1.com">https://sileqelbachin1.com</a></b><br/>
  <sub>ሰላም · Peace · Admin: <a href="https://admin.sileqelbachin1.com">admin.sileqelbachin1.com</a></sub>
</p>
