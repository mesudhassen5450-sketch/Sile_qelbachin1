'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Heart,
  MessageCircleQuestion,
  Send,
  Youtube,
} from 'lucide-react'

import FeaturedAudioBlock from '@/components/FeaturedAudioBlock'
import CompactAudioRow from '@/components/CompactAudioRow'
import HomeHero from '@/components/HomeHero'
import AskQuestionNavLink from '@/components/AskQuestionNavLink'
import HomeQuranIntro from '@/components/HomeQuranIntro'
import KitabCard from '@/components/KitabCard'
import { EDUCATIONAL_ARCHIVE, YOUTH_HEART_CORNER } from '@/config/siteNav'
import { kitabsData, siteMetadata, type Kitab } from '@/data/channelData'
import { getLocalOneMinuteSlides } from '@/data/oneMinuteCatalog'
import { useLanguage } from '@/context/LanguageContext'
import {
  fetchPublishedAudio,
  fetchPublishedKitabs,
  fetchPublishedQuestions,
  type CmsAudio,
  type CmsKitab,
  type CmsLoc,
} from '@/lib/cmsClient'

type PopularTrack = {
  title: { am: string; ar: string; en: string }
  speaker: string
  description: { am: string; ar: string; en: string }
  category: { am: string; ar: string; en: string }
  audioUrl: string
  duration?: string
}

function cmsKitabToKitab(k: CmsKitab): Kitab {
  const loc = (v?: { am?: string | null; ar?: string | null; en?: string | null }) => ({
    am: v?.am || '',
    ar: v?.ar || '',
    en: v?.en || '',
  })
  return {
    slug: k.slug,
    title: loc(k.title),
    author: loc(k.author),
    category: { am: '', ar: '', en: '' },
    coverImage: k.coverImage || undefined,
    pdfUrl: k.pdfUrl || undefined,
    dersCount: k.dersCount ?? (k.dersList?.length || 0),
    description: loc(k.description),
    dersList: (k.dersList || []).map(d => ({
      id: d.id,
      title: loc(d.title),
      speaker: loc(d.speaker),
      duration: d.duration || '',
      audioUrl: d.audioUrl || '',
      kitabId: k.slug,
    })),
  }
}

function cmsAudioToPopular(a: CmsAudio): PopularTrack | null {
  if (!a.fileUrl) return null
  const cat = (a.category || 'Audio').trim()
  const title = {
    am: a.title?.am || a.title?.en || '',
    ar: a.title?.ar || a.title?.en || '',
    en: a.title?.en || a.title?.am || '',
  }
  if (!title.en && !title.am) return null
  const desc = {
    am: a.description?.am || a.description?.en || '',
    ar: a.description?.ar || a.description?.en || '',
    en: a.description?.en || a.description?.am || '',
  }
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
  const titleBlob = norm(`${title.am} ${title.en} ${title.ar}`)
  const descBlob = norm(`${desc.am} ${desc.en} ${desc.ar}`)
  const descIsDup =
    !descBlob ||
    descBlob === titleBlob ||
    (title.am && norm(desc.am) === norm(title.am)) ||
    (title.en && norm(desc.en) === norm(title.en)) ||
    (title.am &&
      desc.am &&
      (norm(desc.am).startsWith(norm(title.am)) || norm(title.am).startsWith(norm(desc.am))))
  // Admin Description = byline / speaker name on home (e.g. "By Ustaz …").
  // Do not replace it with "Muhadara" — that hid the name the admin entered.
  return {
    title,
    speaker: '',
    description: descIsDup ? { am: '', ar: '', en: '' } : desc,
    category: { am: cat, ar: cat, en: cat },
    audioUrl: a.fileUrl,
  }
}

/** Home FAQ cards — Admin marks Youth → Q&A as Featured (top 4 by priority). */
type HomeGuideQ = {
  id: string
  q: { en: string; am: string; ar: string }
  href: string
}

function featuredFirst<T extends { featured?: boolean; priority?: number }>(
  rows: T[],
  limit: number
): T[] {
  const scored = [...rows].sort((a, b) => {
    const fa = a.featured ? 1 : 0
    const fb = b.featured ? 1 : 0
    if (fa !== fb) return fb - fa
    const pa = typeof a.priority === 'number' && a.priority >= 1 ? a.priority : 9999
    const pb = typeof b.priority === 'number' && b.priority >= 1 ? b.priority : 9999
    if (pa !== pb) return pa - pb
    return 0
  })
  const featured = scored.filter(r => r.featured)
  if (featured.length >= limit) return featured.slice(0, limit)
  return scored.slice(0, limit)
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-neutral-200/80 dark:bg-neutral-800 ${className}`} />
}

export default function HomePage() {
  const { language, getLocalized, t } = useLanguage()
  const [featuredKitabs, setFeaturedKitabs] = useState<Kitab[]>(() => kitabsData.slice(0, 3))
  const [allKitabs, setAllKitabs] = useState<Kitab[]>(kitabsData)
  const [kitabsLoading, setKitabsLoading] = useState(true)
  const [popularAudio, setPopularAudio] = useState<PopularTrack[]>([])
  const [audioLoading, setAudioLoading] = useState(true)
  const [homeQuestions, setHomeQuestions] = useState<HomeGuideQ[]>([])

  useEffect(() => {
    let cancelled = false
    const safety = window.setTimeout(() => {
      if (!cancelled) {
        setKitabsLoading(false)
        setAudioLoading(false)
      }
    }, 9000)
    void (async () => {
      try {
        const [kitabRows, audioRows, questionRows] = await Promise.all([
          fetchPublishedKitabs(),
          fetchPublishedAudio(),
          fetchPublishedQuestions<{
            id: string
            title?: CmsLoc
            question?: CmsLoc | string
            featured?: boolean
            priority?: number
          }>(),
        ])
        if (cancelled) return

        if (kitabRows?.length) {
          const mapped = kitabRows.map(cmsKitabToKitab)
          // Prefer CMS rows; keep static kitabs that CMS has not replaced yet
          const bySlug = new Map(kitabsData.map(k => [k.slug, k]))
          for (const k of mapped) bySlug.set(k.slug, k)
          setAllKitabs(Array.from(bySlug.values()))

          const picked = featuredFirst(kitabRows, 3).map(cmsKitabToKitab)
          if (picked.length) setFeaturedKitabs(picked)
        }

        if (audioRows?.length) {
          // Admin Featured only — no static/hardcoded home tracks
          const featuredOnly = audioRows.filter(a => a.featured)
          const pool = featuredOnly.length ? featuredOnly : featuredFirst(audioRows, 3)
          const fromCms = featuredFirst(pool, 3)
            .map(cmsAudioToPopular)
            .filter((t): t is PopularTrack => Boolean(t))
          setPopularAudio(fromCms)
        } else {
          setPopularAudio([])
        }

        if (questionRows?.length) {
          const picked = featuredFirst(questionRows, 4)
            .map(row => {
              const title =
                typeof row.question === 'string'
                  ? row.question
                  : row.title?.en ||
                    row.title?.am ||
                    (typeof row.question === 'object'
                      ? row.question?.en || row.question?.am || ''
                      : '')
              const am =
                typeof row.question === 'object'
                  ? row.question?.am || title
                  : row.title?.am || title
              const ar =
                typeof row.question === 'object'
                  ? row.question?.ar || title
                  : row.title?.ar || title
              const en =
                typeof row.question === 'object'
                  ? row.question?.en || title
                  : row.title?.en || title
              if (!en && !am) return null
              return {
                id: row.id,
                q: { en: en || am, am: am || en, ar: ar || en || am },
                href: `/questions?id=${encodeURIComponent(row.id)}`,
              } satisfies HomeGuideQ
            })
            .filter((x): x is HomeGuideQ => Boolean(x))
          setHomeQuestions(picked)
        }
      } catch {
        /* keep empty until CMS responds */
      } finally {
        if (!cancelled) {
          setKitabsLoading(false)
          setAudioLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
      window.clearTimeout(safety)
    }
  }, [])

  return (
    <div className="space-y-10 sm:space-y-16 sm:space-y-20 overflow-x-hidden">
      <HomeHero />

      {/* Purpose */}
      <section className="max-w-3xl mx-auto text-center space-y-4 px-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white">
          {getLocalized({
            en: 'About Our Hearts…',
            am: 'ስለ ቀልባችን…',
            ar: 'عن قلوبنا…',
          })}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-base sm:text-lg">
          {getLocalized(siteMetadata.purposeParagraph1)}
        </p>
      </section>

      {/* Qur’an */}
      <HomeQuranIntro />

      {/* Marriage under Qur’an — banner only */}
      <section className="space-y-6">
        <div className="portfolio-card overflow-hidden border-red-500/20">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="lg:col-span-3 p-8 sm:p-10 space-y-5 bg-gradient-to-br from-red-950/40 via-neutral-950 to-neutral-900 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-950 text-white">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                <span>💍</span>
                {getLocalized({
                  en: 'Youth & Heart · Marriage',
                  am: 'ወጣቶች እና ልብ · ጋብቻ',
                  ar: 'الشباب والقلب · الزواج',
                })}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight text-white">
                {getLocalized({
                  en: 'Marriage & Love — guided by mercy and character',
                  am: 'ጋብቻ እና ፍቅር — በእዝነት እና በሥነ-ምግባር የተመራ',
                  ar: 'الزواج والحب — على أساس الرحمة والخلق',
                })}
              </h2>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed max-w-xl">
                {getLocalized({
                  en: 'For youth seeking marriage or already in married life: put faith first, pursue halal love, and build family peace — then ask privately.',
                  am: 'ትዳር ለሚፈልጉ ወይም በትዳር ሕይወት ውስጥ ላሉ ወጣቶች፦ እምነትን አስቀድሞ መምረጥ፣ ሐላል ፍቅር እና የቤተሰብ ሰላምን መገንባት — በመቀጠል በግል ይጠይቁ።',
                  ar: 'للشباب الباحثين عن الزواج أو في الحياة الزوجية: قدّم الإيمان، واتبع الحب الحلال، وابنِ سلام الأسرة — ثم اسأل بخصوصية.',
                })}
              </p>
              <Link
                href="/marriage"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition"
              >
                {getLocalized({
                  en: 'Marriage & Love center →',
                  am: 'የጋብቻ እና ፍቅር ማዕከል →',
                  ar: 'مركز الزواج والحب →',
                })}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="lg:col-span-2 p-6 sm:p-8 bg-white dark:bg-neutral-950 space-y-5 flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-wider text-[#A91F24]">
                {getLocalized({ en: 'Private guidance', am: 'የግል መመሪያ', ar: 'إرشاد خاص' })}
              </p>
              <p className="text-sm font-medium text-[#6b7280] dark:text-neutral-400 leading-relaxed">
                {getLocalized({
                  en: 'Topics are prepared and published by Admin. Until then, ask privately — an Ustaz will reply by email.',
                  am: 'ርዕሶች በአድሚኑ ተዘጋጅተው ይታተማሉ። እስከዚያው በግል ይጠይቁ — እስታዝ በኢሜይል ይመልሳል።',
                  ar: 'تُعدّ المواضيع وتنشر من الإدارة. إلى ذلك اسأل بخصوصية — يرد الأستاذ عبر البريد.',
                })}
              </p>
              <AskQuestionNavLink className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#A91F24] hover:bg-[#8F171C] text-white text-sm font-bold transition" />
            </div>
          </div>
        </div>
      </section>

      {/* Educational Archive section cards (image 7) */}
      <section id="archive" className="space-y-6 scroll-mt-28">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
            {getLocalized({
              en: 'Educational Archive',
              am: 'ትምህርታዊ ማህደር',
              ar: 'الأرشيف التعليمي',
            })}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white">
            {getLocalized({
              en: 'Choose a section',
              am: 'ክፍል ይምረጡ',
              ar: 'اختر قسماً',
            })}
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {EDUCATIONAL_ARCHIVE.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="portfolio-card p-3 sm:p-5 space-y-1.5 sm:space-y-2 hover:border-red-500/40 hover:-translate-y-0.5 transition group min-w-0"
            >
              <span className="text-xl sm:text-2xl" aria-hidden>
                {item.emoji}
              </span>
              <h3 className="text-sm sm:text-lg font-bold text-[#111827] dark:text-white group-hover:text-red-600 transition line-clamp-2">
                {getLocalized(item.label)}
              </h3>
              <p className="hidden sm:block text-sm text-[#6b7280] dark:text-neutral-400 leading-relaxed">
                {getLocalized(item.description)}
              </p>
              <span className="inline-flex items-center text-xs sm:text-sm font-semibold text-red-600">
                {item.cta
                  ? getLocalized(item.cta)
                  : language === 'en'
                    ? `${t('sections.open')} ${getLocalized(item.label)}`
                    : `${getLocalized(item.label)} ${t('sections.open')}`}
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1 shrink-0" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3 kitabs */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-600 font-semibold text-xs tracking-wider uppercase mb-1">
              <BookOpen className="w-4 h-4" />
              <span>
                {getLocalized({
                  en: 'Library introduction',
                  am: 'የቤተ-መጻሕፍት መግቢያ',
                  ar: 'مقدمة المكتبة',
                })}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white">
              {getLocalized({
                en: 'Three featured kitabs',
                am: 'ሦስት ተመራጭ ኪታቦች',
                ar: 'ثلاثة كتب مختارة',
              })}
            </h2>
          </div>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
          >
            {getLocalized({ en: 'Open library', am: 'ቤተ-መጻሕፍት ክፈት', ar: 'افتح المكتبة' })}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {kitabsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : (
          <>
            <div className="md:hidden flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
              {featuredKitabs.map(kitab => (
                <div key={kitab.slug} className="min-w-[78%] max-w-[78%] snap-start shrink-0">
                  <KitabCard kitab={kitab} />
                </div>
              ))}
            </div>
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredKitabs.map(kitab => (
                <KitabCard key={kitab.slug} kitab={kitab} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Intebih Ante Murakeb — 7-part introduction between Kitabs and popular audio */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#A91F24] mb-1">
              {getLocalized({
                en: 'Introduction series',
                am: 'መግቢያ ተከታታይ',
                ar: 'سلسلة تعريفية',
              })}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white">
              {getLocalized({
                en: 'Intebih Ante Murakeb — 7 parts',
                am: 'ኢንተቢህ አንተ ሙራቀቡን — 7 ክፍሎች',
                ar: 'انتبه أنت مراقب — 7 أجزاء',
              })}
            </h2>
            <p className="mt-1 text-sm font-medium text-[#6b7280] dark:text-neutral-400 max-w-2xl">
              {getLocalized({
                en: 'Start here: seven introduction lessons from Intebih Ante Murakeb.',
                am: 'እዚህ ይጀምሩ፦ «ኢንተቢህ አንተ ሙራቀቡን» የተሰኙ የ7 ክፍሎች መግቢያ ትምህርቶች።',
                ar: 'ابدأ هنا: الدروس السبعة التعريفية من انتبه أنت مراقب.',
              })}
            </p>
          </div>
          <Link
            href="/kitab/intebih-ante-murakeb"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#A91F24] dark:text-red-400 hover:underline shrink-0"
          >
            {getLocalized({
              en: 'Go to kitab →',
              am: 'ወደ ኪታብ ይሂዱ →',
              ar: 'اذهب إلى الكتاب →',
            })}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="portfolio-card overflow-hidden divide-y divide-[#e3e2e0] dark:divide-neutral-800">
          {(() => {
            const fallback =
              kitabsData.find(k => k.slug === 'intebih-ante-murakeb')?.dersList || []
            const fromCms =
              allKitabs.find(k => k.slug === 'intebih-ante-murakeb')?.dersList || []
            // Prefer CMS audio; fill gaps from static. Never show empty "Coming soon" rows.
            const ders: Array<{
              id: string
              title: { am: string; ar: string; en: string }
              speaker: { am: string; ar: string; en: string }
              audioUrl: string
              partNum: number
            }> = []
            for (let i = 0; i < 7; i++) {
              const c = fromCms[i]
              const f = fallback[i]
              const audioUrl = (c?.audioUrl || f?.audioUrl || '').trim()
              if (!audioUrl) continue
              const titleRaw = c?.title || f?.title
              const speakerRaw = c?.speaker || f?.speaker
              if (!titleRaw || !speakerRaw) continue
              const asLoc = (
                v: string | { am?: string; ar?: string; en?: string }
              ): { am: string; ar: string; en: string } =>
                typeof v === 'string'
                  ? { am: v, ar: v, en: v }
                  : { am: v.am || '', ar: v.ar || '', en: v.en || '' }
              ders.push({
                id: c?.id || f?.id || `intebih-part-${i + 1}`,
                title: asLoc(titleRaw),
                speaker: asLoc(speakerRaw),
                audioUrl,
                partNum: i + 1,
              })
            }
            return ders.map(d => (
              <CompactAudioRow
                key={d.id}
                title={d.title}
                speaker={getLocalized(d.speaker)}
                kitabTitle={getLocalized({
                  en: `Part ${d.partNum} of 7`,
                  am: `ክፍል ${d.partNum} ከ 7`,
                  ar: `الجزء ${d.partNum} من 7`,
                })}
                audioUrl={d.audioUrl}
              />
            ))
          })()}
        </div>
      </section>

      {/* Popular audio — same structure day/night; white/elevated cards */}
      <section className="space-y-6 rounded-3xl bg-[#f1f3f6]/80 dark:bg-transparent px-0 sm:px-2 py-2 sm:py-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#A91F24] dark:text-red-400 font-bold text-xs tracking-wider uppercase mb-1">
              <Headphones className="w-4 h-4" />
              <span>
                {getLocalized({
                  en: 'Featured audio',
                  am: 'ተመራጭ ድምጽ',
                  ar: 'صوت مميز',
                })}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-neutral-100">
              {getLocalized({
                en: 'Popular audio lessons',
                am: 'ታዋቂ የድምፅ ትምህርቶች',
                ar: 'دروس صوتية شائعة',
              })}
            </h2>
            <p className="mt-1 text-sm font-medium text-[#6b7280] dark:text-neutral-400 max-w-xl">
              {getLocalized({
                en: 'Listen with presence — lessons that settle the heart.',
                am: 'በትኩረት ያዳምጡ — ልብን የሚያረጋጉ ትምህርቶች።',
                ar: 'استمع بحضور — دروس تطمئن القلب.',
              })}
            </p>
          </div>
          <Link
            href="/dawah"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#A91F24] dark:text-red-400 hover:text-[#8F171C] dark:hover:text-red-300"
          >
            {getLocalized({
              en: 'View all audios',
              am: 'ሁሉንም ድምጾች ይመልከቱ',
              ar: 'عرض كل الصوتيات',
            })}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="lg:grid lg:grid-cols-3 lg:gap-5">
          {audioLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2 lg:contents">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-56 min-w-[82%] max-w-[82%] lg:min-w-0 lg:max-w-none shrink-0" />
              ))}
            </div>
          ) : popularAudio.length === 0 ? (
            <p className="text-sm text-[#6b7280] dark:text-neutral-400 col-span-full">
              {getLocalized({
                en: 'Mark audio as Featured in Admin to show it here.',
                am: 'እዚህ ለማሳየት በአድሚን ድምጹን Featured ያድርጉ።',
                ar: 'علّم الصوت كمميز في الإدارة ليظهر هنا.',
              })}
            </p>
          ) : (
            <>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory lg:hidden">
                {popularAudio.map(track => (
                  <div
                    key={track.audioUrl}
                    className="min-w-[82%] max-w-[82%] sm:min-w-[55%] sm:max-w-[55%] snap-start shrink-0 min-w-0 overflow-hidden"
                  >
                    <FeaturedAudioBlock
                      title={track.title}
                      speaker={getLocalized(track.description) || track.speaker}
                      audioUrl={track.audioUrl}
                      category={track.category}
                      duration={track.duration}
                    />
                  </div>
                ))}
              </div>
              <div className="hidden lg:contents">
                {popularAudio.map(track => (
                  <FeaturedAudioBlock
                    key={track.audioUrl}
                    title={track.title}
                    speaker={getLocalized(track.description) || track.speaker}
                    audioUrl={track.audioUrl}
                    category={track.category}
                    duration={track.duration}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Video / Audio section choice (image 7) — under AV, not above marriage */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
              {getLocalized({
                en: 'Video & audio',
                am: 'ቪዲዮና ድምጽ',
                ar: 'فيديو وصوت',
              })}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white">
              {getLocalized({
                en: 'Choose video or audio',
                am: 'ቪዲዮ ወይም ድምጽ ይምረጡ',
                ar: 'اختر فيديو أو صوت',
              })}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/videos"
              className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              {getLocalized({ en: 'All videos (1 min+)', am: 'ሁሉም ቪዲዮ (1 ደቂቃ+)', ar: 'كل الفيديو (دقيقة+)' })}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dawah"
              className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              {getLocalized({ en: 'Da’wah audio', am: 'የዳዕዋ ድምጽ', ar: 'صوت الدعوة' })}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {(() => {
          const om = getLocalOneMinuteSlides()
          const vCount = om.filter(s => s.kind === 'video').length
          const aCount = om.filter(s => s.kind === 'audio').length
          return (
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/one-minute"
                className="portfolio-card p-6 text-center space-y-1 hover:border-red-500/40 transition group"
              >
                <p className="font-mono font-black text-3xl sm:text-4xl text-red-600">{vCount}</p>
                <p className="text-sm text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                  {getLocalized({ en: 'Video', am: 'ቪዲዮ', ar: 'فيديو' })}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {getLocalized({ en: 'Under 1 minute', am: 'ከ1 ደቂቃ በታች', ar: 'أقل من دقيقة' })}
                </p>
              </Link>
              <Link
                href="/one-minute"
                className="portfolio-card p-6 text-center space-y-1 hover:border-red-500/40 transition group"
              >
                <p className="font-mono font-black text-3xl sm:text-4xl text-red-600">{aCount}</p>
                <p className="text-sm text-neutral-500 group-hover:text-neutral-800 dark:group-hover:text-neutral-200">
                  {getLocalized({ en: 'Audio', am: 'ድምጽ', ar: 'صوت' })}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {getLocalized({ en: 'Under 1 minute', am: 'ከ1 ደቂቃ በታች', ar: 'أقل من دقيقة' })}
                </p>
              </Link>
            </div>
          )
        })()}
      </section>

      {/* Youth & Heart Corner — under video/audio section choice */}
      <section className="space-y-6">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600">
          <Heart className="w-3.5 h-3.5" />
          {getLocalized({
            en: 'Youth & Heart Corner',
            am: 'የወጣቶች እና የልብ ማዕከል',
            ar: 'ركن الشباب والقلب',
          })}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {YOUTH_HEART_CORNER.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`portfolio-card p-5 space-y-2 hover:border-red-500/40 hover:-translate-y-0.5 transition group ${
                item.href === '/questions' ? 'border-[#D4AF37]/50' : ''
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {item.emoji}
              </span>
              <h3 className="text-lg font-bold text-[#111827] dark:text-white group-hover:text-red-600 transition">
                {getLocalized(item.label)}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {getLocalized(item.description)}
              </p>
              <span className="inline-flex items-center text-sm font-semibold text-red-600">
                {language === 'en'
                  ? `${t('sections.open')} ${getLocalized(item.label)}`
                  : `${getLocalized(item.label)} ${t('sections.open')}`}
                <ArrowRight className="w-4 h-4 ml-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Home FAQ (image 3) — not the full Q&A feed */}
      <section className="portfolio-card p-8 sm:p-10 space-y-6 bg-red-50/40 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/40">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-wider">
            <MessageCircleQuestion className="w-4 h-4" />
            {getLocalized({
              en: 'Guidance for visitors',
              am: 'ለጎብኚዎች መመሪያ',
              ar: 'إرشاد للزوار',
            })}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white">
            {getLocalized({ en: 'Have a Question?', am: 'ጥያቄ አለዎት?', ar: 'هل لديك سؤال؟' })}
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
            {getLocalized({
              en: 'These common questions show what you can find here — tap one to open that Q&A with its answer, or send your own.',
              am: 'እነዚህ ተደጋጋሚ ጥያቄዎች በጣቢያው ላይ ምን እንደሚገኝ ያሳያሉ — አንዱን ይጫኑ ያን ጥያቄና መልሱን ለመክፈት፣ ወይም የራስዎን ይላኩ።',
              ar: 'هذه الأسئلة الشائعة تُعرّف بما في الموقع — اضغط لفتح ذلك السؤال وجوابه، أو أرسل سؤالك.',
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {homeQuestions.length > 0
            ? homeQuestions.map(item => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/50 px-4 py-3.5 hover:border-red-500/60 hover:bg-red-50/60 dark:hover:bg-red-950/30 hover:ring-2 hover:ring-red-500/20 transition"
                >
                  <span className="mt-0.5 text-red-600 font-bold text-sm group-hover:scale-110 transition">?</span>
                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-red-700 dark:group-hover:text-red-400 transition leading-snug line-clamp-3">
                    {getLocalized(item.q)}
                  </span>
                </Link>
              ))
            : [0, 1, 2, 3].map(i => (
                <div
                  key={`home-q-slot-${i}`}
                  className="flex items-start gap-3 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-white/40 dark:bg-neutral-950/30 px-4 py-3.5"
                >
                  <span className="mt-0.5 text-red-600/50 font-bold text-sm">?</span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-500 leading-snug">
                    {getLocalized({
                      en: 'Coming soon — Admin will choose a question for this spot.',
                      am: 'በቅርብ — አስተዳዳሪ ለዚህ ቦታ ጥያቄ ይመርጣል።',
                      ar: 'قريبًا — سيختار المشرف سؤالًا لهذا المكان.',
                    })}
                  </span>
                </div>
              ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <AskQuestionNavLink
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 shadow-lg shadow-red-900/20 transition"
            trailing={<ArrowRight className="w-4 h-4" />}
          />
          <Link
            href="/questions"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-red-600/40 text-red-600 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition"
          >
            {getLocalized({
              en: 'Browse published answers',
              am: 'የታተሙ መልሶችን ይመልከቱ',
              ar: 'تصفح الإجابات المنشورة',
            })}
          </Link>
        </div>
      </section>

      {/* Stay Connected — social before footer / contact */}
      <section className="portfolio-card p-8 sm:p-10 space-y-6">
        <div className="space-y-2 text-center sm:text-start">
          <p className="text-xs font-bold uppercase tracking-wider text-red-600">
            {getLocalized({
              en: 'Our social pages',
              am: 'የማህበራዊ ሚዲያ ገጾቻችን',
              ar: 'صفحاتنا الاجتماعية',
            })}
          </p>
          <h2 className="title-gold text-2xl sm:text-3xl font-bold">
            {getLocalized({ en: 'Connect with us', am: 'ከእኛ ጋር ይገናኙ', ar: 'تواصل معنا' })}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {getLocalized({
              en: 'Official pages — Telegram, YouTube, and TikTok.',
              am: 'ይፋዊ ገጾቻችን — ቴሌግራም፣ ዩቲዩብ እና ቲክቶክ።',
              ar: 'صفحاتنا الرسمية — تلغرام ويوتيوب وتيك توك.',
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={siteMetadata.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-sky-500/30 bg-sky-600/10 hover:bg-sky-600 px-5 py-4 transition"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md group-hover:bg-white group-hover:text-sky-600 transition">
              <Send className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#111827] dark:text-white group-hover:text-white transition">
                Telegram
              </span>
              <span className="block text-xs text-neutral-500 group-hover:text-sky-100 transition truncate">
                {siteMetadata.telegramHandle}
              </span>
            </span>
          </a>

          <a
            href={siteMetadata.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-red-500/30 bg-red-700/10 hover:bg-red-700 px-5 py-4 transition"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-700 text-white shadow-md group-hover:bg-white group-hover:text-red-700 transition">
              <Youtube className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#111827] dark:text-white group-hover:text-white transition">
                YouTube
              </span>
              <span className="block text-xs text-neutral-500 group-hover:text-red-100 transition truncate">
                @sle_qelbachn1
              </span>
            </span>
          </a>

          <a
            href={siteMetadata.tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-neutral-400/40 bg-neutral-200/40 dark:bg-neutral-800/60 hover:bg-neutral-800 px-5 py-4 transition"
          >
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-md group-hover:bg-white group-hover:text-neutral-900 transition">
              <span className="text-sm font-black">♪</span>
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-[#111827] dark:text-white group-hover:text-white transition">
                TikTok
              </span>
              <span className="block text-xs text-neutral-500 group-hover:text-neutral-200 transition truncate">
                @sle_qelbachn1
              </span>
            </span>
          </a>
        </div>
      </section>
    </div>
  )
}
