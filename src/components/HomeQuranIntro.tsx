'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, Play } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { verseByVerseQaris, internationalQaris, type Qari } from '@/data/quranCatalog'
import SectionHeading from '@/components/SectionHeading'

const SAMPLE_SURAHS = [
  { n: 1, en: 'Al-Fatihah', am: 'አል-ፋቲሐ', ar: 'الفاتحة' },
  { n: 18, en: 'Al-Kahf', am: 'አል-ካህፍ', ar: 'الكهف' },
  { n: 36, en: 'Ya-Sin', am: 'ያሲን', ar: 'يس' },
  { n: 55, en: 'Ar-Rahman', am: 'አር-ራሕማን', ar: 'الرحمن' },
  { n: 67, en: 'Al-Mulk', am: 'አል-ሙልክ', ar: 'الملك' },
  { n: 112, en: 'Al-Ikhlas', am: 'አል-ኢኽላስ', ar: 'الإخلاص' },
]

function Portrait({ qari, gold }: { qari: Qari; gold?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={qari.imageUrl}
      alt={qari.name}
      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ${
        gold ? 'ring-2 ring-[#D4AF37]' : 'ring-2 ring-neutral-300 dark:ring-neutral-600'
      }`}
      onError={e => {
        const el = e.currentTarget
        if (qari.fallbackUrl && !el.dataset.fallbackApplied) {
          el.dataset.fallbackApplied = '1'
          el.src = qari.fallbackUrl
        }
      }}
    />
  )
}

export default function HomeQuranIntro() {
  const { getLocalized, language } = useLanguage()
  const verseQaris = verseByVerseQaris.slice(0, 4)
  const intlQaris = internationalQaris.slice(0, 4)

  const surahName = (s: (typeof SAMPLE_SURAHS)[0]) =>
    language === 'am' ? s.am : language === 'ar' ? s.ar : s.en

  const qariName = (q: Qari) => (language === 'am' ? q.nameAm : q.name)

  return (
    <section className="space-y-6">
      <SectionHeading
        label={getLocalized({
          en: 'Qur’an',
          am: 'ቁርኣን',
          ar: 'القرآن',
        })}
        title={getLocalized({
          en: 'Listen to the Qur’an',
          am: 'ቁርኣንን ያዳምጡ',
          ar: 'استمع إلى القرآن',
        })}
        description={getLocalized({
          en: 'Choose a qari — verse by verse or full surahs with Amharic translation.',
          am: 'ቃሪእ ይምረጡ — ጥቅስ በጥቅስ ወይም ሙሉ ሱራዎችን ከአማርኛ ትርጉም ጋር ያዳምጡ።',
          ar: 'اختر قارئاً — آية بآية أو سور كاملة مع الترجمة الأمهرية.',
        })}
        icon={<BookOpen className="w-3.5 h-3.5" />}
        action={
          <Link
            href="/quran-recitation"
            className="btn-interactive inline-flex items-center gap-2 text-sm font-bold text-rose-500 hover:text-rose-400"
          >
            {getLocalized({
              en: 'Go to Qur’an archive →',
              am: 'ወደ ቁርኣን ማህደር ይሂዱ →',
              ar: 'اذهب إلى أرشيف القرآن →',
            })}
            <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Verse-by-verse qaris */}
        <div className="portfolio-card p-4 sm:p-6 space-y-3 sm:space-y-4 border-[#D4AF37]/50">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[#B8860B]">
                {getLocalized({
                  en: 'Listen by ayah (verse)',
                  am: 'በአያ (በጥቅስ) ማዳመጥ',
                  ar: 'الاستماع آية بآية',
                })}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5 hidden sm:block">
                {getLocalized({
                  en: 'Tap ayahs to listen continuously.',
                  am: 'አንቀጾችን በተከታታይ ለማዳመጥ አያዎችን ይጫኑ።',
                  ar: 'المس الآيات للاستماع المتتابع.',
                })}
              </p>
            </div>
            <Link
              href="/quran-recitation"
              className="btn-interactive inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D4AF37] text-neutral-950 text-xs font-bold shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {getLocalized({ en: 'Listen', am: 'አዳምጥ', ar: 'استمع' })}
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory sm:flex-wrap sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
            {verseQaris.map(q => (
              <Link
                key={q.id}
                href="/quran-recitation"
                className="btn-interactive flex items-center gap-2.5 rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/8 px-3 py-2 hover:bg-[#D4AF37]/15 min-w-[148px] snap-start shrink-0"
              >
                <Portrait qari={q} gold />
                <span className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-2 max-w-[90px]">
                  {qariName(q)}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* International full-surah */}
        <div className="portfolio-card p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                {getLocalized({
                  en: 'International qaris',
                  am: 'ዓለም አቀፍ ቃሪኦች',
                  ar: 'قراء عالميون',
                })}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5 hidden sm:block">
                {getLocalized({
                  en: 'Full surahs in high quality (MP3)',
                  am: 'ሙሉ ሱራዎች በከፍተኛ ጥራት (MP3)',
                  ar: 'سور كاملة بجودة عالية (MP3)',
                })}
              </p>
            </div>
            <Link
              href="/quran-recitation"
              className="btn-interactive inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {getLocalized({ en: 'Listen', am: 'አዳምጥ', ar: 'استمع' })}
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory sm:flex-wrap sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
            {intlQaris.map(q => (
              <Link
                key={q.id}
                href="/quran-recitation"
                className="btn-interactive flex items-center gap-2.5 rounded-2xl border border-neutral-300 dark:border-neutral-700 px-3 py-2 hover:border-red-500/40 min-w-[148px] snap-start shrink-0"
              >
                <Portrait qari={q} />
                <span className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-2 max-w-[90px]">
                  {qariName(q)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Sample surahs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {SAMPLE_SURAHS.map(s => (
          <Link
            key={s.n}
            href="/quran-recitation"
            className="btn-interactive portfolio-card !rounded-xl p-3 text-center space-y-1 hover:border-[#D4AF37]/70"
          >
            <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-[#D4AF37]/20 text-[#B8860B] text-xs font-mono font-bold mx-auto">
              {s.n}
            </span>
            <span className="block text-xs font-bold text-neutral-900 dark:text-white truncate">
              {surahName(s)}
            </span>
            <span className="block arabic-text text-[11px] text-neutral-500">{s.ar}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
