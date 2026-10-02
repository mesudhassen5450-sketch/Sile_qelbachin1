/**
 * Quran catalog aligned with Flutter app 1.0.6+7
 * Verse-by-verse (gold) vs International full-surah (neutral)
 */

export const QURAN_GOLD = '#D4AF37'
export const R2_PUBLIC_BASE =
  'https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev'
export const R2_RECITER_FOLDER = 'Reciter/reciters'

export function r2ReciterUrl(filename: string): string {
  return `${R2_PUBLIC_BASE}/${R2_RECITER_FOLDER}/${encodeURIComponent(filename)}`
}

export type QariMode = 'verse' | 'fullSurah'

export type Qari = {
  id: string
  name: string
  nameAm: string
  mode: QariMode
  /** Verse-by-verse edition id (cdn.islamic.network) */
  edition?: string
  bitrate?: number
  /** Full-surah server base (mp3quran.net) */
  serverUrl?: string
  imageUrl: string
  fallbackUrl?: string
}

export const verseByVerseQaris: Qari[] = [
  {
    id: 'v_alafasy',
    name: 'Mishary Rashid Alafasy',
    nameAm: 'ሚሻሪ ራሺድ አላፋሲ',
    mode: 'verse',
    edition: 'ar.alafasy',
    bitrate: 128,
    imageUrl:
      'https://static.qurancdn.com/images/reciters/6/mishary-rashid-alafasy-profile.jpeg?v=1',
  },
  {
    id: 'v_maher',
    name: 'Maher Al Muaiqly',
    nameAm: 'ማሂር አል-ሙዐይቅሊ',
    mode: 'verse',
    edition: 'ar.mahermuaiqly',
    bitrate: 128,
    imageUrl: r2ReciterUrl('maher.jpg'),
  },
  {
    id: 'v_husary',
    name: 'Mahmoud Khalil Al-Husary',
    nameAm: 'ማሕሙድ ኸሊል አል-ሁሳሪ',
    mode: 'verse',
    edition: 'ar.husary',
    bitrate: 128,
    imageUrl:
      'https://static.qurancdn.com/images/reciters/5/mahmoud-khalil-al-hussary-profile.png?v=1',
  },
  {
    id: 'v_minshawi',
    name: 'Mohamed Siddiq al-Minshawi',
    nameAm: 'ሙሐመድ ሲዲቅ አል-ሚንሻዊ',
    mode: 'verse',
    edition: 'ar.minshawi',
    bitrate: 128,
    imageUrl: r2ReciterUrl('mohamed sidiq .jpeg'),
    fallbackUrl:
      'https://static.qurancdn.com/images/reciters/7/mohamed-siddiq-al-minshawi-profile.jpeg?v=1',
  },
  {
    id: 'v_ajmy',
    name: 'Ahmed ibn Ali al-Ajmy',
    nameAm: 'አሕመድ አል-አጅሚ',
    mode: 'verse',
    edition: 'ar.ahmedajamy',
    bitrate: 128,
    imageUrl:
      'https://static.qurancdn.com/images/reciters/22/Ahmed-ibn-Ali-al-Ajmy-profile.png?v=1',
  },
  {
    id: 'v_shatri',
    name: 'Abu Bakr Al-Shatri',
    nameAm: 'አቡ በክር አሽ-ሻትሪ',
    mode: 'verse',
    edition: 'ar.shaatree',
    bitrate: 128,
    imageUrl: r2ReciterUrl('abu-bakr-al-shatri-pofile.avif'),
    fallbackUrl:
      'https://static.qurancdn.com/images/reciters/3/abu-bakr-al-shatri-pofile.jpeg?v=1',
  },
]

export const internationalQaris: Qari[] = [
  {
    id: 'g_alafasy',
    name: 'Mishary Rashid Alafasy',
    nameAm: 'ሚሻሪ ራሺድ አላፋሲ',
    mode: 'fullSurah',
    serverUrl: 'https://server8.mp3quran.net/afs',
    imageUrl:
      'https://static.qurancdn.com/images/reciters/6/mishary-rashid-alafasy-profile.jpeg?v=1',
  },
  {
    id: 'g_sudais',
    name: 'Abdurrahman As-Sudais',
    nameAm: 'አብዱረሕማን አስ-ሱደይስ',
    mode: 'fullSurah',
    serverUrl: 'https://server11.mp3quran.net/sds',
    imageUrl:
      'https://static.qurancdn.com/images/reciters/2/abdul-rahman-al-sudais-profile.jpeg?v=1',
  },
  {
    id: 'g_maher',
    name: 'Maher Al Muaiqly',
    nameAm: 'ማሂር አል-ሙዐይቅሊ',
    mode: 'fullSurah',
    serverUrl: 'https://server12.mp3quran.net/maher',
    imageUrl: r2ReciterUrl('maher.jpg'),
  },
  {
    id: 'g_basit',
    name: 'Abdulbasit Abdussamad',
    nameAm: 'አብዱልባሲጥ አብዱሳመድ',
    mode: 'fullSurah',
    serverUrl: 'https://server7.mp3quran.net/basit',
    imageUrl: r2ReciterUrl('abdul basi.jpeg'),
  },
  {
    id: 'g_basfar',
    name: 'Abdullah Basfar',
    nameAm: 'ዐብዱላህ በስፋር',
    mode: 'fullSurah',
    serverUrl: 'https://server6.mp3quran.net/basfar',
    imageUrl: r2ReciterUrl('abdullah-basfar.jpeg'),
  },
  {
    id: 'g_ghamdi',
    name: 'Saad Al-Ghamdi',
    nameAm: 'ሳዕድ አል-ጋምዲ',
    mode: 'fullSurah',
    serverUrl: 'https://server7.mp3quran.net/s_gmd',
    imageUrl:
      'https://static.qurancdn.com/images/reciters/19/saad-al-ghamdi-profile.jpeg?v=1',
  },
  {
    id: 'g_shatri',
    name: 'Abu Bakr Al-Shatri',
    nameAm: 'አቡ በክር አሽ-ሻትሪ',
    mode: 'fullSurah',
    serverUrl: 'https://server11.mp3quran.net/shatri',
    imageUrl: r2ReciterUrl('abu-bakr-al-shatri-pofile.avif'),
    fallbackUrl:
      'https://static.qurancdn.com/images/reciters/3/abu-bakr-al-shatri-pofile.jpeg?v=1',
  },
  {
    id: 'g_ajmy',
    name: 'Ahmed ibn Ali al-Ajmy',
    nameAm: 'አሕመድ አል-አጅሚ',
    mode: 'fullSurah',
    serverUrl: 'https://server10.mp3quran.net/ajm',
    imageUrl:
      'https://static.qurancdn.com/images/reciters/22/Ahmed-ibn-Ali-al-Ajmy-profile.png?v=1',
  },
  {
    id: 'g_husary',
    name: 'Mahmoud Khalil Al-Husary',
    nameAm: 'ማሕሙድ ኸሊል አል-ሁሳሪ',
    mode: 'fullSurah',
    serverUrl: 'https://server13.mp3quran.net/husr',
    imageUrl:
      'https://static.qurancdn.com/images/reciters/5/mahmoud-khalil-al-hussary-profile.png?v=1',
  },
  {
    id: 'g_minshawi',
    name: 'Mohamed Siddiq al-Minshawi',
    nameAm: 'ሙሐመድ ሲዲቅ አል-ሚንሻዊ',
    mode: 'fullSurah',
    serverUrl: 'https://server10.mp3quran.net/minsh',
    imageUrl: r2ReciterUrl('mohamed sidiq .jpeg'),
    fallbackUrl: r2ReciterUrl('maher.jpg'),
  },
  {
    id: 'g_shuraym',
    name: 'Saud Al-Shuraym',
    nameAm: 'ሳዑድ አል-ሹረይም',
    mode: 'fullSurah',
    serverUrl: 'https://server7.mp3quran.net/shur',
    imageUrl:
      'https://static.qurancdn.com/images/reciters/10/saud-al-shuraim-profile.jpeg?v=1',
  },
  {
    id: 'g_yasser',
    name: 'Yasser Al-Dosari',
    nameAm: 'ያሲር አል-ዱሳሪ',
    mode: 'fullSurah',
    serverUrl: 'https://server11.mp3quran.net/yasser',
    imageUrl:
      'https://static.qurancdn.com/images/reciters/107/yasser-al-dosari-profile.jpeg?v=1',
  },
  {
    id: 'g_qatami',
    name: 'Nasser Al-Qatami',
    nameAm: 'ናሲር አል-ቃጣሚ',
    mode: 'fullSurah',
    serverUrl: 'https://server6.mp3quran.net/qtm',
    imageUrl: r2ReciterUrl('Sheikh Nasser Al-Qatami.png'),
  },
  {
    id: 'g_hani',
    name: 'Hani Ar-Rifai',
    nameAm: 'ሃኒ አር-ሪፋዒ',
    mode: 'fullSurah',
    serverUrl: 'https://server8.mp3quran.net/hani',
    imageUrl: r2ReciterUrl('Sheikh Hani Ar-Rifai (.jpeg'),
  },
  {
    id: 'g_juhani',
    name: 'Abdullah Awad Al-Juhani',
    nameAm: 'ዐብዱላህ ዐዋድ አል-ጁሃኒ',
    mode: 'fullSurah',
    serverUrl: 'https://server13.mp3quran.net/jhn',
    imageUrl: r2ReciterUrl('Sheikh Abdullah Awad Al-Juhani.jpeg'),
  },
  {
    id: 'g_hudhaify',
    name: 'Ali Al-Hudhaify',
    nameAm: 'ዐሊ አል-ሁዘይፊ',
    mode: 'fullSurah',
    serverUrl: 'https://server9.mp3quran.net/hthfi',
    imageUrl: r2ReciterUrl('Sheikh Ali Al-Hudhaify.jpeg'),
  },
  {
    id: 'g_jibreel',
    name: 'Muhammad Jibreel',
    nameAm: 'ሙሐመድ ጅብሪል',
    mode: 'fullSurah',
    serverUrl: 'https://server8.mp3quran.net/jbrl',
    imageUrl: r2ReciterUrl('Sheikh Muhammad Jibreel.jpeg'),
  },
  {
    id: 'g_bukhatir',
    name: 'Salah Bukhatir',
    nameAm: 'ሳላሕ ቡኻጢር',
    mode: 'fullSurah',
    serverUrl: 'https://server8.mp3quran.net/bukhatir',
    imageUrl: r2ReciterUrl('Sheikh Salah Bukhatir.jpeg'),
  },
  {
    id: 'g_fares',
    name: 'Fares Abbad',
    nameAm: 'ፋሪስ ዐባድ',
    mode: 'fullSurah',
    serverUrl: 'https://server8.mp3quran.net/fares',
    imageUrl:
      'https://static.qurancdn.com/images/reciters/32/fares-abbad-profile.jpeg?v=1',
  },
  {
    id: 'g_baleela',
    name: 'Bandar Baleela',
    nameAm: 'በንደር በሊላ',
    mode: 'fullSurah',
    serverUrl: 'https://server6.mp3quran.net/bbal',
    imageUrl:
      'https://static.qurancdn.com/images/reciters/122/bandar-baleela-profile.jpeg?v=1',
  },
]

export const DEFAULT_VERSE_QARI_ID = 'v_alafasy'
export const DEFAULT_INTL_QARI_ID = 'g_alafasy'

export type SurahMeta = {
  number: number
  nameAr: string
  nameEn: string
  nameAm: string
  ayahCount: number
  revelation: 'Meccan' | 'Medinan'
}

/** Compact surah metadata (ayah counts for global ayah numbering). */
export const SURAH_META: SurahMeta[] = [
  { number: 1, nameAr: 'الفاتحة', nameEn: 'Al-Fatihah', nameAm: 'አል-ፋቲሐ', ayahCount: 7, revelation: 'Meccan' },
  { number: 2, nameAr: 'البقرة', nameEn: 'Al-Baqarah', nameAm: 'አል-በቀራ', ayahCount: 286, revelation: 'Medinan' },
  { number: 3, nameAr: 'آل عمران', nameEn: 'Ali Imran', nameAm: 'አል ኢምራን', ayahCount: 200, revelation: 'Medinan' },
  { number: 4, nameAr: 'النساء', nameEn: 'An-Nisa', nameAm: 'አን-ኒሳእ', ayahCount: 176, revelation: 'Medinan' },
  { number: 5, nameAr: 'المائدة', nameEn: 'Al-Maidah', nameAm: 'አል-ማኢዳ', ayahCount: 120, revelation: 'Medinan' },
  { number: 6, nameAr: 'الأنعام', nameEn: 'Al-Anam', nameAm: 'አል-አንዓም', ayahCount: 165, revelation: 'Meccan' },
  { number: 7, nameAr: 'الأعراف', nameEn: 'Al-Araf', nameAm: 'አል-አዕራፍ', ayahCount: 206, revelation: 'Meccan' },
  { number: 8, nameAr: 'الأنفال', nameEn: 'Al-Anfal', nameAm: 'አል-አንፋል', ayahCount: 75, revelation: 'Medinan' },
  { number: 9, nameAr: 'التوبة', nameEn: 'At-Tawbah', nameAm: 'አት-ተውባ', ayahCount: 129, revelation: 'Medinan' },
  { number: 10, nameAr: 'يونس', nameEn: 'Yunus', nameAm: 'ዩኑስ', ayahCount: 109, revelation: 'Meccan' },
  { number: 11, nameAr: 'هود', nameEn: 'Hud', nameAm: 'ሁድ', ayahCount: 123, revelation: 'Meccan' },
  { number: 12, nameAr: 'يوسف', nameEn: 'Yusuf', nameAm: 'ዩሱፍ', ayahCount: 111, revelation: 'Meccan' },
  { number: 13, nameAr: 'الرعد', nameEn: 'Ar-Rad', nameAm: 'አር-ራዕድ', ayahCount: 43, revelation: 'Medinan' },
  { number: 14, nameAr: 'إبراهيم', nameEn: 'Ibrahim', nameAm: 'ኢብራሂም', ayahCount: 52, revelation: 'Meccan' },
  { number: 15, nameAr: 'الحجر', nameEn: 'Al-Hijr', nameAm: 'አል-ሒጅር', ayahCount: 99, revelation: 'Meccan' },
  { number: 16, nameAr: 'النحل', nameEn: 'An-Nahl', nameAm: 'አን-ናሕል', ayahCount: 128, revelation: 'Meccan' },
  { number: 17, nameAr: 'الإسراء', nameEn: 'Al-Isra', nameAm: 'አል-ኢስራእ', ayahCount: 111, revelation: 'Meccan' },
  { number: 18, nameAr: 'الكهف', nameEn: 'Al-Kahf', nameAm: 'አል-ካህፍ', ayahCount: 110, revelation: 'Meccan' },
  { number: 19, nameAr: 'مريم', nameEn: 'Maryam', nameAm: 'መርየም', ayahCount: 98, revelation: 'Meccan' },
  { number: 20, nameAr: 'طه', nameEn: 'Ta-Ha', nameAm: 'ጣሃ', ayahCount: 135, revelation: 'Meccan' },
  { number: 21, nameAr: 'الأنبياء', nameEn: 'Al-Anbiya', nameAm: 'አል-አንቢያእ', ayahCount: 112, revelation: 'Meccan' },
  { number: 22, nameAr: 'الحج', nameEn: 'Al-Hajj', nameAm: 'አል-ሐጅ', ayahCount: 78, revelation: 'Medinan' },
  { number: 23, nameAr: 'المؤمنون', nameEn: 'Al-Muminun', nameAm: 'አል-ሙእሚኑን', ayahCount: 118, revelation: 'Meccan' },
  { number: 24, nameAr: 'النور', nameEn: 'An-Nur', nameAm: 'አን-ኑር', ayahCount: 64, revelation: 'Medinan' },
  { number: 25, nameAr: 'الفرقان', nameEn: 'Al-Furqan', nameAm: 'አል-ፉርቃን', ayahCount: 77, revelation: 'Meccan' },
  { number: 26, nameAr: 'الشعراء', nameEn: 'Ash-Shuara', nameAm: 'አሽ-ሹዓራእ', ayahCount: 227, revelation: 'Meccan' },
  { number: 27, nameAr: 'النمل', nameEn: 'An-Naml', nameAm: 'አን-ነምል', ayahCount: 93, revelation: 'Meccan' },
  { number: 28, nameAr: 'القصص', nameEn: 'Al-Qasas', nameAm: 'አል-ቀሰሥ', ayahCount: 88, revelation: 'Meccan' },
  { number: 29, nameAr: 'العنكبوت', nameEn: 'Al-Ankabut', nameAm: 'አል-ዓንከቡት', ayahCount: 69, revelation: 'Meccan' },
  { number: 30, nameAr: 'الروم', nameEn: 'Ar-Rum', nameAm: 'አር-ሩም', ayahCount: 60, revelation: 'Meccan' },
  { number: 31, nameAr: 'لقمان', nameEn: 'Luqman', nameAm: 'ሉቅማን', ayahCount: 34, revelation: 'Meccan' },
  { number: 32, nameAr: 'السجدة', nameEn: 'As-Sajdah', nameAm: 'አስ-ሰጅዳ', ayahCount: 30, revelation: 'Meccan' },
  { number: 33, nameAr: 'الأحزاب', nameEn: 'Al-Ahzab', nameAm: 'አል-አሕዛብ', ayahCount: 73, revelation: 'Medinan' },
  { number: 34, nameAr: 'سبأ', nameEn: 'Saba', nameAm: 'ሰበእ', ayahCount: 54, revelation: 'Meccan' },
  { number: 35, nameAr: 'فاطر', nameEn: 'Fatir', nameAm: 'ፋጢር', ayahCount: 45, revelation: 'Meccan' },
  { number: 36, nameAr: 'يس', nameEn: 'Ya-Sin', nameAm: 'ያሲን', ayahCount: 83, revelation: 'Meccan' },
  { number: 37, nameAr: 'الصافات', nameEn: 'As-Saffat', nameAm: 'አስ-ሳፋት', ayahCount: 182, revelation: 'Meccan' },
  { number: 38, nameAr: 'ص', nameEn: 'Sad', nameAm: 'ሶድ', ayahCount: 88, revelation: 'Meccan' },
  { number: 39, nameAr: 'الزمر', nameEn: 'Az-Zumar', nameAm: 'አዝ-ዙመር', ayahCount: 75, revelation: 'Meccan' },
  { number: 40, nameAr: 'غافر', nameEn: 'Ghafir', nameAm: 'ጋፊር', ayahCount: 85, revelation: 'Meccan' },
  { number: 41, nameAr: 'فصلت', nameEn: 'Fussilat', nameAm: 'ፉሢለት', ayahCount: 54, revelation: 'Meccan' },
  { number: 42, nameAr: 'الشورى', nameEn: 'Ash-Shura', nameAm: 'አሽ-ሹራ', ayahCount: 53, revelation: 'Meccan' },
  { number: 43, nameAr: 'الزخرف', nameEn: 'Az-Zukhruf', nameAm: 'አዝ-ዙኽሩፍ', ayahCount: 89, revelation: 'Meccan' },
  { number: 44, nameAr: 'الدخان', nameEn: 'Ad-Dukhan', nameAm: 'አድ-ዱኻን', ayahCount: 59, revelation: 'Meccan' },
  { number: 45, nameAr: 'الجاثية', nameEn: 'Al-Jathiyah', nameAm: 'አል-ጃሢያ', ayahCount: 37, revelation: 'Meccan' },
  { number: 46, nameAr: 'الأحقاف', nameEn: 'Al-Ahqaf', nameAm: 'አል-አሕቃፍ', ayahCount: 35, revelation: 'Meccan' },
  { number: 47, nameAr: 'محمد', nameEn: 'Muhammad', nameAm: 'ሙሐመድ', ayahCount: 38, revelation: 'Medinan' },
  { number: 48, nameAr: 'الفتح', nameEn: 'Al-Fath', nameAm: 'አል-ፈትሕ', ayahCount: 29, revelation: 'Medinan' },
  { number: 49, nameAr: 'الحجرات', nameEn: 'Al-Hujurat', nameAm: 'አል-ሑጁራት', ayahCount: 18, revelation: 'Medinan' },
  { number: 50, nameAr: 'ق', nameEn: 'Qaf', nameAm: 'ቃፍ', ayahCount: 45, revelation: 'Meccan' },
  { number: 51, nameAr: 'الذاريات', nameEn: 'Adh-Dhariyat', nameAm: 'አዝ-ዛሪያት', ayahCount: 60, revelation: 'Meccan' },
  { number: 52, nameAr: 'الطور', nameEn: 'At-Tur', nameAm: 'አት-ጡር', ayahCount: 49, revelation: 'Meccan' },
  { number: 53, nameAr: 'النجم', nameEn: 'An-Najm', nameAm: 'አን-ነጅም', ayahCount: 62, revelation: 'Meccan' },
  { number: 54, nameAr: 'القمر', nameEn: 'Al-Qamar', nameAm: 'አል-ቀመር', ayahCount: 55, revelation: 'Meccan' },
  { number: 55, nameAr: 'الرحمن', nameEn: 'Ar-Rahman', nameAm: 'አር-ራሕማን', ayahCount: 78, revelation: 'Medinan' },
  { number: 56, nameAr: 'الواقعة', nameEn: 'Al-Waqiah', nameAm: 'አል-ዋቂዓ', ayahCount: 96, revelation: 'Meccan' },
  { number: 57, nameAr: 'الحديد', nameEn: 'Al-Hadid', nameAm: 'አል-ሐዲድ', ayahCount: 29, revelation: 'Medinan' },
  { number: 58, nameAr: 'المجادلة', nameEn: 'Al-Mujadila', nameAm: 'አል-ሙጃዲላ', ayahCount: 22, revelation: 'Medinan' },
  { number: 59, nameAr: 'الحشر', nameEn: 'Al-Hashr', nameAm: 'አል-ሐሽር', ayahCount: 24, revelation: 'Medinan' },
  { number: 60, nameAr: 'الممتحنة', nameEn: 'Al-Mumtahanah', nameAm: 'አል-ሙምተሒና', ayahCount: 13, revelation: 'Medinan' },
  { number: 61, nameAr: 'الصف', nameEn: 'As-Saff', nameAm: 'አስ-ሶፍ', ayahCount: 14, revelation: 'Medinan' },
  { number: 62, nameAr: 'الجمعة', nameEn: 'Al-Jumuah', nameAm: 'አል-ጁሙዐ', ayahCount: 11, revelation: 'Medinan' },
  { number: 63, nameAr: 'المنافقون', nameEn: 'Al-Munafiqun', nameAm: 'አል-ሙናፊቁን', ayahCount: 11, revelation: 'Medinan' },
  { number: 64, nameAr: 'التغابن', nameEn: 'At-Taghabun', nameAm: 'አት-ተጋቡን', ayahCount: 18, revelation: 'Medinan' },
  { number: 65, nameAr: 'الطلاق', nameEn: 'At-Talaq', nameAm: 'አት-ጠላቅ', ayahCount: 12, revelation: 'Medinan' },
  { number: 66, nameAr: 'التحريم', nameEn: 'At-Tahrim', nameAm: 'አት-ተሕሪም', ayahCount: 12, revelation: 'Medinan' },
  { number: 67, nameAr: 'الملك', nameEn: 'Al-Mulk', nameAm: 'አል-ሙልክ', ayahCount: 30, revelation: 'Meccan' },
  { number: 68, nameAr: 'القلم', nameEn: 'Al-Qalam', nameAm: 'አል-ቀለም', ayahCount: 52, revelation: 'Meccan' },
  { number: 69, nameAr: 'الحاقة', nameEn: 'Al-Haqqah', nameAm: 'አል-ሐቃ', ayahCount: 52, revelation: 'Meccan' },
  { number: 70, nameAr: 'المعارج', nameEn: 'Al-Maarij', nameAm: 'አል-መዓሪጅ', ayahCount: 44, revelation: 'Meccan' },
  { number: 71, nameAr: 'نوح', nameEn: 'Nuh', nameAm: 'ኑሕ', ayahCount: 28, revelation: 'Meccan' },
  { number: 72, nameAr: 'الجن', nameEn: 'Al-Jinn', nameAm: 'አል-ጂን', ayahCount: 28, revelation: 'Meccan' },
  { number: 73, nameAr: 'المزمل', nameEn: 'Al-Muzzammil', nameAm: 'አል-ሙዘሚል', ayahCount: 20, revelation: 'Meccan' },
  { number: 74, nameAr: 'المدثر', nameEn: 'Al-Muddaththir', nameAm: 'አል-መዱሲር', ayahCount: 56, revelation: 'Meccan' },
  { number: 75, nameAr: 'القيامة', nameEn: 'Al-Qiyamah', nameAm: 'አል-ቂያማ', ayahCount: 40, revelation: 'Meccan' },
  { number: 76, nameAr: 'الإنسان', nameEn: 'Al-Insan', nameAm: 'አል-ኢንሳን', ayahCount: 31, revelation: 'Medinan' },
  { number: 77, nameAr: 'المرسلات', nameEn: 'Al-Mursalat', nameAm: 'አል-ሙርሰላት', ayahCount: 50, revelation: 'Meccan' },
  { number: 78, nameAr: 'النبأ', nameEn: 'An-Naba', nameAm: 'አን-ነበእ', ayahCount: 40, revelation: 'Meccan' },
  { number: 79, nameAr: 'النازعات', nameEn: 'An-Naziat', nameAm: 'አን-ናዚዓት', ayahCount: 46, revelation: 'Meccan' },
  { number: 80, nameAr: 'عبس', nameEn: 'Abasa', nameAm: 'ዐበሰ', ayahCount: 42, revelation: 'Meccan' },
  { number: 81, nameAr: 'التكوير', nameEn: 'At-Takwir', nameAm: 'አት-ተክዊር', ayahCount: 29, revelation: 'Meccan' },
  { number: 82, nameAr: 'الانفطار', nameEn: 'Al-Infitar', nameAm: 'አል-ኢንፊጣር', ayahCount: 19, revelation: 'Meccan' },
  { number: 83, nameAr: 'المطففين', nameEn: 'Al-Mutaffifin', nameAm: 'አል-ሙጠፈፊን', ayahCount: 36, revelation: 'Meccan' },
  { number: 84, nameAr: 'الانشقاق', nameEn: 'Al-Inshiqaq', nameAm: 'አል-ኢንሺቃቅ', ayahCount: 25, revelation: 'Meccan' },
  { number: 85, nameAr: 'البروج', nameEn: 'Al-Buruj', nameAm: 'አል-ቡሩጅ', ayahCount: 22, revelation: 'Meccan' },
  { number: 86, nameAr: 'الطارق', nameEn: 'At-Tariq', nameAm: 'አት-ጣሪቅ', ayahCount: 17, revelation: 'Meccan' },
  { number: 87, nameAr: 'الأعلى', nameEn: 'Al-Ala', nameAm: 'አል-አዕላ', ayahCount: 19, revelation: 'Meccan' },
  { number: 88, nameAr: 'الغاشية', nameEn: 'Al-Ghashiyah', nameAm: 'አል-ጋሺያ', ayahCount: 26, revelation: 'Meccan' },
  { number: 89, nameAr: 'الفجر', nameEn: 'Al-Fajr', nameAm: 'አል-ፈጅር', ayahCount: 30, revelation: 'Meccan' },
  { number: 90, nameAr: 'البلد', nameEn: 'Al-Balad', nameAm: 'አል-በለድ', ayahCount: 20, revelation: 'Meccan' },
  { number: 91, nameAr: 'الشمس', nameEn: 'Ash-Shams', nameAm: 'አሽ-ሸምስ', ayahCount: 15, revelation: 'Meccan' },
  { number: 92, nameAr: 'الليل', nameEn: 'Al-Layl', nameAm: 'አል-ለይል', ayahCount: 21, revelation: 'Meccan' },
  { number: 93, nameAr: 'الضحى', nameEn: 'Ad-Duha', nameAm: 'አድ-ዱሓ', ayahCount: 11, revelation: 'Meccan' },
  { number: 94, nameAr: 'الشرح', nameEn: 'Ash-Sharh', nameAm: 'አሽ-ሸርሕ', ayahCount: 8, revelation: 'Meccan' },
  { number: 95, nameAr: 'التين', nameEn: 'At-Tin', nameAm: 'አት-ቲን', ayahCount: 8, revelation: 'Meccan' },
  { number: 96, nameAr: 'العلق', nameEn: 'Al-Alaq', nameAm: 'አል-ዓለቅ', ayahCount: 19, revelation: 'Meccan' },
  { number: 97, nameAr: 'القدر', nameEn: 'Al-Qadr', nameAm: 'አል-ቀድር', ayahCount: 5, revelation: 'Meccan' },
  { number: 98, nameAr: 'البينة', nameEn: 'Al-Bayyinah', nameAm: 'አል-በይይና', ayahCount: 8, revelation: 'Medinan' },
  { number: 99, nameAr: 'الزلزلة', nameEn: 'Az-Zalzalah', nameAm: 'አዝ-ዘልዘላ', ayahCount: 8, revelation: 'Medinan' },
  { number: 100, nameAr: 'العاديات', nameEn: 'Al-Adiyat', nameAm: 'አል-ዓዲያት', ayahCount: 11, revelation: 'Meccan' },
  { number: 101, nameAr: 'القارعة', nameEn: 'Al-Qariah', nameAm: 'አል-ቃሪዓ', ayahCount: 11, revelation: 'Meccan' },
  { number: 102, nameAr: 'التكاثر', nameEn: 'At-Takathur', nameAm: 'አት-ተካሱር', ayahCount: 8, revelation: 'Meccan' },
  { number: 103, nameAr: 'العصر', nameEn: 'Al-Asr', nameAm: 'አል-ዓስር', ayahCount: 3, revelation: 'Meccan' },
  { number: 104, nameAr: 'الهمزة', nameEn: 'Al-Humazah', nameAm: 'አል-ሁመዛ', ayahCount: 9, revelation: 'Meccan' },
  { number: 105, nameAr: 'الفيل', nameEn: 'Al-Fil', nameAm: 'አል-ፊል', ayahCount: 5, revelation: 'Meccan' },
  { number: 106, nameAr: 'قريش', nameEn: 'Quraysh', nameAm: 'ቁረይሽ', ayahCount: 4, revelation: 'Meccan' },
  { number: 107, nameAr: 'الماعون', nameEn: 'Al-Maun', nameAm: 'አል-ማዑን', ayahCount: 7, revelation: 'Meccan' },
  { number: 108, nameAr: 'الكوثر', nameEn: 'Al-Kawthar', nameAm: 'አል-ከውሰር', ayahCount: 3, revelation: 'Meccan' },
  { number: 109, nameAr: 'الكافرون', nameEn: 'Al-Kafirun', nameAm: 'አል-ካፊሩን', ayahCount: 6, revelation: 'Meccan' },
  { number: 110, nameAr: 'النصر', nameEn: 'An-Nasr', nameAm: 'አን-ነስር', ayahCount: 3, revelation: 'Medinan' },
  { number: 111, nameAr: 'المسد', nameEn: 'Al-Masad', nameAm: 'አል-መሰድ', ayahCount: 5, revelation: 'Meccan' },
  { number: 112, nameAr: 'الإخلاص', nameEn: 'Al-Ikhlas', nameAm: 'አል-ኢኽላስ', ayahCount: 4, revelation: 'Meccan' },
  { number: 113, nameAr: 'الفلق', nameEn: 'Al-Falaq', nameAm: 'አል-ፈለቅ', ayahCount: 5, revelation: 'Meccan' },
  { number: 114, nameAr: 'الناس', nameEn: 'An-Nas', nameAm: 'አን-ናስ', ayahCount: 6, revelation: 'Meccan' },
]

/** Global ayah number (1…6236) for verse-by-verse CDN. */
export function globalAyahNumber(surahNumber: number, ayahInSurah: number): number {
  let offset = 0
  for (const s of SURAH_META) {
    if (s.number === surahNumber) return offset + ayahInSurah
    offset += s.ayahCount
  }
  return ayahInSurah
}

export function ayahAudioUrl(qari: Qari, surahNumber: number, ayahInSurah: number): string {
  const edition = qari.edition || 'ar.alafasy'
  const bitrate = qari.bitrate || 128
  const n = globalAyahNumber(surahNumber, ayahInSurah)
  return `https://cdn.islamic.network/quran/audio/${bitrate}/${edition}/${n}.mp3`
}

export function fullSurahAudioUrl(qari: Qari, surahNumber: number): string {
  const base = (qari.serverUrl || '').replace(/\/$/, '')
  const nnn = String(surahNumber).padStart(3, '0')
  return `${base}/${nnn}.mp3`
}

export function isFullSurahQari(qari: Qari): boolean {
  return Boolean(qari.serverUrl && qari.serverUrl.trim())
}

export function findQari(id: string): Qari | undefined {
  return (
    verseByVerseQaris.find(q => q.id === id) ||
    internationalQaris.find(q => q.id === id)
  )
}
