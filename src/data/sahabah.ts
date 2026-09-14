import { LocalizedString } from '@/context/LanguageContext';

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

export const sahabahData: Sahabah[] = [
  {
    slug: 'abu-bakr-al-siddiq',
    name: {
      am: 'አቡ በክር አል-ሲዲቅ (ረ.ዐ)',
      ar: 'أبو بكر الصديق رضي الله عنه',
      en: 'Abu Bakr Al-Siddiq (R.A)',
    },
    title: {
      am: 'የመጀመሪያው ኸሊፋ — (632 – 634 እ.ኤ.አ / 11 – 13 ሂጅሪ)',
      ar: 'الخليفة الأول — (١١–١٣ هـ / ٦٣٢–٦٣٤ م)',
      en: 'First Caliph — (11–13 AH / 632–634 CE)',
    },
    reign: {
      am: '632 – 634 እ.ኤ.አ / 11 – 13 ሂጅሪ',
      ar: '١١–١٣ هـ / ٦٣٢–٦٣٤ م',
      en: '11–13 AH / 632–634 CE',
    },
    shortDescription: {
      am: 'ከነቢያት በኋላ ከሰዎች ሁሉ የተሻለው፣ የመጀመሪያው አዋቂ ወንድ እምነት ተቀባይ፣ እና የነቢዩ (ሶ.ዐ.ወ) የስደት አጋር።',
      ar: 'خير الناس بعد الأنبياء، أول من آمن من الرجال، وصاحب رسول الله في الهجرة.',
      en: 'The best of people after the Prophets, the first adult male to embrace Islam, and the Prophet’s companion in the Hijrah.',
    },
    fullBiography: {
      am: 'አቡ በክር አል-ሲዲቅ (ረ.ዐ) እውነተኛ ስማቸው ዐብዱላህ ኢብኑ አቢ ቁሓፋ ነው። ከቁሬሽ ነገድ “ባኑ ተይም” ቤተሰብ የተወለዱ፣ በታማኝነታቸው “አል-ሲዲቅ” እና በነቢዩ ቃል “ዐቲቅ” የተባሉ ታላቅ ሶሓቢ ናቸው። የመጀመሪያው ኸሊፋ ሆነው የሪዳህ ጦርነቶችን በጽናት መርተው፣ የመጀመሪያውን የቁርኣን ስብስብ አዘጋጅተው፣ የእስልምናን አንድነት ጠብቀዋል።',
      ar: 'أبو بكر الصديق رضي الله عنه اسمه عبد الله بن أبي قحافة، من بني تيم من قريش، لُقّب بالصديق والعتيق. كان أول الخلفاء الراشدين، قاد حروب الردة، وأمر بجمع القرآن أول مرة، وحفظ وحدة الأمة.',
      en: 'Abu Bakr Al-Siddiq (R.A), born Abdullah ibn Abi Quhafah of Banu Taym of Quraysh, known as As-Siddiq and Al-Atiq. As the first Rightly Guided Caliph he led the Ridda wars, commissioned the first compilation of the Qur’an, and preserved the unity of the Ummah.',
    },
    sections: [
      {
        title: {
          am: '1. ግላዊ ታሪክ፣ ስብእና እና ከእስልምና በፊት',
          ar: '١. نسبه وشخصيته قبل الإسلام',
          en: '1. Personal history, character, and life before Islam',
        },
        body: {
          am: `ሙሉ ስምና ትውልድ: እውነተኛ ስማቸው ዐብዱላህ ኢብኑ አቢ ቁሓፋ ነው። የተወለዱት ከመካው የቁሬሽ ነገድ ስር ከሚመደበው "ባኑ ተይም" ከሚባል የተከበረ ቤተሰብ ነው።

"አል-ሲዲቅ" እና "ዐቲቅ" የሚሉ መጠሪያዎች:
• አል-ሲዲቅ (እውነተኛው): ነቢዩ ሙሐመድ (ሶ.ዐ.ወ) ስለ እሰራእ እና ሚዕራጅ በተናገሩ ጊዜ፣ መካውያን ሲያፌዙ አቡ በክር ግን ያለ ምንም ጥርጥር በመቀበላቸው ይህን ማዕረግ አገኙ።
• ዐቲቅ (ከእሳት ነፃ የወጣ): ነቢዩ (ሶ.ዐ.ወ) "አንተ ከአላህ የእሳት ቅጣት ነፃ የወጣህ ነህ" ብለዋቸው ነበር።

ከእስልምና በፊት: ሀብታም ነጋዴ፣ የቁሬሽን የትውልድ ሀረግ ጠንቅቀው የሚያውቁ፣ ለምክር የሚያጧቸው፣ እና መጥፎ ልማዶችን (እንደ ጠጅ መጠጣትና ጣኦት ማምለክ) ይጸየፉ የነበሩ ሰው ናቸው።`,
          ar: `اسمه عبد الله بن أبي قحافة، من بني تيم من قريش الشريفة.

لقباه الصديق والعتيق:
• الصديق: لتصديقه المطلق خبر الإسراء والمعراج حين سخر منه أهل مكة.
• العتيق: لقول النبي صلى الله عليه وسلم إنه عتيق من النار.

قبل الإسلام كان تاجراً شريفاً، عارفاً بأنساب قريش، يُقصد للمشورة، ويكره الخمر وعبادة الأصنام.`,
          en: `His given name was Abdullah ibn Abi Quhafah, from the noble Banu Taym clan of Quraysh.

Titles:
• As-Siddiq (the Truthful): for immediately affirming the Night Journey and Ascension when Makkans mocked it.
• Al-Atiq (freed from the Fire): for the Prophet’s words that he was freed from the Fire.

Before Islam he was a respected wealthy merchant, an expert in Quraysh genealogy, sought for counsel, and averse to wine and idol worship.`,
        },
      },
      {
        title: {
          am: '2. ለእስልምና የዋሉት ታላቅ መስዋዕትነት',
          ar: '٢. تضحياته العظيمة للإسلام',
          en: '2. Great sacrifices for Islam',
        },
        body: {
          am: `የመጀመሪያው ወንድ እምነት ተቀባይ: ነቢዩ ሙሐመድ (ሶ.ዐ.ወ) የእስልምናን ጥሪ ሲያቀርቡላቸው፣ ምንም ማንራራት ሳያደርጉ ወዲያውኑ የተቀበሉ የመጀመሪያው አዋቂ ወንድ ናቸው።

የዳዕዋ ፍሬዎች: በእሳቸው ምክንያት ካመኑት መካከል ከጀነት ከተበሰሩት አስር ሶሃባዎች አምስቱ — ዑስማን፣ ዙበይር፣ ጦልሐ፣ ዐብዱር-ረሕማን ኢብኑ ዐውፍ እና ሰዕድ ኢብኑ አቢ ወቃስ — ይገኙበታል።

ሀብታቸውን መስጠት: እንደ ቢላል ኢብኑ ረባህ ያሉ ባሪያዎችን ነፃ አውጥተዋል፤ ለተቡክ ዘመቻ ሀብታቸውን ሙሉ በሙሉ ሰጥተዋል። ነቢዩም "አላህ ሀብቱን እንደ አቡ በክር የጠቀመኝ ሰው የለም" ብለዋል።

የሂጅራ አጋር: ከነቢዩ ጋር በሠውር ዋሻ ውስጥ የነበሩ ብቸኛ አጋር ናቸው። ቁርኣን በሱረቱ አት-ተውባህ (9:40) ላይ "...አትዘን አላህ ከእኛ ጋር ነውና" በማለት ታላቅነታቸውን መስክሯል።`,
          ar: `أول من آمن من الرجال بلا تردد.

بسبب دعوته أسلم خمسة من العشرة المبشرين بالجنة: عثمان والزبير وطلحة وعبد الرحمن بن عوف وسعد بن أبي وقاص.

أنفق ماله في فك رقاب العبيد كبلال، وقدم ماله كله في تبوك. قال النبي: ما نفعني مال أحد ما نفعني مال أبي بكر.

صاحب النبي في غار ثور، وشهد القرآن بفضله في التوبة:٤٠.`,
          en: `He was the first adult male to accept Islam without hesitation.

Through his da‘wah, five of the ten promised Paradise embraced Islam: Uthman, Zubayr, Talhah, Abdur-Rahman ibn Awf, and Sa‘d ibn Abi Waqqas.

He freed enslaved believers such as Bilal and gave all his wealth for Tabuk. The Prophet said no one’s wealth benefited him like Abu Bakr’s.

He alone shared the Cave of Thawr with the Prophet; Qur’an 9:40 honors him.`,
        },
      },
      {
        title: {
          am: '3. የኸሊፋነት መረጣ እና አመራር',
          ar: '٣. اختياره للخلافة وقيادته',
          en: '3. Selection as Caliph and leadership',
        },
        body: {
          am: `የነቢዩ ህልፈት እና ድንጋጤ: አቡ በክር በመረጋጋት፦ "ሙሐመድን የሚያመልክ የነበረ ሰው ከሆነ ሙሐመድ በእርግጥ ሞተዋል፤ አላህን የሚያመልክ ከሆነ ግን አላህ ህያው ነው አይሞትም!" ብለው ተናገሩ።

የሰቂፋ ስብሰባ: በ"ሰቂፋ በኒ ሳዒዳህ" በአንሳሮችና በሙሃጂሮች መካከል ክርክር ሲነሳ፣ በዑመር ድጋፍ እና በህዝቡ ፍቃደኝነት የመጀመሪያው ኸሊፋ ሆነው ተመረጡ።`,
          ar: `عند وفاة النبي ثبّت الناس بقوله: من كان يعبد محمداً فإن محمداً قد مات، ومن كان يعبد الله فإن الله حي لا يموت.

وفي سقيفة بني ساعدة اختير خليفة أول بإجماع المهاجرين والأنصار وبدعم عمر.`,
          en: `At the Prophet’s death he steadied the people: “Whoever worshipped Muhammad, Muhammad has died; whoever worships Allah, Allah is Living and does not die.”

At Saqifah Bani Sa‘idah he was chosen as first Caliph with the support of Umar and the consent of the community.`,
        },
      },
      {
        title: {
          am: '4. ዋና ዋና ታሪካዊ አስተዋጽኦዎች',
          ar: '٤. أبرز إنجازاته التاريخية',
          en: '4. Major historical contributions',
        },
        body: {
          am: `ሀ. የሪዳህ ጦርነቶች: ከነቢዩ ህልፈት በኋላ ያፈነገጡ ነገዶችንና የሐሰት ነቢያትን (እንደ ሙሰይሊማህ) በጽናት ገጥመው አረቢያን በአንድ የእስልምና ባንዲራ ስር መለሱ።

ለ. የመጀመሪያው የቁርኣን ስብስብ: በያማማህ ጦርነት ብዙ ሐፊዞች ሲሰው፣ በዑመር ምክር ዘይድ ኢብኑ ሣቢትን መርጠው የመጀመሪያውን ሙሉ የቁርኣን ግልባጭ አዘጋጁ።

ሐ. ወደ ውጭ ማስፋፋት: ወደ ኢራቅ (በኻሊድ) እና ወደ ሶሪያ/ሻም (በአቡ ዑበይዳህ) ዘመቻዎችን በማስጀመር ለቀጣዩ መስፋፋት መሰረት ጣሉ።`,
          ar: `أ. حروب الردة: قضى على المرتدين ومدّعي النبوة كمسيلمة، وأعاد جزيرة العرب تحت راية الإسلام.

ب. جمع القرآن: بعد استشهاد كثير من الحفاظ في اليمامة أمر زيد بن ثابت بجمع المصحف الأول.

ج. الفتوح: وجّه الجيوش إلى العراق والشام تمهيداً للتوسع الكبير.`,
          en: `a. Ridda wars: he confronted apostate tribes and false prophets such as Musaylimah and reunited Arabia under Islam.

b. First Qur’an compilation: after many memorizers fell at Yamamah, on Umar’s counsel he tasked Zayd ibn Thabit with compiling the first complete mushaf.

c. Expansion: he launched campaigns into Iraq (Khalid) and Syria/Sham (Abu Ubaydah), laying foundations for later conquests.`,
        },
      },
      {
        title: {
          am: '5. እረፍት እና ውርስ',
          ar: '٥. وفاته وإرثه',
          en: '5. Passing and legacy',
        },
        body: {
          am: `አቡ በክር (ረ.ዐ) ለ2 ዓመት ከ3 ወራት ካገለገሉ በኋላ በ634 እ.ኤ.አ (13 ሂጅሪ) አረፉ። ከሞታቸው በፊት ዑመር ኢብኑል ኸጣብን በኸሊፋነት ጠቁመው አልፈዋል። በመስጅድ አል-ነበዊ ከነቢዩ (ሶ.ዐ.ወ) ጎን ተቀብረዋል።`,
          ar: `توفي سنة ١٣ هـ بعد خلافة نحو سنتين وثلاثة أشهر، واستخلف عمر بن الخطاب، ودُفن بجوار النبي في المسجد النبوي.`,
          en: `He passed away in 13 AH / 634 CE after about two years and three months as Caliph. He designated Umar as successor and was buried beside the Prophet in Al-Masjid An-Nabawi.`,
        },
      },
    ],
    keyLessons: [
      {
        am: 'እውነትን ያለ ጥርጥር መቀበል (ሲድቅ) እና በእምነት መጽናት',
        ar: 'التصديق المطلق والثبات على الإيمان',
        en: 'Truthfulness and unwavering faith',
      },
      {
        am: 'ሀብትን ሙሉ በሙሉ ለአላህ መንገድ ማውጣት',
        ar: 'بذل المال كله في سبيل الله',
        en: 'Spending wealth fully in the path of Allah',
      },
      {
        am: 'በችግር ጊዜ ማህበረሰቡን በጥበብና በጽናት መምራት',
        ar: 'قيادة الأمة بالحكمة والحزم في الأزمات',
        en: 'Leading the Ummah with wisdom and firmness in crisis',
      },
    ],
  },
  {
    slug: 'umar-ibn-al-khattab',
    name: {
      am: 'ዑመር ኢብኑል ኸጣብ (ረ.ዐ)',
      ar: 'عمر بن الخطاب رضي الله عنه',
      en: 'Umar ibn Al-Khattab (R.A)',
    },
    title: {
      am: 'ሁለተኛው ኸሊፋ — አል-ፋሩቅ (634 – 644 እ.ኤ.አ / 13 – 23 ሂጅሪ)',
      ar: 'الخليفة الثاني — الفاروق (١٣–٢٣ هـ / ٦٣٤–٦٤٤ م)',
      en: 'Second Caliph — Al-Faruq (13–23 AH / 634–644 CE)',
    },
    reign: {
      am: '634 – 644 እ.ኤ.አ / 13 – 23 ሂጅሪ',
      ar: '١٣–٢٣ هـ / ٦٣٤–٦٤٤ م',
      en: '13–23 AH / 634–644 CE',
    },
    shortDescription: {
      am: 'እውነትን ከሐሰት የሚለይ “አል-ፋሩቅ”፣ የፍትህ ተምሳሌት፣ እና የእስልምና ግዛት ታላቅ መስፋፋት መሪ።',
      ar: 'الفاروق، إمام العدل، وقائد التوسع العظيم للدولة الإسلامية.',
      en: 'Al-Faruq, the exemplar of justice, and leader of Islam’s great expansion.',
    },
    fullBiography: {
      am: 'ዑመር ኢብኑል ኸጣብ (ረ.ዐ) ከባኑ ዐዲይ የተወለዱ፣ በብርታትና በፍትህ የታወቁ፣ የመጀመሪያው “አሚሩል ሙእሚኒን” የተባሉ ኸሊፋ ናቸው። በዘመናቸው ፋርስና ብዙ የቢዛንታይን ግዛት ተከፈተ፤ የዲዋን፣ ቤት አል-ማል፣ የዳኝነትና የሂጅሪ አቆጣጠር ተቋማት ተመሰረቱ።',
      ar: 'عمر بن الخطاب من بني عدي، لُقّب بالفاروق، وهو أول من سُمّي أمير المؤمنين. في عهده فُتحت فارس وكثير من بلاد الروم، وأُسست الدواوين وبيت المال والقضاء والتقويم الهجري.',
      en: 'Umar ibn Al-Khattab of Banu Adiy, titled Al-Faruq, was the first called Amir al-Mu’minin. Under him Persia and much of Byzantine territory were opened, and state institutions—diwans, Bayt al-Mal, judiciary, and the Hijri calendar—were established.',
    },
    sections: [
      {
        title: {
          am: '1. ግላዊ ታሪክ፣ ስብእና እና ከእስልምና በፊት',
          ar: '١. نسبه وشخصيته قبل الإسلام',
          en: '1. Personal history, character, and life before Islam',
        },
        body: {
          am: `ሙሉ ስም: ዑመር ኢብኑል ኸጣብ ኢብኑ ኑፋይል። ከቁሬሽ “ባኑ ዐዲይ” ቤተሰብ የተወለዱ ናቸው።

"አል-ፋሩቅ": ነቢዩ (ሶ.ዐ.ወ) እውነትን ከሐሰት ለይቶ የሚያውቅ ማለት የሆነውን ይህን ማዕረግ ሰጥተዋቸዋል።

ከእስልምና በፊት: በብርታት፣ በቁመት፣ በታጋይነትና በዲፕሎማሲ ይታወቁ ነበር።

የእስልምና መቀበል: መጀመሪያ ላይ እስልምናን ይቃወሙ የነበሩ ሲሆን፣ የእህታቸውን መስለም ሰምተው ሱረቱ ጣሃ ሲሰሙ ልባቸው ተነክቶ እስልምናን ተቀበሉ። የእሳቸው መስለም ሙስሊሞች በመካ በግልጽ እንዲሰግዱ ድፍረት ሰጥቷቸዋል።`,
          ar: `هو عمر بن الخطاب بن نفيل من بني عدي. لقّبه النبي بالفاروق.

قبل الإسلام عُرف بالقوة والشجاعة والدبلوماسية. أسلم بعد سماع سورة طه عند أخته، وكان إسلامه عزاً للإسلام في مكة.`,
          en: `Umar ibn Al-Khattab ibn Nufayl of Banu Adiy was titled Al-Faruq by the Prophet.

Before Islam he was known for strength, stature, courage, and diplomacy. He embraced Islam after hearing Surah Ta-Ha at his sister’s home; his conversion gave Muslims courage to pray openly in Makkah.`,
        },
      },
      {
        title: {
          am: '2. የኸሊፋነት መረጣ',
          ar: '٢. اختياره للخلافة',
          en: '2. Selection as Caliph',
        },
        body: {
          am: `አቡ በክር ከሞታቸው በፊት ከታላላቅ ሶሃባዎች ጋር ከተማከሩ በኋላ ዑመርን በኸሊፋነት ጠቆሙ። "አሚሩል ሙእሚኒን" የሚለውን የክብር ስም ለመጀመሪያ ጊዜ የተቀበሉ ኸሊፋ ናቸው።`,
          ar: `استخلفه أبو بكر بعد مشاورة كبار الصحابة، وهو أول من لُقّب بأمير المؤمنين.`,
          en: `Abu Bakr designated him after consulting senior Companions. He was the first Caliph called Amir al-Mu’minin.`,
        },
      },
      {
        title: {
          am: '3. ዋና ዋና ታሪካዊ አስተዋጽኦዎች',
          ar: '٣. أبرز إنجازاته التاريخية',
          en: '3. Major historical contributions',
        },
        body: {
          am: `ሀ. የግዛት መስፋፋት: የፋርስ ግዛት ሙሉ በሙሉ በቁጥጥር ስር ሲውል፣ የቢዛንታይን አብዛኛው ክፍል ተሸነፈ። በ637 እ.ኤ.አ ኢየሩሳሌም (ቁድስ) በሰላም እጅ ሰጠች፤ "የዑመር ቃል ኪዳን" ተፈረመ። ግብፅ፣ ሶሪያ፣ ዮርዳኖስና ኢራቅ በሙስሊሞች አስተዳደር ስር ገቡ።

ለ. ተቋማትና ህግ: የዲዋን (ሚኒስቴር)፣ ቤት አል-ማል፣ የካዲ/ፖሊስ ስርዓት፣ እና የሂጅሪ አቆጣጠር ለመጀመሪያ ጊዜ ደነገጉ።

ሐ. የፍትህ ምሳሌ: ሌሊት ሌሊት በመዲና እየተዘዋወሩ ድሆችን ይከታተሉ ነበር፤ በራሳቸውና በቤተሰባቸው ላይ ጥብቅ ቁጥጥር ያደርጉ ነበር።`,
          ar: `أ. الفتوح: فتح فارس ومعظم الشام وبيت المقدس بعهد عمر، ومصر والعراق.

ب. المؤسسات: أنشأ الدواوين وبيت المال والقضاء والشرطة والتقويم الهجري.

ج. العدل: كان يتعهد الضعفاء ليلاً، ويحاسب نفسه وأهله أشد المحاسبة.`,
          en: `a. Expansion: Persia fell; much of Byzantium was defeated; Jerusalem surrendered peacefully in 637 CE under the Pact of Umar; Egypt, Syria, Jordan, and Iraq came under Muslim rule.

b. Institutions: he founded diwans, Bayt al-Mal, judiciary/police structures, and the Hijri calendar.

c. Justice: he checked on the poor at night and held himself and his family to the strictest standards.`,
        },
      },
      {
        title: {
          am: '4. እረፍት እና ውርስ',
          ar: '٤. وفاته وإرثه',
          en: '4. Passing and legacy',
        },
        body: {
          am: `በ644 እ.ኤ.አ (23 ሂጅሪ) በአቡ ሉእሉአህ አል-መጁሲ የሱብሒ ሶላት እየመሩ ሳለ ተወግተው አረፉ። ከሞቱ በፊት 6 ታላላቅ ሶሃባዎችን ያቀፈ ሹራ ሰይመው ቀጣዩን ኸሊፋ እንዲመርጡ አደረጉ። በመስጅድ አል-ነበዊ ከነቢዩና ከአቡ በክር ጎን ተቀብረዋል።`,
          ar: `استُشهد سنة ٢٣ هـ وهو يصلي الفجر، وجعل الأمر شورى في ستة من المبشرين، ودُفن بجوار النبي وأبي بكر.`,
          en: `He was martyred in 23 AH / 644 CE while leading Fajr prayer. He appointed a shura of six Companions to choose the next Caliph and was buried beside the Prophet and Abu Bakr.`,
        },
      },
    ],
    keyLessons: [
      {
        am: 'ፍትህን ከራስና ከቤተሰብ ጀምሮ ማስፈን',
        ar: 'العدل يبدأ بالنفس والأهل',
        en: 'Justice begins with oneself and one’s family',
      },
      {
        am: 'ለህዝብ አገልጋይነት እና ቀላል ኑሮ',
        ar: 'خدمة الناس والزهد في الدنيا',
        en: 'Public service and simple living',
      },
      {
        am: 'ስርዓትና ተቋም መገንባት የእምነት ክፍል ነው',
        ar: 'بناء المؤسسات جزء من نصرة الدين',
        en: 'Building institutions is part of serving the religion',
      },
    ],
  },
  {
    slug: 'uthman-ibn-affan',
    name: {
      am: 'ዑስማን ኢብኑ ዓፋን (ረ.ዐ)',
      ar: 'عثمان بن عفان رضي الله عنه',
      en: 'Uthman ibn Affan (R.A)',
    },
    title: {
      am: 'ሦስተኛው ኸሊፋ — ዙን-ኑረይን (644 – 656 እ.ኤ.አ / 23 – 35 ሂጅሪ)',
      ar: 'الخليفة الثالث — ذو النورين (٢٣–٣٥ هـ / ٦٤٤–٦٥٦ م)',
      en: 'Third Caliph — Dhun-Nurayn (23–35 AH / 644–656 CE)',
    },
    reign: {
      am: '644 – 656 እ.ኤ.አ / 23 – 35 ሂጅሪ',
      ar: '٢٣–٣٥ هـ / ٦٤٤–٦٥٦ م',
      en: '23–35 AH / 644–656 CE',
    },
    shortDescription: {
      am: 'የነቢዩ ሁለት ሴት ልጆች ባል (“ዙን-ኑረይን”)، የቁርኣን ወጥ ስብስብ አዘጋጅ፣ እና ታላቁ የገንዘብ ደጋፊ።',
      ar: 'ذو النورين، جامع المصحف العثماني، وأعظم المنفقين في سبيل الله.',
      en: 'Dhun-Nurayn, unifier of the Uthmani mushaf, and one of Islam’s greatest financial supporters.',
    },
    fullBiography: {
      am: 'ዑስማን ኢብኑ ዓፋን (ረ.ዐ) ከባኑ ኡመያ የተወለዱ፣ በትህትናና በህፍረተኝነት የታወቁ፣ የቁርኣን ወጥ ግልባጭ ያዘጋጁ፣ የመጀመሪያውን የሙስሊም የባህር ኃይል የገነቡ ኸሊፋ ናቸው።',
      ar: 'عثمان بن عفان من بني أمية، عُرف بالحياء والإنفاق، وجمع المصاحف على حرف قريش، وأنشأ أول أسطول إسلامي.',
      en: 'Uthman ibn Affan of Banu Umayyah, known for modesty and generosity, standardized the Qur’anic mushaf on the Qurayshi dialect and founded the first Muslim navy.',
    },
    sections: [
      {
        title: {
          am: '1. ግላዊ ታሪክ፣ ስብእና እና ከእስልምና በፊት',
          ar: '١. نسبه وشخصيته قبل الإسلام',
          en: '1. Personal history, character, and life before Islam',
        },
        body: {
          am: `ሙሉ ስም: ዑስማን ኢብኑ ዓፋን ኢብኒ አቢል-ዐስ። ከቁሬሽ “ባኑ ኡመያ” ቤተሰብ የተወለዱ ናቸው።

"ዙን-ኑረይን": የነቢዩ ሁለት ሴት ልጆችን (ሩቂያን እና ከእሷ ህልፈት በኋላ እሙ-ከልሱምን) ያገቡ በመሆናቸው።

ከእስልምና በፊት: ሀብታም ነጋዴ፣ ትሁት፣ ህፍረተኛ፣ ጣኦት ያላመለኩና አረቄ ያልጠጡ ነበሩ።

እስልምናን በአቡ በክር ጥሪ ተቀብለው ወደ ሐበሻ (ኢትዮጵያ) ከተሰደዱት የመጀመሪያዎቹ መካከል ናቸው።`,
          ar: `عثمان بن عفان بن أبي العاص من بني أمية. لُقّب بذي النورين لزواجه من ابنتي النبي رقية ثم أم كلثوم.

كان تاجراً حياً كريماً، لم يعبد الأصنام ولم يشرب الخمر، وهاجر إلى الحبشة ثم المدينة.`,
          en: `Uthman ibn Affan ibn Abi al-‘As of Banu Umayyah was called Dhun-Nurayn for marrying two daughters of the Prophet, Ruqayyah then Umm Kulthum.

A wealthy, modest merchant who never worshipped idols or drank wine, he was among the earliest migrants to Abyssinia and later to Madinah.`,
        },
      },
      {
        title: {
          am: '2. ለእስልምና ያደረጉት የገንዘብ ድጋፍ',
          ar: '٢. إنفاقه العظيم في الإسلام',
          en: '2. Financial support for Islam',
        },
        body: {
          am: `• የቢእሩ-ሩመህ ጉድጓድ ገዝተው ለሙስሊሞች በነፃ አዋጡ።
• የመስጅድ አል-ነበዊን አስፋፉ።
• የተቡክ ዘመቻን በመቶዎች ግመሎች፣ ፈረሶችና ወርቅ አዘጋጁ።`,
          ar: `اشترى بئر رومة للمسلمين، ووسّع المسجد النبوي، وجهّز جيش العسرة في تبوك بماله.`,
          en: `He bought Bi’r Rumah for free public use, expanded Al-Masjid An-Nabawi, and fully equipped the army of hardship at Tabuk.`,
        },
      },
      {
        title: {
          am: '3. የኸሊፋነት መረጣ እና ዋና አስተዋጽኦዎች',
          ar: '٣. خلافته وأبرز إنجازاته',
          en: '3. Caliphate and major contributions',
        },
        body: {
          am: `በዑመር ሹራ ውይይት በ644 እ.ኤ.አ ሦስተኛው ኸሊፋ ሆነው ተመረጡ።

ሀ. ሙስሐፍ ዑስማኒ: የቁርኣን ወጥ ግልባጮች አዘጋጅተው ወደ ግዛቶች ላኩ — ቁርኣን እስከ ዛሬ ሳይበረዝ እንዲቆይ አድርጓል።
ለ. የባህር ኃይል: የመጀመሪያውን የሙስሊም የባህር ሰራዊት ገንብተው በዛት አስ-ሰዋሪ ድል አደረጉ።
ሐ. መስፋፋት: ወደ ሰሜን አፍሪካ፣ ኻራሳንና ካውካሰስ ተስፋፋ።`,
          ar: `اختير سنة ٢٣ هـ عبر الشورى. جمع المصاحف العثمانية، وأنشأ الأسطول الإسلامي، وامتدت الفتوح إلى شمال أفريقيا وخراسان والقوقاز.`,
          en: `Chosen via shura in 23 AH / 644 CE. He standardized the Uthmani mushafs, founded the Muslim navy (victory at Dhat al-Sawari), and expanded into North Africa, Khurasan, and the Caucasus.`,
        },
      },
      {
        title: {
          am: '4. ፈተና፣ እረፍት እና ውርስ',
          ar: '٤. الفتنة ووفاته وإرثه',
          en: '4. Trial, passing, and legacy',
        },
        body: {
          am: `በኸሊፋነታቸው መጨረሻ አማፂያን መዲናን ከበቡ። ዑስማን በሙስሊሞች መካከል ደም እንዳይፈስ ሶሃባዎች እንዲከላከሉላቸው አልፈቀዱም። በ656 እ.ኤ.አ ቁርኣን እያነበቡ እያለ ተገደሉ። በጃናት አል-በቂዕ ተቀብረዋል።`,
          ar: `حاصره الثوار في المدينة، ومنع القتال حقناً للدماء، وقُتل وهو يقرأ القرآن سنة ٣٥ هـ، ودُفن بالبقيع.`,
          en: `Rebels besieged Madinah; he forbade fighting to spare Muslim blood and was martyred in 35 AH / 656 CE while reading Qur’an. He was buried in Jannat al-Baqi‘.`,
        },
      },
    ],
    keyLessons: [
      {
        am: 'ትህትና፣ ህፍረተኝነት እና በገንዘብ መልካም ማድረግ',
        ar: 'الحياء والكرم في الإنفاق',
        en: 'Modesty, bashfulness, and generous spending',
      },
      {
        am: 'የቁርኣን አንድነትን መጠበቅ',
        ar: 'حفظ وحدة القرآن',
        en: 'Preserving the unity of the Qur’an',
      },
      {
        am: 'በፈተና ጊዜ ደም መፍሰስን መከላከል',
        ar: 'حقن دماء المسلمين في الفتن',
        en: 'Preventing Muslim bloodshed during trials',
      },
    ],
  },
  {
    slug: 'ali-ibn-abi-talib',
    name: {
      am: 'ዐሊይ ኢብኑ አቢ ጣሊብ (ረ.ዐ)',
      ar: 'علي بن أبي طالب رضي الله عنه',
      en: 'Ali ibn Abi Talib (R.A)',
    },
    title: {
      am: 'አራተኛው ኸሊፋ — አሰዱላህ (656 – 661 እ.ኤ.አ / 35 – 40 ሂጅሪ)',
      ar: 'الخليفة الرابع — أسد الله (٣٥–٤٠ هـ / ٦٥٦–٦٦١ م)',
      en: 'Fourth Caliph — Lion of Allah (35–40 AH / 656–661 CE)',
    },
    reign: {
      am: '656 – 661 እ.ኤ.አ / 35 – 40 ሂጅሪ',
      ar: '٣٥–٤٠ هـ / ٦٥٦–٦٦١ م',
      en: '35–40 AH / 656–661 CE',
    },
    shortDescription: {
      am: 'የነቢዩ የአጎት ልጅና አማች፣ ከህፃናት የመጀመሪያው እምነት ተቀባይ፣ የእውቀትና የጀግንነት ተምሳሌት።',
      ar: 'ابن عم النبي وزوج فاطمة، أول من أسلم من الصبيان، إمام العلم والشجاعة.',
      en: 'Cousin and son-in-law of the Prophet, first child to accept Islam, exemplar of knowledge and courage.',
    },
    fullBiography: {
      am: 'ዐሊይ ኢብኑ አቢ ጣሊብ (ረ.ዐ) የነቢዩ የአጎት ልጅ፣ የፋጢማ ባል፣ የሐሰንና የሑሰይን አባት ናቸው። በሂጅራ ምሽት በነቢዩ አልጋ ላይ ተኝተው ህይወታቸውን አደጋ ላይ ጥለዋል። አራተኛው ኸሊፋ ሆነው በፍትህና በፊቅህ ታወቁ።',
      ar: 'علي بن أبي طالب ابن عم النبي وزوج فاطمة وأبو الحسنين. نام في فراش النبي ليلة الهجرة، وكان رابع الخلفاء الراشدين، إماماً في العلم والعدل.',
      en: 'Ali ibn Abi Talib, the Prophet’s cousin, husband of Fatimah and father of Hasan and Husayn, slept in the Prophet’s bed on the night of Hijrah. As fourth Caliph he was renowned for knowledge and justice.',
    },
    sections: [
      {
        title: {
          am: '1. ግላዊ ታሪክ፣ ስብእና እና ከእስልምና በፊት',
          ar: '١. نسبه وشخصيته',
          en: '1. Personal history and character',
        },
        body: {
          am: `ሙሉ ስም: ዐሊይ ኢብኑ አቢ ጣሊብ ኢብኒ ዐብደል-ሙጦሊብ። የነቢዩ የአጎት (አቡ ጣሊብ) ልጅ ናቸው።

ከህፃናት የመጀመሪያው እምነት ተቀባይ: ገና በ10–11 ዓመታቸው እስልምናን ተቀበሉ።

አህል አል-በይት: የፋጢማ ባል፣ የሐሰንና የሑሰይን አባት።

መጠሪያዎች: "አሰዱላህ" / "ሐይደር"። ነቢዩም "እኔ የእውቀት ከተማ ነኝ፤ ዐሊይ ደጃፏ ነው" ብለዋል።`,
          ar: `علي بن أبي طالب بن عبد المطلب، ابن عم النبي. أول من أسلم من الصبيان، زوج فاطمة وأبو الحسنين، يُلقّب بأسد الله وحيدر، وقال النبي: أنا مدينة العلم وعلي بابها.`,
          en: `Ali ibn Abi Talib ibn Abd al-Muttalib, the Prophet’s cousin. First child to accept Islam, husband of Fatimah and father of Hasan and Husayn. Called Asadullah/Haydar; the Prophet said: “I am the city of knowledge and Ali is its gate.”`,
        },
      },
      {
        title: {
          am: '2. ለእስልምና የዋሉት መስዋዕትነት',
          ar: '٢. تضحياته للإسلام',
          en: '2. Sacrifices for Islam',
        },
        body: {
          am: `በሂጅራ ምሽት በነቢዩ አልጋ ላይ ተኝተው ህይወታቸውን አደጋ ላይ ጥለዋል፤ የሰዎች አደራዎችን ከመለሱ በኋላ ወደ መዲና ተጓዙ።

ከዛቡክ በስተቀር በሁሉም ጦርነቶች (በድር፣ ኡሁድ፣ ኸንደቅ፣ ኸይበር) ግንባር ቀደም ተጋዳይ ነበሩ።`,
          ar: `نام في فراش النبي ليلة الهجرة وأدى الأمانات ثم لحق بالمدينة. شهد بدراً وأحداً والخندق وخيبر وكان حامل الراية.`,
          en: `On the night of Hijrah he slept in the Prophet’s bed, returned trusts, then joined Madinah. Except Tabuk, he fought in every major battle and often carried the banner.`,
        },
      },
      {
        title: {
          am: '3. የኸሊፋነት መረጣ እና አስተዋጽኦዎች',
          ar: '٣. خلافته وإنجازاته',
          en: '3. Caliphate and contributions',
        },
        body: {
          am: `ከዑስማን ህልፈት በኋላ በሶሃባዎችና በህዝቡ ጥያቄ አራተኛው ኸሊፋ ሆኑ።

ሀ. አስተዳደር ማዕከልን ከመዲና ወደ ኩፋ አዛወሩ።
ለ. የአረብኛ ሰዋሰው (ነሕው) እንዲፃፍ መመሪያ ሰጡ።
ሐ. የውስጥ ፈተናዎችን በፍትህና በጥበብ ለመፍታት ጥረት አድርገዋል።`,
          ar: `بويع بعد مقتل عثمان. نقل العاصمة إلى الكوفة، وأمر بوضع قواعد النحو، وسعى لحقن الدماء وإقامة العدل في الفتن.`,
          en: `He accepted the caliphate after Uthman’s martyrdom. He moved the capital to Kufa, directed the foundations of Arabic grammar (nahw), and strove for justice amid internal trials.`,
        },
      },
      {
        title: {
          am: '4. እረፍት እና ውርስ',
          ar: '٤. وفاته وإرثه',
          en: '4. Passing and legacy',
        },
        body: {
          am: `በ661 እ.ኤ.አ (40 ሂጅሪ) በኩፋ መስጅድ የሱብሒ ሶላት እየመሩ ሳለ በዐብዱር-ረሕማን ኢብኑ ሙልጀም ተመተው አረፉ። መቃብራቸው በናጃፍ (ኢራቅ) ይገኛል። የእሳቸው ህልፈት የአራቱ ታላላቅ ኸሊፋዎች (አል-ኹለፋእ አር-ራሺዱን) ዘመንን አብቅቷል።`,
          ar: `استُشهد سنة ٤٠ هـ في مسجد الكوفة، وقبره في النجف، وبوفاته انتهت خلافة الراشدين.`,
          en: `He was martyred in 40 AH / 661 CE in the mosque of Kufa. His resting place is in Najaf, Iraq. His death closed the era of the Rightly Guided Caliphs.`,
        },
      },
    ],
    keyLessons: [
      {
        am: 'እውቀትን ከጀግንነት ጋር ማጣመር',
        ar: 'الجمع بين العلم والشجاعة',
        en: 'Combining knowledge with courage',
      },
      {
        am: 'ለአደራ ታማኝነት እና ለፍትህ ቁርጠኝነት',
        ar: 'حفظ الأمانة والعدل',
        en: 'Trustworthiness and commitment to justice',
      },
      {
        am: 'በፈተና ጊዜ የማህበረሰብ አንድነትን መጠበቅ',
        ar: 'حرص على وحدة الأمة في الفتن',
        en: 'Protecting the unity of the Ummah in times of fitnah',
      },
    ],
  },
];
