'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown,
  Heart,
  MessageCircle,
  Mic,
  Pause,
  Play,
  Share2,
  Type,
  Video,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { pickCmsLoc, type CmsOneMinute } from '@/lib/cmsClient'
import { formatDuration } from '@/lib/mediaDuration'
import { prepareVideoPastIntro, skipTelegramVideoIntro } from '@/lib/videoIntroSkip'

export type FeedFilter = 'all' | 'video' | 'audio' | 'text'

type Slide = CmsOneMinute & { durationSeconds?: number | null }

type Props = {
  slides: Slide[]
  filter: FeedFilter
  onFilterChange: (f: FeedFilter) => void
}

function kindLabel(kind: string, getLocalized: (v: { en: string; am: string; ar: string }) => string) {
  if (kind === 'audio') return getLocalized({ en: 'Audio', am: 'ድምጽ', ar: 'صوت' })
  if (kind === 'video') return getLocalized({ en: 'Video', am: 'ቪዲዮ', ar: 'فيديو' })
  if (kind === 'image') return getLocalized({ en: 'Image', am: 'ምስል', ar: 'صورة' })
  return getLocalized({ en: 'Text', am: 'ጽሑፍ', ar: 'نص' })
}

/** Clean telegram spam / raw filenames for display */
function cleanTitle(raw: string, fallback?: string): string {
  let t = (raw || '').trim()
  t = t.replace(/https?:\/\/t\.me\/\S+/gi, '')
  t = t.replace(/t\.me\/\S+/gi, '')
  t = t.replace(/\s{2,}/g, ' ').trim()
  if (!t || /^audio[_\d@.-]+$/i.test(t) || /\.(ogg|mp3|m4a|mp4|webm)$/i.test(t)) {
    return fallback || t || 'Clip'
  }
  return t
}

/** All tab: video → audio → text → video → audio → text… */
function interleaveCycle(slides: Slide[]): Slide[] {
  const videos = slides.filter(s => s.kind === 'video')
  const audios = slides.filter(s => s.kind === 'audio')
  const texts = slides.filter(s => s.kind === 'text' || s.kind === 'image')
  const out: Slide[] = []
  const n = Math.max(videos.length, audios.length, texts.length)
  for (let i = 0; i < n; i++) {
    if (videos[i]) out.push(videos[i])
    if (audios[i]) out.push(audios[i])
    if (texts[i]) out.push(texts[i])
  }
  return out
}

export default function OneMinuteFeed({ slides, filter, onFilterChange }: Props) {
  const { getLocalized, language } = useLanguage()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const [active, setActive] = useState(0)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [clock, setClock] = useState({ current: 0, total: 0 })
  const [liked, setLiked] = useState<Record<string, boolean>>({})

  const filtered = useMemo(() => {
    if (filter === 'all') return interleaveCycle(slides)
    if (filter === 'text') return slides.filter(s => s.kind === 'text' || s.kind === 'image')
    return slides.filter(s => s.kind === filter)
  }, [slides, filter])

  const stopAllMedia = useCallback(() => {
    videoRefs.current.forEach(v => {
      try {
        v.pause()
      } catch {
        /* ignore */
      }
    })
    if (audioRef.current) {
      try {
        audioRef.current.pause()
      } catch {
        /* ignore */
      }
    }
  }, [])

  const playActive = useCallback(
    async (index: number) => {
      const slide = filtered[index]
      if (!slide) return
      stopAllMedia()
      setProgress(0)
      const known = slide.durationSeconds || 0
      setClock({ current: 0, total: known })
      if (!playing) return

      await new Promise(r => requestAnimationFrame(() => r(null)))

      if (slide.kind === 'video' && slide.mediaUrl) {
        const el = videoRefs.current.get(slide.id)
        if (!el) return
        el.muted = muted
        el.playsInline = true
        el.loop = false
        await prepareVideoPastIntro(el)
        el.ontimeupdate = () => {
          const total = el.duration || known || 0
          const cur = el.currentTime || 0
          if (total > 0) setProgress((cur / total) * 100)
          setClock({ current: cur, total })
        }
        el.onended = () => {
          setPlaying(false)
          setProgress(100)
        }
        try {
          await el.play()
        } catch {
          el.muted = true
          setMuted(true)
          try {
            await el.play()
          } catch {
            setPlaying(false)
          }
        }
        return
      }

      const soundUrl =
        slide.kind === 'audio' ? slide.mediaUrl || slide.soundUrl : slide.soundUrl
      if (!soundUrl) return
      if (!audioRef.current) audioRef.current = new Audio()
      const a = audioRef.current
      a.src = soundUrl
      a.muted = muted
      a.loop = false
      a.ontimeupdate = () => {
        const total = a.duration || known || 0
        const cur = a.currentTime || 0
        if (total > 0) setProgress((cur / total) * 100)
        setClock({ current: cur, total })
      }
      a.onended = () => {
        setPlaying(false)
        setProgress(100)
      }
      try {
        await a.play()
      } catch {
        a.muted = true
        setMuted(true)
        try {
          await a.play()
        } catch {
          setPlaying(false)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, playing, muted, stopAllMedia]
  )

  useEffect(() => {
    setActive(0)
    setPlaying(true)
    setProgress(0)
    setClock({ current: 0, total: 0 })
    scrollerRef.current?.scrollTo({ top: 0 })
  }, [filter, slides.length])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await playActive(active)
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, playing, muted, filtered])

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
  }, [filtered.length])

  useEffect(() => () => stopAllMedia(), [stopAllMedia])

  const tabs: { id: FeedFilter; label: { en: string; am: string; ar: string }; icon: typeof Video }[] =
    [
      { id: 'all', label: { en: 'All', am: 'ሁሉም', ar: 'الكل' }, icon: Play },
      { id: 'video', label: { en: 'Video', am: 'ቪዲዮ', ar: 'فيديو' }, icon: Video },
      { id: 'audio', label: { en: 'Audio', am: 'ድምጽ', ar: 'صوت' }, icon: Mic },
      { id: 'text', label: { en: 'Text', am: 'ጽሑፍ', ar: 'نص' }, icon: Type },
    ]

  const counts = {
    all: slides.length,
    video: slides.filter(s => s.kind === 'video').length,
    audio: slides.filter(s => s.kind === 'audio').length,
    text: slides.filter(s => s.kind === 'text' || s.kind === 'image').length,
  }

  if (!slides.length) {
    return (
      <div className="portfolio-card p-10 text-center space-y-2">
        <p className="font-bold text-neutral-900 dark:text-white">
          {getLocalized({
            en: 'No 1-minute slides yet',
            am: 'እስካሁን የ1 ደቂቃ ስላይድ የለም',
            ar: 'لا شرائح دقيقة بعد',
          })}
        </p>
      </div>
    )
  }

  return (
    <div className="relative space-y-4">
      <div
        role="tablist"
        className="grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
      >
        {tabs.map(tab => {
          const Icon = tab.icon
          const activeTab = filter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab}
              onClick={() => onFilterChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-2.5 text-[11px] sm:text-xs font-bold transition ${
                activeTab
                  ? 'bg-white dark:bg-neutral-950 text-red-600 shadow-sm border border-red-500/30'
                  : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{getLocalized(tab.label)}</span>
              <span className="font-mono text-[10px] opacity-60">{counts[tab.id]}</span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-neutral-500 text-center">
        {getLocalized({
          en: 'Autoplays muted · tap 🔊 for sound · tap to pause · swipe up for next',
          am: 'በራስ-ሰር ዝም ብሎ ይጫወታል · ለድምጽ 🔊 ይንኩ · ለማቆም ይንኩ · ቀጣይ ወደ ላይ',
          ar: 'تشغيل صامت تلقائي · المس 🔊 للصوت · المس للإيقاف · اسحب للأعلى',
        })}
      </p>

      {!filtered.length ? (
        <div className="portfolio-card p-8 text-center text-sm text-neutral-500">
          {getLocalized({
            en: 'No items in this category yet.',
            am: 'በዚህ ምድብ እስካሁን ምንም የለም።',
            ar: 'لا عناصر في هذا التصنيف بعد.',
          })}
        </div>
      ) : (
        <div
          ref={scrollerRef}
          className="h-[min(88vh,820px)] overflow-y-auto snap-y snap-mandatory rounded-[1.75rem] border border-neutral-800 bg-black shadow-2xl"
          style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {filtered.map((slide, index) => {
            const rawTitle = pickCmsLoc(slide.title, language)
            const title = cleanTitle(rawTitle, slide.kind === 'audio' ? 'Audio clip' : 'Video clip')
            const body = cleanTitle(pickCmsLoc(slide.body, language), '')
            const isActive = index === active
            const nearActive = Math.abs(index - active) <= 1
            const isLiked = liked[slide.id]
            const mediaUrl = slide.mediaUrl || ''

            return (
              <article
                key={slide.id}
                data-slide-index={index}
                className="relative h-[min(88vh,820px)] w-full snap-start snap-always flex flex-col overflow-hidden"
              >
                <button
                  type="button"
                  aria-label={playing && isActive ? 'Pause' : 'Play'}
                  className="absolute inset-0 z-10"
                  onClick={() => {
                    if (slide.kind === 'video') {
                      const el = videoRefs.current.get(slide.id)
                      if (!el) {
                        setPlaying(true)
                        return
                      }
                      if (el.paused) {
                        setPlaying(true)
                        el.muted = muted
                        void el.play().catch(() => {
                          el.muted = true
                          setMuted(true)
                          void el.play()
                        })
                      } else {
                        el.pause()
                        setPlaying(false)
                      }
                      return
                    }
                    // audio toggle
                    const a = audioRef.current
                    if (a && isActive) {
                      if (a.paused) {
                        setPlaying(true)
                        void a.play()
                      } else {
                        a.pause()
                        setPlaying(false)
                      }
                      return
                    }
                    setPlaying(p => !p)
                  }}
                >
                  <span className="sr-only">Toggle play</span>
                </button>

                <div className="absolute inset-0 pointer-events-none bg-neutral-950">
                  {slide.kind === 'video' && mediaUrl ? (
                    slide.coverUrl && !nearActive && !isActive ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slide.coverUrl}
                        alt=""
                        className="h-full w-full object-contain bg-black"
                      />
                    ) : (
                      <video
                        ref={el => {
                          if (el) videoRefs.current.set(slide.id, el)
                          else videoRefs.current.delete(slide.id)
                        }}
                        src={mediaUrl}
                        poster={slide.coverUrl || undefined}
                        playsInline
                        muted={muted || !isActive}
                        preload={isActive || nearActive ? 'auto' : 'metadata'}
                        className="h-full w-full object-contain bg-black"
                        onLoadedMetadata={e => {
                          try {
                            skipTelegramVideoIntro(e.currentTarget)
                          } catch {
                            /* ignore */
                          }
                        }}
                      />
                    )
                  ) : slide.kind === 'video' ? (
                    <div className="h-full w-full bg-neutral-950" />
                  ) : slide.kind === 'image' && mediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl} alt={title} className="h-full w-full object-contain bg-black" />
                  ) : slide.kind === 'audio' ? (
                    <div className="h-full w-full bg-gradient-to-br from-red-950 via-neutral-950 to-black flex flex-col items-center justify-center gap-6 px-6">
                      <div
                        className={`w-28 h-28 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center ${
                          isActive && playing ? 'animate-pulse' : ''
                        }`}
                      >
                        <Mic className="w-12 h-12 text-red-400" />
                      </div>
                      {isActive ? (
                        <div className="w-full max-w-xs space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-mono text-white/70">
                            <span>{formatDuration(clock.current || 0)}</span>
                            <span>
                              {formatDuration(clock.total || slide.durationSeconds || 0)}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full transition-[width] duration-150"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-neutral-900 via-neutral-950 to-black flex items-center justify-center px-8">
                      <Type className="w-14 h-14 text-red-400/80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 pointer-events-none" />
                </div>

                {isActive && !playing ? (
                  <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-black/55 border border-white/25 flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-7 h-7 text-white fill-white ml-1" />
                    </div>
                  </div>
                ) : null}

                {/* Top progress for video */}
                {isActive && slide.kind === 'video' ? (
                  <div className="absolute top-0 inset-x-0 z-20 h-1 bg-white/15">
                    <div
                      className="h-full bg-red-500 transition-[width] duration-150"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                ) : null}

                <div className="absolute end-3 bottom-36 z-20 flex flex-col items-center gap-5">
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      setLiked(prev => ({ ...prev, [slide.id]: !prev[slide.id] }))
                    }}
                    className="flex flex-col items-center gap-1 text-white"
                  >
                    <span
                      className={`w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/15 ${
                        isLiked ? 'text-red-500' : ''
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    </span>
                    <span className="text-[10px] font-bold">
                      {getLocalized({ en: 'Save', am: 'አስቀምጥ', ar: 'حفظ' })}
                    </span>
                  </button>
                  <Link
                    href="/ask-question"
                    onClick={e => e.stopPropagation()}
                    className="flex flex-col items-center gap-1 text-white"
                  >
                    <span className="w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/15">
                      <MessageCircle className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold">
                      {getLocalized({ en: 'Ask', am: 'ጠይቅ', ar: 'اسأل' })}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      const next = !muted
                      setMuted(next)
                      const el = videoRefs.current.get(slide.id)
                      if (el) el.muted = next
                      if (audioRef.current) audioRef.current.muted = next
                      if (!playing) setPlaying(true)
                    }}
                    className="flex flex-col items-center gap-1 text-white"
                  >
                    <span className="w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/15">
                      {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </span>
                    <span className="text-[10px] font-bold">
                      {muted
                        ? getLocalized({ en: 'Unmute', am: 'ድምጽ ክፈት', ar: 'تشغيل الصوت' })
                        : getLocalized({ en: 'Sound', am: 'ድምጽ', ar: 'صوت' })}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={async e => {
                      e.stopPropagation()
                      try {
                        await navigator.share?.({
                          title,
                          url: typeof window !== 'undefined' ? window.location.href : '',
                        })
                      } catch {
                        /* ignore */
                      }
                    }}
                    className="flex flex-col items-center gap-1 text-white"
                  >
                    <span className="w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/15">
                      <Share2 className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold">
                      {getLocalized({ en: 'Share', am: 'አጋራ', ar: 'شارك' })}
                    </span>
                  </button>
                </div>

                <div className="relative z-10 mt-auto p-5 sm:p-7 pe-20 space-y-3 pointer-events-none">
                  <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
                    <span className="inline-flex rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      {kindLabel(slide.kind, getLocalized)}
                    </span>
                    <span className="rounded-full bg-black/55 px-2 py-1 text-[10px] font-mono text-white/90 border border-white/10">
                      {isActive
                        ? `${formatDuration(clock.current || 0)} / ${formatDuration(
                            clock.total || slide.durationSeconds || 0
                          )}`
                        : formatDuration(slide.durationSeconds || 0)}
                    </span>
                    <span className="text-[10px] font-mono text-white/50">
                      {index + 1}/{filtered.length}
                    </span>
                  </div>

                  {/* Video bottom progress + clock */}
                  {isActive && slide.kind === 'video' ? (
                    <div className="space-y-1.5 max-w-md">
                      <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                        <div
                          className="h-full bg-[#D4AF37] rounded-full transition-[width] duration-150"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  <h2
                    className={`text-lg sm:text-xl font-black text-white leading-snug drop-shadow line-clamp-3 ${
                      language === 'ar' ? 'arabic-text' : ''
                    }`}
                  >
                    {title}
                  </h2>

                  {body && body !== title ? (
                    <p
                      className={`text-sm text-white/80 leading-relaxed line-clamp-2 max-w-md ${
                        language === 'ar' ? 'arabic-text' : ''
                      }`}
                    >
                      {body}
                    </p>
                  ) : null}

                  {index < filtered.length - 1 ? (
                    <div className="flex items-center gap-1 text-xs text-white/40 pt-1">
                      <ChevronDown className="w-4 h-4 animate-bounce" />
                      {getLocalized({ en: 'Swipe up', am: 'ወደ ላይ', ar: 'اسحب للأعلى' })}
                    </div>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
