import type { Metadata } from 'next';
import { SITE_URL, siteMetadata, kitabsData, sahabahData } from '@/data/channelData';

/**
 * Brand + discovery keywords for Google Search Console / international SEO.
 * Includes Amharic queries that already convert, Latin spellings, and intent terms.
 */
export const SEO_KEYWORDS = [
  // Brand (Amharic — already ranking)
  'ስለ ቀልባችን',
  'ስለቀልባችን',
  // Brand (Latin / common misspellings)
  'sile qelbachin',
  'sileqelbachin',
  'seleqelbachin',
  'sle qelbachin',
  'sle_qelbachn1',
  'Sle Qelbachin',
  // Intent / international
  'islamic website ethiopia',
  'best islamic website',
  'islamic website ethiopia amharic',
  'asking question from website ethiopia',
  'ask islamic question ethiopia',
  'amharic islamic education',
  'quran tafsir amharic',
  'kitab audio ders',
] as const;

export const SITE_ALTERNATE_NAMES = [
  'ስለ ቀልባችን',
  'Sile Qelbachin',
  'Sileqelbachin',
  'Seleqelbachin',
  'Sle Qelbachin',
  'Sle_qelbachn1',
] as const;

export interface SitePage {
  path: string;
  name: string;
  nameAm: string;
  nameAr?: string;
  title: string;
  description: string;
  descriptionAm: string;
  descriptionAr?: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  sitelink: boolean;
}

export function getSitePageCopy(page: SitePage, language: string) {
  if (language === 'en') {
    return { name: page.name, description: page.description };
  }
  if (language === 'ar') {
    return {
      name: page.nameAr || page.nameAm,
      description: page.descriptionAr || page.descriptionAm,
    };
  }
  return { name: page.nameAm, description: page.descriptionAm };
}

/** Core pages Google should treat as sitelink candidates (header + schema + homepage). */
export const SITE_PAGES: SitePage[] = [
  {
    path: '/',
    name: 'Home',
    nameAm: 'መነሻ',
    title: 'ስለ ቀልባችን (Sile Qelbachin) — Best Islamic Website Ethiopia',
    description:
      'Sile Qelbachin (ስለ ቀልባችን) — Islamic educational website in Ethiopia. Qur’an tilawah & tafsir, kitab audio ders, da’wah, videos, and ask an Ustaz online.',
    descriptionAm:
      'ስለ ቀልባችን — በኢትዮጵያ የእስልምና ትምህርታዊ ድረ-ገጽ። ቁርኣን፣ ኪታብ፣ ዳዕዋ፣ ቪዲዮ እና ጥያቄ ለኡስታዝ በመስመር ላይ።',
    descriptionAr:
      'سله قيلباتشن — منصة تعليمية إسلامية في إثيوبيا: قرآن، كتب، دعوة، فيديو واسأل العالِم.',
    changeFrequency: 'weekly',
    priority: 1,
    sitelink: false,
  },
  {
    path: '/quran-recitation',
    name: 'Qur’an Recitation',
    nameAm: 'የቁርኣን ተላዋ እና ተፍሲር',
    nameAr: 'تلاوة القرآن والتفسير',
    title: 'Qur’an Tilawah & Tafsir',
    description: 'Qur’an tilawah with Amharic tafsir and audio lessons from Sle Qelbachin.',
    descriptionAm: 'የቁርኣን ቲላዋዎች ከአማርኛ ተፍሲር እና ከድምፅ ትምህርቶች ጋር።',
    descriptionAr: 'سلاسل تلاوة مكتملة وأرشيف استماع من سله قيلباتشن.',
    changeFrequency: 'weekly',
    priority: 0.95,
    sitelink: true,
  },
  {
    path: '/dawah',
    name: 'Da’wah',
    nameAm: 'ዳዕዋ',
    nameAr: 'الدعوة',
    title: 'Da’wah — Reminders & Audio (1 min+)',
    description: 'Heart reminders and audio lessons over 1 minute from Sle Qelbachin.',
    descriptionAm: 'ማስታወሻዎች እና ከ1 ደቂቃ በላይ የሆኑ የድምፅ ማብራሪያዎች።',
    descriptionAr: 'تذكيرات القلب ودروس صوتية أطول من دقيقة.',
    changeFrequency: 'weekly',
    priority: 0.9,
    sitelink: true,
  },
  {
    path: '/audio',
    name: 'Audio (alias)',
    nameAm: 'ድምጽ',
    nameAr: 'الصوتيات',
    title: 'Audio — Redirects to Da’wah',
    description: 'Alias route; content lives at /dawah.',
    descriptionAm: 'አማራጭ መንገድ — ይዘቱ በ /dawah ነው።',
    changeFrequency: 'yearly',
    priority: 0.2,
    sitelink: false,
  },
  {
    path: '/one-minute',
    name: '1-Minute Message',
    nameAm: 'የ1 ደቂቃ መልእክት',
    nameAr: 'رسالة دقيقة واحدة',
    title: '1-Minute Message',
    description: 'Video and audio under 1 minute — quick mobile reminders from Sle Qelbachin.',
    descriptionAm: 'ከ1 ደቂቃ በታች የሆኑ የቪዲዮ፣ የድምፅ እና የጽሑፍ ማስታወሻዎች።',
    descriptionAr: 'تذكيرات فيديو وصوت ونص أقل من دقيقة.',
    changeFrequency: 'daily',
    priority: 0.9,
    sitelink: true,
  },
  {
    path: '/videos',
    name: 'Videos',
    nameAm: 'የቪዲዮ ትምህርቶች',
    nameAr: 'دروس الفيديو',
    title: 'Video Lessons',
    description: 'Sequential video lessons and explanations from Sle Qelbachin.',
    descriptionAm: 'ተከታታይ የቪዲዮ ትምህርቶች እና ማብራሪያዎች።',
    descriptionAr: 'دروس فيديو متتابعة وشروح.',
    changeFrequency: 'weekly',
    priority: 0.9,
    sitelink: true,
  },
  {
    path: '/library',
    name: 'Library',
    nameAm: 'ቤተ-መጻሕፍት',
    nameAr: 'المكتبة',
    title: 'Library — Kitabs, PDFs & Notes',
    description: 'Kitab ders, downloadable PDFs, and written notes from Sle Qelbachin.',
    descriptionAm: 'የኪታብ ድርሶች፣ ሊወርዱ የሚችሉ PDFዎች እና የተጻፉ ማስታወሻዎች።',
    descriptionAr: 'دروس الكتب وملفات PDF ومذكرات مكتوبة.',
    changeFrequency: 'weekly',
    priority: 0.85,
    sitelink: true,
  },
  {
    path: '/questions',
    name: 'Questions & Answers',
    nameAm: 'ጥያቄ እና መልስ',
    nameAr: 'أسئلة وأجوبة',
    title: 'Questions & Answers — Youth Corner',
    description: 'Youth questions with real published answers — text, audio, or video.',
    descriptionAm: 'የወጣቶች ጥያቄዎችና እውነተኛ መልሶች — ጽሑፍ፣ ድምፅ ወይም ቪዲዮ።',
    descriptionAr: 'أسئلة الشباب وإجابات حقيقية — نص أو صوت أو فيديو.',
    changeFrequency: 'daily',
    priority: 0.9,
    sitelink: true,
  },
  {
    path: '/ask-question',
    name: 'Ask a Question',
    nameAm: 'ጥያቄዎን ያቅርቡ',
    nameAr: 'اطرح سؤالك',
    title: 'Ask an Islamic Question Online — Ethiopia | Sile Qelbachin',
    description:
      'Ask a question from the website in Ethiopia — reply by Telegram or Gmail. Sile Qelbachin (ስለ ቀልባችን) personal Ustaz guidance.',
    descriptionAm:
      'ከድረ-ገጹ ጥያቄ ይጠይቁ — መልስ በቴሌግራም ወይም በኢሜይል። ስለ ቀልባችን የግል የኡስታዝ መመሪያ።',
    descriptionAr:
      'اطرح سؤالك من الموقع — الإجابة عبر تيليجرام أو البريد. إرشاد شخصي من سله قيلباتشن.',
    changeFrequency: 'weekly',
    priority: 0.95,
    sitelink: true,
  },
  {
    path: '/marriage',
    name: 'Marriage & Love',
    nameAm: 'ጋብቻ እና ፍቅር',
    nameAr: 'الزواج والحب',
    title: 'Marriage & Love',
    description: 'Guidance on choosing a partner and love life in Islam.',
    descriptionAm: 'አጋር መምረጥና የፍቅር ሕይወት — የእስልምና መመሪያ።',
    descriptionAr: 'اختيار الشريك وحياة الحب وفق الإسلام.',
    changeFrequency: 'weekly',
    priority: 0.8,
    sitelink: true,
  },
  {
    path: '/articles',
    name: 'Articles',
    nameAm: 'ጽሑፎች',
    nameAr: 'مقالات',
    title: 'Articles — Healing the Heart',
    description: 'Short articles on healing the heart from Sle Qelbachin.',
    descriptionAm: 'ልብን ስለ ማከም አጫጭር ጽሑፎች።',
    descriptionAr: 'مقالات قصيرة في شفاء القلب.',
    changeFrequency: 'weekly',
    priority: 0.8,
    sitelink: true,
  },
  {
    path: '/contact',
    name: 'Contact',
    nameAm: 'ግንኙነት',
    nameAr: 'التواصل',
    title: 'Contact — Telegram, YouTube & TikTok',
    description:
      'Official Sle Qelbachin contact and verified social links: Telegram @Sle_qelbachn1, YouTube, and TikTok.',
    descriptionAm:
      'ይፋዊ የስለ ቀልባችን ግንኙነት እና የተረጋገጡ ማህበራዊ አድራሻዎች፦ ቴሌግራም @Sle_qelbachn1፣ ዩቲዩብ እና ቲክቶክ።',
    descriptionAr:
      'تواصل سله قيلباتشن الرسمي والروابط الموثقة: تليجرام ويوتيوب وتيك توك.',
    changeFrequency: 'yearly',
    priority: 0.5,
    sitelink: true,
  },
  // Classic aliases kept for sitemap/SEO but not primary sitelinks
  {
    path: '/kitab',
    name: 'Kitab',
    nameAm: 'ኪታብ',
    nameAr: 'الكتب',
    title: 'Kitab Library — Islamic Books & Audio Ders',
    description: 'Complete Sle Qelbachin kitab collection with audio lessons and PDF documents.',
    descriptionAm: 'የስለ ቀልባችን ሙሉ የኪታብ ስብስብ ከድምጽ ትምህርቶችና ከPDF ሰነዶች ጋር።',
    changeFrequency: 'weekly',
    priority: 0.5,
    sitelink: false,
  },
  {
    path: '/audio-lecture',
    name: 'Audio Lectures',
    nameAm: 'የድምፅ ትምህርቶች',
    nameAr: 'المحاضرات الصوتية',
    title: 'Audio Lectures — Islamic Ders & Archive',
    description: 'Recorded Islamic audio lectures and ders from Sle Qelbachin.',
    descriptionAm: 'ከስለ ቀልባችን የተቀረጹ የእስልምና የድምጽ ትምህርቶችንና ድርሶችን ያዳምጡ።',
    changeFrequency: 'weekly',
    priority: 0.5,
    sitelink: false,
  },
  {
    path: '/reminders',
    name: 'Reminders',
    nameAm: 'ማስታወሻዎች',
    nameAr: 'التذكيرات',
    title: 'Islamic Reminders — Daily Heart Advice',
    description: 'Short Qur’an, Hadith, and heart-purification reminders.',
    descriptionAm: 'ከቁርኣን፣ ከሐዲሥ እና የልብ ማጽዳት አጫጭር ማስታወሻዎች።',
    changeFrequency: 'weekly',
    priority: 0.4,
    sitelink: false,
  },
  {
    path: '/knowledge',
    name: 'Qur’an & Hadith',
    nameAm: 'ዕውቀት',
    nameAr: 'القرآن والحديث',
    title: 'Qur’an & Hadith Knowledge',
    description: 'Verified Qur’an verses and Hadith with Amharic explanation.',
    descriptionAm: 'የተረጋገጡ የቁርኣን አንቀጾችና ሐዲሶች ከአማርኛ ማብራሪያ ጋር።',
    changeFrequency: 'weekly',
    priority: 0.4,
    sitelink: false,
  },
  {
    path: '/sahabah',
    name: 'Sahabah',
    nameAm: 'የሶሓቦች ታሪክ',
    nameAr: 'قصص الصحابة',
    title: 'Sahabah Stories — Companions of the Prophet',
    description: 'Biographies and lessons from the Sahabah.',
    descriptionAm: 'የሶሓቦች ሕይወት ታሪክና ትምህርቶች።',
    changeFrequency: 'monthly',
    priority: 0.3,
    sitelink: false,
  },
  {
    path: '/muhadara',
    name: 'Muhadara',
    nameAm: 'ሙሓደራዎች',
    nameAr: 'المحاضرات',
    title: 'Muhadara — Islamic Discourses',
    description: 'Islamic discourses and muhadara audio lectures.',
    descriptionAm: 'የእስልምና ሙሓደራዎችና የድምጽ ትምህርቶች።',
    changeFrequency: 'weekly',
    priority: 0.3,
    sitelink: false,
  },
  {
    path: '/video-lecture',
    name: 'Video Lectures (legacy)',
    nameAm: 'ቪዲዮ ትምህርቶች',
    nameAr: 'المرئيات',
    title: 'Video Lectures — Legacy Route',
    description: 'Legacy video lecture route; prefer /videos.',
    descriptionAm: 'የቆየ የቪዲዮ መንገድ — /videos ይመረጣል።',
    changeFrequency: 'weekly',
    priority: 0.3,
    sitelink: false,
  },
];
export const SITELINK_PAGES = SITE_PAGES.filter((page) => page.sitelink);

export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (path === '/') return SITE_URL;
  return `${SITE_URL}${path}`;
}

export function getPageSeo(path: string): SitePage | undefined {
  return SITE_PAGES.find((page) => page.path === path);
}

export function pageMetadata(path: string, overrides: Metadata = {}): Metadata {
  const page = getPageSeo(path);
  const title = (typeof overrides.title === 'string' ? overrides.title : page?.title) || siteMetadata.channelName;
  const description = overrides.description || page?.description || siteMetadata.channelName;
  const canonical = path === '/' ? '/' : path;

  const { openGraph, twitter, alternates, keywords, ...rest } = overrides;

  return {
    title,
    description,
    keywords: keywords ?? [...SEO_KEYWORDS],
    alternates: { canonical, ...alternates },
    openGraph: {
      type: 'website',
      locale: 'am_ET',
      alternateLocale: ['en_US', 'ar'],
      siteName: 'Sile Qelbachin — ስለ ቀልባችን',
      images: [{ url: '/logo.jpg', width: 512, height: 512, alt: 'Sile Qelbachin — ስለ ቀልባችን' }],
      ...openGraph,
      title,
      description,
      url: absoluteUrl(path),
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/logo.jpg'],
      ...twitter,
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    ...rest,
  };
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: siteMetadata.channelName,
    alternateName: [...SITE_ALTERNATE_NAMES],
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/logo.jpg'),
      width: 512,
      height: 512,
    },
    image: absoluteUrl('/logo.jpg'),
    description:
      'Islamic educational platform in Ethiopia — Qur’an, kitab, da’wah, and ask-an-Ustaz (Sile Qelbachin / ስለ ቀልባችን).',
    areaServed: {
      '@type': 'Country',
      name: 'Ethiopia',
    },
    availableLanguage: ['am', 'ar', 'en'],
    sameAs: [siteMetadata.telegramUrl, siteMetadata.youtubeUrl, siteMetadata.tiktokUrl],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      url: absoluteUrl('/ask-question'),
      availableLanguage: ['am', 'ar', 'en'],
    },
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'Sile Qelbachin — ስለ ቀልባችን',
    alternateName: [...SITE_ALTERNATE_NAMES],
    url: SITE_URL,
    description:
      'Best Islamic educational website for Amharic speakers in Ethiopia. Qur’an tilawah, kitab ders, videos, and ask questions online.',
    inLanguage: ['am', 'ar', 'en'],
    keywords: SEO_KEYWORDS.join(', '),
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/ask-question`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** Netlify-style sitelink candidates — clear hub URLs Google can promote under the brand. */
export function buildSiteNavigationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}/#sitelinks`,
    name: 'Sile Qelbachin — main sections',
    numberOfItems: SITELINK_PAGES.length,
    itemListElement: SITELINK_PAGES.map((page, index) => ({
      '@type': 'SiteNavigationElement',
      position: index + 1,
      name: page.name,
      alternateName: [page.nameAm, page.nameAr].filter(Boolean),
      description: page.description,
      url: absoluteUrl(page.path),
    })),
  };
}

export function buildBreadcrumbJsonLd(crumbs: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function buildWebPageJsonLd(path: string, title: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: absoluteUrl(path),
    isPartOf: {
      '@type': 'WebSite',
      name: siteMetadata.channelName,
      url: SITE_URL,
    },
    inLanguage: 'am',
  };
}

export function buildKitabJsonLd(kitab: (typeof kitabsData)[number]) {
  const title = typeof kitab.title === 'string' ? kitab.title : kitab.title.am;
  const description =
    typeof kitab.description === 'string' ? kitab.description : kitab.description.am;
  const author = typeof kitab.author === 'string' ? kitab.author : kitab.author.am;
  const path = `/kitab/${kitab.slug}`;
  const cover =
    kitab.coverImage && kitab.coverImage.startsWith('http')
      ? kitab.coverImage
      : kitab.coverImage
        ? absoluteUrl(kitab.coverImage)
        : absoluteUrl('/logo.jpg');

  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: title,
    alternateName: typeof kitab.title === 'object' ? [kitab.title.ar, kitab.title.en] : undefined,
    description,
    author: { '@type': 'Person', name: author },
    url: absoluteUrl(path),
    image: cover,
    inLanguage: ['am', 'ar', 'en'],
    numberOfPages: kitab.dersCount,
    isPartOf: {
      '@type': 'WebSite',
      name: siteMetadata.channelName,
      url: SITE_URL,
    },
    hasPart: kitab.dersList.map((ders, index) => {
      const dersTitle = typeof ders.title === 'string' ? ders.title : ders.title.am;
      return {
        '@type': 'AudioObject',
        name: dersTitle,
        position: index + 1,
        url: absoluteUrl(`${path}?ders=${index + 1}`),
        encodingFormat: 'audio/mpeg',
      };
    }),
  };
}

export function buildKitabLibraryJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Sile Qelbachin Kitab Collection',
    itemListElement: kitabsData.map((kitab, index) => {
      const title = typeof kitab.title === 'string' ? kitab.title : kitab.title.am;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: title,
        url: absoluteUrl(`/kitab/${kitab.slug}`),
      };
    }),
  };
}

export function resolveCrumbs(pathname: string): { name: string; path: string }[] {
  const crumbs = [{ name: 'መነሻ', path: '/' }];
  if (pathname === '/') return crumbs;

  const kitabMatch = pathname.match(/^\/kitab\/([^/]+)/);
  if (kitabMatch) {
    const kitab = kitabsData.find((item) => item.slug === kitabMatch[1]);
    crumbs.push({ name: 'ኪታብ', path: '/kitab' });
    crumbs.push({
      name: kitab ? (typeof kitab.title === 'string' ? kitab.title : kitab.title.am) : kitabMatch[1],
      path: pathname.split('?')[0],
    });
    return crumbs;
  }

  const sahabahMatch = pathname.match(/^\/sahabah\/([^/]+)/);
  if (sahabahMatch) {
    const sahabah = sahabahData.find((item) => item.slug === sahabahMatch[1]);
    crumbs.push({ name: 'የሶሓቦች ታሪክ', path: '/sahabah' });
    crumbs.push({
      name: sahabah
        ? typeof sahabah.name === 'string'
          ? sahabah.name
          : sahabah.name.am
        : sahabahMatch[1],
      path: pathname.split('?')[0],
    });
    return crumbs;
  }

  const normalized =
    pathname === '/videos' ? '/video-lecture' : pathname === '/muhadera' ? '/muhadara' : pathname;
  const page = getPageSeo(normalized);
  crumbs.push({ name: page?.nameAm || page?.name || normalized, path: normalized });
  return crumbs;
}
