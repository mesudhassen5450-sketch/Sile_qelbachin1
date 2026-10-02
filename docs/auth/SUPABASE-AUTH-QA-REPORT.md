# Passwordless Magic Link — QA Report

Date: 2026-09-28  
Mode: **Passwordless Magic Link only** (no password registration)

| Item | Result | Notes |
|------|--------|-------|
| Email-only login UI | **CODE READY** | `/login` — Continue → Magic Link |
| No password fields | **PASS** | Register/forgot/reset redirect to login |
| Real Magic Link send | **NEEDS LIVE GMAIL TEST** | Requires Supabase Magic Link + redirect URLs |
| Click link → session | **CODE READY** | `/auth/callback` exchanges `code` |
| Expired / used link message | **CODE READY** | Redirects to `/login?error=otp_expired` |
| Resend email | **CODE READY** | Rate-limit friendly message |
| Session persistence | **CODE READY** | AuthProvider + cookies |
| Logout | **CODE READY** | `/account` Sign out |
| Ask an Ustaz gated | **CODE READY** | Login required |
| No service-role in client | **PASS** | Publishable key only |
| Cross-platform same email | **PASS (design)** | Same Supabase project |

## Live Gmail checklist (required for PASS)

1. Dashboard: Magic Link ON; redirect URLs include site `/auth/callback`
2. Paste email template from `MAGIC-LINK-EMAIL-TEMPLATE.md`
3. Open http://127.0.0.1:3000/login
4. Enter real Gmail → Continue
5. Open inbox → **Log in to Sile Qelbachin** → Secure login
6. Land on site authenticated → refresh → still in
7. Ask an Ustaz works → Sign out → Ask requires login again

Do not mark Magic Link delivery as PASS until the Gmail steps succeed.
