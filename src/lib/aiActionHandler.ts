/**
 * AI Action Handler - Controlled Navigation and Actions
 * Executes structured actions safely without arbitrary code execution
 */

import { Intent, extractKitabSlug } from './aiIntentMatcher';
import {
  searchKitab,
  searchAudio,
  getRandomMuhadara,
  getRandomReminder,
  getSocialLink,
  getCachedIndex,
  findKitabLesson,
  getLatestHighlights,
  getNewestDers,
} from './aiContentIndex';

export interface AIAction {
  type: 'navigate' | 'play_audio' | 'open_pdf' | 'answer' | 'set_language' | 'error';
  data?: {
    route?: string;
    audioUrl?: string;
    pdfUrl?: string;
    message?: string;
    title?: string;
    kitabId?: string;
    language?: 'am' | 'ar' | 'en';
    url?: string;
    languageOptions?: boolean;
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
          message:
            'Wa alaykumussalam wa rahmatullahi wa barakatuh 🌙\n\nI can actually help you on this site — for example:\n• “go to new ders”\n• “what’s new”\n• “open intebih”\n• “change language to English”\n• “play muhadara”',
        },
      };

    case 'WHAT_NEW':
      return handleWhatNew();

    case 'LATEST_DERS':
      return handleLatestDers();

    case 'CHANGE_LANGUAGE':
      return handleLanguageChange(intent);

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
          message: getNavigationMessage(intent.type),
        },
      };

    case 'NAVIGATE_KITAB_DETAIL':
      return handleKitabNavigation(intent);

    case 'SEARCH_KITAB':
      return handleKitabSearch(intent);

    case 'SEARCH_AUDIO':
      return handleAudioSearch(intent);

    case 'PLAY_AUDIO':
      if (intent.params?.kitabId && intent.params?.audioId) {
        return handleKitabLessonPlay(intent);
      }
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
      return handleUnknown(intent.params?.query || '');
  }
}

function handleWhatNew(): AIAction {
  const highlights = getLatestHighlights(4);
  if (!highlights.length) {
    return {
      type: 'navigate',
      data: {
        route: '/kitab',
        message: '📖 Opening the Kitab library so you can browse the latest lessons.',
      },
    };
  }

  const newest = highlights[0];
  const list = highlights
    .map(
      (item, i) =>
        `${i + 1}. **${item.kitabTitle}** — ${item.dersTitle} (Ders ${item.dersNumber})`
    )
    .join('\n');

  return {
    type: 'navigate',
    data: {
      route: newest.route,
      title: newest.dersTitle,
      kitabId: newest.kitabSlug,
      audioUrl: newest.audioUrl,
      message: `✨ **What’s new on Sle Qelbachin**\n\n${list}\n\nOpening the newest: **${newest.kitabTitle} — Ders ${newest.dersNumber}**.`,
    },
  };
}

function handleLatestDers(): AIAction {
  const newest = getNewestDers();
  if (!newest) {
    return {
      type: 'navigate',
      data: {
        route: '/audio-lecture',
        message: '🎧 Opening the audio archive — ask for a kitab name if you want a specific ders.',
      },
    };
  }

  return {
    type: 'play_audio',
    data: {
      route: newest.route,
      audioUrl: newest.audioUrl,
      title: newest.dersTitle,
      kitabId: newest.kitabSlug,
      message: `🎧 Opening the newest ders:\n\n**${newest.kitabTitle}**\n${newest.dersTitle}\nSpeaker: ${newest.speaker}`,
    },
  };
}

function handleLanguageChange(intent: Intent): AIAction {
  const language = intent.params?.language;
  if (language) {
    const labels = { am: 'አማርኛ (Amharic)', ar: 'العربية (Arabic)', en: 'English' } as const;
    return {
      type: 'set_language',
      data: {
        language,
        message: `🌐 Language switched to **${labels[language]}**.\n\nThe site text will update now. You can also say “change language to Amharic/Arabic/English”.`,
      },
    };
  }

  return {
    type: 'answer',
    data: {
      message:
        '🌐 Which language do you want?\n\n• Amharic — say “change language to Amharic”\n• Arabic — say “change language to Arabic”\n• English — say “change language to English”\n\nOr tap a button below.',
      languageOptions: true,
    },
  };
}

function handleUnknown(query: string): AIAction {
  const highlights = getLatestHighlights(3);
  const tip = highlights[0]
    ? `\n\nNewest ders right now: **${highlights[0].kitabTitle} — Ders ${highlights[0].dersNumber}**. Say “go to new ders” to open it.`
    : '';

  return {
    type: 'answer',
    data: {
      message: `I didn’t catch a clear action for “${query || 'that'}”. Try one of these:\n\n• go to new ders\n• what’s new\n• open intebih / adewa\n• change language to English\n• open videos / muhadara / reminders${tip}`,
      route: highlights[0]?.route,
    },
  };
}

function handleKitabNavigation(intent: Intent): AIAction {
  const kitabId = intent.params?.kitabId;
  if (!kitabId) {
    return {
      type: 'navigate',
      data: { route: '/kitab', message: '📖 Opening Kitab Library.' },
    };
  }

  const index = getCachedIndex();
  const kitab = index.kitabs.find((k) => k.slug === kitabId);

  if (kitab) {
    return {
      type: 'navigate',
      data: {
        route: `/kitab/${kitabId}`,
        message: `📖 **${kitab.title}**\n\n${kitab.dersCount} audio lessons${kitab.pdfUrl ? ' • PDF available' : ''}`,
        title: kitab.title,
        kitabId: kitabId,
      },
    };
  }

  return {
    type: 'navigate',
    data: { route: '/kitab', message: '📖 Kitab not found. Opening library.' },
  };
}

function handleKitabSearch(intent: Intent): AIAction {
  const query = intent.params?.query || '';
  const results = searchKitab(query);

  if (results.length === 0) {
    return {
      type: 'navigate',
      data: {
        message: '📖 No Kitabs matched that search. Opening the full library.',
        route: '/kitab',
      },
    };
  }

  if (results.length === 1) {
    const kitab = results[0];
    return {
      type: 'navigate',
      data: {
        route: kitab.route,
        message: `📖 **${kitab.title}**\n\nAuthor: ${kitab.author}\n${kitab.dersCount} audio lessons`,
        title: kitab.title,
      },
    };
  }

  const list = results.slice(0, 3).map((k) => `• ${k.title} - ${k.author}`).join('\n');
  return {
    type: 'navigate',
    data: {
      message: `📖 Found ${results.length} Kitabs:\n\n${list}\n\nOpening the library.`,
      route: '/kitab',
    },
  };
}

function handleKitabLessonPlay(intent: Intent): AIAction {
  const kitabId = intent.params?.kitabId || '';
  const lessonNumber = parseInt(intent.params?.audioId || '', 10);
  const found = findKitabLesson(kitabId, lessonNumber);

  if (!found) {
    return {
      type: 'navigate',
      data: { route: '/kitab', message: '📖 Kitab not found. Opening the library.' },
    };
  }

  if (!found.ders || !Number.isFinite(lessonNumber)) {
    return {
      type: 'navigate',
      data: {
        route: `/kitab/${kitabId}`,
        title: found.kitab.title,
        kitabId,
        message: `📖 **${found.kitab.title}**\n\nLesson ${lessonNumber} is not in the archive yet. Opening the Kitab so you can choose another lesson.`,
      },
    };
  }

  return {
    type: 'play_audio',
    data: {
      audioUrl: found.ders.audioUrl,
      title: found.ders.title,
      speaker: found.ders.speaker,
      kitabId,
      route: `/kitab/${kitabId}?ders=${lessonNumber}`,
      message: `🎧 **${found.kitab.title}** — Lesson ${String(lessonNumber).padStart(2, '0')}\n\n${found.ders.title}\nSpeaker: ${found.ders.speaker}`,
    },
  };
}

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
        route: audio.route,
      },
    };
  }

  return {
    type: 'navigate',
    data: {
      message: '🎧 I could not match that audio title. Opening the audio archive.',
      route: '/audio-lecture',
    },
  };
}

function handleSocialLink(intent: Intent): AIAction {
  const platform = intent.params?.platform;
  if (!platform) {
    return {
      type: 'navigate',
      data: { route: '/contact', message: '📱 Opening contact page.' },
    };
  }

  const social = getSocialLink(platform);

  if (social && social.verified) {
    return {
      type: 'answer',
      data: {
        message: `📱 **${social.platform}**\n\n${social.handle}\n\n${social.url}`,
        url: social.url,
      },
    };
  }

  return {
    type: 'answer',
    data: {
      message: `${platform.charAt(0).toUpperCase() + platform.slice(1)} is not currently available on Sle Qelbachin.\n\n**Verified platforms:**\n📱 Telegram: https://t.me/Sle_qelbachn1\n🎵 TikTok: https://www.tiktok.com/@sle_qelbachn1`,
    },
  };
}

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
        route: '/muhadara',
      },
    };
  }

  return {
    type: 'navigate',
    data: { route: '/muhadara', message: '🎙️ Opening Muhadara page.' },
  };
}

function handleRandomReminder(): AIAction {
  const reminder = getRandomReminder();

  if (reminder) {
    return {
      type: 'answer',
      data: {
        message: `💭 **Daily Reminder**\n\n${reminder.content}\n\n**Source:** ${reminder.source}`,
        route: '/reminders',
      },
    };
  }

  return {
    type: 'navigate',
    data: { route: '/reminders', message: '💭 Opening Reminders page.' },
  };
}

function handleContentSearch(intent: Intent): AIAction {
  const query = intent.params?.query || '';
  const kitabId = extractKitabSlug(query);

  if (kitabId) {
    return handleKitabNavigation({
      type: 'NAVIGATE_KITAB_DETAIL',
      confidence: 1,
      params: { kitabId, route: `/kitab/${kitabId}` },
    });
  }

  if (/(new|latest|update)/i.test(query)) {
    return handleWhatNew();
  }

  const kitabResults = searchKitab(query);
  if (kitabResults.length > 0) {
    return handleKitabSearch(intent);
  }

  const audioResults = searchAudio(query);
  if (audioResults.length > 0) {
    return handleAudioSearch(intent);
  }

  return handleUnknown(query);
}

function getNavigationMessage(intentType: string): string {
  const messages: Record<string, string> = {
    NAVIGATE_HOME: '🏠 Taking you to the homepage.',
    NAVIGATE_KITAB: '📖 Opening the Kitab Library.',
    NAVIGATE_AUDIO: '🎧 Opening Audio Lectures.',
    NAVIGATE_MUHADARA: '🎙️ Opening Muhadara (Islamic Discourses).',
    NAVIGATE_VIDEOS: '🎥 Opening Videos.',
    NAVIGATE_REMINDERS: '💭 Opening Daily Reminders.',
    NAVIGATE_KNOWLEDGE: "📜 Opening Qur'an & Hadith Knowledge.",
    NAVIGATE_SAHABAH: '🕌 Opening Sahabah stories.',
    NAVIGATE_CONTACT: '📱 Opening Contact with social links.',
  };

  return messages[intentType] || 'Navigating...';
}

export function getActionButtons(
  action: AIAction
): Array<{ type: 'navigate' | 'open-kitab' | 'play-audio'; label: string; url?: string }> {
  const buttons: Array<{
    type: 'navigate' | 'open-kitab' | 'play-audio';
    label: string;
    url?: string;
  }> = [];

  if (action.data?.languageOptions) {
    buttons.push(
      { type: 'navigate', label: '🇪🇹 Amharic', url: '#lang-am' },
      { type: 'navigate', label: '🇸🇦 Arabic', url: '#lang-ar' },
      { type: 'navigate', label: '🇬🇧 English', url: '#lang-en' }
    );
  }

  if ((action.type === 'navigate' || action.type === 'answer') && action.data?.route) {
    const route = action.data.route;
    if (route.startsWith('/kitab/')) {
      buttons.push({
        type: 'open-kitab',
        label: `📖 Open ${action.data.title || 'Kitab'}`,
        url: route.split('?')[0],
      });
    } else {
      const labelMap: Record<string, string> = {
        '/': '🏠 Go Home',
        '/kitab': '📖 View All Kitabs',
        '/audio-lecture': '🎧 Browse Audio',
        '/muhadara': '🎙️ Open Muhadara',
        '/video-lecture': '🎥 Watch Videos',
        '/videos': '🎥 Watch Videos',
        '/reminders': '💭 Read Reminders',
        '/knowledge': '📜 Explore Knowledge',
        '/sahabah': '🕌 Learn About Sahabah',
        '/contact': '📱 Contact Us',
      };
      buttons.push({
        type: 'navigate',
        label: labelMap[route] || `Open ${action.data.title || 'Page'}`,
        url: route,
      });
    }
  }

  if (action.type === 'play_audio' && action.data?.route) {
    buttons.push({
      type: 'play-audio',
      label: action.data.title ? `🎧 Play ${action.data.title}` : '🎧 Listen',
      url: action.data.route,
    });
  }

  return buttons.slice(0, 3);
}
