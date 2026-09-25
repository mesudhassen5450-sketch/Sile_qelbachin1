'use client'

import { useEffect, useRef, useState } from 'react'

import { siteMetadata } from '@/data/channelData'
import { useLanguage } from '@/context/LanguageContext'

const INTRO_SRC = '/assets/quran_then_hadith_hero.mp4'
const HERO_STILL = '/assets/heart-hero.jpg'
/** Once per browser — home only. Bump key so old broken sessions reset. */
const PLAYED_KEY = 'sq_intro_home_once_v2'
/** Medium volume */
const INTRO_VOLUME = 0.45

/**
 * Home hero card only:
 * - First visit: play intro video here with medium sound (once)
 * - Leaving Home stops the video (no sound on Kitab / Contact)
 * - When finished (or already played): static heart image
 * - No controls
 */
export default function HeroCardMedia() {
  const { t } = useLanguage()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const startedRef = useRef(false)
  const [mode, setMode] = useState<'pending' | 'video' | 'still'>('pending')

  useEffect(() => {
    try {
      if (localStorage.getItem(PLAYED_KEY) === '1') {
        setMode('still')
        return
      }
    } catch {
      // ignore
    }
    setMode('video')
  }, [])

  const markDone = () => {
    try {
      localStorage.setItem(PLAYED_KEY, '1')
    } catch {
      // ignore
    }
    setMode('still')
  }

  useEffect(() => {
    if (mode !== 'video') return
    const el = videoRef.current
    if (!el || startedRef.current) return
    startedRef.current = true

    el.playsInline = true
    el.setAttribute('playsinline', '')
    el.setAttribute('webkit-playsinline', '')
    el.volume = INTRO_VOLUME
    el.muted = false

    let unlocked = false

    const playFromStartWithSound = async () => {
      if (unlocked) return
      unlocked = true
      el.muted = false
      el.volume = INTRO_VOLUME
      try {
        el.currentTime = 0
      } catch {
        // ignore
      }
      try {
        await el.play()
      } catch {
        markDone()
      }
    }

    const start = async () => {
      try {
        await el.play()
      } catch {
        // Autoplay with sound blocked — wait for first tap on THIS page, then start from 0.
        el.pause()
        try {
          el.currentTime = 0
        } catch {
          // ignore
        }
        window.addEventListener('pointerdown', playFromStartWithSound, { once: true, capture: true })
        window.addEventListener('touchstart', playFromStartWithSound, { once: true, capture: true })
      }
    }

    void start()

    return () => {
      // Leaving Home: stop audio so Kitab / Contact stay silent.
      el.pause()
      window.removeEventListener('pointerdown', playFromStartWithSound, true)
      window.removeEventListener('touchstart', playFromStartWithSound, true)
    }
  }, [mode])

  return (
    <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950">
      {mode === 'video' ? (
        <video
          ref={videoRef}
          src={INTRO_SRC}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          playsInline
          autoPlay
          preload="auto"
          controls={false}
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          onEnded={markDone}
          onError={markDone}
          aria-label={siteMetadata.channelName}
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
