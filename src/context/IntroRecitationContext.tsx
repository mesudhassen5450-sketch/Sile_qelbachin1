'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'

const INTRO_SRC = '/assets/quran_then_hadith_hero.mp4'
/** One play per browser profile (phone or desktop). Survives navigation; never auto-replays. */
const PLAYED_KEY = 'sq_intro_recitation_played_v1'
const INTRO_VOLUME = 0.45
export const HERO_INTRO_SLOT_ID = 'sq-hero-intro-slot'

type IntroPhase = 'pending' | 'playing' | 'done'

type IntroRecitationContextValue = {
  phase: IntroPhase
  isPlaying: boolean
}

const IntroRecitationContext = createContext<IntroRecitationContextValue>({
  phase: 'pending',
  isPlaying: false,
})

export function useIntroRecitation() {
  return useContext(IntroRecitationContext)
}

/**
 * Site intro (mobile + desktop):
 * - Opens once when the user first visits any page in this browser
 * - Keeps playing while they navigate (kitab, contact, …)
 * - No controls / play button
 * - When finished → marked in localStorage → never plays again on that device/browser
 */
export function IntroRecitationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const parkRef = useRef<HTMLDivElement | null>(null)
  const startedRef = useRef(false)
  const [phase, setPhase] = useState<IntroPhase>('pending')
  const [heroSlot, setHeroSlot] = useState<HTMLElement | null>(null)

  const markDone = useCallback(() => {
    try {
      localStorage.setItem(PLAYED_KEY, '1')
    } catch {
      // ignore (private mode)
    }
    setPhase('done')
  }, [])

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(PLAYED_KEY) === '1') {
        setPhase('done')
        return
      }
    } catch {
      // ignore
    }
    setPhase('playing')
  }, [])

  useEffect(() => {
    if (phase !== 'playing') {
      setHeroSlot(null)
      return
    }
    const sync = () => setHeroSlot(document.getElementById(HERO_INTRO_SLOT_ID))
    sync()
    const t = window.setInterval(sync, 300)
    return () => window.clearInterval(t)
  }, [phase, pathname])

  useLayoutEffect(() => {
    const video = videoRef.current
    if (!video || phase !== 'playing') return
    const onHome = pathname === '/'
    const target = onHome && heroSlot ? heroSlot : parkRef.current
    if (!target) return
    if (video.parentElement !== target) {
      target.appendChild(video)
    }
    if (onHome && heroSlot) {
      video.className = 'absolute inset-0 h-full w-full object-cover pointer-events-none'
      video.removeAttribute('aria-hidden')
    } else {
      video.className = 'sr-only'
      video.setAttribute('aria-hidden', 'true')
    }
  }, [phase, pathname, heroSlot])

  useEffect(() => {
    if (phase !== 'playing') return
    const el = videoRef.current
    if (!el || startedRef.current) return
    startedRef.current = true

    el.setAttribute('playsinline', '')
    el.setAttribute('webkit-playsinline', '')
    el.playsInline = true
    el.volume = INTRO_VOLUME

    let unlocked = false

    const unlockOnGesture = () => {
      if (unlocked) return
      unlocked = true
      el.muted = false
      el.volume = INTRO_VOLUME
      void el.play().catch(() => undefined)
    }

    const start = async () => {
      // iOS often blocks unmuted autoplay — try sound first, then muted + unlock on first tap.
      el.muted = false
      el.volume = INTRO_VOLUME
      try {
        await el.play()
      } catch {
        el.muted = true
        el.volume = INTRO_VOLUME
        try {
          await el.play()
        } catch {
          markDone()
          return
        }
        window.addEventListener('pointerdown', unlockOnGesture, { once: true, capture: true })
        window.addEventListener('touchstart', unlockOnGesture, { once: true, capture: true })
        window.addEventListener('keydown', unlockOnGesture, { once: true, capture: true })
      }
    }

    void start()

    return () => {
      window.removeEventListener('pointerdown', unlockOnGesture, true)
      window.removeEventListener('touchstart', unlockOnGesture, true)
      window.removeEventListener('keydown', unlockOnGesture, true)
    }
  }, [phase, markDone])

  const value = useMemo(
    () => ({
      phase,
      isPlaying: phase === 'playing',
    }),
    [phase]
  )

  return (
    <IntroRecitationContext.Provider value={value}>
      {children}
      {phase === 'playing' ? (
        <div ref={parkRef} className="contents" aria-hidden>
          <video
            ref={videoRef}
            src={INTRO_SRC}
            playsInline
            autoPlay
            preload="auto"
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noplaybackrate noremoteplayback"
            onEnded={markDone}
            onError={markDone}
            className="sr-only"
            aria-label="Site introduction recitation"
          />
        </div>
      ) : null}
    </IntroRecitationContext.Provider>
  )
}
