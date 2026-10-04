'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import CategoryPageHero from '@/components/CategoryPageHero'
import { useLanguage } from '@/context/LanguageContext'
import { ASK_QUESTION } from '@/config/siteNav'
import { fetchPublishedQuestions, type CmsLoc } from '@/lib/cmsClient'

type CmsQa = {
  id: string
  slug?: string
  title?: CmsLoc
  excerpt?: CmsLoc
  body?: CmsLoc
  question?: CmsLoc
  answer?: CmsLoc
  category?: string | null
  coverUrl?: string | null
  audioUrl?: string | null
  videoUrl?: string | null
  answerAudioUrl?: string | null
  answerVideoUrl?: string | null
  featured?: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

type DisplayQa = {
  id: string
  displayId: string
  category: { en: string; am: string; ar: string }
  question: { en: string; am: string; ar: string }
  answer: { en: string; am: string; ar: string }
  description: { en: string; am: string; ar: string }
  coverUrl?: string | null
  audioUrl?: string | null
  videoUrl?: string | null
  createdAt?: string | null
  readMinutes: number
}

const TITLE_MAX = 110

function loc(v?: CmsLoc | null, fallback = '') {
  return {
    en: v?.en || fallback,
    am: v?.am || v?.en || fallback,
    ar: v?.ar || v?.en || fallback,
  }
}

function stableQuestionCode(id: string): string {
  let n = 0
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0
  return `Q-${1000 + (n % 9000)}`
}

function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 180))
}

function truncateText(s: string, max = TITLE_MAX): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).replace(/\s+\S*$/, '').trimEnd()}…`
}

function formatPublishedMonth(iso: string | null | undefined, language: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  try {
    return new Intl.DateTimeFormat(language === 'am' ? 'am-ET' : language === 'ar' ? 'ar' : 'en', {
      month: 'short',
      year: 'numeric',
    }).format(d)
  } catch {
    return d.toLocaleDateString('en', { month: 'short', year: 'numeric' })
  }
}

function toDisplay(r: CmsQa): DisplayQa {
  const question = r.question || r.title
  const answer = r.answer || r.body
  const description = r.excerpt
  const answerBlob = `${answer?.en || ''} ${answer?.am || ''} ${answer?.ar || ''}`
  return {
    id: r.id,
    displayId: stableQuestionCode(r.id),
    category: {
      en: (r.category || 'General').toUpperCase(),
      am: r.category || 'አጠቃላይ',
      ar: r.category || 'عام',
    },
    question: loc(question),
    answer: loc(answer),
    description: loc(description),
    coverUrl: r.coverUrl || null,
    audioUrl: r.audioUrl || r.answerAudioUrl || null,
    videoUrl: r.videoUrl || r.answerVideoUrl || null,
    createdAt: r.createdAt || r.updatedAt || null,
    readMinutes: estimateReadMinutes(answerBlob),
  }
}

/** Telegram-like: each search word must appear somewhere in question+answer+category. */
function matchesTelegramSearch(
  item: DisplayQa,
  needle: string,
  getLocalized: (v: { en: string; am: string; ar: string }) => string
): boolean {
  const raw = needle.trim().toLowerCase()
  if (!raw) return true
  const blob = [
    getLocalized(item.question),
    getLocalized(item.answer),
    getLocalized(item.description),
    getLocalized(item.category),
    item.displayId,
  ]
    .join(' ')
    .toLowerCase()
  const tokens = raw.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true
  return tokens.every(t => blob.includes(t))
}

function QuestionsPageInner() {
  const { getLocalized, language } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const focusId = searchParams.get('id')
  const [q, setQ] = useState('')
  const [cmsItems, setCmsItems] = useState<DisplayQa[]>([])
  const [loading, setLoading] = useState(true)
  const [detailIndex, setDetailIndex] = useState<number | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const deepLinkDone = useRef(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      const rows = await fetchPublishedQuestions<CmsQa>()
      if (cancelled) return
      setCmsItems((rows || []).map(toDisplay).filter(i => getLocalized(i.question).trim()))
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once
  }, [])

  const filtered = useMemo(() => {
    return cmsItems.filter(item => matchesTelegramSearch(item, q, getLocalized))
  }, [q, getLocalized, cmsItems])

  const detail = detailIndex != null ? filtered[detailIndex] : null

  useEffect(() => {
    if (detailIndex != null && detailIndex >= filtered.length) {
      setDetailIndex(filtered.length ? filtered.length - 1 : null)
    }
  }, [filtered.length, detailIndex])

  // Deep-link from home: /questions?id=… → highlight card + open answer
  useEffect(() => {
    deepLinkDone.current = false
  }, [focusId])

  useEffect(() => {
    if (loading || !focusId || deepLinkDone.current || cmsItems.length === 0) return
    const idx = filtered.findIndex(i => i.id === focusId)
    if (idx < 0) {
      // Prefer unfiltered list if search is hiding the target
      const rawIdx = cmsItems.findIndex(i => i.id === focusId)
      if (rawIdx < 0) return
      setQ('')
      return
    }
    deepLinkDone.current = true
    setHighlightId(focusId)
    setDetailIndex(idx)
    window.requestAnimationFrame(() => {
      const el = cardRefs.current.get(focusId)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    const clear = window.setTimeout(() => setHighlightId(null), 4500)
    return () => window.clearTimeout(clear)
  }, [loading, focusId, cmsItems, filtered])

  useEffect(() => {
    if (detailIndex == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailIndex(null)
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setDetailIndex(i => (i == null ? i : Math.max(0, i - 1)))
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setDetailIndex(i => (i == null ? i : Math.min(filtered.length - 1, i + 1)))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailIndex, filtered.length])

  const openDetail = (id: string) => {
    const idx = filtered.findIndex(i => i.id === id)
    if (idx < 0) return
    setDetailIndex(idx)
    setHighlightId(id)
    router.replace(`/questions?id=${encodeURIComponent(id)}`, { scroll: false })
    window.setTimeout(() => setHighlightId(null), 2500)
  }

  const closeDetail = () => {
    setDetailIndex(null)
    router.replace('/questions', { scroll: false })
  }

  const goPrev = () => {
    if (detailIndex == null || detailIndex <= 0) return
    const next = detailIndex - 1
    setDetailIndex(next)
    const id = filtered[next]?.id
    if (id) router.replace(`/questions?id=${encodeURIComponent(id)}`, { scroll: false })
  }
  const goNext = () => {
    if (detailIndex == null || detailIndex >= filtered.length - 1) return
    const next = detailIndex + 1
    setDetailIndex(next)
    const id = filtered[next]?.id
    if (id) router.replace(`/questions?id=${encodeURIComponent(id)}`, { scroll: false })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <CategoryPageHero
        emoji="💬"
        badge={{
          en: 'Youth & Heart Corner',
          am: 'የወጣቶች እና የልብ ማዕከል',
          ar: 'ركن الشباب والقلب',
        }}
        title={{
          en: 'Questions & Answers',
          am: 'ጥያቄ እና መልስ',
          ar: 'أسئلة وأجوبة',
        }}
        description={{
          en: 'Search questions by word — tap a card to read the full answer.',
          am: 'ጥያቄዎችን በቃላት ፈልገው ያግኙ — ሙሉ መልሱን ለማንበብ ካርዱን ይጫኑ።',
          ar: 'ابحث في الأسئلة بالكلمات — المس البطاقة لقراءة الجواب كاملاً.',
        }}
        showAskCta={false}
      >
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={getLocalized({
              en: 'Search a word or title…',
              am: 'ቃል ወይም ርዕስ ይፈልጉ...',
              ar: 'ابحث عن كلمة أو عنوان…',
            })}
            className="flex-1 rounded-xl border border-[#e3e2e0] dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm font-medium text-[#37352f] dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30"
          />
          <Link
            href={ASK_QUESTION.href}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#A91F24] text-white text-sm font-bold shadow-md hover:bg-[#8F171C] transition shrink-0"
          >
            <span>{ASK_QUESTION.emoji}</span>
            {getLocalized({
              en: 'Ask a Question',
              am: 'ጥያቄዎን ያቅርቡ',
              ar: 'اطرح سؤالاً',
            })}
          </Link>
        </div>
      </CategoryPageHero>

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-neutral-500 text-center py-8 font-medium">
            {getLocalized({ en: 'Loading…', am: 'በመጫን ላይ…', ar: 'جاري التحميل…' })}
          </p>
        ) : null}

        {!loading &&
          filtered.map(item => {
            const fullQuestion = getLocalized(item.question)
            const published = formatPublishedMonth(item.createdAt, language)
            const isFocus = highlightId === item.id
            return (
              <button
                key={item.id}
                id={`qa-${item.id}`}
                type="button"
                ref={el => {
                  if (el) cardRefs.current.set(item.id, el)
                  else cardRefs.current.delete(item.id)
                }}
                onClick={() => openDetail(item.id)}
                className={`w-full text-start portfolio-card p-6 sm:p-7 space-y-3 transition duration-300 hover:-translate-y-0.5 hover:border-[#A91F24]/45 hover:ring-2 hover:ring-[#A91F24]/25 ${
                  isFocus
                    ? 'border-[#A91F24] ring-2 ring-[#A91F24]/40 shadow-lg shadow-red-900/10'
                    : ''
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-[#7f1d1d] text-white text-[11px] font-semibold tracking-wide px-2.5 py-1 border border-[#A91F24]/60">
                    {getLocalized(item.category)}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    <span className="tabular-nums">#{item.displayId}</span>
                    {published ? (
                      <>
                        <span aria-hidden className="text-neutral-300 dark:text-neutral-600">
                          ·
                        </span>
                        <span>{published}</span>
                      </>
                    ) : null}
                    <span aria-hidden className="text-neutral-300 dark:text-neutral-600">
                      ·
                    </span>
                    <span>
                      {getLocalized({
                        en: `${item.readMinutes} min read`,
                        am: `${item.readMinutes} ደቂቃ ንባብ`,
                        ar: `${item.readMinutes} د قراءة`,
                      })}
                    </span>
                  </div>
                </div>

                <h2 className="text-lg sm:text-xl font-semibold text-[#111827] dark:text-white leading-snug">
                  {truncateText(fullQuestion)}
                </h2>

                <p className="text-sm leading-relaxed line-clamp-2 text-[#4b5563] dark:text-neutral-400">
                  <span className="font-semibold text-[#374151] dark:text-neutral-300">
                    {getLocalized({ en: 'Answer: ', am: 'መልስ፦ ', ar: 'الجواب: ' })}
                  </span>
                  {getLocalized(item.answer)}
                </p>

                <p className="text-xs font-semibold text-[#A91F24] dark:text-red-400 pt-0.5">
                  {getLocalized({
                    en: 'Open full Q&A →',
                    am: 'ሙሉ ጥያቄና መልስ ክፈት →',
                    ar: 'افتح السؤال والجواب ←',
                  })}
                </p>
              </button>
            )
          })}

        {!loading && filtered.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {cmsItems.length === 0
                ? getLocalized({
                    en: 'No published answers yet. Ask your question — an Ustaz will reply.',
                    am: 'እስካሁን የታተመ መልስ የለም። ጥያቄዎን ይጠይቁ — ኡስታዝ ይመልሳል።',
                    ar: 'لا إجابات منشورة بعد. اطرح سؤالك — سيجيبك أستاذ.',
                  })
                : getLocalized({
                    en: 'No matches. Try another word or ask your own question.',
                    am: 'ምንም አልተገኘም። ሌላ ቃል ይሞክሩ ወይም የራስዎን ጥያቄ ይጠይቁ።',
                    ar: 'لا نتائج. جرّب كلمة أخرى أو اطرح سؤالك.',
                  })}
            </p>
            <Link
              href={ASK_QUESTION.href}
              className="inline-flex items-center gap-2 text-sm font-bold text-[#A91F24] hover:underline"
            >
              {getLocalized(ASK_QUESTION.label)}
            </Link>
          </div>
        ) : null}
      </div>

      {detail && detailIndex != null ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onClick={closeDetail}
        >
          <div
            className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-[#e3e2e0] dark:border-neutral-700 bg-white dark:bg-neutral-950 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#e3e2e0] dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 px-4 py-3 backdrop-blur">
              <button
                type="button"
                onClick={goPrev}
                disabled={detailIndex <= 0}
                className="inline-flex items-center gap-1 rounded-xl border border-[#e3e2e0] dark:border-neutral-700 px-3 py-2 text-sm font-bold disabled:opacity-30 hover:bg-[#efefed] dark:hover:bg-neutral-900"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {getLocalized({ en: 'Prev', am: 'ቀዳሚ', ar: 'السابق' })}
                </span>
              </button>
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 tabular-nums">
                {detailIndex + 1} / {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goNext}
                  disabled={detailIndex >= filtered.length - 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-[#e3e2e0] dark:border-neutral-700 px-3 py-2 text-sm font-bold disabled:opacity-30 hover:bg-[#efefed] dark:hover:bg-neutral-900"
                  aria-label="Next"
                >
                  <span className="hidden sm:inline">
                    {getLocalized({ en: 'Next', am: 'ቀጣይ', ar: 'التالي' })}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={closeDetail}
                  className="rounded-xl p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-7 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-[#7f1d1d] text-white text-[11px] font-semibold tracking-wide px-2.5 py-1 border border-[#A91F24]/60">
                  {getLocalized(detail.category)}
                </span>
                <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400 tabular-nums">
                  #{detail.displayId}
                </span>
                {formatPublishedMonth(detail.createdAt, language) ? (
                  <span className="text-[11px] font-medium text-neutral-500">
                    {formatPublishedMonth(detail.createdAt, language)}
                  </span>
                ) : null}
                <span className="text-[11px] font-medium text-neutral-500">
                  {getLocalized({
                    en: `${detail.readMinutes} min read`,
                    am: `${detail.readMinutes} ደቂቃ ንባብ`,
                    ar: `${detail.readMinutes} د قراءة`,
                  })}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold text-[#111827] dark:text-white leading-snug">
                {getLocalized(detail.question)}
              </h2>

              {detail.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail.coverUrl}
                  alt=""
                  className="w-full max-h-64 object-cover rounded-xl border border-[#e3e2e0] dark:border-neutral-800"
                />
              ) : null}

              <div className="space-y-2 rounded-xl border border-[#e3e2e0] dark:border-neutral-800 bg-[#fafafa] dark:bg-neutral-900/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#A91F24]">
                  {getLocalized({ en: 'Answer', am: 'መልስ', ar: 'الجواب' })}
                </p>
                <p className="text-base font-medium text-[#37352f] dark:text-neutral-100 leading-relaxed whitespace-pre-wrap">
                  {getLocalized(detail.answer)}
                </p>
              </div>

              {getLocalized(detail.description).trim() ? (
                <p className="text-sm text-[#4b5563] dark:text-neutral-400 leading-relaxed whitespace-pre-wrap border-t border-[#e3e2e0] dark:border-neutral-800 pt-4">
                  {getLocalized(detail.description)}
                </p>
              ) : null}

              {detail.audioUrl ? (
                <audio controls className="w-full" src={detail.audioUrl}>
                  <track kind="captions" />
                </audio>
              ) : null}

              {detail.videoUrl ? (
                <video controls className="w-full rounded-xl bg-black" src={detail.videoUrl} />
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function QuestionsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-neutral-500">
          Loading…
        </div>
      }
    >
      <QuestionsPageInner />
    </Suspense>
  )
}
