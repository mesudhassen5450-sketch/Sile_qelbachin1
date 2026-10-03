'use client'

import { useEffect, useMemo, useState } from 'react'
import { Heart, Headphones, Pause, Play, Search } from 'lucide-react'
import CategoryPageHero from '@/components/CategoryPageHero'
import RemindersFeed from '@/components/RemindersFeed'
import { useLanguage } from '@/context/LanguageContext'
import { useAudio } from '@/context/AudioContext'
import { getAudios, type MediaItem } from '@/data/mediaStore'
import { getMediaDurationSeconds } from '@/data/mediaDurations'
import { fetchPublishedAudio, pickCmsLoc, type CmsAudio } from '@/lib/cmsClient'
import { formatDuration, isShortMedia } from '@/lib/mediaDuration'

/** Da’wah — Reminders + full audio (1 min+). Short clips live in /one-minute */
const LONG_MIN_SECONDS = 60

type Tab = 'reminders' | 'audio'

type PlayableAudio = {
  id: string
  catalogId?: string
  title: { am: string; en: string; ar: string }
  speaker: string
  audioUrl: string
  source: 'archive' | 'cms'
  category?: string
  durationSeconds?: number | null
}

function AudioRow({ item }: { item: PlayableAudio }) {
  const { getLocalized, language } = useLanguage()
  const { currentTrack, isPlaying, playTrack, togglePlayPause } = useAudio()
  const title = pickCmsLoc(item.title, language) || getLocalized(item.title)
  const active = currentTrack?.id === item.id && isPlaying
  const label = item.durationSeconds ? formatDuration(item.durationSeconds) : ''

  return (
    <div
      className={`portfolio-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        active ? 'ring-2 ring-[#D4AF37]/50 bg-[#D4AF37]/5' : ''
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={() => {
            if (currentTrack?.id === item.id) togglePlayPause()
            else
              playTrack({
                id: item.id,
                title,
                speaker: item.speaker,
                duration: label,
                audioUrl: item.audioUrl,
              })
          }}
          className={`btn-interactive w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md ${
            active
              ? 'bg-[#D4AF37] text-neutral-950'
              : 'bg-red-600 hover:bg-red-500 text-white'
          }`}
          aria-label={active ? 'Pause' : 'Play'}
        >
          {active ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>
        <div className="min-w-0 space-y-1">
          <h3 className="font-bold text-neutral-900 dark:text-white truncate">{title}</h3>
          <p className="text-xs text-neutral-500 truncate">🎙 {item.speaker}</p>
          {item.category ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8860B]">
              {item.category}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-mono text-neutral-700 dark:text-neutral-300 bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-2.5 py-1 rounded-lg">
          {label ? `⏱️ ${label}` : '—'}
        </span>
        <span className="text-[10px] font-semibold text-neutral-400 uppercase">
          {item.source === 'cms' ? 'CMS' : 'Archive'}
        </span>
      </div>
    </div>
  )
}

export default function DawahPage() {
  const { getLocalized } = useLanguage()
  const [tab, setTab] = useState<Tab>('reminders')
  const [query, setQuery] = useState('')
  const [cmsAudio, setCmsAudio] = useState<CmsAudio[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const rows = await fetchPublishedAudio()
      if (!cancelled && rows?.length) setCmsAudio(rows)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const archiveAudios: PlayableAudio[] = useMemo(() => {
    return getAudios().map((a: MediaItem) => {
      const durationSeconds = getMediaDurationSeconds(a.id)
      return {
        id: `archive-${a.id}`,
        catalogId: a.id,
        title: a.title,
        speaker: 'እስታዝ አቡ ዐብደላህ · Muhadara',
        audioUrl: a.fileUrl,
        source: 'archive' as const,
        category: a.category || 'Muhadara',
        durationSeconds,
      }
    })
  }, [])

  const cmsPlayable: PlayableAudio[] = useMemo(() => {
    return cmsAudio
      .filter(a => a.fileUrl)
      .map(a => ({
        id: `cms-${a.id}`,
        title: {
          am: a.title.am || a.title.en || '',
          en: a.title.en || a.title.am || '',
          ar: a.title.ar || a.title.en || a.title.am || '',
        },
        speaker: a.isMuhadara ? 'Muhadara' : a.category || 'Audio lesson',
        audioUrl: a.fileUrl!,
        source: 'cms' as const,
        category: a.isMuhadara ? 'Muhadara' : a.category || 'Audio',
        durationSeconds: null as number | null,
      }))
  }, [cmsAudio])

  const allAudio = useMemo(() => {
    const map = new Map<string, PlayableAudio>()
    ;[...cmsPlayable, ...archiveAudios].forEach(item => {
      const key = item.audioUrl || item.id
      if (!map.has(key)) map.set(key, item)
    })
    return Array.from(map.values())
  }, [cmsPlayable, archiveAudios])

  const filteredAudio = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = allAudio.filter(a => {
      const sec = a.durationSeconds
      if (sec != null && isShortMedia(sec, LONG_MIN_SECONDS)) return false
      return true
    })
    if (q) {
      list = list.filter(a => {
        const t = `${a.title.am} ${a.title.en} ${a.title.ar} ${a.speaker} ${a.category || ''}`.toLowerCase()
        return t.includes(q)
      })
    }
    return [...list].sort((a, b) => {
      const da = a.durationSeconds || 0
      const db = b.durationSeconds || 0
      if (db !== da) return db - da
      return 0
    })
  }, [allAudio, query])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <CategoryPageHero
        emoji="🎙️"
        badge={{
          en: 'Educational Archive',
          am: 'ትምህርታዊ ማህደር',
          ar: 'الأرشيف التعليمي',
        }}
        title={{ en: 'Da’wah', am: 'ዳዕዋ', ar: 'الدعوة' }}
        description={{
          en: 'Heart reminders and Da’wah audio lessons.',
          am: 'የልብ ማስታወሻዎች እና የዳዕዋ የድምፅ ትምህርቶች።',
          ar: 'تذكيرات القلب ودروس صوتية للدعوة.',
        }}
      />

      <div
        role="tablist"
        className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-[#D4AF37]/35"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'reminders'}
          onClick={() => setTab('reminders')}
          className={`btn-interactive flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition ${
            tab === 'reminders'
              ? 'bg-white dark:bg-neutral-950 text-[#B8860B] shadow-sm border border-[#D4AF37]/60'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          {getLocalized({ en: 'Reminders', am: 'ማስታወሻዎች', ar: 'تذكيرات' })}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'audio'}
          onClick={() => setTab('audio')}
          className={`btn-interactive flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition ${
            tab === 'audio'
              ? 'bg-white dark:bg-neutral-950 text-[#B8860B] shadow-sm border border-[#D4AF37]/60'
              : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Headphones className="w-4 h-4" />
          {getLocalized({ en: 'Audio', am: 'ድምጽ', ar: 'صوت' })}
          <span className="text-[10px] font-mono opacity-60">{filteredAudio.length}</span>
        </button>
      </div>

      {tab === 'reminders' ? (
        <section role="tabpanel">
          <RemindersFeed showHeading />
        </section>
      ) : (
        <section className="space-y-5" role="tabpanel">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {getLocalized({
                  en: 'Da’wah audio',
                  am: 'የዳዕዋ ድምፆች',
                  ar: 'أصوات الدعوة',
                })}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                {getLocalized({
                  en: `Sorted by duration — longest first (${filteredAudio.length} tracks).`,
                  am: `በርዝመት የተደረደረ — ረጅሙ መጀመሪያ (${filteredAudio.length})።`,
                  ar: `مرتّب حسب المدة — الأطول أولاً (${filteredAudio.length}).`,
                })}
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={getLocalized({
                  en: 'Search audio…',
                  am: 'ድምፅ ይፈልጉ...',
                  ar: 'ابحث في الصوت…',
                })}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D4AF37]/40 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredAudio.map(item => (
              <AudioRow key={item.id} item={item} />
            ))}
            {!filteredAudio.length ? (
              <div className="portfolio-card p-8 text-center text-sm text-neutral-500">
                {getLocalized({
                  en: 'No audio matched your search.',
                  am: 'ከፍለጋዎ ጋር የሚመሳሰል ድምጽ አልተገኘም።',
                  ar: 'لا صوت يطابق بحثك.',
                })}
              </div>
            ) : null}
          </div>
        </section>
      )}
    </div>
  )
}
