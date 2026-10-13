# Google Search Console — indexing checklist (Sile Qelbachin)

**Site:** https://sileqelbachin1.com  
**Sitemap:** https://sileqelbachin1.com/sitemap.xml  
**Robots:** https://sileqelbachin1.com/robots.txt

## Target keywords

| Keyword | Notes |
|---------|--------|
| ስለ ቀልባችን / ስለቀልባችን | Already ranking (Amharic) |
| sile qelbachin / sileqelbachin / seleqelbachin | Latin brand spellings |
| islamic website ethiopia | International intent |
| best islamic website | Competitive intent |
| asking question from website ethiopia | Ask path — `/ask-question` |

## After deploy

1. **Search Console → Sitemaps** → submit `https://sileqelbachin1.com/sitemap.xml` (if not already).
2. **URL Inspection** → request indexing for hubs:
   - `/`
   - `/ask-question`
   - `/quran-recitation`
   - `/library`
   - `/questions`
   - `/dawah`
   - `/one-minute`
   - `/videos`
   - `/contact`
3. **Pages → Not indexed** → expand the 6 reasons; soft-404 / crawled-not-indexed on old `?ders=` URLs can be ignored after this sitemap cleanup.
4. Wait days–weeks for sitelinks (Google chooses them; we only structure the site like Netlify).

## What the code does

- Keywords + Amharic/Latin brand names in `<meta>` and JSON-LD  
- `Organization` + `WebSite` + `SiteNavigationElement` sitelink list  
- Clean sitemap (no `?ders=` query spam)  
- Per-hub page metadata layouts  
- Home “Explore” grid with ↗ links  

Sitelinks with arrows in Google SERP (like Netlify) are **Google’s UI** — they appear when the site has clear hubs, titles, and strong brand searches.
