# Google OAuth (Supabase Auth) — Sile Qelbachin website

## Why Google shows `….supabase.co`

Google always shows the **OAuth callback host**. With Supabase Auth that host is:

`lsyyezhsqhzcskjbqmco.supabase.co`

That is normal. To show a friendlier **app name** (“Sile Qelbachin”) on the Google account picker:

1. Google Cloud Console → **APIs & Services → OAuth consent screen**
2. Set **App name** = `Sile Qelbachin` (or ስለ ቀልባችን)
3. Upload your logo if asked
4. Save and publish (if External)

The heading may still say `….supabase.co` because that is the Auth callback host. To hide the Supabase URL entirely you need a **custom Auth domain** (Supabase Pro) pointed at something like `auth.sileqelbachin1.com` — optional later. App name + logo already make the screen feel branded.

## CRITICAL — do NOT send public users to Admin

Supabase **Authentication → URL Configuration → Site URL** must be the **public website**, never Admin:

| Correct Site URL | Wrong |
|------------------|--------|
| `http://localhost:3000` (local) | `https://sile-qelbachin1-1.onrender.com` |
| `https://sileqelbachin1.com` (prod) | any Admin / Render admin URL |

**Redirect URLs** allowlist (add all):

- `http://localhost:3000/auth/callback`
- `http://127.0.0.1:3000/auth/callback`
- `https://sileqelbachin1.com/auth/callback`
- (optional Netlify preview) `https://YOUR.netlify.app/auth/callback`

Admin staff login stays at:

- Local: `http://localhost:3001/pages/auth/login`
- Prod: `https://admin.sileqelbachin1.com/pages/auth/login`

Public visitors: **Continue with Google** → back to **website** `/auth/callback` → avatar in nav → Ask a Question.

## Code flow

1. `/login` → Continue with Google → `signInWithOAuth({ provider: 'google', redirectTo: <website>/auth/callback?next=… })`
2. `/auth/callback` exchanges `code` for session cookies
3. Redirect to `next` (default **`/`** home; **`/ask-question`** when user clicked Ask a Question while signed out)

## Env (website only)

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# production: https://sileqelbachin1.com
NEXT_PUBLIC_SUPABASE_URL=https://lsyyezhsqhzcskjbqmco.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

Never put Google Client Secret or service-role key on the website.
