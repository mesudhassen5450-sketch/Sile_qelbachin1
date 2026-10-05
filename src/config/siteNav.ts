/**
 * Client category architecture for Sile Qelbachin.
 * Youth & Heart Corner is a group heading — not its own page.
 * Old routes (/kitab, /dawah, /reminders, …) stay live as aliases.
 */

import type { SiteIconName } from '@/components/icons/SiteIcons'

export type NavLink = {
  href: string
  label: { en: string; am: string; ar: string }
  description: { en: string; am: string; ar: string }
  /** Optional dedicated CTA line for home archive cards */
  cta?: { en: string; am: string; ar: string }
  /** Hand-coded SVG icon key (header / footer / home) */
  icon: SiteIconName
}

export type NavSection = {
  id: string
  title: { en: string; am: string; ar: string }
  items: NavLink[]
}

/** Educational Archive — main content pages */
export const EDUCATIONAL_ARCHIVE: NavLink[] = [
  {
    href: '/quran-recitation',
    icon: 'quran',
    label: {
      en: 'Qur’an Tilawah & Tafsir',
      am: 'የቁርኣን ተላዋ እና ተፍሲር',
      ar: 'تلاوة القرآن والتفسير',
    },
    description: {
      en: 'Qur’an tilawah with Amharic tafsir and audio lessons.',
      am: 'የቁርኣን ቲላዋዎች ከአማርኛ ተፍሲር እና ከድምፅ ትምህርቶች ጋር።',
      ar: 'تلاوات القرآن مع التفسير الأمھري والدروس الصوتية.',
    },
    cta: {
      en: 'Go to Qur’an Tilawah →',
      am: 'ወደ ቁርኣን ተላዋ ይሂዱ →',
      ar: 'اذهب إلى تلاوة القرآن →',
    },
  },
  {
    href: '/dawah',
    icon: 'audio',
    label: {
      en: 'Audio Lessons',
      am: 'የድምፅ ትምህርቶች',
      ar: 'دروس صوتية',
    },
    description: {
      en: 'Audio explanations and sequential lessons',
      am: 'የድምፅ ማብራሪያዎች እና ተከታታይ ትምህርቶች',
      ar: 'شروح ودروس صوتية أطول من دقيقة',
    },
    cta: {
      en: 'Go to audio lessons →',
      am: 'ወደ ድምፅ ትምህርቶች ይሂዱ →',
      ar: 'اذهب إلى الدروس الصوتية →',
    },
  },
  {
    href: '/one-minute',
    icon: 'oneMinute',
    label: {
      en: '1-Minute Messages',
      am: 'የ1 ደቂቃ መልእክቶች',
      ar: 'رسائل الدقيقة',
    },
    description: {
      en: 'Quick video and audio notes under 1 minute',
      am: 'ከ1 ደቂቃ በታች የሆኑ ፈጣን የቪዲዮ እና የድምፅ ማስታወሻዎች',
      ar: 'فيديو وصوت سريع أقل من دقيقة',
    },
    cta: {
      en: 'Go to 1-minute messages →',
      am: 'ወደ 1 ደቂቃ መልእክቶች ይሂዱ →',
      ar: 'اذهب إلى رسائل الدقيقة →',
    },
  },
  {
    href: '/videos',
    icon: 'videos',
    label: {
      en: 'Video Lessons',
      am: 'የቪዲዮ ትምህርቶች',
      ar: 'دروس فيديو',
    },
    description: {
      en: 'Sequential video lessons and explanations',
      am: 'ተከታታይ የቪዲዮ ትምህርቶች እና ማብራሪያዎች',
      ar: 'دروس فيديو متتابعة أطول من دقيقة',
    },
    cta: {
      en: 'Go to video lessons →',
      am: 'ወደ ቪዲዮ ትምህርቶች ይሂዱ →',
      ar: 'اذهب إلى دروس الفيديو →',
    },
  },
  {
    href: '/library',
    icon: 'library',
    label: {
      en: 'Library',
      am: 'ቤተ-መጽሐፍት',
      ar: 'المكتبة',
    },
    description: {
      en: 'Kitabs, PDF files, notes, and books',
      am: 'ኪታቦች፣ የPDF ፋይሎች፣ ማስታወሻዎች እና መጻሕፍት',
      ar: 'كتب وملفات PDF ومذكرات',
    },
    cta: {
      en: 'Go to library →',
      am: 'ወደ ቤተ-መጽሐፍት ይሂዱ →',
      ar: 'اذهب إلى المكتبة →',
    },
  },
]

/** Youth & Heart Corner — group only (no /youth page) */
export const YOUTH_HEART_CORNER: NavLink[] = [
  {
    href: '/questions',
    icon: 'questions',
    label: {
      en: 'Questions & Answers',
      am: 'ጥያቄ እና መልስ',
      ar: 'أسئلة وأجوبة',
    },
    description: {
      en: 'Answered questions — in text, audio, and video',
      am: 'የተመልሱ ጥያቄዎች — በጽሑፍ፣ በድምፅ እና በቪዲዮ',
      ar: 'أسئلة مجابة — نصاً وصوتاً وفيديو',
    },
  },
  {
    href: '/marriage',
    icon: 'marriage',
    label: {
      en: 'Marriage & Love',
      am: 'ጋብቻ እና ፍቅር',
      ar: 'الزواج والحب',
    },
    description: {
      en: 'Choosing a spouse and love life in Islam',
      am: 'የትዳር አጋር መረጣ እና የፍቅር ሕይወት በእስልምና',
      ar: 'اختيار الشريك وحياة الحب في الإسلام',
    },
  },
  {
    href: '/articles',
    icon: 'articles',
    label: {
      en: 'Articles',
      am: 'ጽሑፎች',
      ar: 'مقالات',
    },
    description: {
      en: 'Short educational writings that soften the heart',
      am: 'ልብን የሚያለሰልሱ አጫጭር ትምህርታዊ ጽሑፎች',
      ar: 'مقالات تعليمية قصيرة ترقق القلب',
    },
  },
]

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'educational',
    title: {
      en: 'Educational Archive',
      am: 'ትምህርታዊ ማህደር',
      ar: 'الأرشيف التعليمي',
    },
    items: EDUCATIONAL_ARCHIVE,
  },
  {
    id: 'youth',
    title: {
      en: 'Youth & Heart Corner',
      am: 'ወጣቶች እና ልብ',
      ar: 'ركن الشباب والقلب',
    },
    items: YOUTH_HEART_CORNER,
  },
]

export const ASK_QUESTION = {
  href: '/ask-question',
  icon: 'ask' as SiteIconName,
  label: {
    en: 'Ask a Question',
    am: 'ጥያቄዎን ያቅርቡ',
    ar: 'اطرح سؤالاً',
  },
}

/** Homepage preview cards (order matches client concept) */
export const HOME_PREVIEWS = [...EDUCATIONAL_ARCHIVE, ...YOUTH_HEART_CORNER]
