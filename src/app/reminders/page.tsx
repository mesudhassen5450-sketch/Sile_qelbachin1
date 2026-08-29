'use client';

import React, { useState } from 'react';
import { remindersData } from '@/data/channelData';
import { useLanguage } from '@/context/LanguageContext';
import TranslatedText from '@/components/TranslatedText';
import { Heart, Bookmark, Sparkles } from 'lucide-react';

export default function RemindersPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ሁሉም');
  const { language, t } = useLanguage();

  const categories = [
    'ሁሉም',
    'የቀልብ ጥራት',
    'ኢማን',
    'ትዕግሥት',
    'እውነተኛነት',
    'ሶላት',
    'ተውባ',
    'መልካም ሥነ-ምግባር',
    'አኺራ',
    'ነፍስን መቆጣጠር'
  ];

  const filteredReminders = selectedCategory === 'ሁሉም'
    ? remindersData
    : remindersData.filter(r => r.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Page Header */}
      <div className="portfolio-card p-6 sm:p-10 space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/40">
          <Heart className="w-3.5 h-3.5" />
          <span><TranslatedText text="የቀልብና የኢማን ማስታወሻዎች (Islamic Reminders)" targetLang={language} /></span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
          {t('subReminders')}
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
          <TranslatedText
            text="ከቁርኣንና ከሶሒሕ ሐዲሦች የተወሰዱ የቀልብ ማረጋጊያና የኢማን ማጠናከሪያ አጫጭር ማስታወሻዎች ከትክክለኛ ምንጫቸው ጋር።"
            targetLang={language}
          />
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              selectedCategory === cat
                ? 'btn-red shadow-sm'
                : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <TranslatedText text={cat} targetLang={language} />
          </button>
        ))}
      </div>

      {/* Reminders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReminders.map((reminder) => (
          <div
            key={reminder.id}
            className="portfolio-card p-6 flex flex-col justify-between space-y-4 hover:border-red-600/30 transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400">
                  <Sparkles className="w-3 h-3" />
                  <span><TranslatedText text={reminder.category} targetLang={language} /></span>
                </span>
                <span className="text-2xs uppercase font-extrabold text-neutral-400 font-mono">
                  {reminder.type}
                </span>
              </div>

              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                <TranslatedText text={reminder.title} targetLang={language} />
              </h3>

              <p className="text-sm text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
                "<TranslatedText text={reminder.content} targetLang={language} />"
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center space-x-1">
                <Bookmark className="w-3.5 h-3.5" />
                <span><TranslatedText text={reminder.source} targetLang={language} /></span>
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
