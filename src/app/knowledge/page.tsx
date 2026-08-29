'use client';

import React from 'react';
import { knowledgeData } from '@/data/channelData';
import { useLanguage } from '@/context/LanguageContext';
import TranslatedText from '@/components/TranslatedText';
import { BookOpen, Bookmark, Sparkles, Compass } from 'lucide-react';

export default function KnowledgePage() {
  const { language, t } = useLanguage();

  const quranItems = knowledgeData.filter(k => k.category === 'quran');
  const hadithItems = knowledgeData.filter(k => k.category === 'hadith');
  const lessonItems = knowledgeData.filter(k => k.category === 'lesson');
  const reflectionItems = knowledgeData.filter(k => k.category === 'reflection');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Page Header */}
      <div className="portfolio-card p-6 sm:p-10 space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/40">
          <BookOpen className="w-3.5 h-3.5" />
          <span><TranslatedText text="ትክክለኛ እስላማዊ እውቀት (Islamic Knowledge Library)" targetLang={language} /></span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
          {t('subKnowledge')}
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
          <TranslatedText
            text="የአረብኛ ቁርኣን አያቶች፣ ሶሒሕ ሐዲሦች፣ የእውቀት ትምህርቶችና የቀልብ ማስተንተኖች ከተረጋገጡ ምንጮቻቸው ጋር።"
            targetLang={language}
          />
        </p>
      </div>

      {/* 📖 1. QUR'AN SECTION (Arabic RTL + Amharic) */}
      <section className="space-y-6">
        <div className="flex items-center space-x-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <BookOpen className="w-5 h-5 text-red-600" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            <TranslatedText text="📖 የቁርኣን አንቀጾች (Qur'an Verses)" targetLang={language} />
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {quranItems.map((item) => (
            <div
              key={item.id}
              className="portfolio-card p-6 sm:p-8 space-y-4"
            >
              {item.arabicText && (
                <div className="arabic-text text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 p-5 rounded-xl border border-amber-200 dark:border-amber-900/30">
                  {item.arabicText}
                </div>
              )}
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                <TranslatedText text={item.amharicText} targetLang={language} />
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                <TranslatedText text={item.explanation || ''} targetLang={language} />
              </p>
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-xs font-bold text-red-600 dark:text-red-400 font-mono">
                  <TranslatedText text={item.reference} targetLang={language} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 📜 2. HADITH SECTION */}
      <section className="space-y-6">
        <div className="flex items-center space-x-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <Bookmark className="w-5 h-5 text-red-600" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            <TranslatedText text="📜 ሶሒሕ ሐዲሦች (Authentic Hadiths)" targetLang={language} />
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {hadithItems.map((item) => (
            <div
              key={item.id}
              className="portfolio-card p-6 sm:p-8 space-y-4"
            >
              {item.arabicText && (
                <div className="arabic-text text-xl sm:text-2xl font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  {item.arabicText}
                </div>
              )}
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                <TranslatedText text={item.amharicText} targetLang={language} />
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                <TranslatedText text={item.explanation || ''} targetLang={language} />
              </p>
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                  <TranslatedText text="ምንጭ፡" targetLang={language} /> <TranslatedText text={item.reference} targetLang={language} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 💡 3. ISLAMIC LESSONS & REFLECTIONS */}
      <section className="space-y-6">
        <div className="flex items-center space-x-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
          <Compass className="w-5 h-5 text-red-600" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            <TranslatedText text="💡 ትምህርቶችና ማስተንተኖች (Lessons & Reflections)" targetLang={language} />
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...lessonItems, ...reflectionItems].map((item) => (
            <div
              key={item.id}
              className="portfolio-card p-6 space-y-4"
            >
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                <Sparkles className="w-3 h-3 text-red-500" />
                <span>{item.category === 'lesson' ? <TranslatedText text="ትምህርት" targetLang={language} /> : <TranslatedText text="ማስተንተን" targetLang={language} />}</span>
              </span>

              {item.title && (
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                  <TranslatedText text={item.title} targetLang={language} />
                </h3>
              )}
              <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                <TranslatedText text={item.amharicText} targetLang={language} />
              </p>
              <p className="text-xs text-neutral-500 italic">
                <TranslatedText text={item.explanation || ''} targetLang={language} />
              </p>
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs font-bold text-red-600 dark:text-red-400">
                <TranslatedText text={item.reference} targetLang={language} />
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
