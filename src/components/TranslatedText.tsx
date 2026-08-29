'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage, LocalizedString } from '@/context/LanguageContext';

interface TranslatedTextProps {
  text: string | LocalizedString;
  targetLang?: string;
  className?: string;
}

const translationCache = new Map<string, string>();

export default function TranslatedText({ text, targetLang, className }: TranslatedTextProps) {
  const { language, getLocalized } = useLanguage();
  const langCode = (targetLang || language).toLowerCase();

  const initialString = getLocalized(text);
  const [translatedText, setTranslatedText] = useState<string>(initialString);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const rawString = getLocalized(text);

    // If text prop is already an object containing current language value, use it directly
    if (typeof text === 'object' && text[langCode as keyof LocalizedString]) {
      setTranslatedText(text[langCode as keyof LocalizedString]);
      setLoading(false);
      return;
    }

    // If target language is Amharic (default source), no translation needed
    if (langCode === 'am' || !rawString) {
      setTranslatedText(rawString);
      setLoading(false);
      return;
    }

    const cacheKey = `${langCode}:${rawString}`;
    if (translationCache.has(cacheKey)) {
      setTranslatedText(translationCache.get(cacheKey)!);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawString, targetLanguage: langCode }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.translatedText) {
            translationCache.set(cacheKey, data.translatedText);
            setTranslatedText(data.translatedText);
          } else {
            setTranslatedText(rawString);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('TranslatedText fetch error:', err);
        if (isMounted) {
          setTranslatedText(rawString);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [text, langCode, language]);

  return (
    <span className={`${className || ''} ${loading ? 'opacity-70 animate-pulse' : ''}`}>
      {translatedText}
    </span>
  );
}
