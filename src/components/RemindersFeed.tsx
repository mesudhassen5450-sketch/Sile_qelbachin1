'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { featuredHeartFirst, fetchHeartReadings, type HeartReading } from '@/lib/heartReadings'

const PREVIEW_MAX = 120

type Props = {
  showHeading?: boolean
}

/** Da’wah / Library — for now same as Admin Youth → Articles. */
export default function RemindersFeed({ showHeading = true }: Props) {
  const { getLocalized } = useLanguage()
  const [items, setItems] = useState<HeartReading[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      const rows = await fetchHeartReadings()
      if (!cancelled) {
        setItems(featuredHeartFirst(rows, Math.max(rows.length, 1)))
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const active = activeId ? items.find(i => i.id === activeId) : null

  useEffect(() => {
    if (!activeId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId])

  const titleOf = (r: HeartReading) =>
    getLocalized({
      en: r.title?.en || r.title?.am || '',
      am: r.title?.am || r.title?.en || '',
      ar: r.title?.ar || r.title?.en || r.title?.am || '',
    })
  const bodyOf = (r: HeartReading) =>
    getLocalized({
      en: r.body?.en || r.body?.am || '',
      am: r.body?.am || r.body?.en || '',
      ar: r.body?.ar || r.body?.en || r.body?.am || '',
    })

  const scrollStrip = (dir: -1 | 1) => {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: dir * Math.min(340, el.clientWidth * 0.8), behavior: 'smooth' })
  }

  return (
    <div className="space-y-5">
      {showHeading ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {getLocalized({
                en: 'Heart reminders',
                am: 'የልብ ማስታወሻዎች',
                ar: 'تذكيرات القلب',
              })}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {getLocalized({
                en: 'From Articles — Featured first. Scroll or use the arrows.',
                am: 'ከጽሑፎች — ተለይተው መጀመሪያ። ይሸብልሉ ወይም ቀስቶቹን ይጠቀሙ።',
                ar: 'من المقالات — المميز أولاً. مرّر أو استخدم الأسهم.',
              })}
            </p>
          </div>
          {!loading && items.length > 0 ? (
            <div className="flex items-center gap-1.5 self-end">
              <button
                type="button"
                onClick={() => scrollStrip(-1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:border-amber-500/60 hover:text-amber-600 transition"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollStrip(1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-200 hover:border-amber-500/60 hover:text-amber-600 transition"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-neutral-500 text-center py-8">
          {getLocalized({ en: 'Loading…', am: 'በመጫን ላይ…', ar: 'جاري التحميل…' })}
        </p>
      ) : null}

      <div
        ref={stripRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory [scrollbar-width:thin] [scrollbar-color:rgba(185,28,28,0.55)_transparent]"
      >
        {items.map(r => {
          const title = titleOf(r)
          const body = bodyOf(r)
          if (!title && !body) return null
          const featured = Boolean(r.featured)
          const open = Boolean(expanded[r.id])
          const long = body.length > PREVIEW_MAX
          const preview =
            !long || open
              ? body
              : `${body.slice(0, PREVIEW_MAX).replace(/\s+\S*$/, '').trimEnd()}…`

          return (
            <article
              key={r.id}
              className={`snap-start shrink-0 w-[min(88vw,20rem)] sm:w-[19rem] portfolio-card p-5 space-y-2.5 text-start transition ${
                featured
                  ? 'border-amber-500/45 ring-1 ring-amber-500/20 bg-gradient-to-br from-amber-950/25 via-transparent to-transparent'
                  : 'hover:border-red-500/40'
              }`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {featured ? (
                  <span className="inline-flex items-center rounded-full bg-amber-600 text-white text-[10px] font-bold tracking-wide px-2.5 py-1">
                    {getLocalized({ en: 'Featured', am: 'ተለይቶ', ar: 'مميز' })}
                  </span>
                ) : null}
                <span className="inline-flex items-center rounded-full bg-[#7f1d1d] text-white text-[10px] font-semibold tracking-wide px-2.5 py-1 border border-[#A91F24]/50">
                  {getLocalized({ en: 'Article', am: 'ጽሑፍ', ar: 'مقال' })}
                </span>
              </div>
              {title ? (
                <h3 className="font-semibold text-neutral-900 dark:text-white text-base sm:text-lg leading-snug line-clamp-2">
                  {title}
                </h3>
              ) : null}
              {body ? (
                <p className="text-sm text-[#4b5563] dark:text-neutral-400 leading-relaxed whitespace-pre-line">
                  {preview}
                </p>
              ) : null}
              <div className="flex items-center justify-between gap-2 pt-1">
                {long ? (
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(prev => ({ ...prev, [r.id]: !prev[r.id] }))
                    }
                    className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                  >
                    {open
                      ? getLocalized({ en: 'Show less', am: 'አሳንስ', ar: 'أقل' })
                      : getLocalized({ en: 'Show more', am: 'ተጨማሪ አሳይ', ar: 'عرض المزيد' })}
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => setActiveId(r.id)}
                  className={`text-xs font-semibold ${
                    featured ? 'text-amber-500 hover:underline' : 'text-[#A91F24] hover:underline'
                  }`}
                >
                  {getLocalized({
                    en: 'Read full →',
                    am: 'ሙሉ አንብብ →',
                    ar: 'اقرأ كاملاً ←',
                  })}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveId(null)}
        >
          <div
            className="relative w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-[#e3e2e0] dark:border-neutral-700 bg-white dark:bg-neutral-950 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#e3e2e0] dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 px-4 py-3 backdrop-blur shrink-0">
              <div className="flex items-center gap-2">
                {active.featured ? (
                  <span className="inline-flex items-center rounded-full bg-amber-600 text-white text-[10px] font-bold px-2.5 py-1">
                    {getLocalized({ en: 'Featured', am: 'ተለይቶ', ar: 'مميز' })}
                  </span>
                ) : null}
                <span className="inline-flex items-center rounded-full bg-[#7f1d1d] text-white text-[10px] font-semibold px-2.5 py-1">
                  {getLocalized({ en: 'Article', am: 'ጽሑፍ', ar: 'مقال' })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 space-y-4 flex-1 min-h-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white leading-snug">
                {titleOf(active)}
              </h2>
              <p className="text-base text-neutral-700 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap pb-8">
                {bodyOf(active)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
