/**
 * AI Intent Matcher - Deterministic Navigation System
 * Maps user queries to structured intents and actions
 * Works WITHOUT AI API for simple navigation
 */

export type IntentType =
  | 'NAVIGATE_HOME'
  | 'NAVIGATE_KITAB'
  | 'NAVIGATE_KITAB_DETAIL'
  | 'NAVIGATE_AUDIO'
  | 'NAVIGATE_MUHADARA'
  | 'NAVIGATE_VIDEOS'
  | 'NAVIGATE_REMINDERS'
  | 'NAVIGATE_KNOWLEDGE'
  | 'NAVIGATE_SAHABAH'
  | 'NAVIGATE_CONTACT'
  | 'PLAY_AUDIO'
  | 'OPEN_PDF'
  | 'GET_SOCIAL_LINK'
  | 'SEARCH_KITAB'
  | 'SEARCH_AUDIO'
  | 'SEARCH_CONTENT'
  | 'WHAT_NEW'
  | 'LATEST_DERS'
  | 'CHANGE_LANGUAGE'
  | 'RANDOM_MUHADARA'
  | 'RANDOM_REMINDER'
  | 'GREETING'
  | 'UNKNOWN';

export interface Intent {
  type: IntentType;
  confidence: number;
  params?: {
    route?: string;
    kitabId?: string;
    audioId?: string;
    platform?: string;
    query?: string;
    language?: 'am' | 'ar' | 'en';
  };
}

/**
 * Match user input to intent (deterministic, no AI needed)
 */
export function matchIntent(userInput: string): Intent {
  const input = userInput.toLowerCase().trim();

  // Greetings only — short/exact, never hijack real requests
  if (
    /^(selam|salam|salaam|hello|hi|hey|assalamu?\s*alaikum|as[- ]?salamu?\s*alaikum|السلام\s*عليكم|ሰላም)([!.\s]*)$/i.test(
      input
    )
  ) {
    return { type: 'GREETING', confidence: 1.0 };
  }

  // Language change (before other matches) — only when user asks to change language
  const wantsLanguageChange =
    /(change|switch|set|ቀይር|غير|بدّل).{0,20}(lang|language|ቋንቋ|لغة)/i.test(input) ||
    /^(language|ቋንቋ|لغة|change\s*lang)/i.test(input) ||
    /\b(amharic|english|arabic|አማርኛ|العربية|እንግሊዝኛ)\b/i.test(input);

  if (wantsLanguageChange) {
    const language = extractLanguage(input);
    return {
      type: 'CHANGE_LANGUAGE',
      confidence: 1.0,
      params: language ? { language, query: input } : { query: input },
    };
  }

  // What's new / latest updates
  if (
    /(what'?s?\s*new|what\s*new|anything\s*new|new\s*there|latest|updates?|አዲስ\s*ምን|ምን\s*አዲስ|ما\s*الجديد)/i.test(
      input
    )
  ) {
    return { type: 'WHAT_NEW', confidence: 1.0, params: { query: input } };
  }

  // Go to / open new or latest ders
  if (
    /(new|latest|newest|recent|አዲስ|الجديد).{0,15}(ders|lesson|audio|lecture|ድርስ|درس)/i.test(input) ||
    /(ders|lesson|audio|lecture|ድርስ).{0,15}(new|latest|newest|አዲስ)/i.test(input) ||
    /^(go\s*to\s*)?(new\s*)?(ders|lessons?)(\s*page)?$/i.test(input)
  ) {
    return { type: 'LATEST_DERS', confidence: 1.0, params: { query: input } };
  }

  const kitabSlug = extractKitabSlug(input);
  const lessonNum = extractLessonNumber(input);

  // Specific Kitab + lesson ("go to adawa kitab audio 9")
  if (kitabSlug && lessonNum) {
    return {
      type: 'PLAY_AUDIO',
      confidence: 1.0,
      params: {
        route: `/kitab/${kitabSlug}?ders=${lessonNum}`,
        kitabId: kitabSlug,
        audioId: String(lessonNum),
        query: input,
      },
    };
  }

  // Specific Kitab page
  if (kitabSlug) {
    return {
      type: 'NAVIGATE_KITAB_DETAIL',
      confidence: 1.0,
      params: { route: `/kitab/${kitabSlug}`, kitabId: kitabSlug },
    };
  }

  // Home navigation
  if (/\b(home|homepage|main\s*page|መነሻ)\b/i.test(input) && /go|open|take|show|^home$/i.test(input)) {
    return { type: 'NAVIGATE_HOME', confidence: 1.0, params: { route: '/' } };
  }
  if (/^(home|homepage|መነሻ)$/i.test(input)) {
    return { type: 'NAVIGATE_HOME', confidence: 1.0, params: { route: '/' } };
  }

  // Kitab library
  if (/\bkitabs?\b/i.test(input) || /ኪታብ|كتب/.test(userInput)) {
    return { type: 'NAVIGATE_KITAB', confidence: 1.0, params: { route: '/kitab' } };
  }

  // Audio / ders archive
  if (
    /\b(audio|lecture|lectures|ders|ድርስ)\b/i.test(input) &&
    /(go|open|show|browse|listen|page|take)/i.test(input)
  ) {
    return { type: 'NAVIGATE_AUDIO', confidence: 1.0, params: { route: '/audio-lecture' } };
  }
  if (/^(audio|audio\s*lecture|ders|lectures?)$/i.test(input)) {
    return { type: 'NAVIGATE_AUDIO', confidence: 1.0, params: { route: '/audio-lecture' } };
  }

  // Play audio
  if (/^(play|listen|hear)\b/i.test(input)) {
    return { type: 'PLAY_AUDIO', confidence: 0.9, params: { query: input } };
  }

  // Muhadara
  if (/\b(muhadara|muhadera|discourse)\b/i.test(input)) {
    if (/random|any|give\s*me/i.test(input)) {
      return { type: 'RANDOM_MUHADARA', confidence: 1.0 };
    }
    return { type: 'NAVIGATE_MUHADARA', confidence: 1.0, params: { route: '/muhadara' } };
  }

  // Videos
  if (/\b(video|videos)\b/i.test(input)) {
    return { type: 'NAVIGATE_VIDEOS', confidence: 1.0, params: { route: '/video-lecture' } };
  }

  // Reminders
  if (/\breminders?\b/i.test(input) || /ተዝኪራ|تذكير/.test(userInput)) {
    if (/random|any|give\s*me/i.test(input)) {
      return { type: 'RANDOM_REMINDER', confidence: 1.0 };
    }
    return { type: 'NAVIGATE_REMINDERS', confidence: 1.0, params: { route: '/reminders' } };
  }

  // Knowledge
  if (/\b(knowledge|quran|hadith|qur'an)\b/i.test(input) || /ቁርኣን|قران|حديث/.test(userInput)) {
    return { type: 'NAVIGATE_KNOWLEDGE', confidence: 1.0, params: { route: '/knowledge' } };
  }

  // Sahabah
  if (/\b(sahabah|sahaba|companions)\b/i.test(input) || /ሰሐባ|صحابة/.test(userInput)) {
    return { type: 'NAVIGATE_SAHABAH', confidence: 1.0, params: { route: '/sahabah' } };
  }

  // Contact / social
  if (/\b(contact|social)\b/i.test(input)) {
    return { type: 'NAVIGATE_CONTACT', confidence: 1.0, params: { route: '/contact' } };
  }

  if (/(?:give|show|find|what|tell).*(?:telegram|tiktok|youtube|social)/i.test(input)) {
    const platform = extractSocialPlatform(input);
    if (platform) {
      return { type: 'GET_SOCIAL_LINK', confidence: 1.0, params: { platform } };
    }
  }

  // Search Kitab
  if (/(?:find|search|show|look\s*for).*(?:kitab|book)/i.test(input) && !/page/i.test(input)) {
    return { type: 'SEARCH_KITAB', confidence: 0.85, params: { query: input } };
  }

  // Search Audio
  if (/(?:find|search|show|look\s*for).*(?:audio|lecture|ders)/i.test(input)) {
    return { type: 'SEARCH_AUDIO', confidence: 0.85, params: { query: input } };
  }

  // General content search — only when there is a real topic word beyond filler
  if (/(?:find|search|look\s*for|about|explain)\b/i.test(input)) {
    return { type: 'SEARCH_CONTENT', confidence: 0.85, params: { query: input } };
  }

  return { type: 'UNKNOWN', confidence: 0.0, params: { query: input } };
}

/**
 * Extract target UI language
 */
function extractLanguage(input: string): 'am' | 'ar' | 'en' | null {
  if (/\b(amharic|አማርኛ)\b/i.test(input)) return 'am';
  if (/\b(arabic|العربية|عربي)\b/i.test(input)) return 'ar';
  if (/\b(english|እንግሊዝኛ)\b/i.test(input)) return 'en';
  const coded = input.match(/\b(?:to|language|lang|ቋንቋ|لغة)\s*[:\-]?\s*(am|ar|en)\b/i);
  if (coded) return coded[1].toLowerCase() as 'am' | 'ar' | 'en';
  if (/^(am|ar|en)$/i.test(input.trim())) {
    return input.trim().toLowerCase() as 'am' | 'ar' | 'en';
  }
  return null;
}

/**
 * Extract Kitab slug from user input
 */
export function extractKitabSlug(input: string): string | null {
  const lowerInput = input.toLowerCase();

  if (/intebih|murakeb/i.test(lowerInput)) return 'intebih-ante-murakeb';
  if (/\b(adewae|adewa|adawa|ad-?da['’]?|ad-dawa|ad\s*da)\b/i.test(lowerInput) || /الداء|الدواء/.test(input)) {
    return 'adewae-kitab';
  }
  if (/fatihu|awliya|mefatih|مفاتح/i.test(lowerInput)) return 'fatihu-awliya';
  if (/alwasail|almufida|wasail|happy\s*life|وسائل/i.test(lowerInput)) return 'alwasail-almufida';
  if (/teshilu|alimu|sheria|تسهيل/i.test(lowerInput)) return 'teshilu-alimu-sheria';
  if (/betewbet|tawba|repent/i.test(lowerInput)) return 'betewbet-mengede-lay';
  if (/yekelb|medreq|hardness|جفاف/i.test(lowerInput)) return 'yekelb-medreq';

  return null;
}

/**
 * Extract lesson/ders number ("audio 9", "ders 3", "ክፍል 09")
 */
export function extractLessonNumber(input: string): number | null {
  const labeled = input.match(/(?:audio|ders?|lesson|part|track|ክፍል|الجزء)\s*#?\s*(\d{1,2})/i);
  if (labeled) {
    const n = parseInt(labeled[1], 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

/**
 * Extract social platform from user input
 */
function extractSocialPlatform(input: string): string | null {
  if (/telegram/i.test(input)) return 'telegram';
  if (/tiktok|tik\s*tok/i.test(input)) return 'tiktok';
  if (/youtube|you\s*tube/i.test(input)) return 'youtube';
  return null;
}

/**
 * Get natural language response for intent
 */
export function getIntentResponse(intent: Intent, data?: any): string {
  switch (intent.type) {
    case 'GREETING':
      return 'Wa alaykumussalam wa rahmatullahi wa barakatuh 🌙\n\nI can open kitabs, play ders, switch language, or show what’s new. What do you need?';

    case 'WHAT_NEW':
      return data?.message || 'Here are the latest ders on the site.';

    case 'LATEST_DERS':
      return data?.message || 'Opening the newest ders.';

    case 'CHANGE_LANGUAGE':
      return data?.message || 'Language updated.';

    case 'NAVIGATE_HOME':
      return '🏠 Taking you to the homepage.';

    case 'NAVIGATE_KITAB':
      return '📖 Opening the Kitab Library.';

    case 'NAVIGATE_KITAB_DETAIL':
      return `📖 Opening ${data?.title || 'the Kitab'}.`;

    case 'NAVIGATE_AUDIO':
      return '🎧 Opening Audio Lectures.';

    case 'NAVIGATE_MUHADARA':
      return '🎙️ Opening Muhadara.';

    case 'NAVIGATE_VIDEOS':
      return '🎥 Opening Videos.';

    case 'NAVIGATE_REMINDERS':
      return '💭 Opening Reminders.';

    case 'NAVIGATE_KNOWLEDGE':
      return "📜 Opening Qur'an & Hadith Knowledge.";

    case 'NAVIGATE_SAHABAH':
      return '🕌 Opening Sahabah stories.';

    case 'NAVIGATE_CONTACT':
      return '📱 Opening Contact.';

    default:
      return '';
  }
}
