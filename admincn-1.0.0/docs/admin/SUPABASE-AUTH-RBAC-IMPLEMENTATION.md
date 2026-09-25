# Supabase Auth + RBAC Implementation Report
**Project:** Sile Qelbachin Admin  
**Date:** 2026-09-24

---

## Architecture

```text
Browser
 ↓
Next.js on Render (existing Admin server/API)
 ↓
Supabase Auth (email/password identity)
 ↓
staff_profiles role + status
 ↓
RLS (PostgreSQL) + Next.js API authorization
 ↓
Supabase PostgreSQL (CMS metadata)
 ↓
Cloudflare R2 (media files via server routes only)
```

Do **not** create a second backend. Privileged work stays in existing `/api/admin/*` routes.

---

## Authentication

| Feature | Implementation |
|---------|----------------|
| Email/password | Supabase `signInWithPassword` on `/pages/auth/login` |
| Email verification | Required (`email_confirmed_at`); unverified → verify page / deny Admin |
| Forgot password | `resetPasswordForEmail(email, { redirectTo })` — always shows generic success (no email enumeration) |
| Reset password | Recovery session → `updateUser({ password })` on `/pages/auth/reset-password` |
| Change password | `/account/change-password` — re-check current password, then `updateUser` |
| Session | `@supabase/ssr` cookies + `middleware.ts` refresh |
| Logout | `DELETE /api/auth/session` + client `signOut` |

### Forgot password (exact UX)

```text
Login → Forgot Password → enter email
  → Supabase emails reset link (if account exists)
  → open Gmail → Reset Password
  → /pages/auth/reset-password (recovery session)
  → new + confirm password
  → success → Login → Admin
```

No plaintext password is emailed. No custom reset tokens.

### Bootstrap Super Admin

- Email: `mesudhassen5450@gmail.com` (from `SUPER_ADMIN_EMAIL`)
- Temporary password: **only** via env `SUPER_ADMIN_BOOTSTRAP_PASSWORD` (never in source/docs/logs)
- Script: `npm run auth:bootstrap`
- Sets `must_change_password=true` → forced change on first login

---

## Authorization

### Roles

`super_admin` · `content_admin` · `media_admin` · `analytics_admin` · `moderator` · `read_only`

### Permissions

Central map in `src/lib/auth/permissions.ts` (kitabs.*, ders.*, media.scan, admins.manage, …).

### Enforcement layers

1. **UI** — Sidebar filters by `canPath` (hide only; not security).
2. **API** — `requireApiPermission(...)` on Admin routes; role taken from session + `staff_profiles`, never from the browser body.
3. **RLS** — `supabase/migrations/002_auth_rbac.sql` (published read for anon; staff write; role escalation trigger).
4. **Role escalation** — cannot PATCH own role; DB trigger blocks non-super role changes.

### Status

`active` | `pending` | `disabled` | `suspended` — auth may succeed, Admin authorization fails if not `active`.

---

## Security

| Item | Status |
|------|--------|
| Service-role key client-side | Not used — `createServiceClient` server-only |
| R2 secrets in `NEXT_PUBLIC_*` | No |
| Passwords in CMS DB | No (Supabase Auth only) |
| Local auth bypass | **Removed** — no unauthenticated Admin path |
| `.data/cms-store.json` | Kept for CMS data continuity; not an auth fallback |

### Env (Render)

Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`, R2 public base/prefix  

Server-only: `SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, …

Blueprint: `render.yaml`

### Supabase dashboard settings (required for production email)

1. Authentication → Providers → Email enabled; confirm email ON.  
2. Authentication → URL Configuration:
   - **Site URL:** `https://sile-qelbachin1-1.onrender.com` (production Admin)
   - **Redirect URLs** must include:
     - `http://localhost:3001/pages/auth/reset-password`
     - `https://sile-qelbachin1-1.onrender.com/pages/auth/reset-password`
3. Configure **custom SMTP** (Authentication → Emails). Default Supabase mail is test-only / often blocked — that is why Forgot Password can show “sent” with **no inbox mail**. Login + My Account password change do **not** use email; only Forgot Password does.
4. If mail never arrives: Authentication → Logs → filter recovery / email errors.
5. Apply migrations `001_cms_schema.sql` + `002_auth_rbac.sql`.  
6. Run `npm run auth:bootstrap` with bootstrap password in env once.

---

## Key files

| Path | Purpose |
|------|---------|
| `src/middleware.ts` | Session + route protection |
| `src/lib/auth/guards.ts` | API authz |
| `src/lib/auth/permissions.ts` | RBAC map |
| `src/views/pages/auth/*/…` | Login / forgot / reset |
| `src/app/(pages)/account/*` | My Account + change password |
| `src/app/api/admin/staff/route.ts` | Admin create/list (service role) |
| `scripts/bootstrap-super-admin.ts` | Initial Super Admin |
| `supabase/migrations/002_auth_rbac.sql` | staff_profiles + RLS |

---

## Testing

### Performed in this environment

| Test | Result | Notes |
|------|--------|-------|
| Protected Admin API without session | **PASS** | Expect 401/503 depending on whether Supabase env is set |
| Public content API still open | **PASS** | `/api/public/v1/*` remains unauthenticated |
| Login UI has email + password + Forgot Password | **PASS** | Wired to Supabase client |
| Forgot password form asks for email + generic success copy | **PASS** | Uses `resetPasswordForEmail` |
| Secret scan (no committed secret values) | **PASS** | Env placeholders only; `.env` gitignored |
| Full live login / reset email / RLS matrix | **NOT RUN** | Requires real Supabase project URL, publishable key, service role, SMTP |

### Must run after Supabase is connected

1. Bootstrap Super Admin → login → forced password change → dashboard.  
2. Wrong password → fail.  
3. Unverified user → denied.  
4. Non-staff Auth user → Admin denied.  
5. Content Admin vs Media Admin UI + API 403 checks.  
6. Forgot password → Gmail link → reset → login with new password.  
7. Change password → old fails, new works.  
8. Logout → protected page → login redirect.  
9. Direct `POST /api/admin/media/scan` without cookie → 401.

---

## Existing CMS

- R2 scan/import, local store, public v1 APIs preserved.  
- Admin media/content APIs now require authenticated staff permissions once Supabase Auth is configured.  
- Content records (882 media, kitabs, ders, …) are not deleted by this auth work.

---

## Acceptance checklist

| Item | Code complete | Live verified |
|------|---------------|---------------|
| Email/password | ✓ | Pending Supabase |
| Email verification gate | ✓ | Pending |
| Forgot password email | ✓ | Pending SMTP |
| Change password | ✓ | Pending |
| Session management | ✓ | Pending |
| Protected Admin routes | ✓ | Pending |
| Role lookup + UI filter | ✓ | Pending |
| Server/API authorization | ✓ | Pending |
| RLS migration | ✓ | Apply in project |
| Role escalation protection | ✓ | Pending |
| Audit logging hooks | ✓ | Pending |
| R2/service secrets protected | ✓ | ✓ (structure) |
| Render config | ✓ | Deploy pending |
