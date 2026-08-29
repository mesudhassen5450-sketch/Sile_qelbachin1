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
  };
}

/**
 * Match user input to intent (deterministic, no AI needed)
 */
export function matchIntent(userInput: string): Intent {
  const input = userInput.toLowerCase().trim();

  // Greetings
  if (/^(selam|salam|hello|hi|assalam|aleykum|wa\s*aleykum)/i.test(input)) {
    return { type: 'GREETING', confidence: 1.0 };
  }

  // Home navigation
  if (/^(home|go\s*home|homepage|main\s*page)/i.test(input)) {
    return { type: 'NAVIGATE_HOME', confidence: 1.0, params: { route: '/' } };
  }

  // Kitab navigation
  if (/^(kitab|go\s*to\s*kitab|kitabpage|show\s*kitab|open\s*kitab|kitab\s*page|kitab\s*library)/i.test(input)) {
    return { type: 'NAVIGATE_KITAB', confidence: 1.0, params: { route: '/kitab' } };
  }

  // Specific Kitab navigation
  const kitabMatches = input.match(/(?:go\s*to\s*|open\s*|show\s*)?(?:intebih|intebihkitab|adewae|fatihu|alkesidu|teshilu|yekelb|betewbet)(?:\s*kitab)?/i);
  if (kitabMatches) {
    const kitabSlug = extractKitabSlug(input);
    if (kitabSlug) {
      return {
        type: 'NAVIGATE_KITAB_DETAIL',
        confidence: 1.0,
        params: { route: `/kitab/${kitabSlug}`, kitabId: kitabSlug }
      };
    }
  }

  // Audio/Ders navigation or playback
  if (/^(audio|go\s*to\s*audio|audio\s*lecture|audio\s*page|ders)/i.test(input)) {
    return { type: 'NAVIGATE_AUDIO', confidence: 1.0, params: { route: '/audio-lecture' } };
  }

  // Play audio
  if (/^(play|listen|hear)/i.test(input)) {
    return { type: 'PLAY_AUDIO', confidence: 0.9, params: { query: input } };
  }

  // Muhadara navigation
  if (/^(muhadara|go\s*to\s*muhadara|muhadara\s*page|open\s*muhadara|discourse)/i.test(input)) {
    return { type: 'NAVIGATE_MUHADARA', confidence: 1.0, params: { route: '/muhadara' } };
  }

  // Random Muhadara
  if (/random\s*muhadara|muhadara\s*random|any\s*muhadara/i.test(input)) {
    return { type: 'RANDOM_MUHADARA', confidence: 1.0 };
  }

  // Videos navigation
  if (/^(video|go\s*to\s*video|video\s*page|open\s*video|videos|show\s*videos)/i.test(input)) {
    return { type: 'NAVIGATE_VIDEOS', confidence: 1.0, params: { route: '/videos' } };
  }

  // Reminders navigation
  if (/^(reminder|go\s*to\s*reminder|reminder\s*page|open\s*reminder|reminders|show\s*reminders)/i.test(input)) {
    return { type: 'NAVIGATE_REMINDERS', confidence: 1.0, params: { route: '/reminders' } };
  }

  // Random Reminder
  if (/random\s*reminder|reminder\s*random|any\s*reminder|give\s*me\s*a\s*reminder/i.test(input)) {
    return { type: 'RANDOM_REMINDER', confidence: 1.0 };
  }

  // Knowledge navigation
  if (/^(knowledge|go\s*to\s*knowledge|knowledge\s*page|quran|hadith|qur'an)/i.test(input)) {
    return { type: 'NAVIGATE_KNOWLEDGE', confidence: 1.0, params: { route: '/knowledge' } };
  }

  // Sahabah navigation
  if (/^(sahabah|go\s*to\s*sahabah|sahabah\s*page|companions|sahaba)/i.test(input)) {
    return { type: 'NAVIGATE_SAHABAH', confidence: 1.0, params: { route: '/sahabah' } };
  }

  // Contact navigation
  if (/^(contact|go\s*to\s*contact|contact\s*page|contact\s*us|social)/i.test(input)) {
    return { type: 'NAVIGATE_CONTACT', confidence: 1.0, params: { route: '/contact' } };
  }

  // Social links
  if (/(?:give|show|find|what|tell).*(?:telegram|tiktok|youtube|social)/i.test(input)) {
    const platform = extractSocialPlatform(input);
    if (platform) {
      return { type: 'GET_SOCIAL_LINK', confidence: 1.0, params: { platform } };
    }
  }

  // Search Kitab
  if (/(?:find|search|show|look\s*for).*(?:kitab|book)/i.test(input) && !(/page/i.test(input))) {
    return { type: 'SEARCH_KITAB', confidence: 0.8, params: { query: input } };
  }

  // Search Audio
  if (/(?:find|search|show|look\s*for).*(?:audio|lecture|ders)/i.test(input)) {
    return { type: 'SEARCH_AUDIO', confidence: 0.8, params: { query: input } };
  }

  // General content search
  if (/(?:find|search|show|tell|what|about|explain)/i.test(input)) {
    return { type: 'SEARCH_CONTENT', confidence: 0.6, params: { query: input } };
  }

  // Unknown
  return { type: 'UNKNOWN', confidence: 0.0, params: { query: input } };
}

/**
 * Extract Kitab slug from user input
 */
function extractKitabSlug(input: string): string | null {
  const lowerInput = input.toLowerCase();

  if (/intebih/i.test(lowerInput)) return 'intebih-ante-murakeb';
  if (/adewae|dawa|disease|cure/i.test(lowerInput)) return 'adewae-kitab';
  if (/fatihu|awliya/i.test(lowerInput)) return 'fatihu-awliya';
  if (/alkesidu|leyse|algerib/i.test(lowerInput)) return 'alkesidu-leyse-algerib';
  if (/teshilu|alimu|sheria/i.test(lowerInput)) return 'teshilu-alimu-sheria';
  if (/yekelb|betewbet/i.test(lowerInput)) return 'yekelb-betewbet-kitab';

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
      return 'Wa alaykumussalam wa rahmatullahi wa barakatuh 🌙\n\nWelcome to Sle Qelbachin. How can I help you today?\n\n📖 Kitab\n🎧 Audio Ders\n🎙️ Muhadara\n💭 Reminders\n🕌 Islamic Knowledge';

    case 'NAVIGATE_HOME':
      return '🏠 Taking you to the homepage.';

    case 'NAVIGATE_KITAB':
      return '📖 Opening the Kitab Library with 7 Islamic books.';

    case 'NAVIGATE_KITAB_DETAIL':
      return `📖 Opening ${data?.title || 'the Kitab'}.`;

    case 'NAVIGATE_AUDIO':
      return '🎧 Opening Audio Lectures page.';

    case 'NAVIGATE_MUHADARA':
      return '🎙️ Opening Muhadara (Islamic Discourses) page.';

    case 'NAVIGATE_VIDEOS':
      return '🎥 Opening Videos page.';

    case 'NAVIGATE_REMINDERS':
      return '💭 Opening Daily Reminders page.';

    case 'NAVIGATE_KNOWLEDGE':
      return '📜 Opening Qur\'an & Hadith Knowledge page.';

    case 'NAVIGATE_SAHABAH':
      return '🕌 Opening Sahabah (Companions) Stories page.';

    case 'NAVIGATE_CONTACT':
      return '📱 Opening Contact page with social links.';

    case 'GET_SOCIAL_LINK':
      if (data?.url) {
        return `📱 **${data.platform}**: ${data.handle}\n\n${data.url}`;
      } else {
        return `${data?.platform || 'That social link'} is not currently available on Sle Qelbachin.\n\nVerified platforms:\n📱 Telegram: https://t.me/Sle_qelbachn1\n🎵 TikTok: https://www.tiktok.com/@sle_qelbachn1`;
      }

    case 'PLAY_AUDIO':
      return data?.title
        ? `🎧 **${data.title}**\n\nReady to play.`
        : '🎧 Please specify which audio you\'d like to play.';

    case 'RANDOM_MUHADARA':
      return data?.title
        ? `🎙️ **Random Muhadara**\n\n${data.title}\nSpeaker: ${data.speaker}`
        : '🎙️ No Muhadara available at this time.';

    case 'RANDOM_REMINDER':
      return data?.content
        ? `💭 **Daily Reminder**\n\n${data.content}\n\nSource: ${data.source}`
        : '💭 No reminders available at this time.';

    default:
      return '';
  }
}
