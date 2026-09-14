'use client';

import React from 'react';
import Link from 'next/link';
import { Sahabah } from '@/data/channelData';
import { useLanguage } from '@/context/LanguageContext';
import { ShieldCheck, ArrowLeft, BookOpen, Quote } from 'lucide-react';

export default function SahabahDetailClient({ sahabah }: { sahabah: Sahabah }) {
  const { t, getLocalized } = useLanguage();
  const hasSections = Boolean(sahabah.sections && sahabah.sections.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <Link
        href="/sahabah"
        className="inline-flex items-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        <span>{t('sahabahBack')}</span>
      </Link>

      <div className="portfolio-card p-6 sm:p-10 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 text-xs font-semibold border border-red-200 dark:border-red-900/40">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t('nav.sahabah')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 dark:text-white">
          {getLocalized(sahabah.name)}
        </h1>
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
          {getLocalized(sahabah.title)}
        </p>
        {sahabah.reign && (
          <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
            {getLocalized(sahabah.reign)}
          </p>
        )}
        <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed pt-2">
          {getLocalized(sahabah.shortDescription)}
        </p>
      </div>

      {!hasSections && (
        <div className="portfolio-card p-6 sm:p-10 space-y-6">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <BookOpen className="w-6 h-6 text-red-600" />
            <span>{t('sahabahBiography')}</span>
          </h2>
          <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
            {getLocalized(sahabah.fullBiography)}
          </p>
        </div>
      )}

      {hasSections && (
        <div className="space-y-6">
          <div className="portfolio-card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
              <BookOpen className="w-6 h-6 text-red-600" />
              <span>{t('sahabahBiography')}</span>
            </h2>
            <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
              {getLocalized(sahabah.fullBiography)}
            </p>
          </div>

          {sahabah.sections!.map((section, idx) => (
            <section key={idx} className="portfolio-card p-6 sm:p-8 space-y-4">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-3">
                {getLocalized(section.title)}
              </h3>
              <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                {getLocalized(section.body)}
              </p>
            </section>
          ))}
        </div>
      )}

      {sahabah.keyLessons && sahabah.keyLessons.length > 0 && (
        <div className="portfolio-card p-6 sm:p-10 space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <Quote className="w-5 h-5 text-red-600" />
            <span>{t('sahabahKeyLessons')}</span>
          </h2>
          <ul className="space-y-2.5">
            {sahabah.keyLessons.map((lesson, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
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
