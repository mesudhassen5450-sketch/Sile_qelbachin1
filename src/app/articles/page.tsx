'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import CategoryPageHero from '@/components/CategoryPageHero'
import { useLanguage } from '@/context/LanguageContext'
import { fetchHeartReadings, type HeartReading } from '@/lib/heartReadings'

const PREVIEW_MAX = 140

function truncate(s: string, max = PREVIEW_MAX): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).replace(/\s+\S*$/, '').trimEnd()}…`
}

function titleOf(r: HeartReading, getLocalized: (v: { en: string; am: string; ar: string }) => string) {
  return getLocalized({
    en: r.title?.en || r.title?.am || '',
    am: r.title?.am || r.title?.en || '',
    ar: r.title?.ar || r.title?.en || r.title?.am || '',
  })
}

function bodyOf(r: HeartReading, getLocalized: (v: { en: string; am: string; ar: string }) => string) {
  return getLocalized({
    en: r.body?.en || r.body?.am || '',
    am: r.body?.am || r.body?.en || '',
    ar: r.body?.ar || r.body?.en || r.body?.am || '',
  })
}

/** Public articles — sourced from Admin Youth → Articles (same feed as home titles). */
function ArticlesPageInner() {
  const { getLocalized } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusId = searchParams.get('id')
  const [items, setItems] = useState<HeartReading[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const deepLinkDone = useRef(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      const rows = await fetchHeartReadings()
      if (cancelled) return
      setItems(rows)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    deepLinkDone.current = false
  }, [focusId])

  useEffect(() => {
    if (loading || !focusId || deepLinkDone.current || !items.length) return
    if (!items.some(i => i.id === focusId)) return
    deepLinkDone.current = true
    setActiveId(focusId)
    setHighlightId(focusId)
    window.requestAnimationFrame(() => {
      cardRefs.current.get(focusId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    const t = window.setTimeout(() => setHighlightId(null), 4500)
    return () => window.clearTimeout(t)
  }, [loading, focusId, items])

  useEffect(() => {
    if (!activeId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveId(null)
        router.replace('/articles', { scroll: false })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeId, router])

  const active = useMemo(() => items.find(i => i.id === activeId) || null, [items, activeId])

  const openDetail = (id: string) => {
    setActiveId(id)
    setHighlightId(id)
    router.replace(`/articles?id=${encodeURIComponent(id)}`, { scroll: false })
    window.setTimeout(() => setHighlightId(null), 2500)
  }

  const closeDetail = () => {
    setActiveId(null)
    router.replace('/articles', { scroll: false })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <CategoryPageHero
        emoji="📝"
        badge={{
          en: 'Youth & Heart Corner',
          am: 'የወጣቶች እና የልብ ማዕከል',
          ar: 'ركن الشباب والقلب',
        }}
        title={{
          en: 'Articles & reminders',
          am: 'ጽሑፎች እና ማስታወሻዎች',
          ar: 'مقالات وتذكيرات',
        }}
        description={{
          en: 'Tap a title to read the full text.',
          am: 'ሙሉ ጽሑፉን ለማንበብ ርዕሱን ይጫኑ።',
          ar: 'المس العنوان لقراءة النص كاملاً.',
        }}
      />

      {loading ? (
        <p className="text-sm text-neutral-500 text-center py-8">
          {getLocalized({ en: 'Loading…', am: 'በመጫን ላይ…', ar: 'جاري التحميل…' })}
        </p>
      ) : null}

      {!loading ? (
        <div className="space-y-3">
          {items.map(item => {
            const title = titleOf(item, getLocalized)
            const body = bodyOf(item, getLocalized)
            const isFocus = highlightId === item.id
            if (!title && !body) return null
            return (
              <button
                key={item.id}
                id={`article-${item.id}`}
                type="button"
                ref={el => {
                  if (el) cardRefs.current.set(item.id, el)
                  else cardRefs.current.delete(item.id)
                }}
                onClick={() => openDetail(item.id)}
                className={`w-full text-start portfolio-card p-5 sm:p-6 space-y-2 transition hover:-translate-y-0.5 hover:border-red-500/40 hover:ring-2 hover:ring-red-500/20 ${
                  isFocus ? 'border-red-600 ring-2 ring-red-500/40' : ''
                }`}
              >
                <h2 className="text-base sm:text-lg font-semibold text-[#111827] dark:text-white leading-snug">
                  {title}
                </h2>
                {body ? (
                  <p className="text-sm text-[#4b5563] dark:text-neutral-400 leading-relaxed line-clamp-2">{truncate(body)}</p>
                ) : null}
              </button>
            )
          })}
        </div>
      ) : null}

      {active ? (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={closeDetail}
        >
          <div
            className="relative w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-[#e3e2e0] dark:border-neutral-700 bg-white dark:bg-neutral-950 shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#e3e2e0] dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 px-4 py-3 backdrop-blur shrink-0">
              <span className="text-xs font-bold uppercase tracking-wide text-[#A91F24]">
                {getLocalized({ en: 'Article', am: 'ጽሑፍ', ar: 'مقال' })}
              </span>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 space-y-4 flex-1 min-h-0">
              <h2 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white leading-snug">
                {titleOf(active, getLocalized)}
              </h2>
              <p className="text-base text-neutral-700 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap pb-8">
                {bodyOf(active, getLocalized)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function ArticlesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-neutral-500">
          Loading…
        </div>
      }
    >
      <ArticlesPageInner />
    </Suspense>
  )
}
