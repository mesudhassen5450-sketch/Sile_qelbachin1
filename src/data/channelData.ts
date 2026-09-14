import { LocalizedString } from '@/context/LanguageContext';
import { kitabsData } from './kitabs';

export { kitabsData };

export interface Ders {
  id: string;
  title: string | LocalizedString;
  speaker: string | LocalizedString;
  duration: string;
  audioUrl: string;
  kitabId?: string;
  kitabTitle?: string | LocalizedString;
}

export type AudioTrack = Ders;

export interface Kitab {
  slug: string;
  title: string | LocalizedString;
  author: string | LocalizedString;
  category: string | LocalizedString;
  coverImage?: string;
  coverBg?: string;
  pdfUrl?: string;
  pdfSize?: string;
  dersCount: number;
  description: string | LocalizedString;
  dersList: Ders[];
}

export interface Muhadara {
  id: string;
  title: string | LocalizedString;
  speaker: string | LocalizedString;
  topic: string | LocalizedString;
  duration: string;
  date: string;
  audioUrl: string;
}

export interface VideoItem {
  id: string;
  title: string | LocalizedString;
  speaker: string | LocalizedString;
  platform: 'tiktok' | 'youtube' | 'telegram';
  videoUrl: string;
  thumbnailUrl: string;
  views?: string;
}

export interface Reminder {
  id: string;
  title: string | LocalizedString;
  content: string | LocalizedString;
  source: string | LocalizedString;
  category: string;
  type: 'hadith' | 'quran' | 'reflection' | 'advice';
}

export interface KnowledgeItem {
  id: string;
  category: 'quran' | 'hadith' | 'lesson' | 'reflection';
  title?: string | LocalizedString;
  arabicText?: string;
  amharicText: string | LocalizedString;
  explanation?: string | LocalizedString;
  reference: string | LocalizedString;
}

export interface SahabahSection {
  title: string | LocalizedString;
  body: string | LocalizedString;
}

export interface Sahabah {
  slug: string;
  name: string | LocalizedString;
  title: string | LocalizedString;
  shortDescription: string | LocalizedString;
  fullBiography: string | LocalizedString;
  keyLessons: (string | LocalizedString)[];
  famousQuotes?: (string | LocalizedString)[];
  sections?: SahabahSection[];
  reign?: string | LocalizedString;
}

export { sahabahData } from './sahabah';

export interface LiveLecture {
  id: string;
  title: string | LocalizedString;
  speaker: string | LocalizedString;
  status: 'live' | 'upcoming' | 'ended';
  scheduledTime?: string | LocalizedString;
  streamUrl?: string;
  audioUrl?: string;
  description: string | LocalizedString;
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://sileqelbachin1.netlify.app';

export const siteMetadata = {
  channelName: 'ስለ ቀልባችን',
  siteUrl: SITE_URL,
  telegramHandle: '@Sle_qelbachn1',
  telegramUrl: 'https://t.me/Sle_qelbachn1',
  tiktokHandle: '@sle_qelbachn1',
  tiktokUrl: 'https://www.tiktok.com/@sle_qelbachn1',
  youtubeHandle: '@sle_qelbachn1',
  youtubeUrl: 'https://youtube.com/@sle_qelbachn1?si=jwFjYSDtGE-clwJn',
  bannerVerse: {
    am: '«እነዚያ ያመኑ ልቦቻቸውም አላህን በማውሳት (በማስታወስ) የሚረኩ ናቸው፤ ንቁ! አላህን በማውሳት ልቦች ይረካሉ።»',
    ar: '«الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ»',
    en: '“Those who have believed and whose hearts find rest in the remembrance of Allah. Unquestionably, in the remembrance of Allah do hearts find rest.”',
  },
  bannerVerseSource: {
    am: 'ቁርኣን — ሱረቱ አር-ረዕድ 13:28',
    ar: 'القرآن — سورة الرعد: ٢٨',
    en: 'Qur’an 13:28',
  },
  heroHadithText: {
    am: '«በሰውነት ውስጥ አንዲት ቁራጭ ስጋ አለች፤ እሷ ከተስተካከለች መላው ሰውነት ይስተካከላል፤ እሷ ከተበላሸች መላው ሰውነት ይበላሻል። እሷም ቀልብ (ልብ) ነች።»',
    ar: '«أَلا وَإِنَّ فِي الْجَسَدِ مُضْغَةً إِذَا صَلَحَتْ صَلَحَ الْجَسَدُ كُلُّهُ، وَإِذَا فَسَدَتْ فَسَدَ الْجَسَدُ كُلُّهُ، أَلا وَهِيَ الْقَلْبُ.»',
    en: '“Verily, in the body there is a piece of flesh of which if it is sound, the whole body is sound, and if it is corrupt, the whole body is corrupt. Truly, it is the heart.”'
  },
  heroHadithSource: {
    am: '📚 ቡኻሪና ሙስሊም',
    ar: '📚 رواه البخاري ومسلم',
    en: '📚 Sahih al-Bukhari & Sahih Muslim'
  },
  purposeParagraph1: {
    am: '✅ በዚህ የፈተናና የቴክኖሎጂ ዘመን የቀልብ መድረቅና የኢማን መድከም የብዙዎቻችን የጋራ ፈተና ሆኗል። የዚህ ቻናል ዋነኛ ዓላማም አላህ ባገራልን ቴክኖሎጂ በመጠቀም፣ ከቁርኣንና ከሐዲሥ ቀልባችንን የምናክምበትን ጥበብ በጋራ መፈለግና ለወጣቱ ትውልድ ደግሞ በራሱ ቋንቋ የሕይወት መፍትሔዎችን ማመላከት ነው።',
    ar: '✅ في هذا العصر الذي كثرت فيه الفتن والتحديات التقنية، أصبح قسوة القلب وضعف الإيمان معضلة مشتركة. والهدف الأسمى لهذه القناة هو استغلال التكنولوجيا لنستشفي بالقرآن والسنة ونحيي قلوبنا معًا.',
    en: '✅ In this era of trials and technology, spiritual dryness and weakening faith affect many of us. The primary objective of this channel is to utilize modern technology to seek wisdom from the Qur’an and Hadith to purify our hearts.'
  },
  purposeParagraph2: {
    am: '📖 አላህ እርስ በርስ በመልካም የምንመካከርበት፣ የቀልባችንን ድርቀት በጋራ የምናክምበትና እጅ ለእጅ ተያይዘን ወደ እርሱ የምንጓዝበት መድረክ ያድርግልን።',
    ar: '📖 نسأل الله أن يجعل هذا المنبر ساحة للتواصي بالحق والتناصح بالخير والمسير معًا نحو رضوان الله.',
    en: '📖 May Allah make this a platform where we advise each other in goodness, cure spiritual hardness together, and walk hand-in-hand towards His pleasure.'
  }
};

export const muhadarasData: Muhadara[] = [
  {
    id: 'muhadara-1',
    title: {
      am: 'ቀልብን የሚያረሰርሱ 10 ቁልፍ ነገሮች',
      ar: '١٠ أسباب لرقة القلوب',
      en: '10 Key Means to Soften the Heart'
    },
    speaker: {
      am: 'እስታዝ አቡ ዐብደላህ',
      ar: 'الأستاذ أبو عبد الله',
      en: 'Ustadh Abu Abdullah'
    },
    topic: {
      am: 'የቀልብ ሕክምና',
      ar: 'تزكية النفس',
      en: 'Purification of Soul'
    },
    duration: '54:10',
    date: '2026-02-15',
    audioUrl: 'https://cdn.jsdelivr.net/gh/mesudhassen5450-sketch/sileqelbachin-media@main/voice_messages/audio_10.ogg'
  }
];

export const videosData: VideoItem[] = [];
export const remindersData: Reminder[] = [
  {
    id: 'rem-1',
    title: {
      am: 'የቀልብ ተቅዋና ሰላም',
      ar: 'تقوى القلوب',
      en: 'Piety of the Hearts'
    },
    content: {
      am: '«አላህ ሆይ! ለነፍሴ ተቅዋዋን ስጣት፣ አጽዳትም፤ አንተ ከሚያጸዷት ሁሉ በላጭ ነህ።»',
      ar: '«اللَّهُمَّ آتِ نَفْسِي تَقْوَاهَا، وَزَكِّهَا أَنْتَ خَيْرُ مَنْ زَكَّاهَا»',
      en: '“O Allah, grant my soul its piety and purify it; You are the best to purify it.”'
    },
    source: {
      am: 'ሶሒሕ ሙስሊም',
      ar: 'صحيح مسلم',
      en: 'Sahih Muslim'
    },
    category: 'የቀልብ ዱዓ',
    type: 'hadith'
  }
];

export const knowledgeData: KnowledgeItem[] = [
  {
    id: 'k-1',
    category: 'quran',
    arabicText: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    amharicText: {
      am: '«እነዚያ ያመኑ ልቦቻቸውም አላህን በማውሳት (በማስታወስ) የሚረኩ ናቸው፤ ንቁ! አላህን በማውሳት ልቦች ይረካሉ።»',
      ar: '«أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ» (الرعد: ٢٨)',
      en: '“Unquestionably, by the remembrance of Allah hearts find rest.” (Ar-Ra’d: 28)'
    },
    reference: {
      am: 'ሱረቱ አር-ረዕድ ፡ 28',
      ar: 'سورة الرعد ፡ ٢٨',
      en: 'Surah Ar-Ra’d: 28'
    }
  }
];

export const liveLecturesData: LiveLecture[] = [];
