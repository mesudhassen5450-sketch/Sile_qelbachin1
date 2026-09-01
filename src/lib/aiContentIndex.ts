/**
 * AI Content Indexer for Sle Qelbachin
 * Maps ALL website content for AI context - complete content navigator
 */

import { kitabsData, muhadarasData, videosData, remindersData, knowledgeData, siteMetadata } from '@/data/channelData';

export interface ContentIndex {
  kitabs: KitabIndex[];
  muhadara: MuhadaraIndex[];
  videos: VideoIndex[];
  reminders: ReminderIndex[];
  knowledge: KnowledgeIndex[];
  featuredAudio: AudioIndex[];
  categories: CategoryIndex[];
  routes: RouteIndex[];
  social: SocialIndex[];
}

export interface KitabIndex {
  slug: string;
  title: string;
  titleAm: string;
  titleAr: string;
  author: string;
  authorAm: string;
  authorAr: string;
  category: string;
  description: string;
  dersCount: number;
  pdfUrl?: string;
  pdfSize?: string;
  dersList: {
    id: string;
    title: string;
    titleAm: string;
    titleAr: string;
    speaker: string;
    duration: string;
    audioUrl: string;
  }[];
  route: string;
}

export interface MuhadaraIndex {
  id: string;
  title: string;
  titleAm: string;
  titleAr: string;
  speaker: string;
  speakerAm: string;
  speakerAr: string;
  topic: string;
  duration: string;
  date: string;
  audioUrl: string;
}

export interface VideoIndex {
  id: string;
  title: string;
  speaker: string;
  platform: 'tiktok' | 'youtube' | 'telegram';
  videoUrl: string;
  thumbnailUrl: string;
  views?: string;
}

export interface ReminderIndex {
  id: string;
  title: string;
  content: string;
  source: string;
  category: string;
  type: 'hadith' | 'quran' | 'reflection' | 'advice';
}

export interface KnowledgeIndex {
  id: string;
  category: 'quran' | 'hadith' | 'lesson' | 'reflection';
  title?: string;
  arabicText?: string;
  amharicText: string;
  explanation?: string;
  reference: string;
}

export interface AudioIndex {
  id: string;
  title: string;
  speaker: string;
  category: string;
  audioUrl: string;
  kitabId?: string;
  route?: string;
}

export interface CategoryIndex {
  name: string;
  description: string;
  route: string;
  itemCount?: number;
}

export interface RouteIndex {
  path: string;
  name: string;
  description: string;
}

export interface SocialIndex {
  platform: string;
  handle: string;
  url: string;
  verified: boolean;
}

/**
 * Build complete content index from ALL website data
 */
export function buildContentIndex(): ContentIndex {
  // Index all Kitabs with full details
  const kitabs: KitabIndex[] = kitabsData.map(kitab => ({
    slug: kitab.slug,
    title: typeof kitab.title === 'string' ? kitab.title : kitab.title.en,
    titleAm: typeof kitab.title === 'string' ? kitab.title : kitab.title.am,
    titleAr: typeof kitab.title === 'string' ? kitab.title : kitab.title.ar,
    author: typeof kitab.author === 'string' ? kitab.author : kitab.author.en,
    authorAm: typeof kitab.author === 'string' ? kitab.author : kitab.author.am,
    authorAr: typeof kitab.author === 'string' ? kitab.author : kitab.author.ar,
    category: typeof kitab.category === 'string' ? kitab.category : kitab.category.en,
    description: typeof kitab.description === 'string' ? kitab.description : kitab.description.en,
    dersCount: kitab.dersCount,
    pdfUrl: kitab.pdfUrl,
    pdfSize: kitab.pdfSize,
    dersList: kitab.dersList.map(ders => ({
      id: ders.id,
      title: typeof ders.title === 'string' ? ders.title : ders.title.en,
      titleAm: typeof ders.title === 'string' ? ders.title : ders.title.am,
      titleAr: typeof ders.title === 'string' ? ders.title : ders.title.ar,
      speaker: typeof ders.speaker === 'string' ? ders.speaker : ders.speaker.en,
      duration: ders.duration,
      audioUrl: ders.audioUrl,
    })),
    route: `/kitab/${kitab.slug}`,
  }));

  // Index all Muhadara
  const muhadara: MuhadaraIndex[] = muhadarasData.map(m => ({
    id: m.id,
    title: typeof m.title === 'string' ? m.title : m.title.en,
    titleAm: typeof m.title === 'string' ? m.title : m.title.am,
    titleAr: typeof m.title === 'string' ? m.title : m.title.ar,
    speaker: typeof m.speaker === 'string' ? m.speaker : m.speaker.en,
    speakerAm: typeof m.speaker === 'string' ? m.speaker : m.speaker.am,
    speakerAr: typeof m.speaker === 'string' ? m.speaker : m.speaker.ar,
    topic: typeof m.topic === 'string' ? m.topic : m.topic.en,
    duration: m.duration,
    date: m.date,
    audioUrl: m.audioUrl,
  }));

  // Index all Videos
  const videos: VideoIndex[] = videosData.map(v => ({
    id: v.id,
    title: typeof v.title === 'string' ? v.title : v.title.en,
    speaker: typeof v.speaker === 'string' ? v.speaker : v.speaker.en,
    platform: v.platform,
    videoUrl: v.videoUrl,
    thumbnailUrl: v.thumbnailUrl,
    views: v.views,
  }));

  // Index all Reminders
  const reminders: ReminderIndex[] = remindersData.map(r => ({
    id: r.id,
    title: typeof r.title === 'string' ? r.title : r.title.en,
    content: typeof r.content === 'string' ? r.content : r.content.en,
    source: typeof r.source === 'string' ? r.source : r.source.en,
    category: r.category,
    type: r.type,
  }));

  // Index all Knowledge (Qur'an, Hadith, etc.)
  const knowledge: KnowledgeIndex[] = knowledgeData.map(k => ({
    id: k.id,
    category: k.category,
    title: k.title ? (typeof k.title === 'string' ? k.title : k.title.en) : undefined,
    arabicText: k.arabicText,
    amharicText: typeof k.amharicText === 'string' ? k.amharicText : k.amharicText.am,
    explanation: k.explanation ? (typeof k.explanation === 'string' ? k.explanation : k.explanation.en) : undefined,
    reference: typeof k.reference === 'string' ? k.reference : k.reference.en,
  }));

  // Featured Audio from Homepage + Latest Ders
  const featuredAudio: AudioIndex[] = [
    {
      id: 'intebih-part-1',
      title: 'Intebih Part 1 - Warning for the Heedless',
      speaker: 'Abu Sufiyan Albenan',
      category: 'Kitab',
      audioUrl: 'https://cdn.jsdelivr.net/gh/mesudhassen5450-sketch/sileqelbachin-media@main/files/Intebih Ante Murakeb (intebih-ante-murakeb)/ኢንተቢህ 1.m4a',
      kitabId: 'intebih-ante-murakeb',
      route: '/kitab/intebih-ante-murakeb',
    },
    {
      id: 'intebih-part-2',
      title: 'Intebih Part 2 - Warning for the Heedless',
      speaker: 'Abu Sufiyan Albenan',
      category: 'Kitab',
      audioUrl: 'https://cdn.jsdelivr.net/gh/mesudhassen5450-sketch/sileqelbachin-media@main/files/Intebih Ante Murakeb (intebih-ante-murakeb)/ኢንተቢህ- ክፍል 2.m4a',
      kitabId: 'intebih-ante-murakeb',
      route: '/kitab/intebih-ante-murakeb',
    },
    {
      id: 'intebih-part-3',
      title: 'Intebih Part 3 - Warning for the Heedless',
      speaker: 'Abu Sufiyan Albenan',
      category: 'Kitab',
      audioUrl: 'https://cdn.jsdelivr.net/gh/mesudhassen5450-sketch/sileqelbachin-media@main/files/Intebih Ante Murakeb (intebih-ante-murakeb)/ኢንተቡህ- ክፍል 3.m4a',
      kitabId: 'intebih-ante-murakeb',
      route: '/kitab/intebih-ante-murakeb',
    },
    {
      id: 'intebih-part-4',
      title: 'Intebih Part 4 - Warning for the Heedless',
      speaker: 'Abu Sufiyan Albenan',
      category: 'Kitab',
      audioUrl: 'https://cdn.jsdelivr.net/gh/mesudhassen5450-sketch/sileqelbachin-media@main/files/Intebih Ante Murakeb (intebih-ante-murakeb)/ኢንተቢህ-ክፍል 4.m4a',
      kitabId: 'intebih-ante-murakeb',
      route: '/kitab/intebih-ante-murakeb',
    },
    {
      id: 'poetry-mareny-geta',
      title: 'ማረኝ ጌታየ ሆይ - My Lord, Poetry',
      speaker: 'Composed by Ustaz Muhammad Siraj, Voice by Abu Sufiyan',
      category: 'Poetry',
      audioUrl: 'https://cdn.jsdelivr.net/gh/mesudhassen5450-sketch/sileqelbachin-media@main/files/home page audio/ማረኝ_የኔ_ጌታ…!የ_ኡስታዝ_መመሀመድ_ሲራጁ_ግጥም.m4a',
    },
    {
      id: 'anxiety-stress',
      title: 'How to Overcome Anxiety and Stress',
      speaker: 'Ustaz Abdu Razaq Al-Baji',
      category: 'Advice',
      audioUrl: 'https://cdn.jsdelivr.net/gh/mesudhassen5450-sketch/sileqelbachin-media@main/files/home page audio/ከጭንቀት_እና_ከ_ሐሳብ_መውጫ_መንገዶች!.mp3',
    },
    {
      id: 'marriage-islam',
      title: 'Marriage & Islam - Consequences of Sin',
      speaker: 'Abu Sufiyan',
      category: 'Marriage',
      audioUrl: 'https://cdn.jsdelivr.net/gh/mesudhassen5450-sketch/sileqelbachin-media@main/files/home page audio/ትዳር እና እስልምና.ogg',
    },
  ];

  // Website Categories with counts
  const categories: CategoryIndex[] = [
    {
      name: 'Kitab',
      description: '7 Islamic book series with audio lessons',
      route: '/kitab',
      itemCount: kitabs.length,
    },
    {
      name: 'Audio Lectures',
      description: 'Online audio lectures and lessons',
      route: '/audio-lecture',
    },
    {
      name: 'Muhadara',
      description: 'Islamic discourses and talks',
      route: '/muhadara',
      itemCount: muhadara.length,
    },
    {
      name: 'Videos',
      description: 'Educational video content',
      route: '/videos',
      itemCount: videos.length,
    },
    {
      name: 'Reminders',
      description: 'Daily Islamic reminders',
      route: '/reminders',
      itemCount: reminders.length,
    },
    {
      name: 'Qur\'an & Hadith',
      description: 'Qur\'anic verses and Hadith knowledge',
      route: '/knowledge',
      itemCount: knowledge.length,
    },
    {
      name: 'Sahabah',
      description: 'Stories of the Prophet\'s companions',
      route: '/sahabah',
    },
  ];

  // Available Routes
  const routes: RouteIndex[] = [
    { path: '/', name: 'Home', description: 'Homepage with featured content' },
    { path: '/kitab', name: 'Kitab Library', description: '7 Islamic books with audio' },
    { path: '/audio-lecture', name: 'Audio Lectures', description: 'All audio lectures' },
    { path: '/muhadara', name: 'Muhadara', description: 'Islamic discourses' },
    { path: '/videos', name: 'Videos', description: 'Video lectures' },
    { path: '/reminders', name: 'Reminders', description: 'Daily reminders' },
    { path: '/knowledge', name: 'Knowledge', description: 'Qur\'an & Hadith' },
    { path: '/sahabah', name: 'Sahabah', description: 'Companion stories' },
    { path: '/contact', name: 'Contact', description: 'Social media links' },
  ];

  // Verified Social Links
  const social: SocialIndex[] = [
    {
      platform: 'Telegram',
      handle: '@Sle_qelbachn1',
      url: siteMetadata.telegramUrl,
      verified: true,
    },
    {
      platform: 'TikTok',
      handle: '@sle_qelbachn1',
      url: siteMetadata.tiktokUrl,
      verified: true,
    },
    {
      platform: 'YouTube',
      handle: siteMetadata.youtubeHandle,
      url: siteMetadata.youtubeUrl,
      verified: true,
    },
  ];

  return {
    kitabs,
    muhadara,
    videos,
    reminders,
    knowledge,
    featuredAudio,
    categories,
    routes,
    social,
  };
}

/**
 * Search for Kitab by keyword (title, author, category)
 */
export function searchKitab(query: string): KitabIndex[] {
  const index = getCachedIndex();
  const lowerQuery = query.toLowerCase();

  return index.kitabs.filter(kitab =>
    kitab.title.toLowerCase().includes(lowerQuery) ||
    kitab.titleAm.includes(query) ||
    kitab.titleAr.includes(query) ||
    kitab.author.toLowerCase().includes(lowerQuery) ||
    kitab.authorAm.includes(query) ||
    kitab.category.toLowerCase().includes(lowerQuery) ||
    kitab.slug.includes(lowerQuery)
  );
}

/**
 * Search for audio/ders by keyword
 */
export function searchAudio(query: string): AudioIndex[] {
  const index = getCachedIndex();
  const lowerQuery = query.toLowerCase();

  return index.featuredAudio.filter(audio =>
    audio.title.toLowerCase().includes(lowerQuery) ||
    audio.speaker.toLowerCase().includes(lowerQuery) ||
    audio.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search for Muhadara by keyword
 */
export function searchMuhadara(query: string): MuhadaraIndex[] {
  const index = getCachedIndex();
  const lowerQuery = query.toLowerCase();

  return index.muhadara.filter(m =>
    m.title.toLowerCase().includes(lowerQuery) ||
    m.titleAm.includes(query) ||
    m.speaker.toLowerCase().includes(lowerQuery) ||
    m.speakerAm.includes(query) ||
    m.topic.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get random Muhadara
 */
export function getRandomMuhadara(): MuhadaraIndex | null {
  const index = getCachedIndex();
  if (index.muhadara.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * index.muhadara.length);
  return index.muhadara[randomIndex];
}

/**
 * Search for reminders
 */
export function searchReminders(query: string): ReminderIndex[] {
  const index = getCachedIndex();
  const lowerQuery = query.toLowerCase();

  return index.reminders.filter(r =>
    r.title.toLowerCase().includes(lowerQuery) ||
    r.content.toLowerCase().includes(lowerQuery) ||
    r.source.toLowerCase().includes(lowerQuery) ||
    r.category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get random reminder
 */
export function getRandomReminder(): ReminderIndex | null {
  const index = getCachedIndex();
  if (index.reminders.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * index.reminders.length);
  return index.reminders[randomIndex];
}

/**
 * Search knowledge (Qur'an/Hadith)
 */
export function searchKnowledge(query: string, category?: 'quran' | 'hadith' | 'lesson' | 'reflection'): KnowledgeIndex[] {
  const index = getCachedIndex();
  const lowerQuery = query.toLowerCase();

  return index.knowledge.filter(k => {
    const matchesCategory = category ? k.category === category : true;
    const matchesQuery = 
      (k.title && k.title.toLowerCase().includes(lowerQuery)) ||
      k.amharicText.toLowerCase().includes(lowerQuery) ||
      (k.arabicText && k.arabicText.includes(query)) ||
      k.reference.toLowerCase().includes(lowerQuery);
    
    return matchesCategory && matchesQuery;
  });
}

/**
 * Get social link by platform
 */
export function getSocialLink(platform: string): SocialIndex | null {
  const index = getCachedIndex();
  return index.social.find(s => 
    s.platform.toLowerCase() === platform.toLowerCase()
  ) || null;
}

// Cache the content index to avoid rebuilding on every request
let cachedIndex: ContentIndex | null = null;

function getCachedIndex(): ContentIndex {
  if (!cachedIndex) {
    cachedIndex = buildContentIndex();
  }
  return cachedIndex;
}

// Export for external use
export { getCachedIndex };

/**
 * Get AI-friendly comprehensive content summary
 */
export function getAIContextSummary(): string {
  const index = getCachedIndex();

  return `
# Sle Qelbachin Website - Complete Content Index

## VERIFIED SOCIAL LINKS:
${index.social.map(s => `
- **${s.platform}**: ${s.verified ? `${s.handle} - ${s.url}` : 'Not available'}
`).join('')}

## AVAILABLE KITABS (${index.kitabs.length} Islamic Books):
${index.kitabs.map(k => `
### ${k.title} (${k.titleAm})
- **Author**: ${k.author} (${k.authorAm})
- **Category**: ${k.category}
- **Ders Count**: ${k.dersCount} audio lessons
- **PDF**: ${k.pdfUrl ? `Available (${k.pdfSize})` : 'Not available'}
- **Route**: ${k.route}
- **Description**: ${k.description}
- **Ders List**:
${k.dersList.slice(0, 3).map(d => `  - ${d.title} (${d.titleAm}) - Speaker: ${d.speaker}`).join('\n')}
${k.dersList.length > 3 ? `  ... and ${k.dersList.length - 3} more` : ''}
`).join('\n')}

## MUHADARA (${index.muhadara.length} Discourses):
${index.muhadara.map(m => `
- **${m.title}** (${m.titleAm})
  - Speaker: ${m.speaker} (${m.speakerAm})
  - Topic: ${m.topic}
  - Duration: ${m.duration}
  - Date: ${m.date}
`).join('\n')}

## FEATURED AUDIO (Latest Ders & Special Content):
${index.featuredAudio.map(a => `
- **${a.title}**
  - Speaker: ${a.speaker}
  - Category: ${a.category}
  ${a.kitabId ? `- From Kitab: ${a.kitabId}` : ''}
  ${a.route ? `- Route: ${a.route}` : ''}
`).join('\n')}

## REMINDERS (${index.reminders.length} items):
${index.reminders.slice(0, 2).map(r => `
- **${r.title}**
  - Type: ${r.type}
  - Source: ${r.source}
  - Category: ${r.category}
`).join('\n')}
${index.reminders.length > 2 ? `... and ${index.reminders.length - 2} more reminders available` : ''}

## KNOWLEDGE (Qur'an & Hadith - ${index.knowledge.length} items):
${index.knowledge.slice(0, 2).map(k => `
- **Category**: ${k.category}
  ${k.title ? `- Title: ${k.title}` : ''}
  - Reference: ${k.reference}
`).join('\n')}
${index.knowledge.length > 2 ? `... and ${index.knowledge.length - 2} more knowledge items` : ''}

## VIDEOS:
${index.videos.length > 0 ? index.videos.map(v => `
- **${v.title}**
  - Speaker: ${v.speaker}
  - Platform: ${v.platform}
`).join('\n') : 'No videos currently available'}

## WEBSITE SECTIONS:
${index.categories.map(c => `
- **${c.name}**: ${c.description} ${c.itemCount ? `(${c.itemCount} items)` : ''}
  - Route: ${c.route}
`).join('\n')}

## NAVIGATION ROUTES:
${index.routes.map(r => `
- **${r.path}**: ${r.name} - ${r.description}
`).join('\n')}

## IMPORTANT AI BEHAVIOR RULES:
1. **Content Accuracy**: Only refer to content that EXISTS in this index
2. **No Fabrication**: NEVER invent Qur'an verses, Hadith, or Islamic rulings
3. **Verified Sources**: Always provide actual source references from the index
4. **Route Guidance**: Direct users to actual routes (e.g., /kitab/intebih-ante-murakeb)
5. **Social Links**: Only provide verified social links listed above
6. **Search Support**: Help users find Kitab, Ders, Muhadara, Audio, Videos, Reminders, Knowledge
7. **Navigation Actions**: Provide clickable actions when relevant (📖 Open, 🎧 Listen, 🎥 Watch, 📄 PDF)
8. **PDF Availability**: Only mention PDF if pdfUrl exists for that Kitab
9. **Content Not Found**: If user asks for unavailable content, clearly state it's not on the website
10. **No Internal Details**: Never expose search processes, indexing, or system internals

## CONTENT SEARCH CAPABILITIES:
- Search Kitabs by: title, author, category, slug
- Search Audio by: title, speaker, category
- Search Muhadara by: title, speaker, topic
- Search Reminders by: title, content, source, category, type
- Search Knowledge by: category (quran/hadith/lesson/reflection), text, reference
- Get random Muhadara or Reminder
- Find social links by platform

## LANGUAGE SUPPORT:
- Amharic (primary)
- Arabic
- English

All content is multilingual - respond in the language the user uses or provide translations when helpful.
`;
}
