/**
 * Quick Action Buttons for AI Assistant
 * Predefined queries for common user needs
 */

import { QuickAction } from '@/components/AIChatDrawer';

export const quickActions: QuickAction[] = [
  {
    id: 'find-kitab',
    icon: '📖',
    label: 'Find a Kitab',
    labelAm: 'ኪታብ ፈልግ',
    query: 'Show me the available Kitabs on this website',
  },
  {
    id: 'find-audio',
    icon: '🎧',
    label: 'Find Audio',
    labelAm: 'ድምፅ ፈልግ',
    query: 'What audio lectures are available?',
  },
  {
    id: 'find-muhadara',
    icon: '🎙️',
    label: 'Muhadara',
    labelAm: 'ሙሓደራ',
    query: 'Show me Muhadara content',
  },
  {
    id: 'find-video',
    icon: '🎥',
    label: 'Videos',
    labelAm: 'ቪዲዮ',
    query: 'What videos are available?',
  },
  {
    id: 'find-reminder',
    icon: '💭',
    label: 'Reminders',
    labelAm: 'ማስታወሻዎች',
    query: 'Show me daily Islamic reminders',
  },
  {
    id: 'find-quran',
    icon: '📜',
    label: 'Qur\'an & Hadith',
    labelAm: 'ቁርኣን እና ሐዲስ',
    query: 'Show me Qur\'an and Hadith content',
  },
  {
    id: 'find-sahabah',
    icon: '🕌',
    label: 'Sahabah',
    labelAm: 'ሰሐባህ',
    query: 'Tell me about the Sahabah stories',
  },
  {
    id: 'heart-purification',
    icon: '❤️',
    label: 'Heart Purification',
    labelAm: 'የልብ ዝቅያህ',
    query: 'Show me content about heart purification',
  },
];

/**
 * Get quick actions filtered by category
 */
export function getQuickActionsByCategory(category: 'content' | 'topics'): QuickAction[] {
  const contentActions = ['find-kitab', 'find-audio', 'find-muhadara', 'find-video'];
  const topicActions = ['find-reminder', 'find-quran', 'find-sahabah', 'heart-purification'];

  if (category === 'content') {
    return quickActions.filter(action => contentActions.includes(action.id));
  }
  
  return quickActions.filter(action => topicActions.includes(action.id));
}

/**
 * Get featured quick actions (top 6 for initial display)
 */
export function getFeaturedQuickActions(): QuickAction[] {
  return quickActions.slice(0, 6);
}
