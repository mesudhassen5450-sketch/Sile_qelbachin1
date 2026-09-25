'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const INTRO_SRC = '/assets/quran_then_hadith_hero.mp4'
/** One play per browser. Bump to reset old sessions. */
const PLAYED_KEY = 'sq_intro_recitation_played_v3'
/** Medium volume (not high, not low) */
const INTRO_VOLUME = 0.45

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
 * Site intro (once per browser, any first page):
 * - Starts as soon as the app loads (Home, Kitab, Contact, …)
 * - Continues while navigating; stops when the track ends
 * - Medium volume; if autoplay is blocked, first tap starts from 0 with sound
 */
export function IntroRecitationProvider({ children }: { children: ReactNode }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const startedRef = useRef(false)
  const [phase, setPhase] = useState<IntroPhase>('pending')

  const markDone = useCallback(() => {
    try {
      localStorage.setItem(PLAYED_KEY, '1')
    } catch {
      // ignore
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
    if (phase !== 'playing') return
    const el = videoRef.current
    if (!el || startedRef.current) return
    startedRef.current = true

    el.setAttribute('playsinline', '')
    el.setAttribute('webkit-playsinline', '')
    el.playsInline = true
    el.preload = 'auto'
    el.volume = INTRO_VOLUME

    let unlocked = false

    const playWithSoundFromStart = async () => {
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
        // ignore
      }
    }

    const start = async () => {
      el.muted = false
      el.volume = INTRO_VOLUME
      try {
        await el.play()
        return
      } catch {
        el.pause()
        try {
          el.currentTime = 0
        } catch {
          // ignore
        }
        window.addEventListener('pointerdown', playWithSoundFromStart, { once: true, capture: true })
        window.addEventListener('touchstart', playWithSoundFromStart, { once: true, capture: true })
        window.addEventListener('keydown', playWithSoundFromStart, { once: true, capture: true })
      }
    }

    void start()

    return () => {
      window.removeEventListener('pointerdown', playWithSoundFromStart, true)
      window.removeEventListener('touchstart', playWithSoundFromStart, true)
      window.removeEventListener('keydown', playWithSoundFromStart, true)
    }
  }, [phase])

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
        <video
          ref={videoRef}
          src={INTRO_SRC}
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          controlsList="nodownload noplaybackrate noremoteplayback"
          onEnded={markDone}
          onError={markDone}
          className="fixed w-px h-px opacity-0 pointer-events-none -z-50"
          aria-hidden
          tabIndex={-1}
        />
      ) : null}
    </IntroRecitationContext.Provider>
  )
}
