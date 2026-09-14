'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';
import { Kitab } from '@/data/channelData';
import { useLanguage } from '@/context/LanguageContext';
import { resolveMediaUrl } from '@/lib/mediaUrl';

export default function KitabCard({ kitab }: { kitab: Kitab }) {
  const { getLocalized, t, language } = useLanguage();
  const titleText = getLocalized(kitab.title);
  const authorText = getLocalized(kitab.author);
  const descriptionText = getLocalized(kitab.description);
  const arabicTitle = typeof kitab.title === 'object' ? kitab.title.ar : '';
  const coverSrc = resolveMediaUrl(kitab.coverImage);
  const pdfSrc = resolveMediaUrl(kitab.pdfUrl);
  const isArabic = language === 'ar';

  return (
    <div className="group relative bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-zinc-800 hover:border-red-700/50 dark:hover:border-red-900/60 rounded-xl overflow-hidden transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-red-950/10 hover:scale-[1.02]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-200 dark:bg-zinc-900">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={titleText}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-contain object-center p-3"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-900 via-neutral-900 to-neutral-950 flex items-center justify-center">
            <span className="text-6xl font-black text-red-600/30 select-none">
              {titleText.charAt(0)}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-black/10 pointer-events-none" />

        <span className="absolute top-3 end-3 bg-red-700/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md border border-red-500/20 shadow-sm">
          {kitab.dersCount} {t('dersCount')}
        </span>

        {arabicTitle && !isArabic && (
          <span className="absolute bottom-2 start-3 arabic-text text-zinc-300 text-xs bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
            {arabicTitle}
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3
            className={`text-lg font-bold text-neutral-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1 ${
              isArabic ? 'arabic-text' : ''
            }`}
          >
            {titleText}
          </h3>

          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <User className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className={`truncate ${isArabic ? 'arabic-text' : ''}`}>{authorText}</span>
          </div>

          <p
            className={`text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed pt-1 ${
              isArabic ? 'arabic-text' : ''
            }`}
          >
            {descriptionText}
          </p>
        </div>

        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-2">
          <Link
            href={`/kitab/${kitab.slug}`}
            className="flex-1 text-center bg-red-700 hover:bg-red-800 text-white text-xs font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-md flex items-center justify-center gap-1"
          >
            <span>{t('buttons.openKitab')}</span>
            <span className="rtl:rotate-180 inline-block">→</span>
          </Link>

          {pdfSrc && (
            <a
              href={pdfSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-white rounded-lg transition-colors"
              title={t('downloadPdf')}
              aria-label={t('downloadPdf')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
