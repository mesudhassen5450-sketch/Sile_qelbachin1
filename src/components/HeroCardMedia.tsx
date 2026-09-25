'use client'

import { siteMetadata } from '@/data/channelData'
import { useLanguage } from '@/context/LanguageContext'
import { useIntroRecitation } from '@/context/IntroRecitationContext'

const HERO_STILL = '/assets/heart-hero.jpg'
const INTRO_SRC = '/assets/quran_then_hadith_hero.mp4'

/**
 * Home hero visual only.
 * Sound is owned by IntroRecitationProvider (all pages, once, medium volume).
 */
export default function HeroCardMedia() {
  const { t } = useLanguage()
  const { phase } = useIntroRecitation()
  const showVideo = phase === 'playing'

  return (
    <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950">
      {showVideo ? (
        <video
          src={INTRO_SRC}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          playsInline
          muted
          autoPlay
          preload="metadata"
          controls={false}
          disablePictureInPicture
          aria-hidden
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- instant still
        <img
          src={HERO_STILL}
          alt={siteMetadata.channelName}
          width={840}
          height={420}
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent flex items-end p-4 z-[1]">
        <div>
          <span className="text-xs font-mono text-red-400 font-bold">{t('officialCommunity')}</span>
          <h3 className="text-lg font-bold text-white">{siteMetadata.channelName}</h3>
        </div>
      </div>
    </div>
  )
}
