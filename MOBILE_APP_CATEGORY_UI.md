# Mobile App — Category & UI Fit Guide (Client Spec)

**Product:** ስለ ቀልባችን / **Sile Qelbachin**  
**Purpose:** Exact website category structure + UI rules so the **mobile app matches the website** — same groups, labels, order, icons, and content sources.  
**Source of truth (code):** `src/config/siteNav.ts`  
**Live website:** https://sileqelbachin1.com  
**Admin CMS (published API):** https://admin.sileqelbachin1.com/api/public/v1  
**Media:** Cloudflare R2 only (`CLOUDFLARE_R2.md`)  
**Updated:** 2026-10-07  

> Older `FLUTTER_HANDOFF.md` (2026-09) describes an earlier IA (Kitab / Muhadara / Knowledge first). **This document wins** for navigation, home sections, and category labels.  
> **How Admin / Supabase / Render / Cloudflare feed this UI:** `HOW_ADMIN_CONNECTS.md` (content pipeline unchanged — only shell layout is app/website code).

---

## 0. Non‑negotiable client rules

1. **Two nav groups only** — not a flat list of old pages.
   - **Educational Archive** (ትምህርታዊ ማህደር)
   - **Youth & Heart Corner** (ወጣቶች እና ልብ) — group heading only; **no** `/youth` screen
2. **Ask a Question** is a primary CTA (header + home), not buried in a menu.
3. **Languages:** Amharic (`am`) default UX, Arabic (`ar`) RTL, English (`en`). Every label is `{ am, ar, en }`.
4. **No emoji as icons** — use geometric brand icons (red `#A91F24`). Website: `src/components/icons/SiteIcons.tsx`.
5. **No mock speaker names** on audio rows (do not invent “ኡስታዝ … · Muhadara”). Show title; speaker only if CMS provides a real byline.
6. **Published only** — mobile reads Admin public API (`status=published`). Drafts never appear.
7. **Do not invent religious content** — only what Admin / R2 / CMS returns.
8. PDFs must **open**, **download**, and **share** (share a clean app deep link or the file — never a double‑encoded R2 URL).

---

## 1. Information architecture (exact)

```text
Home
 ├─ Daily · Priority  (FIRST — 4 medium cards in one row)
 │   ├─ Qur’an                      → /quran-recitation
 │   ├─ Azan                        → /daily/azan
 │   ├─ Athkar (Athzan)             → /daily/athkar
 │   └─ Qibla                       → /daily/qibla
 │
 ├─ Educational Archive  (NEXT — medium cards, 4 across)
 │   ├─ Qur’an Tilawah & Tafsir     → /quran-recitation
 │   ├─ Audio Lessons               → /dawah
 │   ├─ 1-Minute Messages           → /one-minute
 │   ├─ Video Lessons               → /videos
 │   └─ Library                     → /library
 │       ├─ Kitab
 │       ├─ PDF
 │       └─ Reminders (notes)
 │
 ├─ Youth & Heart Corner   (group title only)
 │   ├─ Questions & Answers         → /questions
 │   ├─ Marriage & Love             → /marriage
 │   └─ Articles                    → /articles
 │
 ├─ Ask a Question                  → /ask-question
 └─ Contact                         → /contact
```

**Mobile-only priority rule:** Daily tools (Qur’an · Azan · Athkar · Qibla) rank **first on the app Home**. They are **not** on the public website home — do not change the Next.js site for this.

### Mobile bottom nav (recommended)

| Slot | Screen | Notes |
|------|--------|--------|
| 1 | **Home** | App section order (§3) — Daily first, then archive/content |
| 2 | **Archive** | Grid/list of the 5 Educational Archive items |
| 3 | **Youth** | Grid/list of the 3 Youth & Heart items (not a single youth feed) |
| 4 | **Ask** | Ask Question flow |
| 5 | **More** | Contact, language, theme, auth |

Drawer/hamburger should still list both groups with the exact labels below.

---

## 2. Category labels (copy exactly)

### Group A — Educational Archive

| id | route | icon key | EN | AM | AR |
|----|-------|----------|----|----|-----|
| `quran` | `/quran-recitation` | `quran` | Qur’an Tilawah & Tafsir | የቁርኣን ተላዋ እና ተፍሲር | تلاوة القرآن والتفسير |
| `audio` | `/dawah` | `audio` | Audio Lessons | የድምፅ ትምህርቶች | دروس صوتية |
| `oneMinute` | `/one-minute` | `oneMinute` | 1-Minute Messages | የ1 ደቂቃ መልእክቶች | رسائل الدقيقة |
| `videos` | `/videos` | `videos` | Video Lessons | የቪዲዮ ትምህርቶች | دروس فيديو |
| `library` | `/library` | `library` | Library | ቤተ-መጽሐፍት | المكتبة |

**Descriptions (subtitle under each card):**

| id | EN | AM | AR |
|----|----|----|-----|
| quran | Qur’an tilawah with Amharic tafsir and audio lessons. | የቁርኣን ቲላዋዎች ከአማርኛ ተፍሲር እና ከድምፅ ትምህርቶች ጋር። | تلاوات القرآن مع التفسير الأمھري والدروس الصوتية. |
| audio | Audio explanations and sequential lessons | የድምፅ ማብራሪያዎች እና ተከታታይ ትምህርቶች | شروح ودروس صوتية أطول من دقيقة |
| oneMinute | Quick video and audio notes under 1 minute | ከ1 ደቂቃ በታች የሆኑ ፈጣን የቪዲዮ እና የድምፅ ማስታወሻዎች | فيديو وصوت سريع أقل من دقيقة |
| videos | Sequential video lessons and explanations | ተከታታይ የቪዲዮ ትምህርቶች እና ማብራሪያዎች | دروس فيديو متتابعة أطول من دقيقة |
| library | Kitabs, PDF files, notes, and books | ኪታቦች፣ የPDF ፋይሎች፣ ማስታወሻዎች እና መጻሕፍት | كتب وملفات PDF ومذكرات |

### Group B — Youth & Heart Corner

| id | route | icon key | EN | AM | AR |
|----|-------|----------|----|----|-----|
| `questions` | `/questions` | `questions` | Questions & Answers | ጥያቄ እና መልስ | أسئلة وأجوبة |
| `marriage` | `/marriage` | `marriage` | Marriage & Love | ጋብቻ እና ፍቅር | الزواج والحب |
| `articles` | `/articles` | `articles` | Articles | ጽሑፎች | مقالات |

**Descriptions:**

| id | EN | AM | AR |
|----|----|----|-----|
| questions | Answered questions — in text, audio, and video | የተመልሱ ጥያቄዎች — በጽሑፍ፣ በድምፅ እና በቪዲዮ | أسئلة مجابة — نصاً وصوتاً وفيديو |
| marriage | Choosing a spouse and love life in Islam | የትዳር አጋር መረጣ እና የፍቅር ሕይወት በእስልምና | اختيار الشريك وحياة الحب في الإسلام |
| articles | Short educational writings that soften the heart | ልብን የሚያለሰልሱ አጫጭር ትምህርታዊ ጽሑፎች | مقالات تعليمية قصيرة ترقق القلب |

### Ask CTA

| EN | AM | AR | route |
|----|----|----|-------|
| Ask a Question | ጥያቄዎን ያቅርቡ | اطرح سؤالاً | `/ask-question` |

### Group titles

| | EN | AM | AR |
|--|----|----|-----|
| Archive | Educational Archive | ትምህርታዊ ማህደር | الأرشيف التعليمي |
| Youth | Youth & Heart Corner | ወጣቶች እና ልብ | ركن الشباب والقلب |

---

## 3. App Home screen — section order (mobile)

Implement **this order** top → bottom in the **Flutter/mobile app**. Daily priority is **app-only** (not the website).

| # | Section | Mobile UI | Data |
|---|---------|-----------|------|
| 1 | Hero | Brand + name **ስለ ቀልባችን** | Static + locale |
| 2 | **Daily · Priority** | **4 medium cards in one row** (2×2 on narrow): Qur’an · Azan · Athkar · Qibla | App-local screens / APIs |
| 3 | Purpose blurb | Short | `siteMetadata` |
| 4 | Educational Archive | **Medium cards, 4 across** (5th wraps) | `EDUCATIONAL_ARCHIVE` |
| 5 | Qur’an deeper intro | Optional strip → Tilawah | CMS / static |
| 6 | Featured articles / reminders | Titles only | CMS reminders/articles |
| 7 | Marriage banner | After daily + archive | `/marriage` |
| 8 | Three featured kitabs | Carousel / 3 cards | `GET kitabs` |
| 9 | Intebih intro series | 7 parts | Kitab slug |
| 10 | Popular / featured audio | Rows + player | `GET audio` |
| 11 | 1-Minute + Videos teasers | | CMS |
| 12 | Youth & Heart | 3 cards | `YOUTH_HEART_CORNER` |
| 13 | Featured Q&A | Up to 4 | `GET questions` |
| 14 | Social / contact | | `siteMetadata` |

**Daily + Archive card UI (medium — 4 in one row on app Home):**

```text
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ [icon]   │ │ [icon]   │ │ [icon]   │ │ [icon]   │
│ Title    │ │ Title    │ │ Title    │ │ Title    │
│ Subtitle │ │ Subtitle │ │ Subtitle │ │ Subtitle │
│ Open →   │ │ Open →   │ │ Open →   │ │ Open →   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

- Grid: `2 cols` phone → `4 cols` on wider phones/tablets.
- Min height ~7.5–8.25rem; padding ~14–16px; icon in soft red tile.
- Icon color: brand red `#A91F24`. **No emoji.**
- Daily routes (app): Qur’an → tilawah screen; Azan / Athkar / Qibla → dedicated daily screens (implement in Flutter; not required on the website).

---

## 4. Screen specs (UI fit per category)

### 4.1 Qur’an Tilawah (`/quran-recitation`)

- List of recitations / tafsir audio from `GET quran-recitations`.
- Row: title + play; optional duration.
- Persistent bottom audio bar when playing.

### 4.2 Audio Lessons / Da’wah (`/dawah`)

**Tabs (exact):**

1. **Reminders** — same reminder feed as Library notes / home titles  
2. **Audio** — lessons **≥ 1 minute** (short clips belong in 1-Minute)

Audio row UI:

```text
[▶]  Title (filename/CMS title)
     [optional real byline only]
     CATEGORY · duration
```

- **Do not** show fake “Muhadara” speaker under every track.
- Search filters title (and byline if present).
- Sort longer first when duration known.

### 4.3 1-Minute Messages (`/one-minute`)

- Vertical / TikTok-style short feed **or** list of clips **&lt; 60s**.
- Source: `GET one-minute`.
- Share + open in-app player.

### 4.4 Video Lessons (`/videos`)

- List/grid of published videos (`GET video`).
- Full-screen or modal player; share sheet.
- Duration &gt; 1 minute preferred for this screen (shorts → 1-Minute).

### 4.5 Library (`/library`)

**Tabs (exact):**

| Tab | Content |
|-----|---------|
| **Kitab** | Book cards → detail with ders playlist + PDF |
| **PDF** | All published PDFs (CMS + kitabs); default tab on web |
| **Reminders** | Same reminders as Da’wah |

PDF card UI:

```text
[PDF icon]          [Share] [Download]
Title
date / meta
Open PDF        Download
```

- Open = in-app viewer / external.
- Download = save file (handle Amharic/Arabic filenames — ASCII fallback in headers if needed).
- Share = app deep link like `sileqelbachin://library?tab=pdf&pdf={id}` **or** share file via system share; never broken `%25` R2 links.

Kitab detail:

- Cover, title, author, ders list, play all.
- Deep link: `/kitab/{slug}?ders={1-based}` → preserve in app.

### 4.6 Questions & Answers (`/questions`)

- Search + list of answered Q&A (`GET questions`).
- Item can have text / audio / video answer.
- Featured items first (`featured` then `priority`).
- CTA: **Ask a Question**.

### 4.7 Marriage & Love (`/marriage`)

- Topics from `GET marriage` (Admin Youth content).
- Banner + Ask CTA always available.
- Same card language as Articles (soft heart / rings icon).

### 4.8 Articles (`/articles`)

- Short writings from `GET articles` (and/or published reminders treated as articles on home).
- Title-first lists; open detail with body AM/AR/EN.

### 4.9 Ask a Question (`/ask-question`)

- Requires auth (website: login if needed).
- Form → Admin inbox; reply by email.
- Keep brand red primary button.

### 4.10 Contact

| Platform | Handle | URL |
|----------|--------|-----|
| Telegram | `@Sle_qelbachn1` | https://t.me/Sle_qelbachn1 |
| YouTube | `@sle_qelbachn1` | https://youtube.com/@sle_qelbachn1 |
| TikTok | `@sle_qelbachn1` | https://www.tiktok.com/@sle_qelbachn1 |

---

## 5. Design tokens (match website)

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| Brand red | `#A91F24` | `#DC2626` | Primary CTA, icons, accents |
| Brand red deep | `#8F171C` | `#B91C1C` | Pressed |
| Gold accent | `#D4AF37` / `#B8860B` | same | Tab active borders, share chips |
| Text | `#111827` | `#F3F4F6` | Titles |
| Muted | `#6B7280` | `#A3A3A3` | Subtitles |
| Page bg | `#FCFCFD` + light grid | `#0F0F10` + dark grid | Screen background |
| Card | `#FFFFFF` | `#18181C` | Lists / category cards |
| Border | `#E5E7EB` | `#27272A` | Dividers |

- Card radius ≈ **16–20px**
- Bottom player clearance ≈ **96–112px**
- Fonts: **Noto Sans Ethiopic** (AM/EN UI), **Amiri** for Arabic body (RTL)

### Theme

Website supports light + dark. Mobile should too; default can follow system. Grid / smoke background preferred over flat white (client asked for atmosphere).

### Icons to implement (names)

`quran` · `audio` · `oneMinute` · `videos` · `library` · `questions` · `marriage` · `articles` · `ask` · `home` · `contact` · `heart` · `telegram` · `youtube` · `tiktok`

Reference SVGs: `src/components/icons/SiteIcons.tsx` (port paths 1:1).

---

## 6. Public API (mobile must use)

**Base:** `https://admin.sileqelbachin1.com/api/public/v1`  
(Website proxies via `/api/cms` — mobile can call Admin public API directly.)

| Resource | Path | Used by |
|----------|------|---------|
| Kitabs | `GET /kitabs` | Home, Library |
| Audio | `GET /audio` | Da’wah audio, home featured |
| Video | `GET /video` | Videos |
| PDFs | `GET /pdfs` | Library PDF tab |
| Reminders | `GET /reminders` | Da’wah + Library notes + home titles |
| One-minute | `GET /one-minute` | 1-Minute |
| Qur’an | `GET /quran-recitations` | Qur’an screen |
| Articles | `GET /articles` | Articles |
| Marriage | `GET /marriage` | Marriage |
| Questions | `GET /questions` | Q&A |

**Response shape (typical):**

```json
{ "ok": true, "source": "supabase", "count": N, "data": [ /* rows */ ] }
```

**Localization field pattern:**

```json
"title": { "am": "...", "ar": "...", "en": "..." }
```

Pick like website `pickCmsLoc`: prefer current language, then `en`, then `am`/`ar`.

**Featured ordering (home):**

1. `featured === true` first  
2. then lower `priority` (1 = highest)  
3. then recency  

**Media URLs:** must be R2 `https://pub-….r2.dev/sileqelbachin-meadia/...` (or already resolved). Never invent Cloudinary.

---

## 7. Legacy routes (keep as aliases, not primary nav)

Still valid deep links / redirects — **do not put in main bottom nav**:

| Legacy | Prefer |
|--------|--------|
| `/kitab`, `/kitab/{slug}` | Library → Kitab |
| `/muhadara`, `/muhadera` | Audio Lessons |
| `/audio-lecture` | Audio Lessons |
| `/video-lecture` | Video Lessons |
| `/reminders` | Da’wah Reminders / Articles titles |
| `/knowledge`, `/sahabah` | Optional More menu if still needed |

---

## 8. Shared chrome (header / footer → mobile)

### Header (website → app top bar)

- Logo circle + **ስለ ቀልባችን**
- Language `AM | AR | EN`
- Theme toggle
- Auth avatar
- Red **Ask a Question** button

### Footer / More screen

- Same two category groups with icons
- Social: Telegram, YouTube, TikTok (coded icons)
- Copyright + blessing line

### Global audio player

- Fixed bottom bar: title, optional byline, seek, prev/pause/next
- Hides byline when empty (no placeholder names)

---

## 9. Acceptance checklist (mobile = website)

- [ ] Nav has **exactly** two groups with the labels in §2  
- [ ] Youth is a **group**, not its own content page  
- [ ] Home section order matches §3  
- [ ] Archive shows **5** cards; Youth shows **3**  
- [ ] Icons are coded SVGs (brand red), **not emoji**  
- [ ] Audio list has **no fake speaker** strings  
- [ ] Library has Kitab / PDF / Reminders tabs; PDFs all load from CMS  
- [ ] PDF download + share work with Amharic/Arabic titles  
- [ ] Ask Question is primary CTA  
- [ ] All feeds use **published** public API + R2 URLs  
- [ ] AM / AR (RTL) / EN labels match tables  

---

## 10. Files to mirror when coding Flutter / mobile

| Concern | Website file |
|---------|----------------|
| Categories & labels | `src/config/siteNav.ts` |
| Icons | `src/components/icons/SiteIcons.tsx` |
| Daily priority (4) | **App-only** — Qur’an · Azan · Athkar · Qibla (this doc §1 / §3; not on website) |
| Home layout (archive/youth) | `src/app/page.tsx` (website order differs; app inserts Daily first) |
| CMS client | `src/lib/cmsClient.ts` |
| PDF download/share | `src/lib/downloadUrl.ts`, `src/components/ShareSheet.tsx`, `src/app/api/download/route.ts` |
| Library tabs | `src/app/library/page.tsx` |
| Da’wah tabs | `src/app/dawah/page.tsx` |
| Brand CSS | `src/app/globals.css` (`--brand-red`) |
| R2 | `CLOUDFLARE_R2.md` |
| Admin → apps pipeline | `admincn-1.0.0/docs/admin/CMS-WEBSITE-MOBILE-WORKFLOW.md` |

---

## 11. One-line product promise

**Mobile app = same Educational Archive + Youth categories and CMS/R2 as https://sileqelbachin1.com, plus app-only Daily priority (Qur’an · Azan · Athkar · Qibla) first on Home.**
