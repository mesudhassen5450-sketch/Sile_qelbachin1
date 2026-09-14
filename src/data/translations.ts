export type Language = 'AM' | 'AR' | 'EN';

export const translations: Record<string, Record<Language, string>> = {
  // Navigation
  navHome: {
    AM: 'መነሻ',
    AR: 'الرئيسية',
    EN: 'Home',
  },
  navKitab: {
    AM: 'ኪታብ',
    AR: 'الكتب',
    EN: 'Kitab',
  },
  navAudioLecture: {
    AM: 'የድምፅ ትምህርቶች',
    AR: 'المحاضرات الصوتية',
    EN: 'Audio Lectures',
  },
  navEducationalSubpages: {
    AM: 'ትምህርታዊ ክፍሎች',
    AR: 'الأقسام التعليمية',
    EN: 'Educational Sections',
  },
  navContact: {
    AM: 'ግንኙነት',
    AR: 'اتصل بنا',
    EN: 'Contact',
  },

  // Subpage Dropdown Items
  subReminders: {
    AM: 'ማስታወሻዎች',
    AR: 'تذكيرات إسلامية',
    EN: 'Islamic Reminders',
  },
  subRemindersAm: {
    AM: 'ማስታወሻዎች',
    AR: 'تذكيرات',
    EN: 'Reminders',
  },
  subKnowledge: {
    AM: 'ቁርኣንና ሐዲሥ',
    AR: 'القرآن والحديث',
    EN: "Qur'an & Hadith",
  },
  subKnowledgeAm: {
    AM: 'ዕውቀት',
    AR: 'معرفة',
    EN: 'Knowledge',
  },
  subSahabah: {
    AM: 'የሶሓቦች ታሪክ',
    AR: 'قصص الصحابة',
    EN: 'Sahabah Lessons',
  },
  subSahabahAm: {
    AM: 'የሶሓቦች ታሪክ',
    AR: 'قصص الصحابة',
    EN: 'Sahabah Stories',
  },
  subMuhadara: {
    AM: 'ሙሓደራዎች',
    AR: 'محاضرات عامة',
    EN: 'General Muhadara',
  },
  subMuhadaraAm: {
    AM: 'ሙሓደራዎች',
    AR: 'محاضرات',
    EN: 'Lectures',
  },
  subVideos: {
    AM: 'ቪዲዮዎች',
    AR: 'دروس مرئية',
    EN: 'Video Lessons',
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
    AM: 'የኪታብ ድርሶች',
    AR: 'دروس الكتب',
    EN: 'Kitab Audio Lessons',
  },
  heroBtnMuhadara: {
    AM: 'ሙሓደራ ያዳምጡ',
    AR: 'استمع للمحاضرة',
    EN: 'Listen to Muhadara',
  },
  heroBtnTelegram: {
    AM: 'ቴሌግራም ይቀላቀሉ',
    AR: 'انضم للتليجرام',
    EN: 'Join Telegram',
  },
  heroListenAudio: {
    AM: 'የድምፅ ትምህርቶችን ያዳምጡ',
    AR: 'استمع للمحاضرات الصوتية',
    EN: 'Listen to Audio Lectures',
  },
  heroExploreKitab: {
    AM: 'ኪታቦችን ይመልከቱ',
    AR: 'استكشف الكتب',
    EN: 'Explore Kitab',
  },
  heroTelegramChannel: {
    AM: 'የቴሌግራም ቻናል',
    AR: 'قناة التليجرام',
    EN: 'Telegram Channel',
  },

  // Editorial Purpose Section ("ስለ ቀልባችን…")
  purposeTitle: {
    AM: 'ስለ ቀልባችን…',
    AR: 'عن قلوبنا…',
    EN: 'About Our Hearts…',
  },

  // Live Audio Section
  liveNow: {
    AM: 'አሁን በቀጥታ',
    AR: 'مباشر الآن',
    EN: 'Live Now',
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
    AM: 'የሚመጡ የቀጥታ መርሃ-ግብሮች',
    AR: 'المحاضرات القادمة',
    EN: 'Upcoming Live Broadcasts',
  },
  previousLectures: {
    AM: 'ያለፉ የተቀረፁ ትምህርቶች',
    AR: 'المحاضرات السابقة',
    EN: 'Previous Lectures Archive',
  },

  // Section Headers
  featuredKitabLabel: {
    AM: 'ተመራጭ ኪታብ',
    AR: 'كتب مختارة',
    EN: 'Featured Kitab',
  },
  featuredKitab: {
    AM: 'ተመራጭ ኪታቦች',
    AR: 'الكتب المختارة',
    EN: 'Featured Kitab',
  },
  viewAllKitabs: {
    AM: 'ሁሉንም ኪታቦች ይመልከቱ',
    AR: 'عرض جميع الكتب',
    EN: 'View All Kitabs',
  },
  latestDers: {
    AM: 'የቅርብ ጊዜ ድርሶች',
    AR: 'أحدث الدروس',
    EN: 'Latest Ders',
  },
  popularAudioLabel: {
    AM: 'ተመራጭ ድምጽ',
    AR: 'صوتيات مختارة',
    EN: 'Popular Audio',
  },
  popularAudio: {
    AM: 'ታዋቂ የድምፅ ትምህርቶች',
    AR: 'المحاضرات الصوتية الشائعة',
    EN: 'Popular Audio Teachings',
  },
  viewAllAudio: {
    AM: 'ሁሉንም ድምጾች ይመልከቱ',
    AR: 'عرض جميع الصوتيات',
    EN: 'View All Audio',
  },
  exploreSite: {
    AM: 'ጣቢያውን ይዳስሱ',
    AR: 'استكشف الموقع',
    EN: 'Explore the site',
  },
  mainSections: {
    AM: 'የስለ ቀልባችን ዋና ክፍሎች',
    AR: 'الأقسام الرئيسية',
    EN: 'Main sections of Sle Qelbachin',
  },
  openSection: {
    AM: 'ክፈት',
    AR: 'افتح',
    EN: 'Open',
  },
  viewReminders: {
    AM: 'ተጨማሪ ማስታወሻዎችን ያንብቡ',
    AR: 'اقرأ المزيد من التذكيرات',
    EN: 'Read More Reminders',
  },
  readSahabah: {
    AM: 'ታሪካቸውንና ትምህርቱን ያንብቡ',
    AR: 'اقرأ السيرة والدروس',
    EN: 'Read Biography & Lessons',
  },
  spotlight: {
    AM: 'የቁርኣንና የሐዲሥ ብርሃን',
    AR: 'قبسات من القرآن والسنة',
    EN: "Qur'an & Hadith Spotlight",
  },
  viewKnowledge: {
    AM: 'ወደ እስላማዊ እውቀቶች',
    AR: 'استكشف المعرفة الإسلامية',
    EN: 'Explore Islamic Knowledge',
  },
  randomMuhadaraTitle: {
    AM: 'በዘፈቀደ የተመረጠ ሙሓደራ',
    AR: 'محاضرة عشوائية',
    EN: 'Random Muhadara',
  },
  listenAnother: {
    AM: 'ሌላ ሙሓደራ ያዳምጡ',
    AR: 'استمع لمحاضرة أخرى',
    EN: 'Listen to another lecture',
  },
  play: {
    AM: 'አጫውት',
    AR: 'تشغيل',
    EN: 'Play',
  },
  pause: {
    AM: 'አቁም',
    AR: 'إيقاف',
    EN: 'Pause',
  },
  playAudio: {
    AM: 'ድምጽ አጫውት',
    AR: 'تشغيل الصوت',
    EN: 'Play Audio',
  },
  pauseAudio: {
    AM: 'ድምጽ አቁም',
    AR: 'إيقاف الصوت',
    EN: 'Pause Audio',
  },
  openKitab: {
    AM: 'ኪታብ ክፈት',
    AR: 'افتح الكتاب',
    EN: 'Open Kitab',
  },
  dersCount: {
    AM: 'ድርስ',
    AR: 'دروس',
    EN: 'Ders',
  },
  mainNavigation: {
    AM: 'ዋና ገጾች',
    AR: 'التنقل الرئيسي',
    EN: 'Main Navigation',
  },
  footerBlessing: {
    AM: 'በአላህ ፈቃድ ለቀልብ ጥራት የቀረበ መድረክ',
    AR: 'منصة لصفاء القلب بإذن الله',
    EN: 'A platform for heart purification, by the will of Allah',
  },
  videos: {
    AM: 'ቪዲዮዎች',
    AR: 'مرئيات',
    EN: 'Videos',
  },

  // Contact Page
  contactTitle: {
    AM: 'ግንኙነት',
    AR: 'اتصل بنا',
    EN: 'Contact',
  },
  verifiedSocials: {
    AM: 'ይፋዊ ሶሻል ሚዲያ አድራሻዎች',
    AR: 'حسابات التواصل الرسمية',
    EN: 'Official Social Media Accounts',
  },
  sendMessageTitle: {
    AM: 'መልእክት ይላኩ',
    AR: 'أرسل رسالة',
    EN: 'Send a Message',
  },
  yourName: {
    AM: 'ስምዎ *',
    AR: 'الاسم *',
    EN: 'Your Name *',
  },
  yourContact: {
    AM: 'ኢሜይል ወይም ስልክ',
    AR: 'البريد أو الهاتف',
    EN: 'Email or Phone',
  },
  yourMessage: {
    AM: 'መልእክትዎ *',
    AR: 'الرسالة *',
    EN: 'Message *',
  },
  btnSendMessage: {
    AM: 'መልእክት ላክ',
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
    AM: 'ቋንቋ',
    AR: 'اللغة',
    EN: 'Language',
  },
  rightsReserved: {
    AM: 'ሁሉም መብቱ በሕግ የተጠበቀ ነው።',
    AR: 'جميع الحقوق محفوظة.',
    EN: 'All rights reserved.',
  },
  joinTelegramBanner: {
    AM: 'የቴሌግራም ቻናሉን ይቀላቀሉ',
    AR: 'انضم إلى قناة التليجرام',
    EN: 'Join the Telegram Channel',
  },
  telegramBannerSub: {
    AM: 'ዕለታዊ የቁርኣን፣ የሐዲሥና የኪታብ ድርሶችን በቴሌግራም ቻናላችን ይከታተሉ',
    AR: 'تابع دروس القرآن والحديث والكتب يومياً على قناتنا في تليجرام',
    EN: 'Follow daily Qur’an, Hadith, and kitab lessons on our Telegram channel',
  },
  appComingSoonBadge: {
    AM: 'በቅርቡ · Stay Tuned',
    AR: 'قريباً · تابعونا',
    EN: 'Coming Soon · Stay Tuned',
  },
  appComingSoonTitle: {
    AM: 'የስለ ቀልባችን ሞባይል መተግበሪያ',
    AR: 'تطبيق سله قلباشن للهاتف',
    EN: 'Sile Qelbachin Mobile App',
  },
  appComingSoonBody: {
    AM: 'ለዲጂታል ዘመን የተዘጋጀ ሙሉ የእስልምና መተግበሪያ — ቂብላ፣ ቁርኣን፣ አዛን፣ ማስታወሻ፣ ድርስ፣ ኪታብ እና ዓለም አቀፍ ባህሪያት በአንድ ቦታ።',
    AR: 'تطبيق إسلامي رقمي متكامل — القبلة، القرآن، الأذان، التذكير، الدروس، الكتب، وميزات عالمية في مكان واحد.',
    EN: 'A digital Islamic companion — Qibla, Qur’an, Azan, reminders, ders, kitab, and international features in one app.',
  },
  appFeatureQibla: {
    AM: 'ቂብላ',
    AR: 'القبلة',
    EN: 'Qibla',
  },
  appFeatureQuran: {
    AM: 'ቁርኣን',
    AR: 'القرآن',
    EN: 'Qur’an',
  },
  appFeatureAzan: {
    AM: 'አዛን',
    AR: 'الأذان',
    EN: 'Azan',
  },
  appFeatureReminder: {
    AM: 'ማስታወሻ',
    AR: 'تذكير',
    EN: 'Reminder',
  },
  appFeatureDers: {
    AM: 'ድርስ',
    AR: 'دروس',
    EN: 'Ders',
  },
  appFeatureKitab: {
    AM: 'ኪታብ',
    AR: 'كتب',
    EN: 'Kitab',
  },
  appFeatureGlobal: {
    AM: 'ዓለም አቀፍ ባህሪያት',
    AR: 'ميزات عالمية',
    EN: 'International features',
  },
  appNotifyHint: {
    AM: 'ለማስታወቂያው በቴሌግራም ቻናላችን ይከታተሉ',
    AR: 'تابع قناتنا على تليجرام لمعرفة موعد الإطلاق',
    EN: 'Follow our Telegram channel for the launch update',
  },
  liveStayTunedBadge: {
    AM: 'በቅርቡ · Stay Tuned',
    AR: 'قريباً · تابعونا',
    EN: 'Coming Soon · Stay Tuned',
  },
  liveStayTunedTitle: {
    AM: 'LIVE AUDIO CHAT',
    AR: 'بث صوتي مباشر',
    EN: 'LIVE AUDIO CHAT',
  },
  liveStayTunedStyle: {
    AM: 'Telegram / TikTok Style',
    AR: 'بأسلوب تليجرام / تيك توك',
    EN: 'Telegram / TikTok Style',
  },
  liveStayTunedBody: {
    AM: 'የሳምንቱ የቀጥታ የቁርኣንና ሐዲሥ መርሃግብር — በድህረ ገጹ ላይ ሲጀመር እዚህ ይታያል።',
    AR: 'البرنامج الأسبوعي المباشر للقرآن والحديث — سيظهر هنا عند الإطلاق على الموقع.',
    EN: 'Weekly live Qur’an & Hadith program — will appear here on the website when it launches.',
  },
  liveNotActiveYet: {
    AM: 'አሁን ቀጥታ ስርጭት የለም — ሲዘጋጅ በእውነት ይታያል።',
    AR: 'لا يوجد بث مباشر الآن — سيُعلن بصدق عند الجاهزية.',
    EN: 'No live session right now — it will appear only when it is truly ready.',
  },
  liveFeatureTitle: {
    AM: 'የቀጥታ ድርስ ባህሪ (Coming Soon)',
    AR: 'ميزة الدرس المباشر (قريباً)',
    EN: 'Live Ders Feature (Coming Soon)',
  },
  liveFeatureBody: {
    AM: 'ይህ ገጽ አሁን የተቀረጹ ድርሶችን ብቻ ያቀርባል። የቀጥታ የድምፅ ክፍል ሲዘጋጅ እውነተኛ ስርጭት ብቻ እንደሚታይ እናሳውቃለን — ሐሰተኛ LIVE አናሳይም።',
    AR: 'هذه الصفحة تعرض الدروس المسجلة فقط الآن. عند جاهزية البث المباشر سنعلنه بصدق ولن نعرض حالة LIVE وهمية.',
    EN: 'This page currently offers recorded ders only. When live audio is ready we will announce it honestly — no fake LIVE status.',
  },
  audioArchives: {
    AM: 'የድምፅ ድርሶች',
    AR: 'الأرشيف الصوتي',
    EN: 'Audio Archives',
  },
  kitabPdfs: {
    AM: 'የኪታብ PDF ፋይሎች',
    AR: 'ملفات الكتب PDF',
    EN: 'Kitab PDFs',
  },
  officialCommunity: {
    AM: 'ይፋዊ ማህበረሰብ',
    AR: 'المجتمع الرسمي',
    EN: 'Official Community',
  },
  aiAskButton: {
    AM: 'ስለ ቀልባችን AI ይጠይቁ',
    AR: 'اسأل مساعد سله قيلباتشن',
    EN: 'Ask Sile Qelbachin AI',
  },
  aiTitle: {
    AM: 'ስለ ቀልባችን AI',
    AR: 'مساعد سله قيلباتشن',
    EN: 'Sile Qelbachin AI',
  },
  aiSubtitle: {
    AM: 'የእስልምና ዕውቀት ረዳት',
    AR: 'مساعد المعرفة الإسلامية',
    EN: 'Islamic Knowledge Helper',
  },
  aiExplore: {
    AM: 'በስለ ቀልባችን ያለውን ዕውቀት ይዳስሱ',
    AR: 'استكشف المعرفة المتوفرة في سله قيلباتشن',
    EN: 'Explore the knowledge available on Sle Qelbachin',
  },
  aiQuickActions: {
    AM: 'ፈጣን እርምጃዎች',
    AR: 'إجراءات سريعة',
    EN: 'Quick Actions',
  },
  aiPlaceholder: {
    AM: 'ስለ ኪታብ፣ ድምጽ ወይም እስላማዊ ይዘት ይጠይቁ...',
    AR: 'اسأل عن الكتب أو الصوتيات أو المحتوى الإسلامي...',
    EN: 'Ask about Kitabs, audio, or Islamic content...',
  },
  aiEmpty: {
    AM: 'ስለ ኪታቦች፣ የድምፅ ትምህርቶች፣ ሙሓደራ ወይም በዚህ ጣቢያ ስለሚገኝ ማንኛውም እስላማዊ ይዘት ይጠይቁኝ።',
    AR: 'اسألني عن الكتب والمحاضرات الصوتية أو أي محتوى إسلامي في هذا الموقع.',
    EN: 'Ask me about Kitabs, audio lectures, Muhadara, or any Islamic content on this website.',
  },
  aiThinking: {
    AM: 'እያሰብኩ ነው...',
    AR: 'جارٍ التفكير...',
    EN: 'Thinking...',
  },

  downloadPdf: {
    AM: 'PDF አውርድ',
    AR: 'تنزيل PDF',
    EN: 'Download PDF',
  },
  downloadAudio: {
    AM: 'ድምፅ አውርድ',
    AR: 'تنزيل الصوت',
    EN: 'Download audio',
  },
  kitabLibraryLabel: {
    AM: 'የእስልምና መጻሕፍት ቤት',
    AR: 'مكتبة الكتب الإسلامية',
    EN: 'Islamic Books Library',
  },
  kitabCollectionTitle: {
    AM: 'ሙሉ የኪታብ ስብስብ',
    AR: 'مجموعة الكتب الكاملة',
    EN: 'Complete Kitab Collection',
  },
  kitabCollectionIntro: {
    AM: 'ሙሉ የእስልምና መጻሕፍት ስብስባችንን ከድምፅ ድርሶችና ከ PDF ሰነዶች ጋር ይመልከቱ። እያንዳንዱ ኪታብ በርካታ ክፍሎች (ድርስ) አሉት።',
    AR: 'استكشف مجموعتنا الكاملة من الكتب الإسلامية مع الدروس الصوتية وملفات PDF. يحتوي كل كتاب على عدة أجزاء.',
    EN: 'Explore our complete collection of Islamic books with audio lectures and PDF documents. Each Kitab contains multiple parts (Ders).',
  },
  kitabAudioSeries: {
    AM: 'የድምፅ ተከታታይ',
    AR: 'السلاسل الصوتية',
    EN: 'Audio Series',
  },
  kitabPdfDocuments: {
    AM: 'የ PDF ሰነዶች',
    AR: 'وثائق PDF',
    EN: 'PDF Documents',
  },
  kitabAudioSeriesCount: {
    AM: 'የኪታብ ድምፅ ተከታታዮች',
    AR: 'سلاسل الكتب الصوتية',
    EN: 'Kitab Audio Series',
  },
  kitabTotalLessons: {
    AM: 'ጠቅላላ የድምፅ ድርሶች',
    AR: 'إجمالي الدروس الصوتية',
    EN: 'Total Audio Lessons',
  },
  kitabAllAudioAmharic: {
    AM: 'ሁሉም የድምፅ ድርሶች በአማርኛ',
    AR: 'جميع الدروس الصوتية بالأمهرية',
    EN: 'All audio lessons in Amharic',
  },
  kitabAllSeries: {
    AM: 'ሁሉም የኪታብ ድምፅ ተከታታዮች',
    AR: 'جميع السلاسل الصوتية',
    EN: 'All Kitab Audio Series',
  },
  kitabSeriesCount: {
    AM: 'ተከታታይ',
    AR: 'سلاسل',
    EN: 'series',
  },
  kitabStartJourney: {
    AM: 'የትምህርት ጉዞዎን ይጀምሩ',
    AR: 'ابدأ رحلتك التعليمية',
    EN: 'Start Your Learning Journey',
  },
  kitabStartJourneyBody: {
    AM: 'ከላይ ያለውን ማንኛውንም ኪታብ ይምረጡና የድምፅ ድርሶቹን ማዳመጥ ይጀምሩ። እያንዳንዱ ተከታታይ እውቀትዎን በቅደም ተከተል እንዲገነቡ ተዘጋጅቷል።',
    AR: 'اختر أي كتاب أعلاه وابدأ الاستماع إلى الدروس الصوتية. كل سلسلة مبنية لتتقدم معرفتك تدريجياً.',
    EN: 'Select any Kitab above to begin listening to the audio lectures. Each series is structured to build your knowledge progressively.',
  },
  kitabPdfLibrary: {
    AM: 'የኪታብ PDF ቤተ-መጻሕፍት',
    AR: 'مكتبة ملفات PDF',
    EN: 'Kitab PDF Library',
  },
  kitabPdfSubtitle: {
    AM: 'ሙሉ የእስልምና መጻሕፍት በ PDF',
    AR: 'كتب إسلامية كاملة بصيغة PDF',
    EN: 'Complete Islamic books in PDF format',
  },
  kitabPdfAvailable: {
    AM: 'ለንባብና ለማውረድ ዝግጁ',
    AR: 'متاحة للقراءة والتنزيل',
    EN: 'Available for reading & download',
  },
  kitabNoPdfs: {
    AM: 'እስካሁን የ PDF ሰነድ የለም',
    AR: 'لا توجد ملفات PDF حالياً',
    EN: 'No PDF Documents Available Yet',
  },
  kitabNoPdfsBody: {
    AM: 'የ PDF ሰነዶች በቅርቡ ይጨመራሉ።',
    AR: 'ستُضاف ملفات PDF قريباً.',
    EN: 'PDF documents will be added soon. Check back later.',
  },
  kitabReadPdf: {
    AM: 'PDF አንብብ',
    AR: 'اقرأ PDF',
    EN: 'Read PDF',
  },
  kitabBackToLibrary: {
    AM: 'ወደ ኪታቦች ዝርዝር ተመለስ',
    AR: 'العودة إلى مكتبة الكتب',
    EN: 'Back to Kitab Library',
  },
  kitabAudioLectures: {
    AM: 'የድምፅ ድርሶች',
    AR: 'المحاضرات الصوتية',
    EN: 'Audio Lectures',
  },
  kitabPdfDocument: {
    AM: 'የኪታብ PDF ፋይል',
    AR: 'ملف الكتاب PDF',
    EN: 'PDF Document',
  },
  kitabPdfFollowAlong: {
    AM: 'ትምህርቱን በፅሁፍ እየተከታተሉ ለማዳመጥ ፒዲኤፉን እዚህ ያንብቡ ወይም ያውርዱ።',
    AR: 'اقرأ أو نزّل ملف PDF لمتابعة الدرس مع النص.',
    EN: 'Read or download the PDF to follow the lesson in writing.',
  },
  kitabDualPane: {
    AM: 'ድርሶችና ፒዲኤፍ በአንድ ላይ',
    AR: 'عرض الدروس وPDF معاً',
    EN: 'Dual Pane View',
  },
  kitabPdfOnly: {
    AM: 'PDF ብቻ',
    AR: 'PDF فقط',
    EN: 'PDF Only',
  },
  kitabRelatedLessons: {
    AM: 'የተያያዙ የድምፅ ድርሶች',
    AR: 'الدروس الصوتية المرتبطة',
    EN: 'Audio Lessons Playlist',
  },
  kitabTracks: {
    AM: 'ትራኮች',
    AR: 'مقاطع',
    EN: 'Tracks',
  },
  kitabLessons: {
    AM: 'ድርሶች',
    AR: 'دروس',
    EN: 'Lessons',
  },
  kitabSplitSide: {
    AM: 'ጎን ለጎን',
    AR: 'جنباً إلى جنب',
    EN: 'Side by side',
  },
  kitabSplitStacked: {
    AM: 'ከላይ ወደ ታች',
    AR: 'فوق وتحت',
    EN: 'Stacked',
  },
  kitabPdfUnavailable: {
    AM: 'PDF እስካሁን አልተገኘም',
    AR: 'ملف PDF غير متوفر حالياً',
    EN: 'PDF is not available yet',
  },
  kitabResizeHint: {
    AM: 'ለመጠን መቀየር ይጎትቱ — ሁለቴ ጠቅ ማድረግ PDFን ያሰፋል',
    AR: 'اسحب لتغيير الحجم — انقر مرتين لتوسيع PDF',
    EN: 'Drag to resize — double-click to expand PDF',
  },
  kitabExpandPdf: {
    AM: 'PDF አስፋ',
    AR: 'توسيع PDF',
    EN: 'Expand PDF',
  },
  kitabCollapsePdf: {
    AM: 'አጥብቅ',
    AR: 'طيّ',
    EN: 'Collapse',
  },
  sahabahBiography: {
    AM: 'የሕይወት ታሪክና ገድል',
    AR: 'السيرة والمناقب',
    EN: 'Biography',
  },
  sahabahKeyLessons: {
    AM: 'ከታሪካቸው የምንወስዳቸው ዋና ዋና ትምህርቶች',
    AR: 'دروس مستفادة من سيرتهم',
    EN: 'Key Lessons',
  },
  sahabahBack: {
    AM: 'ወደ ሶሓቦች ታሪክ ተመለስ',
    AR: 'العودة إلى قصص الصحابة',
    EN: 'Back to Sahabah List',
  },
};
