'use client'

import { siteMetadata } from '@/data/channelData'
import { useLanguage } from '@/context/LanguageContext'

const HERO_STILL = '/assets/heart-hero.jpg'

/**
 * Home hero card — static heart image only (no video, no wait).
 * Site intro sound is handled separately by IntroRecitationProvider.
 */
export default function HeroCardMedia() {
  const { t } = useLanguage()

  return (
    <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950">
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
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent flex items-end p-4 z-[1]">
        <div>
          <span className="text-xs font-mono text-red-400 font-bold">{t('officialCommunity')}</span>
          <h3 className="text-lg font-bold text-white">{siteMetadata.channelName}</h3>
        </div>
      </div>
    </div>
  )
}
