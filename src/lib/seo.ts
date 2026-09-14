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
      'Islamic educational platform with kitab collections, audio lessons, muhadara, and daily reminders from Sle Qelbachin.',
    descriptionAm:
      'ከቁርኣንና ከሐዲሥ ቀልባችንን የምናክምበትን ጥበብ በጋራ የምንፈልግበት የእስልምና ትምህርታዊ መድረክ።',
    changeFrequency: 'weekly',
    priority: 1,
    sitelink: false,
  },
  {
    path: '/kitab',
    name: 'Kitab',
    nameAm: 'ኪታብ',
    nameAr: 'الكتب',
    title: 'Kitab Library — Islamic Books & Audio Ders',
    description:
      'Complete Sle Qelbachin kitab collection with audio lessons and PDF documents: Intebih, Ad-Da wa Ad-Dawa, Fatihu Awliya, and more.',
    descriptionAm:
      'የስለ ቀልባችን ሙሉ የኪታብ ስብስብ ከድምጽ ትምህርቶችና ከPDF ሰነዶች ጋር፦ እንተብህ፣ አድ-ዳዋ ወአድ-ዳዋ፣ ፋቲሑ አውሊያ እና ሌሎችም።',
    descriptionAr:
      'مجموعة كتب سله قيلباتشن الكاملة مع الدروس الصوتية وملفات PDF: الانتباه، الداء والدواء، فاتح الأولياء وغيرها.',
    changeFrequency: 'weekly',
    priority: 0.9,
    sitelink: true,
  },
  {
    path: '/audio-lecture',
    name: 'Audio Lectures',
    nameAm: 'የድምፅ ትምህርቶች',
    nameAr: 'المحاضرات الصوتية',
    title: 'Audio Lectures — Islamic Ders & Archive',
    description:
      'Listen to recorded Islamic audio lectures and ders from Sle Qelbachin. Live audio sessions will open when announced.',
    descriptionAm:
      'ከስለ ቀልባችን የተቀረጹ የእስልምና የድምጽ ትምህርቶችንና ድርሶችን ያዳምጡ። የቀጥታ ስርጭት ሲዘጋጅ ይፋ ይደረጋል።',
    descriptionAr:
      'استمع إلى المحاضرات والدروس الصوتية المسجلة من سله قيلباتشن. البث المباشر يُعلن عند توفره.',
    changeFrequency: 'weekly',
    priority: 0.9,
    sitelink: true,
  },
  {
    path: '/reminders',
    name: 'Reminders',
    nameAm: 'ማስታወሻዎች',
    nameAr: 'التذكيرات',
    title: 'Islamic Reminders — Daily Heart Advice',
    description:
      'Short Qur’an, Hadith, and heart-purification reminders from Sle Qelbachin to strengthen iman and soften the heart.',
    descriptionAm:
      'ከቁርኣን፣ ከሐዲሥ እና የልብ ማጽዳት አጫጭር ማስታወሻዎች ከስለ ቀልባችን — እምነትን ለማጠንከርና ልብን ለማለስለስ።',
    descriptionAr:
      'تذكيرات قصيرة من القرآن والحديث وتزكية القلب لتقوية الإيمان وتليين القلب.',
    changeFrequency: 'weekly',
    priority: 0.8,
    sitelink: true,
  },
  {
    path: '/knowledge',
    name: 'Qur’an & Hadith',
    nameAm: 'ዕውቀት',
    nameAr: 'القرآن والحديث',
    title: 'Qur’an & Hadith Knowledge',
    description:
      'Verified Qur’an verses and Hadith with Amharic explanation from the Sle Qelbachin Islamic knowledge library.',
    descriptionAm:
      'ከስለ ቀልባችን የእስልምና ዕውቀት ቤተ-መጻሕፍት የተረጋገጡ የቁርኣን አንቀጾችና ሐዲሶች ከአማርኛ ማብራሪያ ጋር።',
    descriptionAr:
      'آيات قرآنية وأحاديث موثقة مع شرح بالأمهرية من مكتبة سله قيلباتشن.',
    changeFrequency: 'weekly',
    priority: 0.8,
    sitelink: true,
  },
  {
    path: '/sahabah',
    name: 'Sahabah',
    nameAm: 'የሶሓቦች ታሪክ',
    nameAr: 'قصص الصحابة',
    title: 'Sahabah Stories — Companions of the Prophet',
    description:
      'Biographies and lessons from the Sahabah, the companions of the Prophet ﷺ, presented by Sle Qelbachin.',
    descriptionAm:
      'የሶሓቦች፣ የነቢዩ ﷺ ጓደኞች፣ ሕይወት ታሪክና ትምህርቶች በስለ ቀልባችን የቀረቡ።',
    descriptionAr:
      'سير ودروس من الصحابة رضوان الله عليهم يقدمها سله قيلباتشن.',
    changeFrequency: 'monthly',
    priority: 0.7,
    sitelink: true,
  },
  {
    path: '/muhadara',
    name: 'Muhadara',
    nameAm: 'ሙሓደራዎች',
    nameAr: 'المحاضرات',
    title: 'Muhadara — Islamic Discourses',
    description:
      'Islamic discourses and muhadara audio lectures from the Sle Qelbachin archive, organized for listening and download.',
    descriptionAm:
      'ከስለ ቀልባችን ማህደር የእስልምና ሙሓደራዎችና የድምጽ ትምህርቶች፤ ለማዳመጥና ለማውረድ የተደራጁ።',
    descriptionAr:
      'محاضرات إسلامية من أرشيف سله قيلباتشن منظمة للاستماع والتحميل.',
    changeFrequency: 'weekly',
    priority: 0.8,
    sitelink: true,
  },
  {
    path: '/video-lecture',
    name: 'Videos',
    nameAm: 'ቪዲዮዎች',
    nameAr: 'المرئيات',
    title: 'Video Lectures — Islamic Video Lessons',
    description:
      'Watch Islamic video lectures from Sle Qelbachin, including lessons shared on YouTube, TikTok, and Telegram.',
    descriptionAm:
      'ከስለ ቀልባችን የእስልምና የቪዲዮ ትምህርቶችን ይመልከቱ፤ በዩቲዩብ፣ ቲክቶክ እና ቴሌግራም የተጋሩትን ጨምሮ።',
    descriptionAr:
      'شاهد الدروس المرئية الإسلامية من سله قيلباتشن على يوتيوب وتيك توك وتليجرام.',
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
