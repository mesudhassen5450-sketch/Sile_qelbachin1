# Deployment Guide for Sle Qelbachin Website

## 🚨 Important: Missing Media Files

The repository **does not include** the `public/telegram_media/` folder (1.9 GB, 800 files) due to size constraints. You need to upload these separately.

## Option 1: Manual Upload to Netlify (Recommended for Quick Fix)

### Step 1: Deploy to Netlify
1. Go to https://app.netlify.com/
2. Connect your GitHub repository: `mesudhassen5450-sketch/Sile_qelbachin1`
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Add environment variable in Netlify (Site settings → Environment variables):
   - Key: `GROQ_API_KEY`
   - Value: your Groq API key (never commit keys to git)
   - Key: `NEXT_PUBLIC_SITE_URL`
   - Value: `https://sileqelbachin1.netlify.app`

### Step 2: Upload Media Files
After your site deploys:

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Login to Netlify:
```bash
netlify login
```

3. Link your site:
```bash
cd c:\Users\user\Documents\multiplepage-portfolio-1.0.0
netlify link
```

4. Upload the telegram_media folder:
```bash
netlify deploy --dir=public/telegram_media --prod --alias=telegram_media
```

Or manually via Netlify Dashboard:
- Go to **Deploys** > **Deploy settings** > **Asset optimization**
- Upload `public/telegram_media` folder as **Static files**

## Option 2: Use CDN for Media (Recommended for Production)

### Using Cloudinary (Free tier: 25GB storage, 25GB bandwidth/month)

1. Sign up at https://cloudinary.com/
2. Upload your media files to Cloudinary
3. Update paths in your code:

Replace `/telegram_media/files/...` with Cloudinary URLs:
- Files to update:
  - `src/data/kitabs.ts`
  - `src/lib/aiContentIndex.ts`
  - `src/app/page.tsx`
  - `src/data/channelData.ts`

Example:
```typescript
// Before
audioUrl: "/telegram_media/files/Intebih%20Ante%20Murakeb/audio.m4a"

// After
audioUrl: "https://res.cloudinary.com/your-cloud-name/video/upload/v1/Intebih%20Ante%20Murakeb/audio.m4a"
```

## Option 3: Host on AWS S3 or DigitalOcean Spaces

Similar to Option 2, upload to S3/Spaces and update URLs in code.

## 🔧 Fixing API Routes on Netlify

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

## 📁 Files Requiring Media Upload

### Required Audio Files (Referenced in Code):
```
public/telegram_media/files/
├── Intebih Ante Murakeb (intebih-ante-murakeb)/
│   ├── intebih ante muakeb.webp (cover image)
│   ├── انتَبه أنتَ مُراقَب.pdf
│   ├── ኢንተቢህ 1.m4a
│   ├── ኢንተቢህ- ክፍል 2.m4a
│   ├── ኢንተቡህ- ክፍል 3.m4a
│   └── ኢንተቢህ-ክፍል 4.m4a
├── home page audio/
│   ├── ማረኝ_የኔ_ጌታ…!የ_ኡስታዝ_መመሀመድ_ሲራጁ_ግጥም.m4a
│   ├── ከጭንቀት_እና_ከ_ሐሳብ_መውጫ_መንገዶች!.mp3
│   └── ትዳር እና እስልምና.ogg
└── [All other Kitab folders and audio files]
```

## 🔍 Testing Locally

To test with media files locally:

1. Ensure `public/telegram_media/` folder exists with all files
2. Run development server:
```bash
npm run dev
```
3. Visit http://localhost:3000

## 🚀 After Deployment

1. Check that media files load (no 404 errors)
2. Test AI Assistant (should connect to API routes)
3. Test PDF viewer on Kitab pages
4. Verify audio playback

## 🔎 Google Search Console (SEO)

After the site is live:

1. Open [Google Search Console](https://search.google.com/search-console)
2. Add property for your domain (or URL prefix matching `NEXT_PUBLIC_SITE_URL`)
3. Verify ownership (HTML tag, DNS, or Netlify method)
4. Submit sitemap: `{NEXT_PUBLIC_SITE_URL}/sitemap.xml`  
   Example: `https://sileqelbachin1.netlify.app/sitemap.xml`
5. Confirm robots is reachable: `{NEXT_PUBLIC_SITE_URL}/robots.txt`

Set `NEXT_PUBLIC_SITE_URL` in Netlify to your final public URL (Netlify or custom domain such as `https://sileqelbachin1.com`) so canonicals, Open Graph, sitemap, and robots stay correct.

## 📝 Environment Variables

Required for production:
- `GROQ_API_KEY`: Your Groq API key for AI features
- `NEXT_PUBLIC_SITE_URL`: Public site URL for sitemap / OG / canonicals

## 💡 Pro Tip

For the best performance, use Option 2 (CDN) for production deployment. This will:
- Reduce GitHub repo size
- Speed up deployments
- Provide better global content delivery
- Allow independent media updates without redeploying code
