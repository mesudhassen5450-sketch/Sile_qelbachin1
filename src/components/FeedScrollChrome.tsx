'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Headphones,
  Home,
  Library,
  Video,
  X,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

export type FeedChromeState = {
  /** Mobile TikTok-style fullscreen scroll mode */
  fullscreen: boolean
  /** Mobile browse: scroll locked until user taps Scroll */
  scrollLocked: boolean
}

type Props = {
  active: number
  total: number
  onPrev: () => void
  onNext: () => void
  hint?: string
  /** Single scroller — rendered once with chrome state. */
  children: (state: FeedChromeState) => ReactNode
}

/**
 * PC/tablet: ↑↓ arrows; free vertical scroll.
 * Mobile: locked until Scroll → fullscreen swipe; Cancel → exit + site sections.
 */
export default function FeedScrollChrome({
  active,
  total,
  onPrev,
  onNext,
  hint,
  children,
}: Props) {
  const { getLocalized } = useLanguage()
  const [fullscreen, setFullscreen] = useState(false)
  const [showExitMenu, setShowExitMenu] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullscreen(false)
        setShowExitMenu(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  useEffect(() => {
    if (!fullscreen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [fullscreen])

  const scrollLocked = isMobile && !fullscreen
  const state: FeedChromeState = { fullscreen, scrollLocked }

  const exitLinks = [
    { href: '/', label: getLocalized({ en: 'Home', am: 'መነሻ', ar: 'الرئيسية' }), icon: Home },
    { href: '/videos', label: getLocalized({ en: 'Videos', am: 'ቪዲዮዎች', ar: 'فيديو' }), icon: Video },
    {
      href: '/one-minute',
      label: getLocalized({ en: '1-Minute', am: '1 ደቂቃ', ar: 'دقيقة' }),
      icon: Headphones,
    },
    {
      href: '/dawah',
      label: getLocalized({ en: 'Da’wah', am: 'ዳዕዋ', ar: 'دعوة' }),
      icon: Headphones,
    },
    {
      href: '/library',
      label: getLocalized({ en: 'Library', am: 'ቤተ-መጻሕፍት', ar: 'المكتبة' }),
      icon: Library,
    },
    {
      href: '/quran-recitation',
      label: getLocalized({ en: 'Qur’an', am: 'ቁርኣን', ar: 'قرآن' }),
      icon: BookOpen,
    },
  ]

  const exitMenu = showExitMenu ? (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-neutral-900 dark:text-white">
            {getLocalized({
              en: 'Continue exploring',
              am: 'መጓዝ ይቀጥሉ',
              ar: 'تابع الاستكشاف',
            })}
          </h3>
          <button
            type="button"
            onClick={() => setShowExitMenu(false)}
            className="btn-interactive w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-700 flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          {getLocalized({
            en: 'Fullscreen closed. Open audio, text, or another site feature.',
            am: 'ሙሉ ማያ ተዘግቷል። ድምጽ፣ ጽሑፍ ወይም ሌላ የድረ-ገጽ ባህሪ ይክፈቱ።',
            ar: 'أُغلق ملء الشاشة. افتح الصوت أو النص أو ميزة أخرى.',
          })}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {exitLinks.map(l => {
            const Icon = l.icon
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setShowExitMenu(false)}
                className="btn-interactive flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 px-3 py-2.5 text-sm font-semibold text-neutral-800 dark:text-neutral-100 hover:border-[#D4AF37]/60"
              >
                <Icon className="w-4 h-4 text-[#B8860B] shrink-0" />
                <span className="truncate">{l.label}</span>
              </Link>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            setShowExitMenu(false)
            setFullscreen(true)
          }}
          className="btn-interactive w-full rounded-xl bg-[#D4AF37] text-neutral-950 font-bold text-sm py-2.5"
        >
          {getLocalized({
            en: 'Back to fullscreen scroll',
            am: 'ወደ ሙሉ ማያ ሸብለል ተመለስ',
            ar: 'العودة لتمرير ملء الشاشة',
          })}
        </button>
      </div>
    </div>
  ) : null

  return (
    <div
      className={cn(
        'relative space-y-3',
        fullscreen && 'fixed inset-0 z-50 bg-black space-y-0 flex flex-col'
      )}
    >
      {fullscreen ? (
        <div className="absolute top-0 inset-x-0 z-[55] flex items-center justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/80 to-transparent">
          <span className="text-xs font-mono text-white/80 tabular-nums px-2">
            {Math.min(active + 1, Math.max(total, 1))} / {total}
          </span>
          <button
            type="button"
            onClick={() => {
              setFullscreen(false)
              setShowExitMenu(true)
            }}
            className="btn-interactive inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur border border-white/30 text-white text-xs font-bold px-3 py-2"
          >
            <X className="w-4 h-4" />
            {getLocalized({ en: 'Cancel', am: 'ሰርዝ', ar: 'إلغاء' })}
          </button>
        </div>
      ) : null}

      {!fullscreen && hint ? (
        <p className="hidden md:block text-xs text-neutral-500 text-center font-medium">{hint}</p>
      ) : null}

      <div
        className={cn(
          'flex items-stretch gap-2 sm:gap-3',
          fullscreen && 'flex-1 min-h-0'
        )}
      >
        <div className={cn('relative min-w-0 flex-1', fullscreen && 'h-full')}>
          {children(state)}

          {/* Mobile: Scroll CTA over locked feed */}
          {scrollLocked ? (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-8 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-[1.75rem]">
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                className="pointer-events-auto btn-interactive inline-flex items-center gap-2 rounded-2xl bg-[#D4AF37] text-neutral-950 font-bold text-sm px-5 py-3 shadow-xl"
              >
                <ChevronDown className="w-5 h-5" />
                {getLocalized({
                  en: 'Scroll · fullscreen',
                  am: 'ሸብልል · ሙሉ ማያ',
                  ar: 'تمرير · ملء الشاشة',
                })}
              </button>
              <p className="mt-2 text-[11px] text-white/75 px-4 text-center max-w-xs">
                {getLocalized({
                  en: 'Feed stays locked until you tap Scroll (TikTok-style).',
                  am: 'ሸብልል እስኪነኩ ድረስ መጋቢው ተቆልፏል (እንደ ቲክቶክ)።',
                  ar: 'الموجز مقفل حتى تلمس تمرير (كتيك توك).',
                })}
              </p>
            </div>
          ) : null}
        </div>

        {/* Arrows: PC + tablet only */}
        {!fullscreen ? (
          <div className="hidden md:flex flex-col justify-center gap-2 shrink-0 py-2">
            <button
              type="button"
              disabled={active <= 0}
              onClick={onPrev}
              className="btn-interactive w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-neutral-900 border border-[#D4AF37]/50 text-white flex items-center justify-center shadow-lg disabled:opacity-30"
              aria-label="Previous"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <span className="text-[10px] font-mono text-center text-neutral-500 tabular-nums">
              {Math.min(active + 1, Math.max(total, 1))}/{total}
            </span>
            <button
              type="button"
              disabled={active >= total - 1}
              onClick={onNext}
              className="btn-interactive w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-neutral-900 border border-[#D4AF37]/50 text-white flex items-center justify-center shadow-lg disabled:opacity-30"
              aria-label="Next"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>
        ) : null}
      </div>

      {exitMenu}
    </div>
  )
}

/** Class helpers for the snap scroller inside feeds. */
export function feedScrollerClass(state: FeedChromeState): string {
  if (state.fullscreen) {
    return 'h-full min-h-0 overflow-y-auto snap-y snap-mandatory overscroll-y-contain bg-black'
  }
  if (state.scrollLocked) {
    return 'h-[min(72vh,640px)] overflow-hidden snap-y snap-mandatory rounded-[1.75rem] border border-[#D4AF37]/45 bg-black shadow-2xl'
  }
  return 'h-[min(82vh,760px)] overflow-y-auto snap-y snap-mandatory rounded-[1.75rem] border border-[#D4AF37]/45 bg-black shadow-2xl'
}

export function feedSlideClass(state: FeedChromeState): string {
  if (state.fullscreen) {
    return 'relative h-[100dvh] w-full snap-start snap-always flex flex-col overflow-hidden'
  }
  return 'relative h-[min(82vh,760px)] w-full snap-start snap-always flex flex-col overflow-hidden max-md:h-[min(72vh,640px)]'
}
