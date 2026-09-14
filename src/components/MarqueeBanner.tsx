'use client';

import { useLanguage } from '@/context/LanguageContext';
import { siteMetadata } from '@/data/channelData';

export default function MarqueeBanner() {
  const { getLocalized, language } = useLanguage();
  const quote = getLocalized(siteMetadata.bannerVerse);
  const source = getLocalized(siteMetadata.bannerVerseSource);
  const isArabic = language === 'ar';

  const renderItem = (hidden: boolean) => (
    <span
      key={hidden ? 'clone' : 'live'}
      aria-hidden={hidden || undefined}
      className={`inline-flex items-center gap-3 px-8 text-sm md:text-base font-medium tracking-wide ${isArabic ? 'arabic-text' : ''}`}
    >
      <span>{quote}</span>
      <span className="text-amber-200/90 text-xs md:text-sm font-semibold whitespace-nowrap">
        — {source}
      </span>
    </span>
  );

  return (
    <div
      className="marquee-banner w-full overflow-hidden bg-[#800000] text-white py-2.5 shadow-md border-t border-b border-red-950"
      role="region"
      aria-label={`${quote} ${source}`}
    >
      <div className="marquee-track">
        {renderItem(false)}
        {renderItem(true)}
      </div>
    </div>
  );
}
