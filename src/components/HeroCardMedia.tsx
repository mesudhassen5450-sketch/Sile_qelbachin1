'use client'

import Image from 'next/image'

import { siteMetadata } from '@/data/channelData'
import { useLanguage } from '@/context/LanguageContext'
import { HERO_INTRO_SLOT_ID, useIntroRecitation } from '@/context/IntroRecitationContext'

const HERO_STILL = '/assets/heart-hero.jpg'

/**
 * Hero card: shows the intro video (once) while it plays on home;
 * otherwise the heart still. Playback is owned by IntroRecitationProvider
 * so audio continues across pages and never repeats after it finishes.
 */
export default function HeroCardMedia() {
  const { t } = useLanguage()
  const { isPlaying } = useIntroRecitation()

  return (
    <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950">
      <div id={HERO_INTRO_SLOT_ID} className="absolute inset-0 z-0" />
      {!isPlaying ? (
        <Image
          src={HERO_STILL}
          alt={siteMetadata.channelName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 420px"
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent flex items-end p-4 z-[1]">
        <div>
          <span className="text-xs font-mono text-red-400 font-bold">{t('officialCommunity')}</span>
          <h3 className="text-lg font-bold text-white">{siteMetadata.channelName}</h3>
        </div>
      </div>
    </div>
  )
}
