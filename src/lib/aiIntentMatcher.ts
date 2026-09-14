/**
 * AI Intent Matcher - Deterministic Navigation System
 * Maps user queries to structured intents and actions
 * Works WITHOUT AI API for simple navigation
 */

import { mapKitabHintToSlug } from './contentCatalog';

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
  | 'NAVIGATE_SPEAKERS'
  | 'NAVIGATE_SEARCH'
  | 'NAVIGATE_CONTACT'
  | 'PLAY_AUDIO'
  | 'PLAY_DERS'
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
    dersId?: string;
    partNumber?: number;
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

  // Exact ders play: "play intebih ders 3", "intebih ante murakeb part 3"
  const dersPlay = matchPlayDers(input);
  if (dersPlay) return dersPlay;

  // Home navigation
  if (/^(home|go\s*home|homepage|main\s*page)/i.test(input)) {
    return { type: 'NAVIGATE_HOME', confidence: 1.0, params: { route: '/' } };
  }

  // Search
  if (/^(search|find\s*content|global\s*search)/i.test(input) || /^search\s+/i.test(input)) {
    const q = input.replace(/^search\s*/i, '').trim();
    return {
      type: 'NAVIGATE_SEARCH',
      confidence: 0.95,
      params: { route: q ? `/search?q=${encodeURIComponent(q)}` : '/search', query: q || input },
    };
  }

  // Speakers
  if (/^(speaker|speakers|ustaaz|ustaz|go\s*to\s*speaker)/i.test(input)) {
    return { type: 'NAVIGATE_SPEAKERS', confidence: 1.0, params: { route: '/speakers' } };
  }

  // Kitab navigation
  if (/^(kitab|go\s*to\s*kitab|kitabpage|show\s*kitab|open\s*kitab|kitab\s*page|kitab\s*library)/i.test(input)) {
    return { type: 'NAVIGATE_KITAB', confidence: 1.0, params: { route: '/kitab' } };
  }

  // Specific Kitab navigation
  const kitabSlug = extractKitabSlug(input);
  if (kitabSlug && /(?:go\s*to|open|show|kitab)/i.test(input) && !/(?:ders|part|ክፍል|play|listen)/i.test(input)) {
    return {
      type: 'NAVIGATE_KITAB_DETAIL',
      confidence: 1.0,
      params: { route: `/kitab/${kitabSlug}`, kitabId: kitabSlug },
    };
  }
  if (kitabSlug && /^(intebih|adewae|fatihu|alwasail|teshilu|yekelb|betewbet)/i.test(input) && !/(?:ders|part|ክፍል|play|listen)/i.test(input)) {
    return {
      type: 'NAVIGATE_KITAB_DETAIL',
      confidence: 0.95,
      params: { route: `/kitab/${kitabSlug}`, kitabId: kitabSlug },
    };
  }

  // Audio/Ders navigation or playback
  if (/^(audio|go\s*to\s*audio|audio\s*lecture|audio\s*page)$/i.test(input)) {
    return { type: 'NAVIGATE_AUDIO', confidence: 1.0, params: { route: '/audio-lecture' } };
  }

  // Play audio
  if (/^(play|listen|hear)/i.test(input)) {
    return { type: 'PLAY_AUDIO', confidence: 0.85, params: { query: input } };
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

  return { type: 'UNKNOWN', confidence: 0.0, params: { query: input } };
}

function matchPlayDers(input: string): Intent | null {
  const partMatch =
    input.match(/(?:ders|part|ክፍል|الجزء)\s*#?\s*0*(\d+)/i) ||
    input.match(/(?:play|listen|open)\s+.*?(\d+)\s*$/i);
  const partNumber = partMatch ? parseInt(partMatch[1], 10) : null;
  const kitabSlug = extractKitabSlug(input);

  if (kitabSlug && partNumber != null && !Number.isNaN(partNumber)) {
    return {
      type: 'PLAY_DERS',
      confidence: 1.0,
      params: {
        kitabId: kitabSlug,
        partNumber,
        query: input,
      },
    };
  }

  // "play ders 3 of intebih" already covered; also bare "intebih ders 3"
  if (kitabSlug && /(?:ders|part|ክፍል)/i.test(input) && partNumber != null) {
    return {
      type: 'PLAY_DERS',
      confidence: 0.95,
      params: { kitabId: kitabSlug, partNumber, query: input },
    };
  }

  return null;
}

/**
 * Extract Kitab slug from user input — only real kitabs in the library
 */
function extractKitabSlug(input: string): string | null {
  return mapKitabHintToSlug(input);
}

function extractSocialPlatform(input: string): string | null {
  if (/telegram/i.test(input)) return 'telegram';
  if (/tiktok|tik\s*tok/i.test(input)) return 'tiktok';
  if (/youtube|you\s*tube/i.test(input)) return 'youtube';
  return null;
}

export function getIntentResponse(intent: Intent, data?: { title?: string; platform?: string; handle?: string; url?: string; speaker?: string; content?: string; source?: string }): string {
  switch (intent.type) {
    case 'GREETING':
      return 'Wa alaykumussalam wa rahmatullahi wa barakatuh.\n\nWelcome to Sile Qelbachin. How can I help you find content today?\n\nKitab · Audio Ders · Muhadara · Reminders · Search';

    case 'NAVIGATE_HOME':
      return 'Taking you to the homepage.';

    case 'NAVIGATE_KITAB':
      return 'Opening the Kitab Library.';

    case 'NAVIGATE_KITAB_DETAIL':
      return `Opening ${data?.title || 'the Kitab'}.`;

    case 'NAVIGATE_AUDIO':
      return 'Opening Audio Lectures.';

    case 'NAVIGATE_MUHADARA':
      return 'Opening Muhadara.';

    case 'NAVIGATE_VIDEOS':
      return 'Opening Videos.';

    case 'NAVIGATE_REMINDERS':
      return 'Opening Reminders.';

    case 'NAVIGATE_KNOWLEDGE':
      return "Opening Qur'an & Hadith Knowledge.";

    case 'NAVIGATE_SAHABAH':
      return 'Opening Sahabah.';

    case 'NAVIGATE_SPEAKERS':
      return 'Opening Speakers.';

    case 'NAVIGATE_SEARCH':
      return 'Opening Search.';

    case 'NAVIGATE_CONTACT':
      return 'Opening Contact.';

    case 'GET_SOCIAL_LINK':
      if (data?.url) {
        return `${data.platform}: ${data.handle}\n\n${data.url}`;
      }
      return 'That social link is not listed on Sile Qelbachin. Verified: Telegram https://t.me/Sle_qelbachn1 · TikTok https://www.tiktok.com/@sle_qelbachn1 · YouTube https://youtube.com/@sle_qelbachn1';

    case 'PLAY_AUDIO':
    case 'PLAY_DERS':
      return data?.title
        ? `${data.title}\n\nOpening the exact Ders page.`
        : 'I could not find that Ders in the available Sile Qelbachin content.';

    case 'RANDOM_MUHADARA':
      return data?.title
        ? `Random Muhadara\n\n${data.title}\nSpeaker: ${data.speaker}`
        : 'No Muhadara available at this time.';

    case 'RANDOM_REMINDER':
      return data?.content
        ? `Reminder\n\n${data.content}\n\nSource: ${data.source}`
        : 'No reminders available at this time.';

    default:
      return '';
  }
}
