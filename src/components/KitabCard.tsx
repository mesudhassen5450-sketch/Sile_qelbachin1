'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Kitab } from '@/data/channelData';
import { useLanguage } from '@/context/LanguageContext';

// Helper function for detail page banner styling (kept for backward compatibility)
export function getKitabDetailBannerStyle(slug: string): React.CSSProperties {
  switch (slug) {
    case 'intebih-ante-murakeb':
      return { objectFit: 'cover', objectPosition: 'center 40%', transform: 'scale(1.08)' };
    case 'adewae-kitab':
      return { objectFit: 'cover', objectPosition: 'center 35%', transform: 'scale(1.12)' };
    case 'fatihu-awliya':
      return { objectFit: 'cover', objectPosition: 'center center', transform: 'scale(1.05)' };
    case 'alkesidu-leyse-algerib':
      return { objectFit: 'cover', objectPosition: 'center 28%', transform: 'scale(1.15)' };
    case 'teshilu-alimu-sheria':
      return { objectFit: 'cover', objectPosition: 'center 30%', transform: 'scale(1.15)' };
    case 'yekelb-medreq':
      return { objectFit: 'cover', objectPosition: 'center center', transform: 'scale(1.08)' };
    case 'betewbet-mengede-lay':
      return { objectFit: 'cover', objectPosition: 'center 45%', transform: 'scale(1.05)' };
    default:
      return { objectFit: 'cover', objectPosition: 'center' };
  }
}

export default function KitabCard({ kitab }: { kitab: Kitab }) {
  const { getLocalized } = useLanguage();
  const titleText = getLocalized(kitab.title);
  const authorText = getLocalized(kitab.author);
  const descriptionText = getLocalized(kitab.description);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-red-600/30 transition-all duration-300">

      {/* Image & Top Floating Badge */}
      <div className="relative h-48 w-full bg-neutral-900 overflow-hidden">
        {kitab.coverImage ? (
          <Image
            src={kitab.coverImage}
            alt={titleText}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="w-full h-full object-cover object-center"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-900 via-neutral-900 to-neutral-950 flex items-center justify-center">
            <span className="text-6xl font-black text-red-600/30 select-none">
              {titleText.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Lesson Count Badge (Top Right) */}
        <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
          <span>🎧 {kitab.dersCount} Ders</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1 leading-snug line-clamp-2">
            {titleText}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-1 font-medium">
            <span>✍️</span> {authorText}
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed mb-4">
            {descriptionText}
          </p>
        </div>

        {/* Footer Link & Path Indicator */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between mt-auto">
          <span className="text-[11px] text-neutral-400 font-mono truncate max-w-[140px]">
            /kitab/{kitab.slug}
          </span>
          <Link
            href={`/kitab/${kitab.slug}`}
            className="bg-red-700 hover:bg-red-800 dark:bg-red-600 dark:hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Open Kitab</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
