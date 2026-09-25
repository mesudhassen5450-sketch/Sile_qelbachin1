# Deploy blueprint — Netlify (website) + Render (Admin)

**Domains**

| Surface | Host | URL |
|---------|------|-----|
| Frontend (public site) | **Netlify** | `https://sileqelbachin1.com` (or `*.netlify.app`) |
| Backend (Admin CMS + public API) | **Render** | `https://admin.sileqelbachin1.com` |
| Render fallback | Render | `https://sile-qelbachin1-1.onrender.com` |

```text
Users / Flutter
      │
      ▼
 Netlify website  ──GET──►  Admin public API
 (NEXT_PUBLIC_*)            https://admin.sileqelbachin1.com/api/public/v1
                                    │
                                    ├── Cloudflare R2 (files)
                                    └── Supabase (auth + CMS metadata)
```

---

## A) Netlify — FRONTEND only (enter these 4)

**Site settings → Environment variables → Add**

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://sileqelbachin1.com` |
| `NEXT_PUBLIC_CMS_API_BASE` | `https://admin.sileqelbachin1.com/api/public/v1` |
| `NEXT_PUBLIC_R2_PUBLIC_BASE` | `https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev` |
| `NEXT_PUBLIC_R2_OBJECT_PREFIX` | `sileqelbachin-meadia` |

Optional (AI assistant only):

| Key | Value |
|-----|--------|
| `GROQ_API_KEY` | *(your Groq key — server only)* |

**Do NOT put on Netlify**

- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_API_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY`
- `SUPER_ADMIN_BOOTSTRAP_PASSWORD`
- Anything with staff login secrets

After saving env vars → **Trigger deploy** (or wait for git push).

---

## B) Render — BACKEND Admin (Web Service)

**Settings**

| Setting | Value |
|---------|--------|
| Service | `Sile_qelbachin1-1` |
| Repo | `mesudhassen5450-sketch/Sile_qelbachin1` |
| Branch | `main` |
| **Root Directory** | `admincn-1.0.0` |
| Custom domain | `admin.sileqelbachin1.com` |

**Environment variables — exact values**

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_APP_URL` | `https://admin.sileqelbachin1.com` |
| `PORT` | `10000` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://lsyyezhsqhzcskjbqmco.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | *(same publishable key you already have)* |
| `SUPABASE_URL` | `https://lsyyezhsqhzcskjbqmco.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | *(same as publishable)* |
| `SUPABASE_SERVICE_ROLE_KEY` | *(service role JWT — same as now)* |
| `SUPABASE_SECRET_KEY` | *(same as service role if you use both)* |
| `SUPER_ADMIN_EMAIL` | `mesudhassen5450@gmail.com` |
| `SUPER_ADMIN_BOOTSTRAP_PASSWORD` | *(temp password — change after bootstrap)* |
| `NEXT_PUBLIC_R2_PUBLIC_BASE` | `https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev` |
| `NEXT_PUBLIC_R2_OBJECT_PREFIX` | `sileqelbachin-meadia` |
| `R2_PUBLIC_BASE_URL` | `https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev` |
| `R2_BUCKET_NAME` | `sileqelbachinmediea` |
| `R2_ENDPOINT` | `https://26e435690c62468180455b796d21b3ab.r2.cloudflarestorage.com` |
| `CLOUDFLARE_ACCOUNT_ID` | `26e435690c62468180455b796d21b3ab` |
| `R2_ACCOUNT_ID` | `26e435690c62468180455b796d21b3ab` |
| `R2_ACCESS_KEY_ID` | *(your 32-char Access Key ID)* |
| `R2_SECRET_ACCESS_KEY` | *(your full ~64-char secret)* |

**Fix these if they still say `value` on Render**

```text
R2_ENDPOINT=https://26e435690c62468180455b796d21b3ab.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev
```

Optional:

```text
CLOUDFLARE_API_TOKEN=…   (CFAT — server only)
```

**Do NOT set on Render**

- `R2_MEDIA_MIRROR_PATH` (local disk path — not for cloud)

After saving → **Manual Deploy → Deploy latest commit**.

---

## C) DNS checklist

| Hostname | Points to |
|----------|-----------|
| `admin.sileqelbachin1.com` | Render custom domain for `Sile_qelbachin1-1` |
| `sileqelbachin1.com` / `www` | Netlify site |

---

## D) Quick test after both are live

1. Open `https://admin.sileqelbachin1.com` → Admin login works  
2. Open `https://admin.sileqelbachin1.com/api/public/v1/kitabs` → JSON `ok: true`  
3. Open Netlify site → kitabs/reminders load from Admin (not only static)  
4. Flutter / mobile `CMS_API_BASE=https://admin.sileqelbachin1.com/api/public/v1`

---

## E) Order of work

1. Fix Render env (especially `R2_ENDPOINT` + `R2_PUBLIC_BASE_URL` + Root Directory `admincn-1.0.0`)  
2. Enter the **4 Netlify** vars above and save  
3. Tell the agent to **push** `main` so Netlify + Render rebuild  

Secrets stay only on Render. Netlify gets public `NEXT_PUBLIC_*` only.
