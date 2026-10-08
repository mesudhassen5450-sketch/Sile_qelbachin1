'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import AskHowToGuide from '@/components/AskHowToGuide'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { signInWithGoogle } from '@/lib/auth/google'

const BOT_USERNAME = 'sileqelbachin1_Bot'
const BOT_URL = `https://t.me/${BOT_USERNAME}`
const ASK_DRAFT_KEY = 'sile_ask_question_draft_v1'
const TG_GUEST_EMAIL_KEY = 'sile_tg_guest_email_v1'

/** Stable anonymous email for Telegram-only guests (no Google required). */
function ensureTelegramGuestEmail(): string {
  try {
    const existing = localStorage.getItem(TG_GUEST_EMAIL_KEY)
    if (existing && existing.includes('@')) return existing.toLowerCase()
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
    const email = `tg.${id}@telegram.guest`
    localStorage.setItem(TG_GUEST_EMAIL_KEY, email)
    return email
  } catch {
    return `tg.${Date.now()}@telegram.guest`
  }
}

type AskDraft = {
  question: string
  categoryValue: string
  otherCategory: string
  guestName: string
  guestEmail: string
  channel: 'email' | 'telegram'
}

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

function cmsQuestionsUrl() {
  return '/api/ask-question'
}

function EmailIcon({ className = 'size-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="2" y="6" width="28" height="20" rx="4" fill="#A91F24" />
      <path d="M4 9.5 16 17 28 9.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TelegramIcon({ className = 'size-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="14" fill="#2AABEE" />
      <path
        d="M23.5 10.2 8.9 15.7c-1 .4-1 1.1-.2 1.4l3.7 1.2 1.4 4.3c.2.5.5.6 1 .3l2-1.7 4.1 3c.8.4 1.3.2 1.5-.7l2.6-12.3c.3-1.1-.4-1.6-1.5-1.2Z"
        fill="#fff"
      />
    </svg>
  )
}

function normalizeDraft(parsed: Partial<AskDraft> | null | undefined): AskDraft | null {
  if (!parsed?.question?.trim()) return null
  const channel = parsed.channel === 'telegram' ? 'telegram' : 'email'
  return {
    question: String(parsed.question),
    categoryValue: String(parsed.categoryValue || CATEGORIES[0].value),
    otherCategory: String(parsed.otherCategory || ''),
    guestName: String(parsed.guestName || ''),
    guestEmail: String(parsed.guestEmail || ''),
    channel,
  }
}

function saveAskDraft(draft: AskDraft) {
  try {
    const raw = JSON.stringify(draft)
    sessionStorage.setItem(ASK_DRAFT_KEY, raw)
    localStorage.setItem(ASK_DRAFT_KEY, raw)
  } catch {
    /* ignore */
  }
}

function readAskDraft(): AskDraft | null {
  try {
    const raw = sessionStorage.getItem(ASK_DRAFT_KEY) || localStorage.getItem(ASK_DRAFT_KEY)
    if (!raw) return null
    return normalizeDraft(JSON.parse(raw) as AskDraft)
  } catch {
    return null
  }
}

/** Carry the draft through OAuth even if the host changes (localhost → production). */
function encodeDraftForUrl(draft: AskDraft): string | null {
  try {
    const pack = (q: string) => {
      const json = JSON.stringify({
        q,
        cv: draft.categoryValue,
        oc: draft.otherCategory || '',
        ch: draft.channel,
      })
      return btoa(unescape(encodeURIComponent(json)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
    }
    // Keep redirect URLs under common proxy limits (~2k for the whole next= value).
    let encoded = pack(draft.question)
    if (encoded.length <= 1600) return encoded
    encoded = pack(draft.question.slice(0, 700))
    return encoded.length <= 1600 ? encoded : null
  } catch {
    return null
  }
}

function decodeDraftFromUrlParam(raw: string | null): AskDraft | null {
  if (!raw) return null
  try {
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/')
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
    const json = decodeURIComponent(escape(atob(padded + pad)))
    const data = JSON.parse(json) as { q?: string; cv?: string; oc?: string; ch?: string }
    return normalizeDraft({
      question: data.q || '',
      categoryValue: data.cv || CATEGORIES[0].value,
      otherCategory: data.oc || '',
      guestName: '',
      guestEmail: '',
      channel: data.ch === 'telegram' ? 'telegram' : 'email',
    })
  } catch {
    return null
  }
}

function readDraftFromLocation(): AskDraft | null {
  try {
    return decodeDraftFromUrlParam(new URLSearchParams(window.location.search).get('d'))
  } catch {
    return null
  }
}

function clearAskDraft() {
  try {
    sessionStorage.removeItem(ASK_DRAFT_KEY)
    localStorage.removeItem(ASK_DRAFT_KEY)
  } catch {
    /* ignore */
  }
}

function clearOauthResumeParams() {
  try {
    const url = new URL(window.location.href)
    if (
      !url.searchParams.has('resume') &&
      !url.searchParams.has('channel') &&
      !url.searchParams.has('d')
    ) {
      return
    }
    url.searchParams.delete('resume')
    url.searchParams.delete('channel')
    url.searchParams.delete('d')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
  } catch {
    /* ignore */
  }
}

function applyDraftToForm(
  draft: AskDraft,
  setters: {
    setQuestion: (v: string) => void
    setCategoryValue: (v: string) => void
    setOtherCategory: (v: string) => void
    setGuestName: (v: string) => void
    setGuestEmail: (v: string) => void
    setModalChannel: (v: 'email' | 'telegram') => void
  }
) {
  setters.setQuestion(draft.question)
  setters.setCategoryValue(draft.categoryValue || CATEGORIES[0].value)
  setters.setOtherCategory(draft.otherCategory || '')
  setters.setGuestName(draft.guestName || '')
  setters.setGuestEmail(draft.guestEmail || '')
  setters.setModalChannel(draft.channel)
  saveAskDraft(draft)
}

export default function AskQuestionPage() {
  const { getLocalized, language } = useLanguage()
  const { user, loading: authLoading, displayName } = useAuth()
  const draftHandled = useRef(false)

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingCheck, setPendingCheck] = useState<'clear' | 'blocked'>('clear')
  const [categoryValue, setCategoryValue] = useState(CATEGORIES[0].value)
  const [otherCategory, setOtherCategory] = useState('')
  const [question, setQuestion] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestName, setGuestName] = useState('')

  // Delivery popup (shown when user clicks Send)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)
  const [modalChannel, setModalChannel] = useState<'email' | 'telegram'>('telegram')
  const [tgConnected, setTgConnected] = useState(false)
  const [tgUsername, setTgUsername] = useState<string | null>(null)
  const [tgToken, setTgToken] = useState<string | null>(null)
  const [tgDeepLink, setTgDeepLink] = useState<string | null>(null)
  const [tgConnecting, setTgConnecting] = useState(false)
  const [tgWaiting, setTgWaiting] = useState(false)
  const [submittedChannel, setSubmittedChannel] = useState<'email' | 'telegram' | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [pendingChannel, setPendingChannel] = useState<'email' | 'telegram' | null>(null)

  /** Google email when signed in; Telegram-only guests use a stable local guest key. */
  const contactEmail = String(user?.email || guestEmail || '')
    .trim()
    .toLowerCase()

  // If this email already has an unanswered question, lock the form (channel-aware waiting UI).
  useEffect(() => {
    if (!contactEmail.includes('@') || submitted) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/ask-question?email=${encodeURIComponent(contactEmail)}`, {
          cache: 'no-store',
        })
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (data.pending) {
          setPendingCheck('blocked')
          setPendingPreview(typeof data.question_preview === 'string' ? data.question_preview : null)
          setPendingChannel(data.answer_channel === 'telegram' ? 'telegram' : 'email')
        } else if (!submitted) {
          setPendingCheck('clear')
          setPendingPreview(null)
          setPendingChannel(null)
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [contactEmail, submitted])

  const resolveCategoryLabel = () => {
    if (categoryValue === 'other') {
      const custom = otherCategory.trim()
      return custom || getLocalized({ en: 'Other', am: 'ሌላ', ar: 'أخرى' })
    }
    const found = CATEGORIES.find(c => c.value === categoryValue)
    return found ? getLocalized(found) : categoryValue
  }

  const validateForm = (): boolean => {
    setError(null)
    // Email comes only from Google auth — never a typed field.
    if (categoryValue === 'other' && otherCategory.trim().length < 2) {
      setError(
        getLocalized({
          en: 'Please briefly describe your category.',
          am: 'እባክዎ የምድቡን ርዕስ በጥቂቱ ይግለጹ።',
          ar: 'يرجى وصف التصنيف باختصار.',
        })
      )
      return false
    }
    if (question.trim().length < 10) {
      setError(
        getLocalized({
          en: 'Please write a clearer question.',
          am: 'እባክዎ ጥያቄዎን በግልጽ ይጻፉ።',
          ar: 'يرجى كتابة سؤال أوضح.',
        })
      )
      return false
    }
    return true
  }

  /** Click Send → open delivery popup (do not submit yet). */
  const onSendClick = (e: FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setModalChannel('telegram')
    setShowDeliveryModal(true)
    setError(null)
  }

  const rememberTgConnected = (username: string | null, emailForCache?: string) => {
    setTgConnected(true)
    setTgUsername(username)
    const email = (emailForCache || contactEmail).toLowerCase()
    try {
      if (email.includes('@')) {
        localStorage.setItem(
          'sile_tg_linked_v1',
          JSON.stringify({ email, username, at: Date.now() })
        )
      }
    } catch {
      /* ignore */
    }
  }

  /** Reuses cached chat_id after the first Start (Google optional for Telegram). */
  const refreshTelegramStatus = async (token?: string | null) => {
    const email =
      user?.email?.toLowerCase() ||
      guestEmail ||
      (typeof window !== 'undefined' ? ensureTelegramGuestEmail() : '')
    if (!guestEmail && email.includes('@telegram.guest')) {
      setGuestEmail(email)
    }
    const params = new URLSearchParams()
    if (email.includes('@')) {
      params.set('email', email)
      if (token) params.set('token', token)
    }
    const qs = params.toString()
    const res = await fetch(`/api/telegram/status${qs ? `?${qs}` : ''}`, { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    const ok = Boolean(data.connected)
    if (ok) {
      rememberTgConnected(typeof data.username === 'string' ? data.username : null, email)
    } else {
      setTgConnected(false)
    }
    return ok
  }

  const startWaitingForTelegram = (token: string) => {
    setTgWaiting(true)
    let tries = 0
    const timer = window.setInterval(() => {
      tries += 1
      void refreshTelegramStatus(token).then(connected => {
        if (connected) {
          window.clearInterval(timer)
          setTgWaiting(false)
        }
      })
      if (tries >= 60) {
        window.clearInterval(timer)
        setTgWaiting(false)
      }
    }, 2000)
  }

  /** Prefetch deep link — Telegram does not require Google. */
  const prepareTelegramDeepLink = async (): Promise<
    { link: string; token: string } | { already: true } | null
  > => {
    const linked = await refreshTelegramStatus(tgToken)
    if (linked || tgConnected) return { already: true }

    if (tgDeepLink && tgToken) return { link: tgDeepLink, token: tgToken }
    setTgConnecting(true)
    setError(null)
    try {
      const guest = user?.email ? undefined : ensureTelegramGuestEmail()
      if (guest) setGuestEmail(guest)
      const res = await fetch('/api/telegram/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          user?.email
            ? { action: 'link-start' }
            : { action: 'link-start', guest_email: guest }
        ),
      })
      const data = await res.json().catch(() => ({}))
      if (data.already_connected || data.connected) {
        rememberTgConnected(typeof data.username === 'string' ? data.username : null, guest)
        return { already: true }
      }
      if (!res.ok || !data.ok || !data.deep_link) {
        throw new Error(
          data.error ||
            getLocalized({
              en: 'Could not open the answer bot. Run migration 010 in Supabase if needed.',
              am: 'የመልስ ቦቱን መክፈት አልተቻለም።',
              ar: 'تعذر فتح بوت الإجابة.',
            })
        )
      }
      const link = String(data.deep_link)
      if (!/t\.me\/sileqelbachin1_Bot/i.test(link)) {
        throw new Error('Wrong bot link — expected @sileqelbachin1_Bot only.')
      }
      const token = typeof data.token === 'string' ? data.token : null
      if (!token) throw new Error('Missing Telegram link token.')
      setTgDeepLink(link)
      setTgToken(token)
      return { link, token }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Telegram connect failed.')
      return null
    } finally {
      setTgConnecting(false)
    }
  }

  useEffect(() => {
    if (!showDeliveryModal || modalChannel !== 'telegram') return
    void (async () => {
      const ok = await refreshTelegramStatus(tgToken)
      if (ok) return
      if (!tgDeepLink) void prepareTelegramDeepLink()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefetch when Telegram modal opens
  }, [showDeliveryModal, modalChannel, user?.email])

  // Restore Telegram linked state after return / reload (Google optional).
  useEffect(() => {
    if (authLoading) return
    try {
      const guest = localStorage.getItem(TG_GUEST_EMAIL_KEY)
      if (guest && !user?.email) setGuestEmail(guest)
      const raw = localStorage.getItem('sile_tg_linked_v1')
      if (raw) {
        const parsed = JSON.parse(raw) as { email?: string; username?: string | null }
        const email = (user?.email || guest || '').toLowerCase()
        if (parsed.email && parsed.email === email) {
          setTgUsername(parsed.username || null)
        }
      }
    } catch {
      /* ignore */
    }
    void refreshTelegramStatus(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, authLoading])

  const onTelegramOpenClick = () => {
    if (tgConnected) return
    if (tgDeepLink && tgToken) {
      startWaitingForTelegram(tgToken)
      return
    }
    const popup = window.open('about:blank', '_blank')
    void prepareTelegramDeepLink().then(prepared => {
      if (!prepared || 'already' in prepared) {
        popup?.close()
        return
      }
      if (popup && !popup.closed) {
        popup.location.replace(prepared.link)
      } else {
        window.location.assign(prepared.link)
      }
      startWaitingForTelegram(prepared.token)
    })
  }

  const beginGoogleForChannel = async (channel: 'email' | 'telegram') => {
    const draft: AskDraft = {
      question: question.trim(),
      categoryValue,
      otherCategory,
      guestName: '',
      guestEmail: '',
      channel,
    }
    saveAskDraft(draft)
    setSubmitting(true)
    setError(null)
    // Embed draft in `next` so the question survives host changes (localhost → sileqelbachin1.com).
    const params = new URLSearchParams()
    params.set('resume', '1')
    params.set('channel', channel)
    const encoded = encodeDraftForUrl(draft)
    if (encoded) params.set('d', encoded)
    const next = `/ask-question?${params.toString()}`
    const { error: oauthError } = await signInWithGoogle(next)
    if (oauthError) {
      setError(oauthError)
      setSubmitting(false)
    }
  }

  const submitQuestion = async (channel: 'email' | 'telegram') => {
    setSubmitting(true)
    setError(null)
    try {
      // Email channel requires Google. Telegram only needs bot Start (no Google).
      if (channel === 'email' && !user?.email) {
        await beginGoogleForChannel('email')
        return
      }

      if (channel === 'telegram') {
        let linked = tgConnected
        if (!linked) {
          linked = await refreshTelegramStatus(tgToken)
        }
        if (!linked) {
          setError(
            getLocalized({
              en: 'Open the bot and press Start once — then send. Next time it stays connected.',
              am: 'ቦቱን አንድ ጊዜ ክፈተው Start ይጫኑ — ከዚያ ይላኩ። በሚቀጥለው ጊዜ ተገናኝቶ ይቆያል።',
              ar: 'افتح البوت واضغط Start مرة واحدة — ثم أرسل. في المرات التالية يبقى متصلاً.',
            })
          )
          setSubmitting(false)
          return
        }
      }

      const deliveryEmail = String(
        user?.email ||
          (channel === 'telegram' ? guestEmail || ensureTelegramGuestEmail() : '')
      )
        .trim()
        .toLowerCase()
      if (!deliveryEmail.includes('@')) {
        if (channel === 'email') {
          await beginGoogleForChannel('email')
          return
        }
        setError(
          getLocalized({
            en: 'Could not prepare Telegram delivery. Try Open bot & Start again.',
            am: 'የቴሌግራም መላኪያ ማዘጋጀት አልተቻለም። ቦት ክፈት እና Start እንደገና ይሞክሩ።',
            ar: 'تعذر تجهيز تسليم تيليجرام. أعد فتح البوت و Start.',
          })
        )
        setSubmitting(false)
        return
      }
      if (channel === 'telegram' && !user?.email) setGuestEmail(deliveryEmail)

      const payload = {
        name: (displayName || '').trim() || (user?.email ? deliveryEmail : 'Telegram guest'),
        anonymous: !user?.email,
        contact: deliveryEmail,
        category: resolveCategoryLabel(),
        question: question.trim(),
        user_id: user?.id || null,
        auth_email: deliveryEmail,
        answer_channel: channel,
      }

      const res = await fetch(cmsQuestionsUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 409 || data.pending) {
        const preview =
          typeof data.question_preview === 'string' ? data.question_preview : null
        const ch = data.answer_channel === 'telegram' ? 'telegram' : 'email'
        setPendingPreview(preview)
        setPendingChannel(ch)
        setPendingCheck('blocked')
        setShowDeliveryModal(false)
        setError(null)
        return
      }
      if (data.need_telegram) {
        setTgConnected(false)
        setError(
          typeof data.error === 'string'
            ? data.error
            : getLocalized({
                en: 'Press Start on the bot, then try again.',
                am: 'በቦቱ Start ይጫኑ፣ ከዚያ እንደገና ይሞክሩ።',
                ar: 'اضغط Start على البوت ثم أعد المحاولة.',
              })
        )
        return
      }
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `submit_${res.status}`)
      }

      clearAskDraft()
      setSubmittedChannel(channel)
      setPendingChannel(channel)
      setSubmitted(true)
      setShowDeliveryModal(false)
      setPendingCheck('blocked')
    } catch {
      setError(
        getLocalized({
          en: 'Could not send your question. Please try again.',
          am: 'ጥያቄዎን መላክ አልተቻለም። እንደገና ይሞክሩ።',
          ar: 'تعذر إرسال سؤالك. حاول مرة أخرى.',
        })
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Always restore a saved draft into the textarea (typing is never discarded on refresh).
  useEffect(() => {
    const draft = readDraftFromLocation() || readAskDraft()
    if (!draft?.question) return
    applyDraftToForm(draft, {
      setQuestion,
      setCategoryValue,
      setOtherCategory,
      setGuestName,
      setGuestEmail,
      setModalChannel,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once on mount
  }, [])

  // Autosave while typing — draft only clears after a successful send.
  useEffect(() => {
    if (submitted) return
    if (!question.trim() && !otherCategory.trim()) return
    const timer = window.setTimeout(() => {
      saveAskDraft({
        question: question.trim() || question,
        categoryValue,
        otherCategory,
        guestName: '',
        guestEmail: '',
        channel: modalChannel,
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [question, categoryValue, otherCategory, modalChannel, submitted])

  // After Google OAuth: restore question (from URL or storage) and reopen delivery modal.
  useEffect(() => {
    if (authLoading || draftHandled.current) return

    let resume = false
    let resumeChannel: 'email' | 'telegram' | null = null
    try {
      const params = new URLSearchParams(window.location.search)
      resume = params.get('resume') === '1'
      const ch = params.get('channel')
      if (ch === 'telegram' || ch === 'email') resumeChannel = ch
    } catch {
      /* ignore */
    }

    const draft = readDraftFromLocation() || readAskDraft()
    if (!draft && !resume) return

    draftHandled.current = true
    if (draft) {
      applyDraftToForm(draft, {
        setQuestion,
        setCategoryValue,
        setOtherCategory,
        setGuestName,
        setGuestEmail,
        setModalChannel,
      })
    }
    if (resumeChannel) setModalChannel(resumeChannel)
    // Only reopen the delivery modal after an OAuth return (not every visit with a saved draft).
    if (resume) {
      setShowDeliveryModal(true)
      setError(null)
    }
    clearOauthResumeParams()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once after auth hydrates
  }, [authLoading, user?.email])

  const ayahTranslation = language === 'en' ? QURAN.en : language === 'ar' ? QURAN.ar : QURAN.am

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <p className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-900/40 px-4 py-2.5 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
        {getLocalized({
          en: 'Submit your question. Choose Telegram or Email. (Telegram: open bot & Start once. Email: Google sign-in.)',
          am: 'ጥያቄዎን ያቅርቡ። ምላሽ የሚያገኙበትን መንገድ (ቴሌግራም ወይም ኢሜይል) ይምረጡ። (ማስታወሻ፦ ቴሌግራም — ቦቱን Start፤ ኢሜይል — በGoogle መግባት)',
          ar: 'قدّم سؤالك. اختر تيليجرام أو البريد. (تيليجرام: Start للبوت مرة. البريد: تسجيل Google.)',
        })}
      </p>

      <section className="portfolio-card p-6 sm:p-8 space-y-5 text-center sm:text-start">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#A91F24] dark:text-red-400">
          {getLocalized({ en: 'Confidential', am: 'ምስጢራዊ', ar: 'سري' })}
        </p>
        <div className="space-y-2 rounded-2xl border border-[#e5e7eb] dark:border-neutral-800 bg-[#f8f9fb]/80 dark:bg-neutral-900/50 px-4 py-4">
          <p
            className="text-xl sm:text-2xl leading-relaxed text-[#111827] dark:text-neutral-100 arabic-text text-center"
            dir="rtl"
          >
            {QURAN.arabic}
          </p>
          <p className="text-sm sm:text-base font-medium text-[#6b7280] dark:text-neutral-400 text-center leading-relaxed">
            {ayahTranslation}
          </p>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white tracking-tight">
            {getLocalized({
              en: 'Submit your question',
              am: 'ጥያቄዎን ያቅርቡ',
              ar: 'قدّم سؤالك',
            })}
          </h1>
          <AskHowToGuide />
        </div>
      </section>

      {pendingCheck === 'blocked' && !submitted ? (
        <div
          role="alert"
          className="portfolio-card p-6 sm:p-8 space-y-5 border border-[#A91F24]/25 bg-gradient-to-b from-[#A91F24]/5 to-transparent"
        >
          <div className="space-y-3 text-center sm:text-start">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#A91F24]">
              {getLocalized({
                en: 'Awaiting Response',
                am: 'መልስ በመጠባበቅ ላይ',
                ar: 'بانتظار الرد',
              })}
            </p>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
              {getLocalized({
                en: 'السلام عليكم — You Have an Active Question',
                am: 'السلام عليكم — በመጠባበቅ ላይ ያለ ጥያቄ አለዎት',
                ar: 'السلام عليكم — لديك سؤال قيد الانتظار',
              })}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {getLocalized({
                en: 'To give your question the attention it deserves and manage our responses effectively, we process only one question at a time. Once we have answered your current question, you will be able to submit a new one.',
                am: 'ጥያቄዎን በጥንቃቄ መርምረን ምላሽ ለመስጠት እና የስራ ሂደታችንን የተስተካከለ ለማድረግ፣ በአንድ ጊዜ አንድ ጥያቄ ብቻ እንቀበላለን። አሁን ያቀረቡትን ጥያቄ መልሰን ስንጨርስ አዲስ ጥያቄ ማስተናገድ እንችላለን።',
                ar: 'لنمنح سؤالك العناية التي يستحقها ونُحسن إدارة الردود، نعالج سؤالاً واحداً فقط في كل مرة. بعد الإجابة عن سؤالك الحالي يمكنك إرسال سؤال جديد.',
              })}
            </p>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200 leading-relaxed">
              {(pendingChannel || submittedChannel) === 'telegram'
                ? getLocalized({
                    en: `Insha’Allah, our response will arrive privately on Telegram (@${BOT_USERNAME}).`,
                    am: `በአላህ ፈቃድ ምላሹ በግል በቴሌግራም (@${BOT_USERNAME}) ይደርሳል።`,
                    ar: `إن شاء الله سيصلك ردنا بخصوصية على تيليجرام (@${BOT_USERNAME}).`,
                  })
                : getLocalized({
                    en: `Insha’Allah, our response will be sent to your email (${contactEmail || 'your inbox'}).`,
                    am: `በአላህ ፈቃድ ምላሹ በኢሜይልዎ (${contactEmail || 'ኢንቦክስዎ'}) ይላካል።`,
                    ar: `إن شاء الله سيُرسل ردنا إلى بريدك (${contactEmail || 'صندوقك'}).`,
                  })}
            </p>
          </div>
          {pendingPreview ? (
            <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/50 px-4 py-3 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                {getLocalized({
                  en: 'Pending Question',
                  am: 'የተላከው ጥያቄ',
                  ar: 'السؤال المعلق',
                })}
              </p>
              <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed">
                “{pendingPreview}”
              </p>
            </div>
          ) : null}
          <div className="rounded-xl border border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3">
            <p className="text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed">
              {(pendingChannel || submittedChannel) === 'telegram'
                ? getLocalized({
                    en: `جزاكم الله خيراً for your patience! Before submitting another question, please check Telegram (@${BOT_USERNAME}) for our reply.`,
                    am: `ስለ ትዕግስትዎ جزاكم الله خيراً! አዲስ ጥያቄ ከመላክዎ በፊት የላክንልዎትን ምላሽ በቴሌግራም (@${BOT_USERNAME}) ያረጋግጡ።`,
                    ar: `جزاكم الله خيراً على صبركم! قبل إرسال سؤال جديد، تحقق من تيليجرام (@${BOT_USERNAME}) لردنا.`,
                  })
                : getLocalized({
                    en: 'جزاكم الله خيراً for your patience! Before submitting another question, please check your email or dashboard for our reply.',
                    am: 'ስለ ትዕግስትዎ جزاكم الله خيراً! አዲስ ጥያቄ ከመላክዎ በፊት የላክንልዎትን ምላሽ በኢሜይልዎ ወይም በዳሽቦርድዎ ያረጋገጡ።',
                    ar: 'جزاكم الله خيراً على صبركم! قبل إرسال سؤال جديد، تحقق من بريدكم أو لوحة التحكم لردنا.',
                  })}
            </p>
          </div>
          {(pendingChannel || submittedChannel) === 'telegram' ? (
            <a
              href={BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold"
            >
              @{BOT_USERNAME}
            </a>
          ) : (
            <a
              href="https://mail.google.com/mail/u/0/#inbox"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex px-5 py-2.5 rounded-xl bg-[#A91F24] text-white text-sm font-bold"
            >
              {getLocalized({ en: 'Open Gmail', am: 'Gmail ክፈት', ar: 'افتح Gmail' })}
            </a>
          )}
        </div>
      ) : null}

      {submitted ? (
        <div
          role="alert"
          className="portfolio-card p-8 space-y-5 text-center border border-emerald-600/30 bg-gradient-to-b from-emerald-950/15 to-transparent"
        >
          <p
            className="text-base sm:text-lg font-arabic text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed"
            dir="rtl"
          >
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white font-arabic" dir="rtl">
              السلام عليكم
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-lg mx-auto">
              {getLocalized({
                en: 'We have respectfully received your question. Insha’Allah, we will carefully review it and provide you with a response as soon as possible.',
                am: 'ጥያቄዎን በአክብሮት ተቀብለናል። በአላህ ፈቃድ በጥንቃቄ ተመልክተን በተቻለ ፍጥነት ምላሽ እንሰጥዎታለን።',
                ar: 'استلمنا سؤالك بكل احترام. إن شاء الله سنراجعه بعناية ونرد في أقرب وقت.',
              })}
            </p>
          </div>
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 leading-relaxed max-w-md mx-auto">
            {submittedChannel === 'telegram'
              ? getLocalized({
                  en: `Insha’Allah, our response will reach you privately on Telegram (@${BOT_USERNAME}).`,
                  am: `በአላህ ፈቃድ ምላሹ በግል በቴሌግራም (@${BOT_USERNAME}) ይደርስዎታል።`,
                  ar: `إن شاء الله سيصلك ردنا بخصوصية على تيليجرام (@${BOT_USERNAME}).`,
                })
              : getLocalized({
                  en: `Insha’Allah, our response will be sent to your email (${contactEmail}).`,
                  am: `በአላህ ፈቃድ ምላሹ በኢሜይልዎ (${contactEmail}) ይላካል።`,
                  ar: `إن شاء الله سيُرسل ردنا إلى بريدك (${contactEmail}).`,
                })}
          </p>
          <p className="text-xs text-neutral-500 leading-relaxed max-w-md mx-auto rounded-xl border border-amber-500/25 bg-amber-50/70 dark:bg-amber-950/20 px-4 py-3">
            {getLocalized({
              en: 'To ensure we provide an accurate and thoughtful response, we accept only one question at a time until your pending question is completed.',
              am: 'ትክክለኛና ጥንቃቄ የተሞላበት ምላሽ ለመስጠት እንድንችል፤ አሁን ያቀረቡት ጥያቄ ምላሽ አግኝቶ እስኪጠናቀቅ ድረስ በአንድ ጊዜ አንድ ጥያቄ ብቻ እንቀበላለን።',
              ar: 'لضمان رد دقيق ومتأنٍ، نقبل سؤالاً واحداً فقط حتى يكتمل سؤالك الحالي.',
            })}
          </p>
          {submittedChannel === 'telegram' ? (
            <a
              href={BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex px-5 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold"
            >
              @{BOT_USERNAME}
            </a>
          ) : (
            <a
              href="https://mail.google.com/mail/u/0/#inbox"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#A91F24] text-white text-sm font-bold hover:bg-red-700 transition"
            >
              {getLocalized({
                en: 'Open Gmail',
                am: 'Gmail ክፈት',
                ar: 'افتح Gmail',
              })}
            </a>
          )}
        </div>
      ) : null}

      {pendingCheck === 'clear' && !submitted ? (
        <form onSubmit={onSendClick} className="portfolio-card p-6 sm:p-8 space-y-5">
          {user?.email ? (
            <p className="text-xs text-neutral-500">
              {getLocalized({
                en: `Assalamu alaikum — signed in as ${user.email}`,
                am: `አሰላሙ ዓለይኩም — እንደ ${user.email} ገብተዋል`,
                ar: `السلام عليكم — مسجّل كـ ${user.email}`,
              })}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-500">
              {getLocalized({ en: 'Question category', am: 'የጥያቄው ምድብ', ar: 'تصنيف السؤال' })}
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
            <input
              type="text"
              value={otherCategory}
              onChange={e => setOtherCategory(e.target.value)}
              className="w-full rounded-xl border border-[#E7E2D8] dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm"
              placeholder={getLocalized({
                en: 'Describe your topic…',
                am: 'ርዕስዎን ይግለጹ…',
                ar: 'صف موضوعك…',
              })}
            />
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
                en: 'Write your question clearly…',
                am: 'ጥያቄዎን በግልጽ ይጻፉ...',
                ar: 'اكتب سؤالك بوضوح…',
              })}
            />
          </div>

          {error && !showDeliveryModal ? (
            <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p>
          ) : null}

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-red-600 text-white text-sm font-bold shadow-md hover:bg-red-700 transition"
          >
            {getLocalized({ en: 'Send question', am: 'ጥያቄውን ላክ', ar: 'إرسال السؤال' })}
          </button>
        </form>
      ) : null}

      {/* Delivery popup — before the question is saved */}
      {showDeliveryModal ? (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delivery-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <h2 id="delivery-title" className="text-lg font-bold text-[#111827] dark:text-white">
              {getLocalized({
                en: 'How should the Ustaz answer reach you?',
                am: 'የኡስታዝ መልስ እንዴት ይድረስዎት?',
                ar: 'كيف تريد أن تصلك إجابة الأستاذ؟',
              })}
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {modalChannel === 'email'
                ? getLocalized({
                    en: user?.email
                      ? `You are signed in — you can send by email to ${user.email}.`
                      : 'Email: sign in with Google to send. After sign-in you return here and send. If you already signed in on the site, you can send now.',
                    am: user?.email
                      ? `ገብተዋል — መልሱ በኢሜይል ወደ ${user.email} ይላካል። አሁን መላክ ይችላሉ።`
                      : 'ኢሜይል፦ ለመላክ በGoogle መግባት ያስፈልጋል። ከገቡ በኋላ ወደዚህ ተመልሰው ይላኩ። አስቀድመው በጣቢያው ከገቡ አሁን መላክ ይችላሉ።',
                    ar: user?.email
                      ? `أنت مسجّل — يمكنك الإرسال بالبريد إلى ${user.email}.`
                      : 'البريد: سجّل بـ Google للإرسال. بعد الدخول تعود هنا وترسل. إن كنت مسجّلاً مسبقاً على الموقع يمكنك الإرسال الآن.',
                  })
                : getLocalized({
                    en: tgConnected
                      ? 'Telegram is connected — confirm and send your question.'
                      : 'Telegram: open the bot, press Start, return here, then send.',
                    am: tgConnected
                      ? 'ቴሌግራም ተገናኝቷል — አረጋግጠው ጥያቄዎን ይላኩ።'
                      : 'ቴሌግራም፦ ቦቱን ክፈተው Start ይጫኑ፣ ወደዚህ ተመልሰው ይላኩ።',
                    ar: tgConnected
                      ? 'تيليجرام متصل — أكّد وأرسل سؤالك.'
                      : 'تيليجرام: افتح البوت واضغط Start ثم عد هنا وأرسل.',
                  })}
            </p>

            <label
              className={`flex gap-3 items-start rounded-xl border p-3.5 cursor-pointer ${
                modalChannel === 'email' ? 'border-[#A91F24]/50 bg-[#A91F24]/5' : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <input
                type="radio"
                className="mt-2 accent-[#A91F24] shrink-0"
                checked={modalChannel === 'email'}
                onChange={() => {
                  setModalChannel('email')
                  setError(null)
                }}
              />
              <EmailIcon className="size-9 shrink-0 mt-0.5" />
              <span className="min-w-0">
                <span className="block text-sm font-bold">Email</span>
                <span className="text-xs text-neutral-500">
                  {getLocalized({
                    en: user?.email
                      ? `Ready — reply to ${user.email}`
                      : 'Requires Google sign-in, then send',
                    am: user?.email
                      ? `ዝግጁ — መልስ ወደ ${user.email}`
                      : 'በGoogle መግባት ያስፈልጋል፣ ከዚያ ላክ',
                    ar: user?.email
                      ? `جاهز — الرد إلى ${user.email}`
                      : 'يتطلب تسجيل Google ثم الإرسال',
                  })}
                </span>
              </span>
            </label>

            <label
              className={`flex gap-3 items-start rounded-xl border p-3.5 cursor-pointer ${
                modalChannel === 'telegram'
                  ? 'border-sky-500/50 bg-sky-50/80 dark:bg-sky-950/30'
                  : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <input
                type="radio"
                className="mt-2 accent-[#A91F24] shrink-0"
                checked={modalChannel === 'telegram'}
                onChange={() => {
                  setModalChannel('telegram')
                  setError(null)
                }}
              />
              <TelegramIcon className="size-9 shrink-0 mt-0.5" />
              <span className="min-w-0">
                <span className="block text-sm font-bold">Telegram — @{BOT_USERNAME}</span>
                <span className="text-xs text-neutral-500">
                  {getLocalized({
                    en: tgConnected
                      ? 'Connected — ready to send'
                      : 'Start the bot, return, then send',
                    am: tgConnected
                      ? 'ተገናኝቷል — ለመላክ ዝግጁ'
                      : 'ቦቱን Start፣ ተመለስ፣ ከዚያ ላክ',
                    ar: tgConnected
                      ? 'متصل — جاهز للإرسال'
                      : 'Start للبوت ثم عد وأرسل',
                  })}
                </span>
              </span>
            </label>

            {modalChannel === 'telegram' ? (
              <div className="rounded-xl border border-sky-500/30 bg-sky-50/90 dark:bg-sky-950/30 p-3.5 space-y-3">
                <ol className="list-decimal list-inside text-xs space-y-1 text-neutral-700 dark:text-neutral-200">
                  <li>
                    {getLocalized({
                      en: 'Tap Open bot — only @sileqelbachin1_Bot',
                      am: 'ቦት ክፈት — @sileqelbachin1_Bot ብቻ',
                      ar: 'افتح البوت — @sileqelbachin1_Bot فقط',
                    })}
                  </li>
                  <li>
                    {getLocalized({
                      en: 'Press Start in Telegram',
                      am: 'በቴሌግራም Start ይጫኑ',
                      ar: 'اضغط Start في تيليجرام',
                    })}
                  </li>
                  <li>
                    {getLocalized({
                      en: 'Return here — when ✓ connected, confirm send',
                      am: 'ተመለሱ — ✓ ተገናኝቷል ሲታይ ላክ ያረጋግጡ',
                      ar: 'عد هنا — عند ✓ متصل أكّد الإرسال',
                    })}
                  </li>
                </ol>

                {tgConnected ? (
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    ✓{' '}
                    {getLocalized({
                      en: 'Telegram connected',
                      am: 'ቴሌግራም ተገናኝቷል',
                      ar: 'تم ربط تيليجرام',
                    })}
                    {tgUsername ? ` (@${tgUsername})` : ''}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 items-center">
                    {tgDeepLink ? (
                      <a
                        href={tgDeepLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onTelegramOpenClick}
                        className="inline-flex px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold"
                      >
                        {getLocalized({
                          en: 'Open bot & Start',
                          am: 'ቦት ክፈት እና Start',
                          ar: 'افتح البوت و Start',
                        })}
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled={tgConnecting}
                        onClick={onTelegramOpenClick}
                        className="inline-flex px-4 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold disabled:opacity-60"
                      >
                        {tgConnecting
                          ? getLocalized({
                              en: 'Preparing link…',
                              am: 'ሊንክ በማዘጋጀት…',
                              ar: 'جارٍ تجهيز الرابط…',
                            })
                          : getLocalized({
                              en: 'Open bot & Start',
                              am: 'ቦት ክፈት እና Start',
                              ar: 'افتح البوت و Start',
                            })}
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-xs font-semibold text-sky-800 underline"
                      onClick={() => void refreshTelegramStatus(tgToken)}
                    >
                      {tgWaiting
                        ? getLocalized({
                            en: 'Waiting for Start… refresh',
                            am: 'Start በመጠባበቅ… አድስ',
                            ar: 'بانتظار Start… حدّث',
                          })
                        : getLocalized({
                            en: 'I pressed Start — refresh',
                            am: 'Start ጫንኩ — አድስ',
                            ar: 'ضغطت Start — حدّث',
                          })}
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {modalChannel === 'email' ? (
              <div
                className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                  user?.email
                    ? 'border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/20 text-neutral-700 dark:text-neutral-200'
                    : 'border-[#A91F24]/25 bg-[#A91F24]/5 text-neutral-700 dark:text-neutral-200'
                }`}
              >
                {user?.email
                  ? getLocalized({
                      en: `✓ Signed in as ${user.email}. You can send your question by email now.`,
                      am: `✓ እንደ ${user.email} ገብተዋል። ጥያቄዎን በኢሜይል አሁን መላክ ይችላሉ።`,
                      ar: `✓ مسجّل كـ ${user.email}. يمكنك إرسال سؤالك بالبريد الآن.`,
                    })
                  : getLocalized({
                      en: 'Status: Google sign-in required. Tap Continue with Google → after auth you return here → then send. (Already signed in on the site? Switch channel or refresh — you can send.)',
                      am: 'ሁኔታ፦ በGoogle መግባት ያስፈልጋል። «በGoogle ይቀጥሉ» ይጫኑ → ከገቡ በኋላ ወደዚህ ይመለሳሉ → ከዚያ ይላኩ። (አስቀድመው ገብተዋል? አሁን መላክ ይችላሉ።)',
                      ar: 'الحالة: يلزم تسجيل Google. اضغط تابع مع Google ← بعد الدخول تعود هنا ← ثم أرسل. (مسجّل مسبقاً؟ يمكنك الإرسال الآن.)',
                    })}
              </div>
            ) : (
              <div
                className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                  tgConnected
                    ? 'border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/20 text-neutral-700 dark:text-neutral-200'
                    : 'border-sky-500/25 bg-sky-50/80 dark:bg-sky-950/20 text-neutral-700 dark:text-neutral-200'
                }`}
              >
                {tgConnected
                  ? getLocalized({
                      en: '✓ Bot connected. Confirm and send your question on Telegram.',
                      am: '✓ ቦቱ ተገናኝቷል። አረጋግጠው ጥያቄዎን በቴሌግራም ይላኩ።',
                      ar: '✓ البوت متصل. أكّد وأرسل سؤالك عبر تيليجرام.',
                    })
                  : getLocalized({
                      en: 'Status: Open bot & Start → return here → send.',
                      am: 'ሁኔታ፦ ቦት ክፈት እና Start → ወደዚህ ተመለስ → ላክ።',
                      ar: 'الحالة: افتح البوت و Start ← عد هنا ← أرسل.',
                    })}
              </div>
            )}

            {error ? <p className="text-sm text-red-600 whitespace-pre-wrap">{error}</p> : null}

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl border text-sm font-semibold"
                onClick={() => {
                  setShowDeliveryModal(false)
                  setError(null)
                  setTgWaiting(false)
                  // Keep tgConnected / chat link — do not force Start again.
                }}
                disabled={submitting}
              >
                {getLocalized({ en: 'Back', am: 'ተመለስ', ar: 'رجوع' })}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submitQuestion(modalChannel)}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50"
              >
                {submitting
                  ? getLocalized({ en: 'Sending…', am: 'በመላክ…', ar: 'جاري الإرسال…' })
                  : modalChannel === 'telegram'
                    ? getLocalized({
                        en: tgConnected ? 'Confirm & send on Telegram' : 'Send after Start',
                        am: tgConnected ? 'አረጋግጥና በቴሌግራም ላክ' : 'ከ Start በኋላ ላክ',
                        ar: tgConnected ? 'أكّد وأرسل عبر تيليجرام' : 'أرسل بعد Start',
                      })
                    : !user?.email
                      ? getLocalized({
                          en: 'Continue with Google',
                          am: 'በGoogle ይቀጥሉ',
                          ar: 'تابع مع Google',
                        })
                      : getLocalized({
                          en: 'Confirm & send by email',
                          am: 'አረጋግጥና በኢሜይል ላክ',
                          ar: 'أكّد وأرسل بالبريد',
                        })}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
