# Sile Qelbachin Admin

CMS for **ስለ ቀልባችን / Sile Qelbachin**. Cloudflare R2 holds media files; Supabase holds Auth + metadata.

## Architecture

```
Browser → Next.js (Render) → Supabase Auth → staff_profiles / RLS
                              ↓
                     Admin APIs (privileged)
                              ↓
                     Cloudflare R2 (server-only secrets)
```

## Auth

- Login: `/pages/auth/login` (email + password)
- Forgot password: `/pages/auth/forgot-password` → Supabase emails a reset link
- Reset: `/pages/auth/reset-password`
- Change password: `/account/change-password`
- Bootstrap: `npm run auth:bootstrap` (password only via `SUPER_ADMIN_BOOTSTRAP_PASSWORD` env)

See `docs/admin/SUPABASE-AUTH-RBAC-IMPLEMENTATION.md`.

## Run locally

```bash
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_* + SUPABASE_SERVICE_ROLE_KEY
# apply supabase/migrations/001_cms_schema.sql and 002_auth_rbac.sql
npm install
npm run auth:bootstrap   # once
npm run cms:scan         # optional media import CLI
npm run dev -- --port 3001
```

Open http://localhost:3001/pages/auth/login

## Brand

- Primary red: `#C52828`
- Dark default theme
- Fonts: Noto Sans Ethiopic + Amiri
