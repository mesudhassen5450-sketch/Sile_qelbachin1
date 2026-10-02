'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronDown,
  Heart,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import ShareSheet from '@/components/ShareSheet'
import { formatDuration } from '@/lib/mediaDuration'
import type { MediaItem } from '@/data/mediaStore'
import { prepareVideoPastIntro, skipTelegramVideoIntro } from '@/lib/videoIntroSkip'

const MEDIUM_VOLUME = 0.55

export type TimedVideo = MediaItem & { durationSeconds: number }

type Props = {
  videos: TimedVideo[]
  focusId?: string | null
  onActiveIdChange?: (id: string) => void
}

function pickTitle(v: MediaItem, language: string) {
  return (
    v.title[language as 'am' | 'en' | 'ar'] ||
    v.title.am ||
    v.rawFilename ||
    'Video'
  )
}

/**
 * Scrollable long-video feed.
 * Only mounts video elements for active ± 1 to avoid WebMediaPlayer limits.
 */
export default function ScrollableVideoFeed({ videos, focusId, onActiveIdChange }: Props) {
  const { getLocalized, language } = useLanguage()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const [active, setActive] = useState(0)
  const [muted, setMuted] = useState(false)
  const [needsUnlock, setNeedsUnlock] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [clock, setClock] = useState({ current: 0, total: 0 })
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [shareTarget, setShareTarget] = useState<{ title: string; text?: string } | null>(null)

  const slides = videos
  const slidesRef = useRef(slides)
  slidesRef.current = slides
  const activeRef = useRef(active)
  activeRef.current = active
  const applyingFocusRef = useRef(false)
  const lastFocusIdRef = useRef<string | null | undefined>(undefined)

  const stopAll = useCallback(() => {
    videoRefs.current.forEach(v => {
      try {
        v.pause()
      } catch {
        /* ignore */
      }
    })
  }, [])

  // External chooser → scroll to slide (only when focusId actually changes from parent)
  useEffect(() => {
    if (!focusId || !slides.length) return
    if (lastFocusIdRef.current === focusId) return
    lastFocusIdRef.current = focusId
    const idx = slides.findIndex(s => s.id === focusId)
    if (idx < 0 || idx === activeRef.current) return
    applyingFocusRef.current = true
    setActive(idx)
    const root = scrollerRef.current
    const node = root?.querySelector(`[data-slide-index="${idx}"]`) as HTMLElement | null
    node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    // release after paint so onActiveIdChange does not fight the chooser
    requestAnimationFrame(() => {
      applyingFocusRef.current = false
    })
  }, [focusId, slides])

  // Reset only when the list length changes (new catalog), not on every parent render
  useEffect(() => {
    setActive(0)
    setPlaying(true)
    setProgress(0)
    lastFocusIdRef.current = undefined
    scrollerRef.current?.scrollTo({ top: 0 })
  }, [slides.length])

  // Notify parent of active slide — skip while applying external focus
  useEffect(() => {
    const slide = slides[active]
    if (!slide || applyingFocusRef.current) return
    lastFocusIdRef.current = slide.id
    onActiveIdChange?.(slide.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  useEffect(() => {
    const slide = slidesRef.current[active]
    if (!slide) return

    stopAll()
    setProgress(0)
    setClock({ current: 0, total: slide.durationSeconds || 0 })

    if (!playing) return

    let cancelled = false
    const tryPlay = async () => {
      await new Promise(r => requestAnimationFrame(() => r(null)))
      if (cancelled) return
      const el = videoRefs.current.get(slide.id)
      if (!el) return
      el.muted = muted
      el.volume = MEDIUM_VOLUME
      el.playsInline = true
      el.loop = false
      await prepareVideoPastIntro(el)
      el.ontimeupdate = () => {
        const total = el.duration || slide.durationSeconds || 0
        const cur = el.currentTime || 0
        if (total > 0) setProgress((cur / total) * 100)
        setClock({ current: cur, total })
      }
      el.onended = () => {
        if (!cancelled) {
          setPlaying(false)
          setProgress(100)
        }
      }
      try {
        await el.play()
        if (!cancelled) setNeedsUnlock(false)
      } catch {
        if (!cancelled) {
          // Autoplay with sound blocked — retry muted then ask for tap
          el.muted = true
          setMuted(true)
          try {
            await el.play()
            if (!cancelled) setNeedsUnlock(true)
          } catch {
            if (!cancelled) {
              setNeedsUnlock(true)
              setPlaying(false)
            }
          }
        }
      }
    }
    void tryPlay()
    return () => {
      cancelled = true
    }
  }, [active, playing, muted, stopAll])

  useEffect(() => {
    const root = scrollerRef.current
    if (!root) return
    const nodes = Array.from(root.querySelectorAll('[data-slide-index]'))
    const io = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting && e.intersectionRatio >= 0.55)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        const idx = Number((visible.target as HTMLElement).dataset.slideIndex)
        if (!Number.isNaN(idx)) setActive(idx)
      },
      { root, threshold: [0.55, 0.75, 0.9] }
    )
    nodes.forEach(n => io.observe(n))
    return () => io.disconnect()
  }, [slides.length])

  useEffect(() => () => stopAll(), [stopAll])

  const hint = useMemo(
    () =>
      getLocalized({
        en: 'Scrollable video · medium sound · swipe up for next',
        am: 'ሊሽከረከር የሚችል ቪዲዮ · መካከለኛ ድምጽ · ቀጣይ ወደ ላይ',
        ar: 'فيديو قابل للتمرير · صوت متوسط · اسحب للأعلى',
      }),
    [getLocalized]
  )

  if (!slides.length) {
    return (
      <div className="portfolio-card p-10 text-center space-y-2">
        <p className="font-bold text-neutral-900 dark:text-white">
          {getLocalized({
            en: 'No videos ready yet',
            am: 'እስካሁን ቪዲዮ የለም',
            ar: 'لا فيديو بعد',
          })}
        </p>
      </div>
    )
  }

  const unlockWithSound = async () => {
    setMuted(false)
    setNeedsUnlock(false)
    setPlaying(true)
    const slide = slides[active]
    if (!slide) return
    const el = videoRefs.current.get(slide.id)
    if (!el) return
    el.muted = false
    el.volume = MEDIUM_VOLUME
    try {
      await el.play()
    } catch {
      setNeedsUnlock(true)
      setPlaying(false)
    }
  }

  return (
    <div className="relative space-y-3">
      <p className="text-xs text-neutral-500 text-center font-medium">{hint}</p>

      <div
        ref={scrollerRef}
        className="h-[min(82vh,760px)] overflow-y-auto snap-y snap-mandatory rounded-[1.75rem] border border-[#D4AF37]/45 bg-black shadow-2xl"
        style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {slides.map((slide, index) => {
          const title = pickTitle(slide, language)
          const isActive = index === active
          const nearActive = Math.abs(index - active) <= 1
          const isLiked = liked[slide.id]

          return (
            <article
              key={slide.id}
              data-slide-index={index}
              className="relative h-[min(82vh,760px)] w-full snap-start snap-always flex flex-col overflow-hidden"
            >
              <button
                type="button"
                aria-label={playing && isActive ? 'Pause' : 'Play'}
                className="absolute inset-0 z-10"
                onClick={() => {
                  if (needsUnlock && isActive) {
                    void unlockWithSound()
                    return
                  }
                  const el = videoRefs.current.get(slide.id)
                  if (!el) {
                    setPlaying(true)
                    return
                  }
                  if (el.paused) {
                    setPlaying(true)
                    el.muted = muted
                    el.volume = MEDIUM_VOLUME
                    void el.play().catch(() => {
                      setNeedsUnlock(true)
                      setPlaying(false)
                    })
                  } else {
                    el.pause()
                    setPlaying(false)
                  }
                }}
              >
                <span className="sr-only">Toggle play</span>
              </button>

              <div className="absolute inset-0 pointer-events-none bg-neutral-950">
                {nearActive ? (
                  <video
                    ref={el => {
                      if (el) videoRefs.current.set(slide.id, el)
                      else videoRefs.current.delete(slide.id)
                    }}
                    src={slide.fileUrl}
                    playsInline
                    muted={muted}
                    preload={isActive ? 'auto' : 'metadata'}
                    className="h-full w-full object-contain bg-black"
                    onLoadedMetadata={e => {
                      if (!isActive) skipTelegramVideoIntro(e.currentTarget)
                    }}
                  />
                ) : (
                  <div className="h-full w-full bg-neutral-950" />
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 z-20 pointer-events-none bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-24 pb-5 px-4 sm:px-6">
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2 pointer-events-none">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                      {getLocalized({
                        en: 'Scrollable video',
                        am: 'ሊሽከረከር የሚችል ቪዲዮ',
                        ar: 'فيديو قابل للتمرير',
                      })}
                      <span className="ms-2 font-mono text-white/70 normal-case tracking-normal">
                        {formatDuration(slide.durationSeconds)}
                      </span>
                    </p>
                    <h2 className="text-base sm:text-lg font-bold text-white line-clamp-3 leading-snug">
                      {title}
                    </h2>
                    {isActive ? (
                      <div className="space-y-1.5 max-w-md">
                        <div className="flex items-center justify-between text-[10px] font-mono text-white/70">
                          <span>{formatDuration(clock.current || 0)}</span>
                          <span>{formatDuration(clock.total || slide.durationSeconds)}</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                          <div
                            className="h-full bg-[#D4AF37] rounded-full transition-[width] duration-150"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-center gap-3 pointer-events-auto shrink-0">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        setLiked(prev => ({ ...prev, [slide.id]: !prev[slide.id] }))
                      }}
                      className="btn-interactive w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white"
                    >
                      <Heart
                        className={`w-5 h-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        setShareTarget({ title, text: title })
                      }}
                      className="btn-interactive w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        setMuted(m => !m)
                      }}
                      className="btn-interactive w-11 h-11 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-white"
                    >
                      {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        const el = videoRefs.current.get(slide.id)
                        if (!el) return
                        if (el.paused) {
                          setPlaying(true)
                          void el.play()
                        } else {
                          el.pause()
                          setPlaying(false)
                        }
                      }}
                      className="btn-interactive w-11 h-11 rounded-full bg-[#D4AF37] text-neutral-950 flex items-center justify-center"
                    >
                      {playing && isActive ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {isActive && index < slides.length - 1 ? (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-white/50">
                  <ChevronDown className="w-5 h-5 animate-bounce" />
                </div>
              ) : null}

              {needsUnlock && isActive ? (
                <button
                  type="button"
                  onClick={() => void unlockWithSound()}
                  className="absolute inset-0 z-30 flex items-center justify-center bg-black/50"
                >
                  <span className="btn-interactive px-5 py-3 rounded-2xl bg-[#D4AF37] text-neutral-950 font-bold text-sm flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    {getLocalized({
                      en: 'Tap for sound',
                      am: 'ለድምጽ ይንኩ',
                      ar: 'المس للصوت',
                    })}
                  </span>
                </button>
              ) : null}
            </article>
          )
        })}
      </div>

      {shareTarget ? (
        <ShareSheet
          open
          title={shareTarget.title}
          text={shareTarget.text}
          onClose={() => setShareTarget(null)}
        />
      ) : null}
    </div>
  )
}
