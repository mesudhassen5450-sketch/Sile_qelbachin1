'use client';

import React from 'react';
import Link from 'next/link';
import { sahabahData } from '@/data/channelData';
import { useLanguage } from '@/context/LanguageContext';
import TranslatedText from '@/components/TranslatedText';
import { ShieldCheck, ArrowRight, BookOpen } from 'lucide-react';

export default function SahabahListPage() {
  const { language, t, getLocalized } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Header Banner */}
      <div className="portfolio-card p-6 sm:p-10 space-y-4 text-center sm:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/40">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span><TranslatedText text="የነቢዩ (ሰ.ዐ.ወ) ባልደራቦች ታሪክ (Stories of Sahabah)" targetLang={language} /></span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
          {t('nav.sahabah')}
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
          <TranslatedText
            text="የሶሓቦች ተምሳሌታዊ የሕይወት ታሪክ፣ የቀልብ ጽናት፣ የኢማን ጥራትና ከነሱ የምንወስዳቸው ዋና ዋና ትምህርቶች።"
            targetLang={language}
          />
        </p>
      </div>

      {/* Sahabah Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sahabahData.map((sahabah) => (
          <div
            key={sahabah.slug}
            className="group portfolio-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-red-600/30 transition"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{t('nav.sahabah')}</span>
                </span>
              </div>

              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition">
                {getLocalized(sahabah.name)}
              </h2>

              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                {getLocalized(sahabah.title)}
              </p>

              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {getLocalized(sahabah.shortDescription)}
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-mono">
                /sahabah/{sahabah.slug}
              </span>
              <Link
                href={`/sahabah/${sahabah.slug}`}
                className="btn-red inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
              >
                <span>{t('sections.readSahabah')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
