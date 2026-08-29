// Media types for Islamic educational resources platform

export type MediaType = 'audio' | 'video' | 'pdf';

export type Category = 'Hadith' | 'Aqeedah' | 'Tafseer' | 'Kitab PDF' | 'Fiqh' | 'Seerah' | 'General' | 'Poetry';

export interface MultiLanguageText {
  en: string;
  ar: string;
  am: string; // Amharic
}

export interface MediaItem {
  id: string;
  type: MediaType;
  title: MultiLanguageText;
  description: MultiLanguageText;
  fileUrl: string; // e.g., /telegram_media/voice_messages/audio_1.ogg
  category: Category;
  duration?: number; // in seconds
  fileSize?: string; // e.g., "2.5 MB"
  dateAdded: string; // ISO date string
  thumbnailUrl?: string;
}

export interface AudioPlayerTrack {
  id: string;
  title: string;
  fileUrl: string;
  duration?: number;
  category?: Category;
}

export type Language = 'en' | 'ar' | 'am';
