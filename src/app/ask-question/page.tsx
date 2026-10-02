'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { siteMetadata } from '@/data/channelData'

const QURAN = {
  arabic: 'فَاسْأَلُوا أَهْلَ الذِّكْرِ إِن كُنتُمْ لَا تَعْلَمُونَ',
  am: '«የማታውቁም ከሆናችሁ የመጽሐፉን ባለቤቶች ጠይቁ፡፡» (ሱረቱ አን-ነሕል፡ 43)',
  en: '"So ask the people of the message if you do not know." (Surah An-Nahl: 43)',
  ar: '«فاسألوا أهل الذكر إن كنتم لا تعلمون» (سورة النحل: 43)',
}

const CATEGORIES = [
  { value: 'general', en: 'General Islamic Question', am: 'አጠቃላይ የእስልምና ጥያቄ', ar: 'سؤال إسلامي عام' },
  { value: 'ibadah', en: 'Worship (Ibadah)', am: 'ዒባዳ (የአምልኮ ጉዳዮች)', ar: 'العبادة' },
  { value: 'family', en: 'Family & Marriage', am: 'ቤተሰብ እና ጋብቻ', ar: 'الأسرة والزواج' },
  { value: 'counseling', en: 'Personal Advice', am: 'የግል ምክር', ar: 'نصيحة شخصية' },
  { value: 'quran', en: 'Qur’an & Tafsir', am: 'ቁርኣን እና ተፍሲር', ar: 'القرآن والتفسير' },
  { value: 'hadith', en: 'Hadith', am: 'ሐዲሥ', ar: 'الحديث' },
  { value: 'aqeedah', en: 'Aqeedah (Faith)', am: 'ዐቂዳ (እምነት)', ar: 'العقيدة' },
  { value: 'other', en: 'Other…', am: 'ሌላ...', ar: 'أخرى…' },
]

function cmsQuestionsUrl(): string {
  return '/api/ask-question'
}

function gmailInboxUrl(email: string): string {
  if (email.toLowerCase().endsWith('@gmail.com')) {
    return 'https://mail.google.com/mail/u/0/#inbox'
  }
  return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email)}`
}

export default function AskQuestionPage() {
  const { getLocalized, language } = useLanguage()
  const { user, loading: authLoading, configured, displayName, refresh } = useAuth()
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingCheck, setPendingCheck] = useState<'loading' | 'clear' | 'blocked'>('loading')
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [categoryValue, setCategoryValue] = useState(CATEGORIES[0].value)
  const [otherCategory, setOtherCategory] = useState('')
  const [question, setQuestion] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!configured) return
    if (user) return
    let cancelled = false
    void (async () => {
      await refresh()
      if (cancelled) return
      // refresh() updates context; re-check via getUser for this tick
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        if (cancelled) return
        if (data.user) return
      } catch {
        /* fall through */
      }
      if (!cancelled) router.replace('/login?next=/ask-question')
    })()
    return () => {
      cancelled = true
    }
  }, [authLoading, configured, user, router, refresh])

  useEffect(() => {
    if (!user?.email) return
    let cancelled = false
    ;(async () => {
      setPendingCheck('loading')
      try {
        const res = await fetch(
          `${cmsQuestionsUrl()}?email=${encodeURIComponent(user.email!)}`,
          { cache: 'no-store' }
        )
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (data.pending) {
          setPendingCheck('blocked')
          setPendingPreview(typeof data.question_preview === 'string' ? data.question_preview : null)
        } else {
          setPendingCheck('clear')
        }
      } catch {
        if (!cancelled) setPendingCheck('clear')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.email])

  const resolveCategoryLabel = () => {
    if (categoryValue === 'other') {
      const custom = otherCategory.trim()
      return custom || getLocalized({ en: 'Other', am: 'ሌላ', ar: 'أخرى' })
    }
    const found = CATEGORIES.find(c => c.value === categoryValue)
    return found ? getLocalized(found) : categoryValue
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!user?.email) {
      router.replace('/login?next=/ask-question')
      return
    }
    if (categoryValue === 'other' && otherCategory.trim().length < 2) {
      setError(
        getLocalized({
          en: 'Please briefly describe your category.',
          am: 'እባክዎ የምድቡን ርዕስ በጥቂቱ ይግለጹ።',
          ar: 'يرجى وصف التصنيف باختصار.',
        })
      )
      return
    }
    const q = question.trim()
    if (q.length < 10) {
      setError(
        getLocalized({
          en: 'Please write a clearer question (at least a few sentences).',
          am: 'እባክዎ ጥያቄዎን በግልጽ ይጻፉ።',
          ar: 'يرجى كتابة سؤال أوضح.',
        })
      )
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: displayName || user.email,
        anonymous: false,
        contact: user.email,
        category: resolveCategoryLabel(),
        question: q,
        user_id: user.id,
        auth_email: user.email,
      }

      const res = await fetch(cmsQuestionsUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 409 || data.pending) {
        setPendingCheck('blocked')
        setPendingPreview(typeof data.question_preview === 'string' ? data.question_preview : null)
        setError(null)
        return
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `submit_${res.status}`)
      }

      setSubmitted(true)
      setPendingCheck('blocked')
    } catch {
      setError(
        getLocalized({
          en: 'Could not send your question. Please try again in a moment.',
          am: 'ጥያቄዎን መላክ አልተቻለም። እባክዎ ትንሽ ቆይተው እንደገና ይሞክሩ።',
          ar: 'تعذر إرسال سؤالك. حاول مرة أخرى.',
        })
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || (user && pendingCheck === 'loading')) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="portfolio-card p-8 text-sm text-neutral-500">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="portfolio-card p-8 space-y-3 text-center">
          <h1 className="text-xl font-bold">
            {getLocalized({ en: 'Sign in required', am: 'መግባት ያስፈልጋል', ar: 'يلزم تسجيل الدخول' })}
          </h1>
          <Link
            href="/login?next=/ask-question"
            className="inline-flex px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold"
          >
            {getLocalized({
              en: 'Continue with Google',
              am: 'በGoogle ይቀጥሉ',
              ar: 'تابع مع Google',
            })}
          </Link>
        </div>
      </div>
    )
  }

  const ayahTranslation =
    language === 'en' ? QURAN.en : language === 'ar' ? QURAN.ar : QURAN.am

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <section className="portfolio-card p-6 sm:p-8 space-y-5 text-center sm:text-start">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#A91F24] dark:text-red-400">
          {getLocalized({ en: 'Confidential', am: 'ምስጢራዊ', ar: 'سري' })}
        </p>
        <div className="space-y-2 rounded-2xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f8f9fb]/80 dark:bg-neutral-900/50 px-4 py-4">
          <p className="text-xl sm:text-2xl leading-relaxed text-[#111827] dark:text-neutral-100 arabic-text text-center" dir="rtl">
            {QURAN.arabic}
          </p>
          <p className="text-sm sm:text-base font-medium text-[#6b7280] dark:text-neutral-400 text-center leading-relaxed">
            {ayahTranslation}
          </p>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white tracking-tight">
            {getLocalized({
              en: 'Submit your question',
              am: 'ጥያቄዎን ያቅርቡ',
              ar: 'قدّم سؤالك',
            })}
          </h1>
          <p className="text-sm sm:text-base text-[#6b7280] dark:text-neutral-400 max-w-2xl leading-relaxed">
            {getLocalized({
              en: 'Your private questions about Islamic life. Your question stays fully confidential.',
              am: 'ስለ እስልምና ሕይወትዎ የሚኖሩዎት የግል ጥያቄዎች። ጥያቄዎ ሙሉ በሙሉ ምስጢራዊነቱ የተጠበቀ ነው።',
              ar: 'أسئلتك الشخصية عن حياتك الإسلامية. سؤالك يبقى سرياً بالكامل.',
            })}
          </p>
        </div>
      </section>

      {pendingCheck === 'blocked' && !submitted ? (
        <div
          role="alert"
          className="portfolio-card p-8 space-y-4 text-center border-2 border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/20"
        >
          <p className="text-3xl">✉️</p>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            {getLocalized({
              en: 'Please wait for your first answer',
              am: 'እባክዎ የመጀመሪያውን መልስ ይጠብቁ',
              ar: 'يرجى انتظار الإجابة الأولى',
            })}
          </h2>
          <p className="text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed max-w-md mx-auto">
            {getLocalized({
              en: `You already have a question waiting. Your answer will arrive at ${user.email}. Please check inbox and spam before asking another.`,
              am: `አንድ ጥያቄ አሁን በመጠባበቅ ላይ ነው። መልስዎ ወደ ${user.email} ይደርሳል። ሌላ ከመጠየቅዎ በፊት Inbox እና spam ይመልከቱ።`,
              ar: `لديك سؤال بانتظار الرد. ستصلك الإجابة على ${user.email}. راجع الوارد قبل سؤال آخر.`,
            })}
          </p>
          {pendingPreview ? (
            <p className="text-xs text-neutral-500 max-w-sm mx-auto line-clamp-3 italic">
              “{pendingPreview}”
            </p>
          ) : null}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <a
              href={gmailInboxUrl(user.email || '')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition"
            >
              {getLocalized({
                en: 'Open Gmail / check email',
                am: 'Gmail / ኢሜይል ይክፈቱ',
                ar: 'افتح البريد',
              })}
            </a>
            <button
              type="button"
              onClick={() => {
                setPendingCheck('loading')
                void fetch(
                  `${cmsQuestionsUrl()}?email=${encodeURIComponent(user.email!)}`,
                  { cache: 'no-store' }
                )
                  .then(r => r.json())
                  .then(data => {
                    if (data.pending) setPendingCheck('blocked')
                    else setPendingCheck('clear')
                  })
                  .catch(() => setPendingCheck('blocked'))
              }}
              className="inline-flex px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition"
            >
              {getLocalized({ en: 'I got the answer — refresh', am: 'መልሱ ደረሰኝ — አድስ', ar: 'وصلتني الإجابة' })}
            </button>
          </div>
        </div>
      ) : null}

      {submitted ? (
        <div
          role="alert"
          className="portfolio-card p-8 space-y-4 text-center border-2 border-emerald-600/40 bg-emerald-950/20"
        >
          <p className="text-3xl">✓</p>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            {getLocalized({
              en: 'Question received — thank you',
              am: 'ጥያቄዎ ተቀብሏል — በደህና',
              ar: 'تم استلام سؤالك — شكراً لك',
            })}
          </h2>
          <p className="text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed max-w-md mx-auto">
            {getLocalized({
              en: `Stay close to your inbox (${user.email}). When your answer is ready, it arrives by email. Please wait for that reply before asking another question.`,
              am: `ኢሜይልዎን (${user.email}) ይከታተሉ። መልስዎ ሲዘጋጅ በኢሜይል ይደርስዎታል። ሌላ ከመጠየቅዎ በፊት ያንን መልስ ይጠብቁ።`,
              ar: `ابقَ قريباً من بريدك (${user.email}). عندما تكون إجابتك جاهزة تصلك بالبريد. انتظر الرد قبل سؤال آخر.`,
            })}
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <a
              href={gmailInboxUrl(user.email || '')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition"
            >
              {getLocalized({ en: 'Open Gmail', am: 'Gmail ይክፈቱ', ar: 'افتح Gmail' })}
            </a>
            <Link
              href="/account"
              className="inline-flex px-5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-600 text-sm font-bold"
            >
              {getLocalized({ en: 'My account', am: 'መለያዬ', ar: 'حسابي' })}
            </Link>
            <a
              href={siteMetadata.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 transition"
            >
              Telegram
            </a>
          </div>
        </div>
      ) : null}

      {pendingCheck === 'clear' && !submitted ? (
        <form onSubmit={onSubmit} className="portfolio-card p-6 sm:p-8 space-y-5">
          <p className="text-xs text-neutral-500">
            {getLocalized({
              en: `Signed in as ${user.email}`,
              am: `በ ${user.email} ገብተዋል`,
              ar: `مسجّل بحساب ${user.email}`,
            })}
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-300/90 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl px-3 py-2.5 leading-relaxed">
            {getLocalized({
              en: 'Please send only one question at a time. After you submit, wait patiently until a reply reaches your email.',
              am: 'እባክዎን በአንድ ጊዜ አንድ ጥያቄ ብቻ ይላኩ። ጥያቄዎ ከተላከ በኋላ በኢሜይልዎ ምላሽ እስኪደርስዎት ድረስ በትዕግሥት ይጠብቁ።',
              ar: 'يرجى إرسال سؤال واحد فقط في كل مرة. بعد الإرسال انتظر بصبر حتى يصلك الرد على بريدك.',
            })}
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500">
              {getLocalized({
                en: 'Question category (select)',
                am: 'የጥያቄው ምድብ (ይምረጡ)',
                ar: 'تصنيف السؤال (اختر)',
              })}
            </label>
            <select
              value={categoryValue}
              onChange={e => setCategoryValue(e.target.value)}
              className="w-full rounded-xl border border-[#E7E2D8] dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>
                  {getLocalized(c)}
                </option>
              ))}
            </select>
          </div>

          {categoryValue === 'other' ? (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-xs font-semibold text-neutral-500">
                {getLocalized({
                  en: 'Briefly describe your topic / category',
                  am: 'የጥያቄዎን ርዕስ/ምድብ በጥቂቱ ይግለጹ',
                  ar: 'صف موضوع سؤالك باختصار',
                })}
              </label>
              <input
                type="text"
                value={otherCategory}
                onChange={e => setOtherCategory(e.target.value)}
                className="w-full rounded-xl border border-[#E7E2D8] dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm"
                placeholder={getLocalized({
                  en: 'e.g. business, social relations…',
                  am: 'ለምሳሌ፦ ንግድ፣ ማኅበራዊ ግንኙነት...',
                  ar: 'مثلاً: التجارة، العلاقات الاجتماعية…',
                })}
              />
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500">
              {getLocalized({ en: 'Your question', am: 'ጥያቄዎ', ar: 'سؤالك' })} *
            </label>
            <textarea
              required
              rows={6}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="w-full rounded-xl border border-[#E7E2D8] dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-sm"
              placeholder={getLocalized({
                en: 'Write your question clearly here…',
                am: 'ጥያቄዎን እዚህ ጋር በግልጽ ይጻፉ...',
                ar: 'اكتب سؤالك بوضوح هنا…',
              })}
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-red-600 text-white text-sm font-bold shadow-md hover:bg-red-700 transition disabled:opacity-60"
          >
            {submitting
              ? getLocalized({ en: 'Sending…', am: 'በመላክ…', ar: 'جاري الإرسال…' })
              : getLocalized({ en: 'Send question', am: 'ጥያቄውን ላክ', ar: 'إرسال السؤال' })}
          </button>
        </form>
      ) : null}
    </div>
  )
}
