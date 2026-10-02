# Passwordless Magic Link auth — Sile Qelbachin

## Experience

```text
Enter email → Continue → Check Gmail → Click secure login link → Logged in
```

No password. No registration form. No username.

## Implementation

| Piece | Path |
|-------|------|
| Login (email only) | `/login` → `signInWithOtp` |
| Callback | `/auth/callback` → `exchangeCodeForSession` |
| Account | `/account` (email + sign out) |
| Protected | `/ask-question`, `/account` |

## Env

```bash
NEXT_PUBLIC_SITE_URL=https://YOUR-WEBSITE-DOMAIN
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# Optional invite-only (default true = allow first-time Magic Link signup)
NEXT_PUBLIC_AUTH_ALLOW_SIGNUPS=true
```

Never put the service-role key on the website.

## Supabase Dashboard (required for real Gmail)

1. **Authentication → Providers → Email** enabled  
2. **Authentication → Providers → Email → Magic Link** enabled  
3. Disable “Confirm email” requirement for password signup if passwords are unused; Magic Link itself proves ownership  
4. **URL configuration**
   - Site URL: production website  
   - Redirect URLs:
     - `https://YOUR-WEBSITE-DOMAIN/auth/callback`
     - `http://127.0.0.1:3000/auth/callback`
     - `http://localhost:3000/auth/callback`
5. Apply `admincn-1.0.0/supabase/migrations/003_user_profiles.sql`  
6. Customize Magic Link email template (see `MAGIC-LINK-EMAIL-TEMPLATE.md`)

## Signup control

`shouldCreateUser` is driven by `NEXT_PUBLIC_AUTH_ALLOW_SIGNUPS` (default `true`).  
Set to `false` for invite-only emails.

## Ask an Ustaz

Guests → redirected to `/login?next=/ask-question`  
Signed-in users → can submit; identity = `auth.users.id` + email  

## Cross-platform

Same Supabase project + same Magic Link email works for website and mobile.
