# Deployment Guide for Sle Qelbachin Website

## Media playback (Cloudflare R2)

**Production audio / PDF / video / remote covers** are served from **Cloudflare R2**. See `CLOUDFLARE_R2.md`.

- Public base: `https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev`
- Object prefix: `sileqelbachin-meadia`
- Resolver: `src/lib/mediaUrl.ts` (rewrites legacy GitHub / jsDelivr URLs)

The GitHub media repo `sileqelbachin-media` is an **optional archive**, not the live playback CDN.

Set on Netlify (optional — code has the same defaults):

- `NEXT_PUBLIC_R2_PUBLIC_BASE`
- `NEXT_PUBLIC_R2_OBJECT_PREFIX`

Never put R2 Access Keys in `NEXT_PUBLIC_*` or client code.

---

## Important: Local telegram_media folder

The repository **does not include** a full `public/telegram_media/` tree (historically ~1.9 GB). Production does **not** need that folder on Netlify — files live on R2. Keep a local copy only for archival or re-upload scripts.

## Option 1: Deploy the Next.js site to Netlify

### Step 1: Deploy to Netlify

1. Go to https://app.netlify.com/
2. Connect your GitHub repository: `mesudhassen5450-sketch/Sile_qelbachin1`
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Add environment variables in Netlify (Site settings → Environment variables):
   - `GROQ_API_KEY` — your Groq API key (never commit keys to git)
   - `NEXT_PUBLIC_SITE_URL` — e.g. `https://sileqelbachin1.netlify.app`
   - `NEXT_PUBLIC_R2_PUBLIC_BASE` — R2 public URL (see `.env.example`)
   - `NEXT_PUBLIC_R2_OBJECT_PREFIX` — `sileqelbachin-meadia`

### Step 2: Confirm media on R2

After deploy, open a Kitab lesson and verify audio/PDF load from `*.r2.dev` (not `githubusercontent` / `jsdelivr`).

If you need to re-upload objects to the bucket, use a **server/CI** script with private R2 credentials from `.env.example` placeholders — never commit real secrets.

## Option 2 (legacy): Manual Netlify static media upload

Only if you are not using R2. Prefer R2 for production.

```bash
npm install -g netlify-cli
netlify login
netlify link
netlify deploy --dir=public/telegram_media --prod --alias=telegram_media
```

## Option 3 (legacy): Other CDNs

Older docs mentioned Cloudinary / S3. The current production path is **Cloudflare R2** as documented above.

## Fixing API Routes on Netlify

The `netlify.toml` file is already configured. Ensure you install the Netlify Next.js plugin:

```bash
npm install --save-dev @netlify/plugin-nextjs
```

Then commit and push:

```bash
git add netlify.toml package.json package-lock.json
git commit -m "chore: Add Netlify configuration"
git push
```

## Media object layout (R2 prefix)

```
sileqelbachin-meadia/
├── files/
│   ├── Intebih Ante Murakeb (intebih-ante-murakeb)/
│   │   ├── intebih ante muakeb.webp
│   │   ├── انتَبه أنتَ مُراقَب.pdf
│   │   ├── intebih5.m4a
│   │   └── …
│   ├── home page audio/
│   └── [other Kitab folders]
├── voice_messages/
└── …
```

## Testing Locally

```bash
npm run dev
```

Visit http://localhost:3000 — playback should hit R2 public URLs via `resolveMediaUrl`.

## After Deployment

1. Check that media files load from `*.r2.dev` (no 404 errors)
2. Test AI Assistant (should connect to API routes)
3. Test PDF viewer on Kitab pages
4. Verify audio playback

## Google Search Console (SEO)

After the site is live:

1. Open [Google Search Console](https://search.google.com/search-console)
2. Add property for your domain (or URL prefix matching `NEXT_PUBLIC_SITE_URL`)
3. Verify ownership (HTML tag, DNS, or Netlify method)
4. Submit sitemap: `{NEXT_PUBLIC_SITE_URL}/sitemap.xml`
   Example: `https://sileqelbachin1.netlify.app/sitemap.xml`
5. Confirm robots is reachable: `{NEXT_PUBLIC_SITE_URL}/robots.txt`

Set `NEXT_PUBLIC_SITE_URL` in Netlify to your final public URL (Netlify or custom domain such as `https://sileqelbachin1.com`) so canonicals, Open Graph, sitemap, and robots stay correct.

## Environment Variables

Required / recommended for production:

- `GROQ_API_KEY`: Groq API key for AI features (server-only)
- `NEXT_PUBLIC_SITE_URL`: Public site URL for sitemap / OG / canonicals
- `NEXT_PUBLIC_R2_PUBLIC_BASE`: R2 public base URL
- `NEXT_PUBLIC_R2_OBJECT_PREFIX`: R2 object prefix (`sileqelbachin-meadia`)

Private R2 upload keys (`R2_ACCESS_KEY_ID`, etc.) are for upload scripts only — see `.env.example` and `CLOUDFLARE_R2.md`.

## Pro Tip

Use R2 for production media so you can:

- Keep the frontend git repo small
- Speed up deploys
- Serve large audio without GitHub/jsDelivr limits
- Update media without redeploying the Next.js app
