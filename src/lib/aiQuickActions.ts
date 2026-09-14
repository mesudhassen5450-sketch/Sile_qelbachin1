/**
 * Quick Action Buttons for AI Assistant
 * Predefined queries for common user needs
 */

import { QuickAction } from '@/components/AIChatDrawer';

export const quickActions: QuickAction[] = [
  {
    id: 'whats-new',
    icon: '✨',
    label: "What's new",
    labelAm: 'ምን አዲስ አለ',
    query: "what's new",
  },
  {
    id: 'new-ders',
    icon: '🎧',
    label: 'New ders',
    labelAm: 'አዲስ ድርስ',
    query: 'go to new ders',
  },
  {
    id: 'find-kitab',
    icon: '📖',
    label: 'Find a Kitab',
    labelAm: 'ኪታብ ፈልግ',
    query: 'open kitab',
  },
  {
    id: 'change-language',
    icon: '🌐',
    label: 'Language',
    labelAm: 'ቋንቋ',
    query: 'change language',
  },
  {
    id: 'find-muhadara',
    icon: '🎙️',
    label: 'Muhadara',
    labelAm: 'ሙሓደራ',
    query: 'open muhadara',
  },
  {
    id: 'find-video',
    icon: '🎥',
    label: 'Videos',
    labelAm: 'ቪዲዮ',
    query: 'open videos',
  },
  {
    id: 'find-reminder',
    icon: '💭',
    label: 'Reminders',
    labelAm: 'ማስታወሻዎች',
    query: 'open reminders',
  },
  {
    id: 'find-sahabah',
    icon: '🕌',
    label: 'Sahabah',
    labelAm: 'ሰሐባህ',
    query: 'open sahabah',
  },
];

/**
 * Get quick actions filtered by category
 */
export function getQuickActionsByCategory(category: 'content' | 'topics'): QuickAction[] {
  const contentActions = ['whats-new', 'new-ders', 'find-kitab', 'find-muhadara', 'find-video'];
  const topicActions = ['change-language', 'find-reminder', 'find-sahabah'];

  if (category === 'content') {
    return quickActions.filter((action) => contentActions.includes(action.id));
  }

  return quickActions.filter((action) => topicActions.includes(action.id));
}

/**
 * Get featured quick actions (top 6 for initial display)
 */
export function getFeaturedQuickActions(): QuickAction[] {
  return quickActions.slice(0, 6);
}
