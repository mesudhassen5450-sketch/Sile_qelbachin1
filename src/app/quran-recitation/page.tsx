'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, Headphones, Mic2, Pause, Play, User } from 'lucide-react'
import CategoryPageHero from '@/components/CategoryPageHero'
import SectionHeading from '@/components/SectionHeading'
import QuranRecitationPanel from '@/components/quran/QuranRecitationPanel'
import { useLanguage } from '@/context/LanguageContext'
import { useAudio } from '@/context/AudioContext'
import {
  fetchPublishedQuranRecitations,
  pickCmsLoc,
  type CmsLoc,
  type CmsQuranRecitation,
} from '@/lib/cmsClient'

type Tab = 'recitation' | 'tafsir'

function hasTafsirContent(row: CmsQuranRecitation): boolean {
  const text =
    pickCmsLoc(row.tafsir?.text, 'en') ||
    pickCmsLoc(row.tafsir?.text, 'am') ||
    pickCmsLoc(row.tafsir?.text, 'ar')
  return Boolean(text || row.tafsir?.audioUrl || row.tafsir?.videoUrl)
}

function TafsirAudioRow({ item }: { item: CmsQuranRecitation }) {
  const { getLocalized, language } = useLanguage()
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio()
  const title = pickCmsLoc(item.title, language) || getLocalized({ en: 'Tafsir lesson', am: 'የተፍሲር ትምህርት', ar: 'درس تفسير' })
  const reciter = pickCmsLoc(item.reciter, language)
  const description = pickCmsLoc(item.description, language)
  const tafsirText = pickCmsLoc(item.tafsir?.text, language)
  const audioUrl = item.tafsir?.audioUrl || item.audioUrl
  const trackId = `quran-tafsir-${item.id}`
  const active = currentTrack?.id === trackId && isPlaying

  return (
    <article className="portfolio-card p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
      {item.coverUrl ? (
        <div className="relative w-full sm:w-24 h-40 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-neutral-900">
          <Image src={item.coverUrl} alt="" fill unoptimized className="object-cover" />
        </div>
      ) : (
        <div className="w-full sm:w-24 h-24 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center justify-center shrink-0">
          <BookOpen className="w-8 h-8 text-red-400" />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <h3 className="font-bold text-neutral-900 dark:text-white line-clamp-2">{title}</h3>
        {reciter ? (
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <User className="w-3.5 h-3.5 text-rose-500" />
            {reciter}
          </p>
        ) : null}
        {(description || tafsirText) ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
            {description || tafsirText}
          </p>
        ) : null}
        {item.duration ? (
          <p className="text-[11px] font-mono text-neutral-500">{item.duration}</p>
        ) : null}
      </div>
      {audioUrl ? (
        <button
          type="button"
          onClick={() => {
            if (currentTrack?.id === trackId) togglePlayPause()
            else
              playTrack({
                id: trackId,
                title,
                speaker: reciter || 'Sile Qelbachin',
                duration: item.duration || '',
                audioUrl,
              })
          }}
          className={`btn-interactive inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shrink-0 ${
            active
              ? 'bg-[#D4AF37] text-neutral-950'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
        >
          {active ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          {active
            ? getLocalized({ en: 'Pause', am: 'ለአፍታ አቁም', ar: 'إيقاف مؤقت' })
            : getLocalized({ en: 'Listen', am: 'አዳምጥ', ar: 'استمع' })}
        </button>
      ) : item.tafsir?.videoUrl ? (
        <a
          href={item.tafsir.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-interactive inline-flex items-center gap-2 rounded-xl bg-red-600 text-white px-4 py-2.5 text-sm font-bold shrink-0"
        >
          <Headphones className="w-4 h-4" />
          {getLocalized({ en: 'Open video', am: 'ቪዲዮ ክፈት', ar: 'افتح الفيديو' })}
        </a>
      ) : null}
    </article>
  )
}

export default function QuranRecitationPage() {
  const { getLocalized, language } = useLanguage()
  const [tab, setTab] = useState<Tab>('recitation')
  const [cmsRows, setCmsRows] = useState<CmsQuranRecitation[] | null>(null)
  const [loadingTafsir, setLoadingTafsir] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoadingTafsir(true)
    void fetchPublishedQuranRecitations<CmsQuranRecitation>().then(rows => {
      if (cancelled) return
      setCmsRows(rows || [])
      setLoadingTafsir(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const tafsirItems = useMemo(() => {
    if (!cmsRows) return []
    return cmsRows.filter(hasTafsirContent)
  }, [cmsRows])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <CategoryPageHero
        emoji="📖"
        badge={{
          en: 'Educational Archive',
          am: 'ትምህርታዊ ማህደር',
          ar: 'الأرشيف التعليمي',
        }}
        title={{
          en: 'Qur’an Tilawah & Tafsir',
          am: 'የቁርኣን ተላዋ እና ተፍሲር',
          ar: 'تلاوة القرآن والتفسير',
        }}
        description={{
          en: 'Qur’an tilawah with Amharic tafsir and audio lessons.',
          am: 'የቁርኣን ቲላዋዎች ከአማርኛ ተፍሲር እና ከድምፅ ትምህርቶች ጋር።',
          ar: 'تلاوات القرآن مع التفسير الأمھري والدروس الصوتية.',
        }}
      />

      <div role="tablist" className="tab-strip grid-cols-2">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'recitation'}
          onClick={() => setTab('recitation')}
          className={`tab-strip-btn btn-interactive ${tab === 'recitation' ? 'is-active' : ''}`}
        >
          <Mic2 className="w-4 h-4" />
          {getLocalized({
            en: 'Qur’an Tilawah',
            am: 'የቁርኣን ቲላዋ',
            ar: 'تلاوة القرآن',
          })}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'tafsir'}
          onClick={() => setTab('tafsir')}
          className={`tab-strip-btn btn-interactive ${tab === 'tafsir' ? 'is-active' : ''}`}
        >
          <BookOpen className="w-4 h-4" />
          {getLocalized({
            en: 'Tafsir & Qur’an lessons',
            am: 'ተፍሲር እና የቁርኣን ትምህርቶች',
            ar: 'تفسير ودروس قرآنية',
          })}
        </button>
      </div>

      {tab === 'recitation' ? (
        <section role="tabpanel" className="space-y-4">
          <SectionHeading
            label={getLocalized({ en: 'Listen', am: 'ያዳምጡ', ar: 'استمع' })}
            title={getLocalized({
              en: 'Qur’an Tilawah',
              am: 'የቁርኣን ቲላዋ',
              ar: 'تلاوة القرآن',
            })}
            description={getLocalized({
              en: 'Choose a listening option: ayah by ayah (verse), or a full surah from international qaris.',
              am: 'የማዳመጫ አማራጭ ይምረጡ፦ አያ በአያ (በጥቅስ) ወይም በዓለም አቀፍ ቃሪኦች ሙሉ ሱራ።',
              ar: 'اختر أسلوب الاستماع: آية بآية، أو سورة كاملة من قراء عالميين.',
            })}
          />
          <QuranRecitationPanel />
        </section>
      ) : (
        <section role="tabpanel" className="space-y-6">
          <SectionHeading
            label={getLocalized({ en: 'Study', am: 'ጥናት', ar: 'دراسة' })}
            title={getLocalized({
              en: 'Tafsir & Qur’anic audio lessons',
              am: 'ተፍሲርና የቁርኣን ድምጽ ትምህርቶች',
              ar: 'التفسير ودروس صوتية قرآنية',
            })}
            description={getLocalized({
              en: 'Explanations and lessons published from the archive. New lessons appear here when added.',
              am: 'ከማህደሩ የታተሙ ማብራሪያዎችና ትምህርቶች። አዲስ ትምህርት ሲታከል እዚህ ይታያል።',
              ar: 'شروح ودروس منشورة من الأرشيف. تظهر الدروس الجديدة هنا عند إضافتها.',
            })}
          />

          {loadingTafsir ? (
            <div className="portfolio-card p-10 text-center text-sm text-neutral-500">
              {getLocalized({
                en: 'Loading tafsir…',
                am: 'ተፍሲር በመጫን…',
                ar: 'جاري تحميل التفسير…',
              })}
            </div>
          ) : tafsirItems.length === 0 ? (
            <div className="portfolio-card p-10 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-neutral-400 mx-auto" />
              <p className="font-bold text-neutral-900 dark:text-white">
                {getLocalized({
                  en: 'No tafsir lessons yet',
                  am: 'እስካሁን የተፍሲር ትምህርት የለም',
                  ar: 'لا دروس تفسير بعد',
                })}
              </p>
              <p className="text-sm text-neutral-500 max-w-md mx-auto">
                {getLocalized({
                  en: 'When new Qur’anic tafsir audio or text is published, it will show in this section.',
                  am: 'አዲስ የቁርኣን ተፍሲር ድምጽ ወይም ጽሑፍ ሲታተም በዚህ ክፍል ይታያል።',
                  ar: 'عند نشر تفسير قرآني صوتي أو نصي جديد سيظهر في هذا القسم.',
                })}
              </p>
              <Link
                href="/kitab"
                className="inline-block text-sm font-bold text-rose-500 hover:text-rose-600"
              >
                {getLocalized({
                  en: 'Browse the kitab library →',
                  am: 'የኪታብ ቤተ-መጻሕፍት ይመልከቱ →',
                  ar: 'تصفح مكتبة الكتب →',
                })}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tafsirItems.map(item => (
                <TafsirAudioRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
