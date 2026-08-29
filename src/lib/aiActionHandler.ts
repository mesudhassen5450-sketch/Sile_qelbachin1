/**
 * AI Action Handler - Controlled Navigation and Actions
 * Executes structured actions safely without arbitrary code execution
 */

import { Intent } from './aiIntentMatcher';
import { 
  searchKitab, 
  searchAudio, 
  searchMuhadara, 
  getRandomMuhadara, 
  getRandomReminder,
  getSocialLink,
  getCachedIndex
} from './aiContentIndex';

export interface AIAction {
  type: 'navigate' | 'play_audio' | 'open_pdf' | 'answer' | 'error';
  data?: {
    route?: string;
    audioUrl?: string;
    pdfUrl?: string;
    message?: string;
    title?: string;
    kitabId?: string;
    [key: string]: any;
  };
}

/**
 * Execute intent and return controlled action
 */
export function executeIntent(intent: Intent): AIAction {
  switch (intent.type) {
    case 'GREETING':
      return {
        type: 'answer',
        data: {
          message: 'Wa alaykumussalam wa rahmatullahi wa barakatuh 🌙\n\nWelcome to Sle Qelbachin. How can I help you today?\n\n📖 Kitab\n🎧 Audio Ders\n🎙️ Muhadara\n💭 Reminders\n🕌 Islamic Knowledge'
        }
      };

    case 'NAVIGATE_HOME':
    case 'NAVIGATE_KITAB':
    case 'NAVIGATE_AUDIO':
    case 'NAVIGATE_MUHADARA':
    case 'NAVIGATE_VIDEOS':
    case 'NAVIGATE_REMINDERS':
    case 'NAVIGATE_KNOWLEDGE':
    case 'NAVIGATE_SAHABAH':
    case 'NAVIGATE_CONTACT':
      return {
        type: 'navigate',
        data: {
          route: intent.params?.route || '/',
          message: getNavigationMessage(intent.type)
        }
      };

    case 'NAVIGATE_KITAB_DETAIL':
      return handleKitabNavigation(intent);

    case 'SEARCH_KITAB':
      return handleKitabSearch(intent);

    case 'SEARCH_AUDIO':
    case 'PLAY_AUDIO':
      return handleAudioSearch(intent);

    case 'GET_SOCIAL_LINK':
      return handleSocialLink(intent);

    case 'RANDOM_MUHADARA':
      return handleRandomMuhadara();

    case 'RANDOM_REMINDER':
      return handleRandomReminder();

    case 'SEARCH_CONTENT':
      return handleContentSearch(intent);

    case 'UNKNOWN':
    default:
      return {
        type: 'answer',
        data: {
          message: 'I\'m not sure what you\'re looking for. You can try:\n\n📖 Browse Kitab\n🎧 Listen to Audio\n🎙️ Explore Muhadara\n💭 Read Reminders\n🕌 Learn about Sahabah'
        }
      };
  }
}

/**
 * Handle Kitab navigation
 */
function handleKitabNavigation(intent: Intent): AIAction {
  const kitabId = intent.params?.kitabId;
  if (!kitabId) {
    return {
      type: 'navigate',
      data: { route: '/kitab', message: '📖 Opening Kitab Library.' }
    };
  }

  const index = getCachedIndex();
  const kitab = index.kitabs.find(k => k.slug === kitabId);

  if (kitab) {
    return {
      type: 'navigate',
      data: {
        route: `/kitab/${kitabId}`,
        message: `📖 **${kitab.title}**\n\n${kitab.dersCount} audio lessons${kitab.pdfUrl ? ' • PDF available' : ''}`,
        title: kitab.title,
        kitabId: kitabId
      }
    };
  }

  return {
    type: 'navigate',
    data: { route: '/kitab', message: '📖 Kitab not found. Opening library.' }
  };
}

/**
 * Handle Kitab search
 */
function handleKitabSearch(intent: Intent): AIAction {
  const query = intent.params?.query || '';
  const results = searchKitab(query);

  if (results.length === 0) {
    return {
      type: 'answer',
      data: {
        message: '📖 No Kitabs found for that search. Browse all available Kitabs:',
        route: '/kitab'
      }
    };
  }

  if (results.length === 1) {
    const kitab = results[0];
    return {
      type: 'navigate',
      data: {
        route: kitab.route,
        message: `📖 **${kitab.title}**\n\nAuthor: ${kitab.author}\n${kitab.dersCount} audio lessons`,
        title: kitab.title
      }
    };
  }

  const list = results.slice(0, 3).map(k => `• ${k.title} - ${k.author}`).join('\n');
  return {
    type: 'answer',
    data: {
      message: `📖 Found ${results.length} Kitabs:\n\n${list}`,
      route: '/kitab'
    }
  };
}

/**
 * Handle audio search
 */
function handleAudioSearch(intent: Intent): AIAction {
  const query = intent.params?.query || '';
  const audioResults = searchAudio(query);

  if (audioResults.length > 0) {
    const audio = audioResults[0];
    return {
      type: 'play_audio',
      data: {
        audioUrl: audio.audioUrl,
        title: audio.title,
        speaker: audio.speaker,
        message: `🎧 **${audio.title}**\n\nSpeaker: ${audio.speaker}`,
        route: audio.route
      }
    };
  }

  return {
    type: 'answer',
    data: {
      message: '🎧 Audio not found. Browse all available audio:',
      route: '/audio-lecture'
    }
  };
}

/**
 * Handle social link request
 */
function handleSocialLink(intent: Intent): AIAction {
  const platform = intent.params?.platform;
  if (!platform) {
    return {
      type: 'navigate',
      data: { route: '/contact', message: '📱 Opening contact page.' }
    };
  }

  const social = getSocialLink(platform);

  if (social && social.verified) {
    return {
      type: 'answer',
      data: {
        message: `📱 **${social.platform}**\n\n${social.handle}\n\n${social.url}`,
        url: social.url
      }
    };
  }

  return {
    type: 'answer',
    data: {
      message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} is not currently available on Sle Qelbachin.\n\n**Verified platforms:**\n📱 Telegram: https://t.me/Sle_qelbachn1\n🎵 TikTok: https://www.tiktok.com/@sle_qelbachn1`
    }
  };
}

/**
 * Handle random Muhadara
 */
function handleRandomMuhadara(): AIAction {
  const muhadara = getRandomMuhadara();

  if (muhadara) {
    return {
      type: 'play_audio',
      data: {
        audioUrl: muhadara.audioUrl,
        title: muhadara.title,
        speaker: muhadara.speaker,
        message: `🎙️ **Random Muhadara**\n\n**${muhadara.title}**\nSpeaker: ${muhadara.speaker}\nTopic: ${muhadara.topic}`,
        route: '/muhadara'
      }
    };
  }

  return {
    type: 'navigate',
    data: { route: '/muhadara', message: '🎙️ Opening Muhadara page.' }
  };
}

/**
 * Handle random reminder
 */
function handleRandomReminder(): AIAction {
  const reminder = getRandomReminder();

  if (reminder) {
    return {
      type: 'answer',
      data: {
        message: `💭 **Daily Reminder**\n\n${reminder.content}\n\n**Source:** ${reminder.source}`,
        route: '/reminders'
      }
    };
  }

  return {
    type: 'navigate',
    data: { route: '/reminders', message: '💭 Opening Reminders page.' }
  };
}

/**
 * Handle general content search
 */
function handleContentSearch(intent: Intent): AIAction {
  // For now, direct to appropriate page based on keywords
  // In future, could implement more sophisticated search
  return {
    type: 'answer',
    data: {
      message: 'I can help you find:\n\n📖 Kitabs and books\n🎧 Audio lectures\n🎙️ Muhadara\n💭 Reminders\n🕌 Knowledge & Sahabah\n\nWhat would you like to explore?'
    }
  };
}

/**
 * Get navigation message for intent type
 */
function getNavigationMessage(intentType: string): string {
  const messages: Record<string, string> = {
    'NAVIGATE_HOME': '🏠 Taking you to the homepage.',
    'NAVIGATE_KITAB': '📖 Opening the Kitab Library with 7 Islamic books.',
    'NAVIGATE_AUDIO': '🎧 Opening Audio Lectures page.',
    'NAVIGATE_MUHADARA': '🎙️ Opening Muhadara (Islamic Discourses) page.',
    'NAVIGATE_VIDEOS': '🎥 Opening Videos page.',
    'NAVIGATE_REMINDERS': '💭 Opening Daily Reminders page.',
    'NAVIGATE_KNOWLEDGE': '📜 Opening Qur\'an & Hadith Knowledge page.',
    'NAVIGATE_SAHABAH': '🕌 Opening Sahabah (Companions) Stories page.',
    'NAVIGATE_CONTACT': '📱 Opening Contact page with social links.',
  };

  return messages[intentType] || 'Navigating...';
}

/**
 * Get action buttons for response
 */
export function getActionButtons(action: AIAction): Array<{ type: 'navigate' | 'open-kitab' | 'play-audio'; label: string; url?: string }> {
  const buttons: Array<{ type: 'navigate' | 'open-kitab' | 'play-audio'; label: string; url?: string }> = [];

  if (action.type === 'navigate' && action.data?.route) {
    const labelMap: Record<string, string> = {
      '/': '🏠 Go Home',
      '/kitab': '📖 View All Kitabs',
      '/audio-lecture': '🎧 Browse Audio',
      '/muhadara': '🎙️ Open Muhadara',
      '/videos': '🎥 Watch Videos',
      '/reminders': '💭 Read Reminders',
      '/knowledge': '📜 Explore Knowledge',
      '/sahabah': '🕌 Learn About Sahabah',
      '/contact': '📱 Contact Us',
    };

    const label = labelMap[action.data.route] || `Open ${action.data.title || 'Page'}`;

    if (action.data.route.startsWith('/kitab/')) {
      buttons.push({
        type: 'open-kitab',
        label: `📖 Open ${action.data.title || 'Kitab'}`,
        url: action.data.route
      });
    } else {
      buttons.push({
        type: 'navigate',
        label: label,
        url: action.data.route
      });
    }
  }

  if (action.type === 'play_audio' && action.data?.route) {
    buttons.push({
      type: 'play-audio',
      label: '🎧 Listen',
      url: action.data.route
    });
  }

  return buttons;
}
