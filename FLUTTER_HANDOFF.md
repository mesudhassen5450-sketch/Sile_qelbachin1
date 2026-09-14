# ስለ ቀልባችን (Sle Qelbachin) — Production Snapshot & Flutter Handoff

**Purpose:** Exact record of the **current live website** so the next Flutter mobile app can copy structure, media, colors, and behavior without guessing.

**Snapshot date:** 2026-09-14  
**Live site:** https://sileqelbachin1.netlify.app/  
**Frontend repo:** https://github.com/mesudhassen5450-sketch/Sile_qelbachin1  
**Media repo:** https://github.com/mesudhassen5450-sketch/sileqelbachin-media  

---

## 1. What this product is

Islamic educational channel platform:

| Amharic | English |
|---------|---------|
| **ስለ ቀልባችን** | **Sle Qelbachin** |

Content types on the site today:

- **Kitab** — books with audio ders + PDF
- **Audio lectures** — archive from Telegram export
- **Muhadara** — discourses
- **Video lectures** — TikTok / YouTube / Telegram embeds or files
- **Reminders** — short hadith / Qur’an / reflection cards
- **Knowledge** — Qur’an & Hadith items
- **Sahabah** — biographies of the Four Khalifas
- **Contact** — Telegram / TikTok / YouTube

**Do not invent religious content.** Only ship what exists in data files / media repo.

---

## 2. Official social accounts

| Platform | Handle | URL |
|----------|--------|-----|
| Telegram | `@Sle_qelbachn1` | https://t.me/Sle_qelbachn1 |
| TikTok | `@sle_qelbachn1` | https://www.tiktok.com/@sle_qelbachn1 |
| YouTube | `@sle_qelbachn1` | https://youtube.com/@sle_qelbachn1 |

Source: `src/data/channelData.ts` → `siteMetadata`

---

## 3. App screens (map web → Flutter)

| Web route | Flutter screen | Notes |
|-----------|----------------|-------|
| `/` | Home | Featured kitabs, latest ders, app teaser, Stay Tuned live (coming soon), Telegram CTA |
| `/kitab` | Kitab library | Grid/list of kitabs |
| `/kitab/{slug}` | Kitab detail | Cover, ders playlist, PDF viewer, deep link `?ders=N` |
| `/audio-lecture` | Audio archive | Recorded only — **no fake LIVE** |
| `/muhadara` / `/muhadera` | Muhadara | Same content (two aliases) |
| `/video-lecture` / `/videos` | Videos | Same content (two aliases) |
| `/reminders` | Reminders | Card list |
| `/knowledge` | Knowledge | Qur’an / Hadith |
| `/sahabah` | Sahabah list | 4 Khalifas |
| `/sahabah/{slug}` | Sahabah detail | Sections AM/AR/EN |
| `/contact` | Contact | Social links |

**Deep link pattern to preserve:**

```text
/kitab/{slug}?ders={1-based-number}
```

Example: `/kitab/intebih-ante-murakeb?ders=5`

---

## 4. Design system (copy into Flutter Theme)

### 4.1 Brand colors

| Token | Light | Dark (default) | Usage |
|-------|-------|----------------|--------|
| Brand red | `#C52828` | `#DC2626` | Primary buttons, accents |
| Brand red hover | `#A61E1E` | `#B91C1C` | Pressed / hover |
| Brand red light | `#E53935` | — | Soft accents |
| Text | `#111111` | `#F3F4F6` | Body text |
| Page background | `#fcfcfd` / `#FAFAFA` | `#0f0f10` / `#0F0F12` | Screen bg |
| Card | `#FFFFFF` @ 85% | `#18181C` @ 85% | Cards |
| Border | `#E5E7EB` | `#27272A` | Dividers |
| Grid line | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.05)` | Background pattern |

**Default theme = dark** (website ships with `class="dark"`).

### 4.2 Background pattern

Website body uses a **32×32 px grid**:

```dart
// Flutter equivalent idea
Color bg = isDark ? Color(0xFF0F0F10) : Color(0xFFFCFCFD);
// Overlay thin grid lines every 32 logical pixels
```

CSS source: `src/app/globals.css`

### 4.3 Typography

| Language | Font |
|----------|------|
| Amharic / default UI | **Noto Sans Ethiopic** |
| Arabic | **Amiri** (serif), RTL |
| English | Noto Sans Ethiopic / system |

### 4.4 Shape / spacing

- Card radius: **20px** (`1.25rem`)
- Max content width (web): `1280px` (`max-w-7xl`)
- Horizontal padding: 16 → 24 → 32
- Bottom player clearance: ~112px (`pb-28`)
- Primary button class: solid brand red, white text

### 4.5 Header chrome (web)

- Nav height: 64px (mobile) / 80px (sm+)
- Marquee under nav: 44px
- Combined header CSS vars in `globals.css`

---

## 5. Languages (i18n)

| Code | Label | Direction |
|------|-------|-----------|
| `am` | አማርኛ (default) | LTR |
| `ar` | العربية | **RTL** |
| `en` | English | LTR |

- Storage key: `islamic-resources-language`
- Strings file (web): `src/data/translations.ts`
- Localized content shape:

```json
{ "am": "...", "ar": "...", "en": "..." }
```

Flutter: use same keys; set `TextDirection.rtl` when `ar`.

---

## 6. How media connects (critical for Flutter)

### 6.1 Two GitHub repos

| Repo | Role |
|------|------|
| `Sile_qelbachin1` | App UI + JSON/TS data (small) |
| `sileqelbachin-media` | Large **audio / PDF / video / covers** |

Media root on CDN/raw:

```text
files/{Kitab Folder Name (slug)}/{filename}
```

Example folder names:

- `Intebih Ante Murakeb (intebih-ante-murakeb)`
- `Ad-Da_ wa Ad-Dawa_ (adewae-kitab)`  ← note underscores
- `Fatihu Awliya (fatihu-awliya)`
- `alwasail-almufida`
- …

### 6.2 URL rules (must copy)

Website helper: `src/lib/mediaUrl.ts`

| Asset type | Preferred URL | Why |
|------------|---------------|-----|
| **Audio** (often >20MB) | `https://raw.githubusercontent.com/mesudhassen5450-sketch/sileqelbachin-media/main/{path}` | jsDelivr rejects large files |
| **PDF** (embed / download) | `https://cdn.jsdelivr.net/gh/mesudhassen5450-sketch/sileqelbachin-media@main/{path}` | Works well for PDFs |
| **Images / covers** | jsDelivr or raw | Either OK if small |

Data files may store **jsDelivr** URLs; at runtime audio is rewritten to **GitHub raw**.

**Always:**

1. URL-encode each path segment (spaces, Amharic, Arabic filenames)
2. Fix alias: `Ad-Da' wa Ad-Dawa'` → `Ad-Da_ wa Ad-Dawa_`

### 6.3 Flutter URL helpers (recommended)

```dart
const mediaOwner = 'mesudhassen5450-sketch';
const mediaRepo = 'sileqelbachin-media';
const mediaRef = 'main';

String encodeMediaPath(String path) =>
  path.split('/').map(Uri.encodeComponent).join('/');

String audioUrl(String relativePath) =>
  'https://raw.githubusercontent.com/$mediaOwner/$mediaRepo/$mediaRef/${encodeMediaPath(relativePath)}';

String pdfUrl(String relativePath) =>
  'https://cdn.jsdelivr.net/gh/$mediaOwner/$mediaRepo@$mediaRef/${encodeMediaPath(relativePath)}';
```

### 6.4 Video

- Catalog: `src/data/mediaStore.ts` + `src/data/content.json` (`type: "video"`)
- Platforms: `tiktok` | `youtube` | `telegram`
- Prefer opening platform URL / WebView / `url_launcher`
- Large `video_files/` live in media / telegram export — not all in frontend git

### 6.5 Local vs remote

| Local `public/` (web) | Production media |
|-----------------------|------------------|
| `/covers/...` | Prefer media repo covers when available |
| `/logo.jpg` | Bundle in Flutter assets |
| Home page audio under `telegram_media/files/home page audio/` | Can stay CDN/raw later |
| `intebih5.m4a`, `muktasar.pdf` | Pushed to media repo; kitabs point to CDN |

---

## 7. Data models to reimplement in Flutter

### 7.1 Kitab

```text
slug, title{am,ar,en}, author{...}, category{...},
coverImage?, coverBg?, pdfUrl?, pdfSize?,
dersCount, description{...},
dersList: Ders[]
```

### 7.2 Ders (audio track)

```text
id, title{...}, speaker{...}, duration, audioUrl,
kitabId?, kitabTitle?
```

### 7.3 Other

| Model | Source file |
|-------|-------------|
| Kitabs | `src/data/kitabs.ts` |
| Sahabah | `src/data/sahabah.ts` |
| Reminders / knowledge / muhadara stubs | `src/data/channelData.ts` |
| Bulk audio/video/pdf | `src/data/mediaStore.ts`, `src/data/content.json` |
| UI strings | `src/data/translations.ts` |

### 7.4 Kitabs on production now

| Slug | Ders count | Notes |
|------|------------|-------|
| `intebih-ante-murakeb` | 5 | Newest ders = part 5 |
| `adewae-kitab` | 28 | PDF: `muktasar.pdf` in Adewa folder |
| `fatihu-awliya` | 5 | |
| `alwasail-almufida` | 11 | |
| `teshilu-alimu-sheria` | 11 | |
| `yekelb-medreq` | 7 | |
| `betewbet-mengede-lay` | 2 | |

### 7.5 Sahabah slugs

- `abu-bakr-al-siddiq`
- `umar-ibn-al-khattab`
- `uthman-ibn-affan`
- `ali-ibn-abi-talib`

---

## 8. Audio player behavior (Flutter parity)

Web: `src/context/AudioContext.tsx` + `AudioPlayerBar.tsx`

| Feature | Value |
|---------|-------|
| Single global player | Yes |
| Default volume | 0.8 |
| Speeds | 0.75, 1, 1.25, 1.5, 2 |
| On track end | Auto play next in playlist |
| UI | Fixed bottom bar |
| Kitab | Pass full `dersList` as playlist |
| Deep link | `?ders=N` selects & plays that ders |

Flutter packages (suggested): `just_audio` + `audio_service` (background), or `audioplayers`.

Resolve every `audioUrl` with the **raw** helper before play.

---

## 9. PDF behavior

Web: `KitabDetailClient.tsx`

- Show PDF beside / above audio (dual pane)
- Embed via iframe using **jsDelivr** PDF URL
- Download button uses resolved media URL
- Expand / fullscreen supported on web

Flutter: `pdfx` / `syncfusion_flutter_pdfviewer` / `webview_flutter` loading jsDelivr URL.

---

## 10. Live audio (honest status)

| Surface | Behavior |
|---------|----------|
| Home | Small **Stay Tuned / Coming Soon** strip — not live |
| Audio page | Coming Soon card only — **no fake LIVE room** |

When real live exists later: Telegram/TikTok-style weekly Qur’an & Hadith program on the site/app.

---

## 11. AI assistant (optional in Flutter v1)

| Layer | Detail |
|-------|--------|
| Local intents first | Navigate, play ders, what’s new, change language |
| Cloud fallback | Groq API via `POST /api/ai/ask` |
| Env | `GROQ_API_KEY` (server only) |
| Model (web) | `qwen/qwen3.6-27b` |

Flutter can call the same Netlify API, or port intent matcher offline.

---

## 12. SEO / site URL (web only; Flutter ignore mostly)

| Env | Purpose |
|-----|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical, sitemap, OG (default Netlify URL) |
| `GROQ_API_KEY` | AI chat |

Endpoints:

- `/sitemap.xml`
- `/robots.txt`

---

## 13. Production checklist for Flutter

1. **Theme:** dark default, red `#C52828` / `#DC2626`, grid bg, Noto + Amiri  
2. **Language:** am default, ar RTL, persist key `islamic-resources-language`  
3. **Media:** audio → GitHub raw; PDF → jsDelivr; encode paths  
4. **Data:** copy `kitabs` / `sahabah` / translations as JSON assets or API  
5. **Screens:** Home, Kitab list/detail, Audio, Muhadara, Video, Reminders, Knowledge, Sahabah, Contact  
6. **Player:** global mini-player + playlist + speed  
7. **Deep links:** `sileqelbachin://kitab/{slug}?ders=N` (and/or https App Links)  
8. **Honesty:** no fake live stream  
9. **Content rule:** never invent Qur’an/Hadith text  

---

## 14. Key source files (web reference)

```text
src/data/kitabs.ts              # All kitabs + ders URLs
src/data/sahabah.ts             # Four Khalifas
src/data/channelData.ts         # siteMetadata, SITE_URL
src/data/translations.ts        # UI strings AM/AR/EN
src/data/mediaStore.ts          # Audio/video/PDF catalog
src/lib/mediaUrl.ts             # Audio raw / PDF CDN rules
src/context/AudioContext.tsx    # Player state
src/context/LanguageContext.tsx # i18n
src/app/globals.css             # Colors + grid background
src/app/kitab/[slug]/KitabDetailClient.tsx  # PDF + audio UI
src/lib/aiIntentMatcher.ts      # Offline assistant actions
```

---

## 15. Suggested Flutter project layout

```text
lib/
  theme/app_colors.dart
  theme/app_theme.dart
  l10n/… 
  data/models/
  data/kitabs.json
  data/sahabah.json
  services/media_url_service.dart
  services/audio_player_service.dart
  screens/home/
  screens/kitab/
  screens/audio/
  …
```

---

## 16. Official “done” state of the website

As of this snapshot the website is considered **finished for web production** with:

- SEO (sitemap, robots, titles, OG, JSON-LD)
- Kitab dual pane + PDF + ders deep links
- Honest Stay Tuned (no fake live)
- AI that navigates / plays / switches language
- Media hosted on `sileqelbachin-media`
- Deployed on Netlify: https://sileqelbachin1.netlify.app/

**Next production step:** Flutter mobile app using this document as the single source of truth for design + media wiring.
