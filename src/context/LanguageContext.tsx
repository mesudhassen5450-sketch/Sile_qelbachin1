'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '@/types/media';
import { translations } from '@/data/translations';

// LocalizedString type for multi-language content
export interface LocalizedString {
  en: string;
  ar: string;
  am: string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string | { en: string; ar: string; am: string }) => string;
  getLocalized: (text: string | LocalizedString | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'islamic-resources-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('am'); // Default to Amharic
  const [mounted, setMounted] = useState(false);

  // Load saved language preference on mount
  useEffect(() => {
    setMounted(true);
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    if (savedLanguage && ['en', 'ar', 'am'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language preference when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (mounted) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
    
    // Update document direction for RTL languages
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  };

  // Translation helper function - supports both key lookup and direct object
  const t = (key: string | { en: string; ar: string; am: string }): string => {
    // If it's an object, return the appropriate language value directly
    if (typeof key === 'object') {
      return key[language] || key.en;
    }
    
    // If it's a string key, look it up in translations
    // Map common key patterns to translation keys
    const keyMap: Record<string, string> = {
      'hero.badge': 'heroBadge',
      'hero.btnKitab': 'heroBtnKitab',
      'hero.btnMuhadara': 'heroBtnMuhadara',
      'hero.btnTelegram': 'heroBtnTelegram',
      'purpose.title': 'purposeTitle',
      'sections.featuredKitab': 'featuredKitab',
      'sections.viewAllKitabs': 'viewAllKitabs',
      'sections.latestDers': 'latestDers',
      'sections.viewReminders': 'viewReminders',
      'sections.readSahabah': 'readSahabah',
      'sections.spotlight': 'spotlight',
      'sections.viewKnowledge': 'viewKnowledge',
      'nav.home': 'navHome',
      'nav.kitab': 'navKitab',
      'nav.audioLecture': 'navAudioLecture',
      'nav.contact': 'navContact',
      'nav.subpages': 'navEducationalSubpages',
      'nav.reminders': 'subRemindersAm',
      'nav.knowledge': 'subKnowledgeAm',
      'nav.sahabah': 'subSahabahAm',
      'nav.muhadara': 'subMuhadaraAm',
      'nav.videos': 'videos',
      'audioLecture.upcoming': 'upcomingLectures',
      'audioLecture.previous': 'previousLectures',
      'buttons.play': 'play',
      'buttons.pause': 'pause',
      'buttons.openKitab': 'openKitab',
      'contactTitle': 'contactTitle',
      'verifiedSocials': 'verifiedSocials',
      'sendMessageTitle': 'sendMessageTitle',
      'yourName': 'yourName',
      'messageSuccess': 'messageSuccess',
      'rightsReserved': 'rightsReserved',
    };
    
    // Try to find the translation key
    const translationKey = keyMap[key] || key;
    const translation = translations[translationKey];
    
    if (translation) {
      const langUpper = language.toUpperCase() as 'EN' | 'AR' | 'AM';
      return translation[langUpper] || translation.EN;
    }
    
    // Return key if no translation found
    return key;
  };

  // Helper to get localized string (handles both string and LocalizedString)
  const getLocalized = (text: string | LocalizedString | undefined): string => {
    if (!text) {
      return '';
    }
    if (typeof text === 'string') {
      return text;
    }
    return text[language] || text.en;
  };

  // Set initial direction on mount
  useEffect(() => {
    if (typeof document !== 'undefined' && mounted) {
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    getLocalized,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Language labels for UI
export const languageLabels: Record<Language, { native: string; english: string }> = {
  en: { native: 'English', english: 'English' },
  ar: { native: 'العربية', english: 'Arabic' },
  am: { native: 'አማርኛ', english: 'Amharic' },
};
