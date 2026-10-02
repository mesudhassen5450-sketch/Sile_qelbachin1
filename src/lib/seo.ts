import type { Metadata } from 'next';
import { SITE_URL, siteMetadata, kitabsData, sahabahData } from '@/data/channelData';

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
    title: 'ስለ ቀልባችን — Islamic Educational Channel',
    description:
      'Islamic educational platform with Qur’an, da’wah, videos, library, and youth Q&A from Sle Qelbachin.',
    descriptionAm:
      'ከቁርኣንና ከሐዲሥ ቀልባችንን የምናክምበትን ጥበብ በጋራ የምንፈልግበት የእስልምና ትምህርታዊ መድረክ።',
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

  const { openGraph, twitter, alternates, ...rest } = overrides;

  return {
    title,
    description,
    alternates: { canonical, ...alternates },
    openGraph: {
      type: 'website',
      locale: 'am_ET',
      siteName: siteMetadata.channelName,
      images: [{ url: '/logo.jpg', alt: siteMetadata.channelName }],
      ...openGraph,
      title,
      description,
      url: absoluteUrl(path),
    },
    twitter: {
      card: 'summary',
      images: ['/logo.jpg'],
      ...twitter,
      title,
      description,
    },
    ...rest,
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteMetadata.channelName,
    alternateName: ['Sle Qelbachin', 'Sile Qelbachin', 'ስለ ቀልባችን'],
    url: SITE_URL,
    inLanguage: ['am', 'ar', 'en'],
    publisher: {
      '@type': 'Organization',
      name: siteMetadata.channelName,
      url: SITE_URL,
      logo: absoluteUrl('/logo.jpg'),
      sameAs: [siteMetadata.telegramUrl, siteMetadata.youtubeUrl, siteMetadata.tiktokUrl],
    },
  };
}

export function buildSiteNavigationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Main navigation',
    itemListElement: SITELINK_PAGES.map((page, index) => ({
      '@type': 'SiteNavigationElement',
      position: index + 1,
      name: page.nameAm,
      description: page.descriptionAm,
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
