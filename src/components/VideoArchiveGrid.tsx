'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getVideos, type MediaItem } from '@/data/mediaStore'
import { useLanguage } from '@/context/LanguageContext'
import { useAudio } from '@/context/AudioContext'
import { formatDuration } from '@/lib/mediaDuration'
import ScrollableVideoFeed, { type TimedVideo } from '@/components/ScrollableVideoFeed'
import { getMediaDurationSeconds } from '@/data/mediaDurations'
import { fetchPublishedVideos, pickCmsLoc, type CmsVideo } from '@/lib/cmsClient'
import {
  Play,
  Download,
  Film,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const LONG_MIN_SECONDS = 60

function cleanMeta(raw: string): string {
  let t = (raw || '').trim()
  t = t.replace(/https?:\/\/t\.me\/\S+/gi, '')
  t = t.replace(/t\.me\/\S+/gi, '')
  return t.replace(/\s{2,}/g, ' ').trim()
}

/** Real video frame as thumbnail — only attaches src when near viewport.
 *  Prefer coverSrc (image) when Admin/CMS provided a real cover. */
function VideoThumb({
  src,
  coverSrc,
  className = '',
  seekTo = 1.2,
}: {
  src: string
  coverSrc?: string | null
  className?: string
  seekTo?: number
}) {
  const ref = React.useRef<HTMLVideoElement>(null)
  const [activeSrc, setActiveSrc] = useState<string | undefined>(undefined)
  const coverLooksLikeImage =
    typeof coverSrc === 'string' &&
    coverSrc.length > 0 &&
    !/\.(mp4|webm|mov|m4v)(\?|$)/i.test(coverSrc)

  useEffect(() => {
    if (coverLooksLikeImage) return
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setActiveSrc(src)
          io.disconnect()
        }
      },
      { rootMargin: '120px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [src, coverLooksLikeImage])

  useEffect(() => {
    const el = ref.current
    if (!el || !activeSrc) return
    const onMeta = () => {
      try {
        if (Number.isFinite(el.duration) && el.duration > seekTo) {
          el.currentTime = seekTo
        }
      } catch {
        /* ignore */
      }
    }
    el.addEventListener('loadedmetadata', onMeta)
    return () => el.removeEventListener('loadedmetadata', onMeta)
  }, [activeSrc, seekTo])

  if (coverLooksLikeImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverSrc!} alt="" className={className} />
    )
  }

  return (
    <video
      ref={ref}
      src={activeSrc}
      muted
      playsInline
      preload="metadata"
      className={className}
    />
  )
}

/**
 * Videos page — all lectures ≥ 1 minute (archive + Admin CMS), with real thumbs.
 */
export default function VideoArchiveGrid({
  focusId,
  feedOnly = false,
}: {
  focusId?: string | null
  feedOnly?: boolean
}) {
  const { getLocalized, language } = useLanguage()
  const { closePlayer } = useAudio()
  const [activeId, setActiveId] = useState<string | null>(focusId || null)
  const [cmsVideos, setCmsVideos] = useState<CmsVideo[]>([])
  const stripRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const rows = await fetchPublishedVideos()
      if (!cancelled && rows?.length) setCmsVideos(rows)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const longSorted: TimedVideo[] = useMemo(() => {
    const archive = getVideos()
      .map(v => {
        const seconds = getMediaDurationSeconds(v.id)
        if (seconds == null || seconds < LONG_MIN_SECONDS) return null
        const title = {
          am: cleanMeta(v.title.am) || v.rawFilename || 'Video',
          en: cleanMeta(v.title.en) || cleanMeta(v.title.am) || v.rawFilename || 'Video',
          ar: cleanMeta(v.title.ar) || cleanMeta(v.title.am) || v.rawFilename || 'Video',
        }
        return { ...v, title, durationSeconds: seconds }
      })
      .filter((x): x is TimedVideo => !!x)

    const fromCms: TimedVideo[] = cmsVideos
      .filter(v => v.fileUrl)
      .filter(v => {
        const cat = String(v.category || '')
          .trim()
          .toLowerCase()
        return cat !== 'one_minute' && cat !== '1-minute' && cat !== 'oneminute' && cat !== '1_minute'
      })
      .map(v => {
        const titleText = {
          am: pickCmsLoc(v.title, 'am') || pickCmsLoc(v.title, 'en'),
          en: pickCmsLoc(v.title, 'en') || pickCmsLoc(v.title, 'am'),
          ar: pickCmsLoc(v.title, 'ar') || pickCmsLoc(v.title, 'en'),
        }
        return {
          id: `cms-${v.id}`,
          title: titleText,
          description: {
            am: pickCmsLoc(v.description, 'am'),
            en: pickCmsLoc(v.description, 'en'),
            ar: pickCmsLoc(v.description, 'ar'),
          },
          fileUrl: v.fileUrl!,
          type: 'video' as const,
          category: (v.category || 'CMS') as TimedVideo['category'],
          dateAdded: '',
          durationSeconds: 120, // CMS long lectures; shorts go to 1-Minute
          thumbnailUrl: v.coverUrl || v.thumbnailUrl || undefined,
        }
      })

    const map = new Map<string, TimedVideo>()
    ;[...archive, ...fromCms].forEach(v => {
      if (!map.has(v.fileUrl)) map.set(v.fileUrl, v)
    })
    return Array.from(map.values()).sort((a, b) => b.durationSeconds - a.durationSeconds)
  }, [cmsVideos])

  useEffect(() => {
    if (focusId) setActiveId(focusId)
  }, [focusId])

  useEffect(() => {
    if (!activeId && longSorted[0]) setActiveId(longSorted[0].id)
  }, [activeId, longSorted])

  const choose = useCallback(
    (id: string) => {
      closePlayer()
      setActiveId(id)
    },
    [closePlayer]
  )

  const onActiveIdChange = useCallback((id: string) => {
    setActiveId(prev => (prev === id ? prev : id))
  }, [])

  const scrollStrip = (dir: -1 | 1) => {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(320, el.clientWidth * 0.7), behavior: 'smooth' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {!feedOnly ? (
        <div className="portfolio-card p-6 sm:p-8 space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-600 text-xs font-bold border border-rose-500/30">
            <Film className="w-3.5 h-3.5" />
            <span>
              {getLocalized({
                en: 'Video lessons',
                am: 'የቪዲዮ ትምህርቶች',
                ar: 'دروس الفيديو',
              })}
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="title-gold text-3xl sm:text-4xl">
              {getLocalized({
                en: 'Video lessons',
                am: 'የቪዲዮ ትምህርቶች',
                ar: 'دروس الفيديو',
              })}
              {longSorted.length > 0 ? (
                <span className="text-lg font-semibold text-neutral-500 dark:text-neutral-400 ms-2">
                  ({longSorted.length})
                </span>
              ) : null}
            </h1>
            <p className="text-base text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
              {getLocalized({
                en: 'Sequential video lessons and explanations.',
                am: 'ተከታታይ የቪዲዮ ትምህርቶች እና ማብራሪያዎች።',
                ar: 'دروس فيديو متتابعة وشروح.',
              })}{' '}
              <Link href="/one-minute" className="font-semibold text-red-600 hover:underline">
                {getLocalized({
                  en: '1-Minute messages →',
                  am: 'የ1 ደቂቃ መልእክቶች →',
                  ar: 'رسائل الدقيقة →',
                })}
              </Link>
            </p>
          </div>
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-[#B8860B]">
            {getLocalized({
              en: `Video lessons (${longSorted.length})`,
              am: `የቪዲዮ ትምህርቶች (${longSorted.length})`,
              ar: `دروس الفيديو (${longSorted.length})`,
            })}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollStrip(-1)}
              className="btn-interactive w-9 h-9 rounded-full border border-[#D4AF37]/40 flex items-center justify-center text-neutral-600 dark:text-neutral-300"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollStrip(1)}
              className="btn-interactive w-9 h-9 rounded-full border border-[#D4AF37]/40 flex items-center justify-center text-neutral-600 dark:text-neutral-300"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          ref={stripRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {longSorted.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="shrink-0 w-[160px] sm:w-[200px] aspect-video rounded-2xl bg-[#D4AF37]/10 animate-pulse snap-start"
                />
              ))
            : longSorted.map(video => {
                const selected = (activeId || longSorted[0]?.id) === video.id
                const title =
                  video.title[language as 'am' | 'en' | 'ar'] ||
                  video.title.am ||
                  video.rawFilename ||
                  'Video'
                return (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => choose(video.id)}
                    className={`btn-interactive shrink-0 w-[160px] sm:w-[200px] snap-start text-left rounded-2xl overflow-hidden border-2 transition ${
                      selected
                        ? 'border-rose-500 shadow-lg shadow-rose-500/20'
                        : 'border-[#D4AF37]/35 hover:border-[#D4AF37]/70'
                    }`}
                  >
                    <div className="relative aspect-video bg-black">
                      <VideoThumb
                        src={video.fileUrl}
                        coverSrc={video.thumbnailUrl}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white">
                        {formatDuration(video.durationSeconds)}
                      </span>
                    </div>
                    <p className="px-2.5 py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-100 line-clamp-2 leading-snug">
                      {title}
                    </p>
                  </button>
                )
              })}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs text-center text-neutral-500 font-medium">
          {getLocalized({
            en: 'Use ↑ ↓ arrows or swipe to move between videos',
            am: 'በ ↑ ↓ ቀስቶች ወይም በማሸብለል ቪዲዮ ይቀይሩ',
            ar: 'استخدم الأسهم ↑ ↓ أو اسحب للتنقل',
          })}
        </p>
        <ScrollableVideoFeed
          videos={longSorted}
          focusId={activeId}
          onActiveIdChange={onActiveIdChange}
        />
      </section>

      {!feedOnly && longSorted.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {longSorted.map(video => (
            <VideoCard
              key={video.id}
              video={video}
              seconds={video.durationSeconds}
              onWatch={() => choose(video.id)}
            />
          ))}
        </section>
      ) : null}
    </div>
  )
}

function VideoCard({
  video,
  seconds,
  onWatch,
}: {
  video: MediaItem
  seconds: number
  onWatch: () => void
}) {
  const { language, getLocalized } = useLanguage()
  const title =
    video.title[language as 'am' | 'en' | 'ar'] || video.title.am || video.rawFilename || 'Video'

  return (
    <article className="portfolio-card overflow-hidden space-y-3">
      <div className="relative aspect-video bg-black">
        <VideoThumb
          src={video.fileUrl}
          coverSrc={video.thumbnailUrl}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-mono text-white">
          {formatDuration(seconds)}
        </span>
      </div>
      <div className="px-4 pb-4 space-y-3">
        <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-2">{title}</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onWatch}
            className="btn-interactive flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white text-sm font-bold py-2.5"
          >
            <Play className="w-4 h-4 fill-current" />
            {getLocalized({ en: 'Watch', am: 'ተመልከት', ar: 'شاهد' })}
          </button>
          <a
            href={video.fileUrl}
            download
            className="btn-interactive inline-flex items-center justify-center rounded-xl border border-neutral-300 dark:border-neutral-700 px-3 text-neutral-600 dark:text-neutral-300"
            aria-label="Download"
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>
    </article>
  )
}
