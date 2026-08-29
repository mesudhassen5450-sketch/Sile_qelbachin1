'use client';

import React from 'react';
import Link from 'next/link';
import { Sahabah } from '@/data/channelData';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, ArrowLeft, BookOpen, Quote } from 'lucide-react';

export default function SahabahDetailClient({ sahabah }: { sahabah: Sahabah }) {
  const { t, getLocalized } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Back Button */}
      <Link
        href="/sahabah"
        className="inline-flex items-center space-x-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ወደ ሶሓቦች ታሪክ ተመለስ (Back to Sahabah List)</span>
      </Link>

      {/* Hero Header */}
      <div className="portfolio-card p-6 sm:p-10 space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/40">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t('nav.sahabah')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
          {getLocalized(sahabah.name)}
        </h1>
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
          {getLocalized(sahabah.title)}
        </p>
        <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed pt-2">
          {getLocalized(sahabah.shortDescription)}
        </p>
      </div>

      {/* Biography Details */}
      <div className="portfolio-card p-6 sm:p-10 space-y-6">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center space-x-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
          <BookOpen className="w-6 h-6 text-red-600" />
          <span>የሕይወት ታሪክና ገድል (Biography)</span>
        </h2>
        <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
          {getLocalized(sahabah.fullBiography)}
        </p>
      </div>

      {/* Key Lessons */}
      {sahabah.keyLessons && sahabah.keyLessons.length > 0 && (
        <div className="portfolio-card p-6 sm:p-10 space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center space-x-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <Quote className="w-5 h-5 text-red-600" />
            <span>ከታሪካቸው የምንወስዳቸው ዋና ዋና ትምህርቶች (Key Lessons)</span>
          </h2>
          <ul className="space-y-2.5">
            {sahabah.keyLessons.map((lesson, idx) => (
              <li key={idx} className="flex items-start space-x-3 text-sm text-neutral-700 dark:text-neutral-300">
                <span className="text-red-600 font-bold">•</span>
                <span>{getLocalized(lesson)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
