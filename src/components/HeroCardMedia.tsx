'use client'

import { siteMetadata } from '@/data/channelData'
import { useLanguage } from '@/context/LanguageContext'

const HERO_STILL = '/assets/heart-hero.jpg'

/**
 * Home hero media — same layout day/night; surfaces adapt with theme classes.
 */
export default function HeroCardMedia() {
  const { t } = useLanguage()

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[2/1] overflow-hidden rounded-[1.25rem] border border-[#e5e7eb] dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-[0_10px_28px_-14px_rgba(15,23,42,0.14)] dark:shadow-none">
      {/* eslint-disable-next-line @next/next/no-img-element -- static hero still */}
      <img
        src={HERO_STILL}
        alt={siteMetadata.channelName}
        width={840}
        height={420}
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 flex items-end p-4 z-[1] bg-gradient-to-t from-[#f8f9fb]/70 via-[#f8f9fb]/10 to-transparent dark:from-black/70 dark:via-black/15 dark:to-transparent">
        <div className="rounded-lg bg-white/85 dark:bg-black/45 px-3 py-2 backdrop-blur-[2px] shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <span className="text-xs font-mono font-bold text-[#286247] dark:text-red-400">
            {t('officialCommunity')}
          </span>
          <h3 className="text-lg font-bold text-[#111827] dark:text-white">{siteMetadata.channelName}</h3>
        </div>
      </div>
    </div>
  )
}
