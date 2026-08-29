export type Language = 'AM' | 'AR' | 'EN';

export const translations: Record<string, Record<Language, string>> = {
  // Navigation
  navHome: {
    AM: '🏠 መነሻ (Home)',
    AR: '🏠 الرئيسية',
    EN: '🏠 Home',
  },
  navKitab: {
    AM: '📖 ኪታብ (Kitab)',
    AR: '📖 الكتب',
    EN: '📖 Kitab',
  },
  navAudioLecture: {
    AM: '🎧 የድምፅ ትምህርቶች',
    AR: '🎧 المحاضرات الصوتية',
    EN: '🎧 Online Audio Lecture',
  },
  navEducationalSubpages: {
    AM: '📚 ትምህርታዊ ክፍሎች',
    AR: '📚 الأقسام التعليمية',
    EN: '📚 Educational Sections',
  },
  navContact: {
    AM: '📞 አድራሻ (Contact)',
    AR: '📞 اتصل بنا',
    EN: '📞 Contact',
  },

  // Subpage Dropdown Items
  subReminders: {
    AM: ' Islamic Reminders',
    AR: ' تذكيرات إسلامية',
    EN: ' Islamic Reminders',
  },
  subRemindersAm: {
    AM: 'ማስታወሻዎች',
    AR: 'تذكيرات',
    EN: 'Reminders',
  },
  subKnowledge: {
    AM: " Qur'an & Hadith",
    AR: ' القرآن والحديث',
    EN: " Qur'an & Hadith",
  },
  subKnowledgeAm: {
    AM: 'ዕውቀት',
    AR: 'معرفة',
    EN: 'Knowledge',
  },
  subSahabah: {
    AM: ' Sahabah Lessons',
    AR: ' قصص الصحابة',
    EN: ' Sahabah Lessons',
  },
  subSahabahAm: {
    AM: 'የሶሓቦች ታሪክ',
    AR: 'قصص الصحابة',
    EN: 'Sahabah Stories',
  },
  subMuhadara: {
    AM: ' General Muhadara',
    AR: ' محاضرات عامة',
    EN: ' General Muhadara',
  },
  subMuhadaraAm: {
    AM: 'ሙሓደራዎች',
    AR: 'محاضرات',
    EN: 'Lectures',
  },
  subVideos: {
    AM: ' Video Lessons',
    AR: ' دروس مرئية',
    EN: ' Video Lessons',
  },
  subVideosAm: {
    AM: 'ቪዲዮዎች',
    AR: 'مرئيات',
    EN: 'Videos',
  },

  // Hero Section
  heroBadge: {
    AM: 'የቀልብና የኢማን ማጠናከሪያ ቻናል',
    AR: 'قناة تقوية القلب والإيمان',
    EN: 'Heart & Faith Strengthening Channel',
  },
  heroBtnKitab: {
    AM: '📖 የኪታብ ድርሶች',
    AR: '📖 دروس الكتب',
    EN: '📖 Kitab Audio Lessons',
  },
  heroBtnMuhadara: {
    AM: '🎧 ሙሓደራ ያዳምጡ',
    AR: '🎧 استمع للمحاضرة',
    EN: '🎧 Listen to Muhadara',
  },
  heroBtnTelegram: {
    AM: '📱 Telegram ይቀላቀሉ',
    AR: '📱 انضم للتليجرام',
    EN: '📱 Join Telegram',
  },

  // Editorial Purpose Section ("ስለ ቀልባችን…")
  purposeTitle: {
    AM: 'ስለ ቀልባችን…',
    AR: 'عن قلوبنا…',
    EN: 'About Our Hearts…',
  },

  // Live Audio Section
  liveNow: {
    AM: '🔴 Live Now (በአሁኑ ሰዓት በቀጥታ)',
    AR: '🔴 مباشر الآن',
    EN: '🔴 Live Now',
  },
  noLiveStream: {
    AM: 'በአሁኑ ሰዓት በቀጥታ የሚተላለፍ ድርስ የለም',
    AR: 'لا يوجد بث مباشر حالياً',
    EN: 'No live audio stream currently',
  },
  noLiveSubtext: {
    AM: 'ቀጣይ የቀጥታ ስርጭት ፕሮግራሞችን ከታች ባለው መርሃ-ግብር ይመልከቱ።',
    AR: 'راجع المواعيد القادمة في الجدول أدناه.',
    EN: 'Check upcoming live broadcasts in the schedule below.',
  },
  upcomingLectures: {
    AM: '🕐 Upcoming (የሚመጡ የቀጥታ መርሃ-ግብሮች)',
    AR: '🕐 المحاضرات القادمة',
    EN: '🕐 Upcoming Live Broadcasts',
  },
  previousLectures: {
    AM: '🎧 Previous Lectures (ያለፉ የተቀረፁ ትምህርቶች)',
    AR: '🎧 المحاضرات السابقة',
    EN: '🎧 Previous Lectures Archive',
  },

  // Section Headers
  featuredKitab: {
    AM: '📖 Featured Kitab',
    AR: '📖 الكتب المختارة',
    EN: '📖 Featured Kitab',
  },
  viewAllKitabs: {
    AM: 'ሁሉንም ኪታቦች ይመልከቱ',
    AR: 'عرض جميع الكتب',
    EN: 'View All Kitabs',
  },
  latestDers: {
    AM: '🎧 Latest Ders',
    AR: '🎧 أحدث الدروس',
    EN: '🎧 Latest Ders',
  },
  randomMuhadaraTitle: {
    AM: '🔀 Random Muhadara (በዘፈቀደ የተመረጠ)',
    AR: '🔀 محاضرة عشوائية',
    EN: '🔀 Random Muhadara',
  },
  listenAnother: {
    AM: 'Listen to another (ሌላ ሙሓደራ ያዳምጡ)',
    AR: 'استمع لمحاضرة أخرى',
    EN: 'Listen to another lecture',
  },
  play: {
    AM: '▶ Play',
    AR: '▶ تشغيل',
    EN: '▶ Play',
  },
  pause: {
    AM: 'Pause',
    AR: 'إيقاف',
    EN: 'Pause',
  },
  openKitab: {
    AM: 'ኪታብ ክፈት',
    AR: 'افتح الكتاب',
    EN: 'Open Kitab',
  },
  videos: {
    AM: 'ቪዲዮዎች',
    AR: 'مرئيات',
    EN: 'Videos',
  },

  // Contact Page
  contactTitle: {
    AM: '📞 Contact (ስለ ቀልባችን)',
    AR: '📞 اتصل بنا (عن قلوبنا)',
    EN: '📞 Contact (Sle Qelbachn)',
  },
  verifiedSocials: {
    AM: 'ይፋዊ ሶሻል ሚዲያ አድራሻዎች',
    AR: 'حسابات التواصل الرسمية',
    EN: 'Official Social Media Accounts',
  },
  sendMessageTitle: {
    AM: 'መልእክት ይላኩ (Send a Message)',
    AR: 'أرسل رسالة',
    EN: 'Send a Message',
  },
  yourName: {
    AM: 'ስምዎ (Your Name) *',
    AR: 'الاسم *',
    EN: 'Your Name *',
  },
  yourContact: {
    AM: 'ኢሜይል ወይም ስልክ (Email / Phone)',
    AR: 'البريد أو الهاتف',
    EN: 'Email or Phone',
  },
  yourMessage: {
    AM: 'መልእክትዎ (Message) *',
    AR: 'الرسالة *',
    EN: 'Message *',
  },
  btnSendMessage: {
    AM: 'መልእክት ላክ (Send Message)',
    AR: 'إرسال الرسالة',
    EN: 'Send Message',
  },
  messageSuccess: {
    AM: 'መልእክትዎ በስኬት ደርሶናል!',
    AR: 'تم استلام رسالتك بنجاح!',
    EN: 'Your message has been received successfully!',
  },

  // Footer & Common
  languageLabel: {
    AM: 'ቋንቋ / Language',
    AR: 'اللغة',
    EN: 'Language',
  },
  rightsReserved: {
    AM: 'ሁሉም መብቱ በሕግ የተጠበቀ ነው።',
    AR: 'جميع الحقوق محفوظة.',
    EN: 'All rights reserved.',
  },
};
