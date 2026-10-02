'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Check,
  Download,
  Loader2,
  Pause,
  Play,
  Search,
  Volume2,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import {
  ayahAudioUrl,
  DEFAULT_INTL_QARI_ID,
  DEFAULT_VERSE_QARI_ID,
  findQari,
  fullSurahAudioUrl,
  internationalQaris,
  QURAN_GOLD,
  type Qari,
  SURAH_META,
  verseByVerseQaris,
} from '@/data/quranCatalog'
import {
  ayahCacheKey,
  blobPlayUrl,
  downloadAndCache,
  listCachedAyahs,
  surahCacheKey,
} from '@/lib/quranOfflineCache'

type TafseerLang = 'am' | 'en'

type AyahRow = {
  numberInSurah: number
  arabic: string
  english: string
  amharic: string
  arabicBody: string
  hasLeadingBismillah: boolean
}

const BISMILLAH_AR = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ'
const BISMILLAH_AM = 'በአላህ ስም እጅግ በጣም ምሕረተኛ በጣም አዛኝ በሆነው'
const BISMILLAH_EN = 'In the name of Allah, the Entirely Merciful, the Especially Merciful'

function splitBismillah(text: string): { bismillah: boolean; body: string } {
  const t = (text || '').trim()
  if (!t) return { bismillah: false, body: '' }
  const re =
    /^(بِسْمِ[\s\u00A0]*[ٱا]للَّهِ[\s\u00A0]*[ٱا]لرَّحْمَ[ٰـ]?نِ[\s\u00A0]*[ٱا]لرَّحِيمِ|بسم[\s\u00A0]*الله[\s\u00A0]*الرحمن[\s\u00A0]*الرحيم)[\s\u00A0]*/u
  if (re.test(t)) {
    const body = t.replace(re, '').trim()
    if (!body) return { bismillah: false, body: t }
    return { bismillah: true, body }
  }
  return { bismillah: false, body: t }
}

function ReciterPortrait({
  qari,
  size = 52,
  goldRing,
}: {
  qari: Qari
  size?: number
  goldRing?: boolean
}) {
  const [src, setSrc] = useState(qari.imageUrl)
  const [failed, setFailed] = useState(false)
  const triedFallback = useRef(false)

  useEffect(() => {
    setSrc(qari.imageUrl)
    setFailed(false)
    triedFallback.current = false
  }, [qari.id, qari.imageUrl])

  const initials = (qari.name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <span
      key={qari.id}
      className="relative inline-flex shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-[#D4AF37]/40 to-red-700/30 items-center justify-center"
      style={{
        width: size,
        height: size,
        boxShadow: goldRing
          ? `0 0 0 2.5px ${QURAN_GOLD}`
          : '0 0 0 2px rgba(163,163,163,0.5)',
      }}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={qari.name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => {
            if (!triedFallback.current && qari.fallbackUrl) {
              triedFallback.current = true
              setSrc(qari.fallbackUrl)
              return
            }
            setFailed(true)
          }}
        />
      ) : (
        <span
          className="text-xs font-black text-neutral-800 dark:text-white"
          style={{ fontSize: Math.max(11, size * 0.28) }}
        >
          {initials}
        </span>
      )}
    </span>
  )
}

function QariChip({
  qari,
  selected,
  onSelect,
  gold,
}: {
  qari: Qari
  selected: boolean
  onSelect: () => void
  gold?: boolean
}) {
  const { language } = useLanguage()
  const label = language === 'am' ? qari.nameAm : qari.name

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`btn-interactive flex flex-col items-center gap-1.5 min-w-[72px] p-2 rounded-2xl border transition ${
        gold
          ? selected
            ? 'border-[#D4AF37] bg-[#D4AF37]/15'
            : 'border-[#D4AF37]/45 bg-white dark:bg-neutral-950/50 hover:border-[#D4AF37]'
          : selected
            ? 'border-red-500/60 bg-red-500/10'
            : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950/50 hover:border-neutral-400'
      }`}
    >
      <ReciterPortrait qari={qari} size={52} goldRing={!!gold} />
      <span className="text-[10px] font-bold text-center line-clamp-2 leading-tight max-w-[68px]">
        {label}
      </span>
    </button>
  )
}

async function fetchAmharicSurah(surahNumber: number): Promise<string[]> {
  // QuranEnc keys amharic_absu / amharic_mulee are gone (404). Use live keys + CDN fallback.
  const quranEncKeys = ['amharic_sadiq', 'amharic_zain'] as const
  for (const key of quranEncKeys) {
    try {
      const res = await fetch(
        `https://quranenc.com/api/v1/translation/sura/${key}/${surahNumber}`
      )
      if (!res.ok) continue
      const json = await res.json()
      const result = (json?.result || []) as Array<{ translation?: string; aya?: string }>
      if (!result.length) continue
      return result
        .sort((a, b) => Number(a.aya || 0) - Number(b.aya || 0))
        .map(r => (r.translation || '').replace(/^\d+\.\s*/, '').trim())
    } catch {
      /* try next */
    }
  }

  try {
    const res = await fetch(
      `https://api.quran.com/api/v4/quran/translations/87?chapter_number=${surahNumber}`
    )
    if (res.ok) {
      const json = await res.json()
      const list = (json?.translations || []) as Array<{ text?: string }>
      if (list.length) {
        return list.map(t =>
          String(t.text || '')
            .replace(/<[^>]+>/g, '')
            .trim()
        )
      }
    }
  } catch {
    /* fallback below */
  }

  try {
    const res = await fetch(
      `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/amh-muhammedsadiqan/${surahNumber}.json`
    )
    if (!res.ok) return []
    const json = await res.json()
    const chapter = json?.chapter as Array<{ verse?: number; text?: string }> | undefined
    if (!Array.isArray(chapter) || !chapter.length) return []
    return [...chapter]
      .sort((a, b) => Number(a.verse || 0) - Number(b.verse || 0))
      .map(v => (v.text || '').trim())
  } catch {
    return []
  }
}

export default function QuranRecitationPanel() {
  const { getLocalized, language } = useLanguage()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlsRef = useRef<string[]>([])
  const preloadMapRef = useRef<
    Map<number, { audio: HTMLAudioElement; objectUrl?: string }>
  >(new Map())
  const continueRef = useRef(true)
  const ayahsRef = useRef<AyahRow[]>([])
  const activeQariRef = useRef<Qari | null>(null)
  const surahRef = useRef(1)
  const modeRef = useRef<'verse' | 'fullSurah'>('verse')

  const [mode, setMode] = useState<'verse' | 'fullSurah'>('verse')
  const [verseQariId, setVerseQariId] = useState(DEFAULT_VERSE_QARI_ID)
  const [intlQariId, setIntlQariId] = useState(DEFAULT_INTL_QARI_ID)
  const [surahNumber, setSurahNumber] = useState(1)
  const [ayahs, setAyahs] = useState<AyahRow[]>([])
  const [loadingAyahs, setLoadingAyahs] = useState(false)
  const [playingKey, setPlayingKey] = useState<string | null>(null)
  const [surahQuery, setSurahQuery] = useState('')
  const [showAllReciters, setShowAllReciters] = useState(false)
  const [autoContinue, setAutoContinue] = useState(true)
  const [tafseerLang, setTafseerLang] = useState<TafseerLang>(
    language === 'am' ? 'am' : 'en'
  )
  const [cachedAyahs, setCachedAyahs] = useState<Set<number>>(new Set())
  const [downloading, setDownloading] = useState<string | null>(null)
  const [surahDlProgress, setSurahDlProgress] = useState<number | null>(null)

  // Follow site language for tafseer (Amharic + English only)
  useEffect(() => {
    setTafseerLang(language === 'am' ? 'am' : 'en')
  }, [language])

  useEffect(() => {
    continueRef.current = autoContinue
  }, [autoContinue])

  const activeQari = useMemo(() => {
    if (mode === 'verse') return findQari(verseQariId) || verseByVerseQaris[0]
    return findQari(intlQariId) || internationalQaris[0]
  }, [mode, verseQariId, intlQariId])

  useEffect(() => {
    activeQariRef.current = activeQari || null
    ayahsRef.current = ayahs
    surahRef.current = surahNumber
    modeRef.current = mode
  }, [activeQari, ayahs, surahNumber, mode])

  const surah = SURAH_META.find(s => s.number === surahNumber) || SURAH_META[0]

  const filteredSurahs = useMemo(() => {
    const q = surahQuery.trim().toLowerCase()
    if (!q) return SURAH_META
    return SURAH_META.filter(
      s =>
        s.nameEn.toLowerCase().includes(q) ||
        s.nameAr.includes(q) ||
        s.nameAm.includes(q) ||
        String(s.number).includes(q)
    )
  }, [surahQuery])

  const refreshCacheMap = useCallback(async () => {
    if (!activeQari || mode !== 'verse') {
      setCachedAyahs(new Set())
      return
    }
    const set = await listCachedAyahs(activeQari.id, surahNumber, surah.ayahCount)
    setCachedAyahs(set)
  }, [activeQari, mode, surahNumber, surah.ayahCount])

  useEffect(() => {
    void refreshCacheMap()
  }, [refreshCacheMap])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null
      audioRef.current.ontimeupdate = null
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlayingKey(null)
    preloadMapRef.current.forEach(({ audio }) => {
      try {
        audio.onended = null
        audio.ontimeupdate = null
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      } catch {
        /* ignore */
      }
    })
    preloadMapRef.current.clear()
    objectUrlsRef.current.forEach(u => URL.revokeObjectURL(u))
    objectUrlsRef.current = []
  }, [])

  const resolveAyahSrc = useCallback(async (qari: Qari, surahN: number, ayahInSurah: number) => {
    const remote = ayahAudioUrl(qari, surahN, ayahInSurah)
    const cacheId = ayahCacheKey(qari.id, surahN, ayahInSurah)
    try {
      return await blobPlayUrl(cacheId, remote)
    } catch {
      return remote
    }
  }, [])

  /** Prefetch next ayah(s) so auto-continue has near-zero gap. */
  const ensurePreloaded = useCallback(
    async (ayahInSurah: number) => {
      const qari = activeQariRef.current
      if (!qari || modeRef.current !== 'verse') return
      const list = ayahsRef.current
      if (ayahInSurah < 1 || ayahInSurah > list.length) return
      if (preloadMapRef.current.has(ayahInSurah)) return

      const surahN = surahRef.current
      const src = await resolveAyahSrc(qari, surahN, ayahInSurah)
      if (preloadMapRef.current.has(ayahInSurah)) return

      const audio = new Audio()
      audio.preload = 'auto'
      audio.src = src
      try {
        audio.load()
      } catch {
        /* ignore */
      }
      preloadMapRef.current.set(ayahInSurah, {
        audio,
        objectUrl: src.startsWith('blob:') ? src : undefined,
      })

      await new Promise<void>(resolve => {
        if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
          resolve()
          return
        }
        const done = () => resolve()
        audio.addEventListener('canplaythrough', done, { once: true })
        audio.addEventListener('error', done, { once: true })
        window.setTimeout(done, 2000)
      })
    },
    [resolveAyahSrc]
  )

  const playAyahContinuous = useCallback(
    async (ayahInSurah: number) => {
      const qari = activeQariRef.current
      if (!qari || modeRef.current !== 'verse') return
      const surahN = surahRef.current
      const list = ayahsRef.current
      const key = `ayah-${surahN}-${ayahInSurah}`

      // Warm next verses while (or before) this one plays — removes network gap
      void ensurePreloaded(ayahInSurah + 1)
      void ensurePreloaded(ayahInSurah + 2)

      if (audioRef.current) {
        audioRef.current.onended = null
        audioRef.current.ontimeupdate = null
        audioRef.current.pause()
      }

      let a: HTMLAudioElement
      const pre = preloadMapRef.current.get(ayahInSurah)
      if (pre) {
        preloadMapRef.current.delete(ayahInSurah)
        a = pre.audio
        if (pre.objectUrl) objectUrlsRef.current.push(pre.objectUrl)
      } else {
        const playSrc = await resolveAyahSrc(qari, surahN, ayahInSurah)
        if (playSrc.startsWith('blob:')) objectUrlsRef.current.push(playSrc)
        a = new Audio(playSrc)
      }

      a.volume = 0.55
      audioRef.current = a
      setPlayingKey(key)

      a.onended = () => {
        if (!continueRef.current) {
          setPlayingKey(null)
          return
        }
        const next = ayahInSurah + 1
        if (next <= list.length) {
          void playAyahContinuous(next)
        } else {
          setPlayingKey(null)
        }
      }
      a.onerror = () => setPlayingKey(null)
      a.ontimeupdate = () => {
        if (!Number.isFinite(a.duration) || a.duration <= 0) return
        // Final seconds: ensure next is already buffered
        if (a.currentTime >= Math.max(0, a.duration - 2.5)) {
          void ensurePreloaded(ayahInSurah + 1)
          void ensurePreloaded(ayahInSurah + 2)
        }
      }

      try {
        // Reset to start if this element was pre-buffered mid-file
        if (a.currentTime > 0.05) a.currentTime = 0
        await a.play()
      } catch {
        setPlayingKey(null)
      }
    },
    [ensurePreloaded, resolveAyahSrc]
  )

  const playFullSurah = useCallback(async () => {
    const qari = activeQariRef.current
    if (!qari || modeRef.current !== 'fullSurah') return
    const surahN = surahRef.current
    const remote = fullSurahAudioUrl(qari, surahN)
    const cacheId = surahCacheKey(qari.id, surahN)
    const key = `surah-${surahN}`

    stopAudio()
    let playSrc = remote
    try {
      playSrc = await blobPlayUrl(cacheId, remote)
      if (playSrc.startsWith('blob:')) objectUrlsRef.current.push(playSrc)
    } catch {
      playSrc = remote
    }
    const a = new Audio(playSrc)
    a.volume = 0.55
    audioRef.current = a
    setPlayingKey(key)
    a.onended = () => setPlayingKey(null)
    a.onerror = () => setPlayingKey(null)
    try {
      await a.play()
    } catch {
      setPlayingKey(null)
    }
  }, [stopAudio])

  useEffect(() => () => stopAudio(), [stopAudio])

  // Load mushaf + translations
  useEffect(() => {
    let cancelled = false
    setLoadingAyahs(true)
    void (async () => {
      try {
        const [mainRes, amList] = await Promise.all([
          fetch(
            `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,en.sahih`
          ),
          fetchAmharicSurah(surahNumber),
        ])
        const json = await mainRes.json()
        const editions = json?.data as Array<{
          ayahs?: Array<{ numberInSurah: number; text: string }>
        }>
        if (!editions?.length || cancelled) return
        const ar = editions[0]?.ayahs || []
        const en = editions[1]?.ayahs || []
        const rows: AyahRow[] = ar.map((a, i) => {
          const split = splitBismillah(a.text)
          return {
            numberInSurah: a.numberInSurah,
            arabic: a.text,
            english: en[i]?.text || '',
            amharic: amList[i] || '',
            arabicBody: split.body,
            hasLeadingBismillah: split.bismillah,
          }
        })
        if (!cancelled) setAyahs(rows)
      } catch {
        if (!cancelled) setAyahs([])
      } finally {
        if (!cancelled) setLoadingAyahs(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [surahNumber])

  const downloadAyah = async (ayahInSurah: number) => {
    if (!activeQari || mode !== 'verse') return
    const id = ayahCacheKey(activeQari.id, surahNumber, ayahInSurah)
    const url = ayahAudioUrl(activeQari, surahNumber, ayahInSurah)
    setDownloading(id)
    try {
      await downloadAndCache(id, url)
      await refreshCacheMap()
    } catch {
      /* ignore */
    } finally {
      setDownloading(null)
    }
  }

  const downloadSurahAudio = async () => {
    if (!activeQari) return
    if (mode === 'fullSurah') {
      const id = surahCacheKey(activeQari.id, surahNumber)
      const url = fullSurahAudioUrl(activeQari, surahNumber)
      setDownloading(id)
      setSurahDlProgress(0)
      try {
        await downloadAndCache(id, url)
        setSurahDlProgress(100)
        // Allow play while/after download
        if (!playingKey) void playFullSurah()
      } catch {
        /* ignore */
      } finally {
        setDownloading(null)
        setTimeout(() => setSurahDlProgress(null), 1200)
      }
      return
    }

    // Verse mode: download all ayahs, play first if idle
    const total = ayahs.length
    setSurahDlProgress(0)
    let done = 0
    for (const a of ayahs) {
      const id = ayahCacheKey(activeQari.id, surahNumber, a.numberInSurah)
      const url = ayahAudioUrl(activeQari, surahNumber, a.numberInSurah)
      setDownloading(id)
      try {
        await downloadAndCache(id, url)
      } catch {
        /* continue */
      }
      done += 1
      setSurahDlProgress(Math.round((done / total) * 100))
      // Start continuous play after first ayah is ready
      if (done === 1 && !playingKey) {
        void playAyahContinuous(1)
      }
    }
    setDownloading(null)
    await refreshCacheMap()
    setTimeout(() => setSurahDlProgress(null), 1200)
  }

  const surahTitle =
    language === 'am' ? surah.nameAm : language === 'ar' ? surah.nameAr : surah.nameEn

  const showSurahBismillah =
    surahNumber !== 9 &&
    (ayahs.some(a => a.hasLeadingBismillah) ||
      (surahNumber === 1 && ayahs[0] && !ayahs[0].hasLeadingBismillah))

  const activeQariLabel = activeQari
    ? language === 'am'
      ? activeQari.nameAm
      : activeQari.name
    : '—'

  const tafseerFor = (a: AyahRow) => {
    if (tafseerLang === 'am') return a.amharic || a.english
    return a.english
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section
          className={`rounded-2xl p-4 sm:p-5 space-y-3 border-2 bg-white dark:bg-neutral-950/40 ${
            mode === 'verse' ? 'border-[#D4AF37]' : 'border-[#D4AF37]/40'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#B8860B]">
                {getLocalized({
                  en: 'Listen ayah by ayah',
                  am: 'አያ በአያ ማዳመጥ',
                  ar: 'الاستماع آية بآية',
                })}
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                {getLocalized({
                  en: 'Tap any ayah and playback continues.',
                  am: 'ማንኛውንም አንቀጽ ሲነኩ ተከታታይ ያጫውታል።',
                  ar: 'المس أي آية فيتابع التشغيل.',
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode('verse')
                stopAudio()
              }}
              className={`btn-interactive text-xs font-bold px-3 py-1.5 rounded-xl border ${
                mode === 'verse'
                  ? 'bg-[#D4AF37] text-neutral-950 border-[#D4AF37]'
                  : 'border-[#D4AF37]/50 text-[#B8860B]'
              }`}
            >
              {mode === 'verse'
                ? getLocalized({ en: 'Live', am: 'ቀጥታ', ar: 'مباشر' })
                : getLocalized({ en: 'Select', am: 'ይምረጡ', ar: 'اختر' })}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {verseByVerseQaris.map(q => (
              <QariChip
                key={q.id}
                qari={q}
                gold
                selected={mode === 'verse' && verseQariId === q.id}
                onSelect={() => {
                  setMode('verse')
                  setVerseQariId(q.id)
                  stopAudio()
                }}
              />
            ))}
          </div>
        </section>

        <section
          className={`rounded-2xl p-4 sm:p-5 space-y-3 border bg-white dark:bg-neutral-950/40 ${
            mode === 'fullSurah'
              ? 'border-red-500/50'
              : 'border-neutral-300 dark:border-neutral-700'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                {getLocalized({
                  en: 'International qaris',
                  am: 'ዓለም አቀፍ ቃሪኦች',
                  ar: 'قراء عالميون',
                })}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {getLocalized({
                  en: 'Full surahs (MP3)',
                  am: 'ሙሉ ሱራዎች (MP3)',
                  ar: 'سور كاملة (MP3)',
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setMode('fullSurah')
                stopAudio()
              }}
              className={`btn-interactive text-xs font-bold px-3 py-1.5 rounded-xl border ${
                mode === 'fullSurah'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-neutral-400 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {mode === 'fullSurah'
                ? getLocalized({ en: 'Live', am: 'ቀጥታ', ar: 'مباشر' })
                : getLocalized({ en: 'Select', am: 'ይምረጡ', ar: 'اختر' })}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {internationalQaris.slice(0, 8).map(q => (
              <QariChip
                key={q.id}
                qari={q}
                selected={mode === 'fullSurah' && intlQariId === q.id}
                onSelect={() => {
                  setMode('fullSurah')
                  setIntlQariId(q.id)
                  stopAudio()
                }}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowAllReciters(true)}
            className="btn-interactive text-xs font-bold text-red-600 hover:underline"
          >
            {getLocalized({ en: 'See all', am: 'ሁሉንም', ar: 'عرض الكل' })} →
          </button>
        </section>
      </div>

      {/* Controls bar */}
      <div
        className={`flex flex-wrap items-center gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-2xl border bg-white dark:bg-neutral-950 shadow-sm ${
          mode === 'verse' ? 'border-[#D4AF37]/60' : 'border-neutral-300 dark:border-neutral-700'
        }`}
      >
        {activeQari ? (
          <ReciterPortrait
            key={`bar-${activeQari.id}`}
            qari={activeQari}
            size={44}
            goldRing={mode === 'verse'}
          />
        ) : null}
        <div className="min-w-0 flex-1 basis-[40%] sm:basis-auto">
          <p className="text-[10px] sm:text-xs font-bold text-neutral-500">
            {getLocalized({ en: 'Reciters', am: 'ቃሪዎች', ar: 'القراء' })}
          </p>
          <p className="font-bold text-sm sm:text-lg text-neutral-900 dark:text-white truncate">
            {activeQariLabel}
          </p>
        </div>

        {/* Tafseer language — Amharic + English only */}
        <div className="flex rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden text-xs font-bold shrink-0">
          {(['am', 'en'] as TafseerLang[]).map(l => (
            <button
              key={l}
              type="button"
              onClick={() => setTafseerLang(l)}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 btn-interactive ${
                tafseerLang === l
                  ? 'bg-[#D4AF37] text-neutral-950'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {l === 'am' ? 'አማ' : 'EN'}
            </button>
          ))}
        </div>

        {mode === 'verse' ? (
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoContinue}
              onChange={e => setAutoContinue(e.target.checked)}
              className="accent-[#D4AF37] w-4 h-4"
            />
            {getLocalized({
              en: 'Auto-continue',
              am: 'በራስ-ሰር ቀጥል',
              ar: 'متابعة تلقائية',
            })}
          </label>
        ) : null}

        <button
          type="button"
          onClick={() => void downloadSurahAudio()}
          disabled={!!downloading}
          className="btn-interactive inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#D4AF37]/50 text-xs font-bold text-[#B8860B] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 disabled:opacity-50"
        >
          {surahDlProgress != null ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {surahDlProgress}%
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              {getLocalized({
                en: 'Download surah',
                am: 'ሱራ አውርድ',
                ar: 'تحميل السورة',
              })}
            </>
          )}
        </button>

        {mode === 'fullSurah' ? (
          <button
            type="button"
            onClick={() => {
              if (playingKey?.startsWith('surah-')) stopAudio()
              else void playFullSurah()
            }}
            className="btn-interactive inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold shadow-md"
          >
            {playingKey?.startsWith('surah-') ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            {getLocalized({
              en: 'Play full surah',
              am: 'ሙሉ ሱራ አጫውት',
              ar: 'شغّل السورة كاملة',
            })}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B8860B]">
            <Volume2 className="w-3.5 h-3.5" />
            {getLocalized({
              en: 'Tap ▶ on an ayah',
              am: 'በአንቀጽ ላይ ▶ ይንኩ',
              ar: 'المس ▶ على آية',
            })}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <aside className="lg:col-span-4 space-y-3">
          <div className="rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 p-3 flex items-center gap-3 shadow-sm">
            {activeQari ? (
              <ReciterPortrait
                key={`side-${activeQari.id}`}
                qari={activeQari}
                size={48}
                goldRing={mode === 'verse'}
              />
            ) : null}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {getLocalized({ en: 'Now listening', am: 'አሁን በማዳመጥ', ar: 'تسمع الآن' })}
              </p>
              <p className="text-sm font-bold truncate text-neutral-900 dark:text-white">
                {activeQariLabel}
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
            <input
              value={surahQuery}
              onChange={e => setSurahQuery(e.target.value)}
              placeholder={getLocalized({
                en: 'Search surah…',
                am: 'ሱራ ፈልግ…',
                ar: 'ابحث عن سورة…',
              })}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40"
            />
          </div>
          <div className="max-h-[520px] overflow-y-auto rounded-2xl border border-neutral-300 dark:border-neutral-700 divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950 shadow-sm">
            {filteredSurahs.map(s => {
              const active = s.number === surahNumber
              const title = language === 'am' ? s.nameAm : language === 'ar' ? s.nameAr : s.nameEn
              return (
                <button
                  key={s.number}
                  type="button"
                  onClick={() => {
                    setSurahNumber(s.number)
                    stopAudio()
                  }}
                  className={`btn-interactive w-full text-start px-3 py-3 flex items-center gap-3 ${
                    active
                      ? mode === 'verse'
                        ? 'bg-[#D4AF37]/20 border-s-4 border-s-[#D4AF37]'
                        : 'bg-red-500/10 border-s-4 border-s-red-600'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-900 border-s-4 border-s-transparent'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                      active && mode === 'verse'
                        ? 'bg-[#D4AF37] text-neutral-950'
                        : active
                          ? 'bg-red-600 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'
                    }`}
                  >
                    {s.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold truncate text-neutral-900 dark:text-white">
                      {title}
                    </span>
                    <span className="block text-[10px] text-neutral-500">
                      {s.ayahCount}{' '}
                      {getLocalized({ en: 'ayahs', am: 'አንቀጾች', ar: 'آيات' })} · {s.revelation}
                    </span>
                  </span>
                  <span className="arabic-text text-sm text-neutral-500 shrink-0">{s.nameAr}</span>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="lg:col-span-8 space-y-4">
          <div
            className={`portfolio-card p-5 space-y-1 ${
              mode === 'verse' ? 'ring-1 ring-[#D4AF37]/40' : ''
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-500">
              <BookOpen className="w-4 h-4" />
              {getLocalized({ en: 'Surah', am: 'ሱራ', ar: 'سورة' })} {surah.number}
            </div>
            <h2 className="title-gold text-2xl sm:text-3xl">{surahTitle}</h2>
            <p className="arabic-text text-xl text-neutral-800 dark:text-neutral-100">{surah.nameAr}</p>
            <p className="text-xs text-neutral-500 pt-1">
              {getLocalized({
                en: `Tafseer: ${tafseerLang === 'am' ? 'Amharic' : 'English'}`,
                am: `ተፍሲር፦ ${tafseerLang === 'am' ? 'አማርኛ' : 'እንግሊዝኛ'}`,
                ar: `التفسير: ${tafseerLang === 'am' ? 'الأمهرية' : 'الإنجليزية'}`,
              })}
            </p>
          </div>

          {loadingAyahs ? (
            <div className="portfolio-card p-10 flex items-center justify-center gap-2 text-neutral-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              {getLocalized({ en: 'Loading ayahs…', am: 'አንቀጾች በመጫን…', ar: 'جاري التحميل…' })}
            </div>
          ) : (
            <div className="space-y-3">
              {showSurahBismillah && surahNumber !== 1 ? (
                <div className="ayah-card rounded-2xl px-5 py-6 text-center border border-[#D4AF37]/50">
                  <p className="arabic-text text-2xl sm:text-3xl text-[#B8860B] leading-loose">
                    {BISMILLAH_AR}
                  </p>
                  <p className="ayah-tafseer mt-2 text-sm">
                    {tafseerLang === 'am' ? BISMILLAH_AM : BISMILLAH_EN}
                  </p>
                </div>
              ) : null}

              {ayahs.map(a => {
                const key = `ayah-${surahNumber}-${a.numberInSurah}`
                const active = playingKey === key
                const tapable = mode === 'verse'
                const displayArabic =
                  a.hasLeadingBismillah && surahNumber !== 1 ? a.arabicBody : a.arabic
                const isFatihaBismillah = surahNumber === 1 && a.numberInSurah === 1
                const isCached = cachedAyahs.has(a.numberInSurah)
                const dlId = activeQari
                  ? ayahCacheKey(activeQari.id, surahNumber, a.numberInSurah)
                  : ''
                const isDl = downloading === dlId
                const tafseer = tafseerFor(a)

                return (
                  <div
                    key={a.numberInSurah}
                    className={`ayah-card rounded-2xl p-4 sm:p-5 transition ${
                      active ? 'ring-2 ring-[#D4AF37] shadow-lg' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-mono font-bold ${
                          active
                            ? 'bg-[#D4AF37] text-neutral-950'
                            : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                        }`}
                      >
                        {a.numberInSurah}
                      </span>

                      <div className="min-w-0 flex-1 space-y-3">
                        <p
                          className={`arabic-text text-2xl sm:text-[1.65rem] leading-[2.1] font-medium ${
                            isFatihaBismillah
                              ? 'text-[#B8860B] text-center'
                              : 'text-neutral-950 dark:text-white'
                          }`}
                        >
                          {displayArabic}
                        </p>

                        {tafseer && !isFatihaBismillah ? (
                          <p
                            className={`ayah-tafseer border-t border-neutral-200 dark:border-neutral-700 pt-3 ${
                              tafseerLang === 'am' ? 'text-base' : ''
                            }`}
                          >
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#B8860B] me-2">
                              {tafseerLang === 'am' ? 'ተፍሲር' : 'Tafseer'}
                            </span>
                            {tafseer}
                          </p>
                        ) : isFatihaBismillah && tafseerLang === 'am' ? (
                          <p className="ayah-tafseer text-center">{BISMILLAH_AM}</p>
                        ) : isFatihaBismillah && tafseerLang === 'en' ? (
                          <p className="ayah-tafseer text-center">{BISMILLAH_EN}</p>
                        ) : null}

                        {tapable ? (
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (active) stopAudio()
                                else void playAyahContinuous(a.numberInSurah)
                              }}
                              className="btn-interactive inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] text-neutral-950 text-sm font-bold shadow-md"
                            >
                              {active ? (
                                <Pause className="w-4 h-4 fill-current" />
                              ) : (
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              )}
                              {active
                                ? getLocalized({ en: 'Pause', am: 'አቁም', ar: 'إيقاف' })
                                : getLocalized({ en: 'Play', am: 'አጫውት', ar: 'تشغيل' })}
                            </button>

                            <button
                              type="button"
                              onClick={() => void downloadAyah(a.numberInSurah)}
                              disabled={isDl}
                              className="btn-interactive inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm font-bold text-neutral-800 dark:text-neutral-100 bg-white dark:bg-neutral-900"
                            >
                              {isDl ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : isCached ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                              {isCached
                                ? getLocalized({
                                    en: 'Saved offline',
                                    am: 'ከመስመር ውጭ ተቀምጧል',
                                    ar: 'محفوظ دون اتصال',
                                  })
                                : getLocalized({
                                    en: 'Download',
                                    am: 'አውርድ',
                                    ar: 'تحميل',
                                  })}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showAllReciters ? (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close"
            onClick={() => setShowAllReciters(false)}
          />
          <div className="relative w-full sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="title-gold text-xl">
                {getLocalized({ en: 'Reciters', am: 'ቃሪዎች', ar: 'القراء' })}
              </h3>
              <button
                type="button"
                onClick={() => setShowAllReciters(false)}
                className="btn-interactive text-sm font-bold text-neutral-500"
              >
                {getLocalized({ en: 'Close', am: 'ዝጋ', ar: 'إغلاق' })}
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#B8860B] uppercase tracking-wider">
                {getLocalized({ en: 'Verse by verse', am: 'ቁጥር በቁጥር', ar: 'آية بآية' })}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {verseByVerseQaris.map(q => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setMode('verse')
                      setVerseQariId(q.id)
                      setShowAllReciters(false)
                      stopAudio()
                    }}
                    className="btn-interactive flex items-center gap-3 p-3 rounded-xl border border-[#D4AF37]/50 text-start hover:bg-[#D4AF37]/10"
                  >
                    <ReciterPortrait qari={q} size={42} goldRing />
                    <span className="block text-sm font-bold">
                      {language === 'am' ? q.nameAm : q.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                {getLocalized({
                  en: 'International · Full surah',
                  am: 'ዓለም አቀፍ · ሙሉ ሱራ',
                  ar: 'عالميون · سورة كاملة',
                })}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {internationalQaris.map(q => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setMode('fullSurah')
                      setIntlQariId(q.id)
                      setShowAllReciters(false)
                      stopAudio()
                    }}
                    className="btn-interactive flex items-center gap-3 p-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-start"
                  >
                    <ReciterPortrait qari={q} size={42} />
                    <span className="block text-sm font-bold">
                      {language === 'am' ? q.nameAm : q.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
