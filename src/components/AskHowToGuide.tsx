'use client'

import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '@/context/LanguageContext'

const BOT = 'sileqelbachin1_Bot'
const ASK_URL = 'https://sileqelbachin1.com/ask-question'

/**
 * Red link under the Ask title → full-screen reader overlay (portal to body).
 * Copy mirrors docs/ask/HOW-TO-ASK-GUIDE.md (EN · AM · AR).
 * Close: Cancel / Close / Esc / backdrop.
 */
export default function AskHowToGuide() {
  const { getLocalized } = useLanguage()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const titleId = useId()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const reader =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={() => setOpen(false)}
          >
            <div
              className="flex w-full max-w-lg sm:max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex-col rounded-t-2xl sm:rounded-2xl bg-[#faf9f7] dark:bg-neutral-950 shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <header className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 px-4 py-3.5 sm:px-6">
                <h2
                  id={titleId}
                  className="min-w-0 text-sm sm:text-base font-bold text-neutral-900 dark:text-white leading-snug"
                >
                  {getLocalized({
                    en: 'How to ask a question — full guide',
                    am: 'ጥያቄ እንዴት እንደሚጠየቅ — ሙሉ መመሪያ',
                    ar: 'كيف تطرح سؤالاً — الدليل الكامل',
                  })}
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 transition"
                >
                  {getLocalized({
                    en: 'Cancel',
                    am: 'ሰርዝ',
                    ar: 'إلغاء',
                  })}
                </button>
              </header>

              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6 space-y-6 text-neutral-800 dark:text-neutral-200">
                {/* Before you start */}
                <section className="space-y-2.5">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {getLocalized({
                      en: 'Before you start',
                      am: 'ከመጀመርዎ በፊት',
                      ar: 'قبل البدء',
                    })}
                  </h3>
                  <ol className="list-decimal list-outside ms-4 space-y-2 text-sm leading-relaxed">
                    <li>
                      {getLocalized({
                        en: 'Go to Ask a Question.',
                        am: 'ወደ «ጥያቄዎን ያቅርቡ» ገጽ ይሂዱ።',
                        ar: 'انتقل إلى صفحة اطرح سؤالك.',
                      })}
                    </li>
                    <li>
                      {getLocalized({
                        en: 'Write your question clearly (provide enough context in a few sentences).',
                        am: 'ጥያቄዎን በግልጽና በዝርዝር ይጻፉ።',
                        ar: 'اكتب سؤالك بوضوح وتفصيل.',
                      })}
                    </li>
                    <li>
                      {getLocalized({
                        en: 'Choose a relevant topic category (helps us direct your query accurately).',
                        am: 'የጥያቄዎን ምድብ/ዓይነት ይምረጡ (ጥያቄዎ ተገቢውን ምላሽ እንዲያገኝ ይረዳል)።',
                        ar: 'اختر القسم المناسب لسؤالك.',
                      })}
                    </li>
                    <li>
                      {getLocalized({
                        en: 'Tap Send Question.',
                        am: '«ጥያቄውን ላክ» የሚለውን ይጫኑ።',
                        ar: 'اضغط على إرسال السؤال.',
                      })}
                    </li>
                    <li>
                      {getLocalized({
                        en: 'Select your preferred reply channel: Telegram or Email.',
                        am: 'ምላሽ የሚቀበሉበትን መንገድ ይምረጡ፦ ቴሌግራም ወይም ኢሜይል።',
                        ar: 'اختر طريقة تلقي الإجابة: تيليجرام أو البريد الإلكتروني.',
                      })}
                    </li>
                  </ol>
                </section>

                {/* Path A — Telegram */}
                <section className="space-y-2.5 rounded-xl border border-sky-500/25 bg-sky-50/60 dark:bg-sky-950/25 p-4">
                  <h3 className="text-sm font-bold text-sky-900 dark:text-sky-200">
                    {getLocalized({
                      en: 'Path A — Telegram',
                      am: 'መንገድ ሀ — ቴሌግራም',
                      ar: 'المسار الأول — تيليجرام',
                    })}
                  </h3>
                  <ol className="list-decimal list-outside ms-4 space-y-2 text-sm leading-relaxed">
                    <li>
                      {getLocalized({
                        en: 'Select Telegram.',
                        am: 'ቴሌግራም የሚለውን ይምረጡ።',
                        ar: 'اختر تيليجرام.',
                      })}
                    </li>
                    <li>
                      {getLocalized({
                        en: 'Tap Open Bot & Start.',
                        am: '«ቦት ክፈት እና Start» የሚለውን ይጫኑ።',
                        ar: 'اضغط على فتح البوت و Start.',
                      })}
                    </li>
                    <li>
                      {getLocalized({
                        en: `In Telegram, open @${BOT} and press Start.`,
                        am: `በቴሌግራም @${BOT} የሚለውን በመክፈት Start ይበሉ።`,
                        ar: `في تيليجرام، افتح @${BOT} واضغط Start.`,
                      })}
                    </li>
                    <li>
                      {getLocalized({
                        en: 'Return to the website Ask page.',
                        am: 'ወደ ድረ-ገጻችን (ጥያቄዎን ያቅርቡ) ይመለሱ።',
                        ar: 'عد إلى صفحة اطرح سؤالك على الموقع.',
                      })}
                    </li>
                    <li>
                      {getLocalized({
                        en: 'Once Telegram Connected appears, tap Confirm & Send via Telegram.',
                        am: '«ቴሌግራም ተገናኝቷል» የሚለው ሲበራ «አረጋግጥና በቴሌግራም ላክ» የሚለውን ይጫኑ።',
                        ar: 'عند ظهور تم الربط بتيليجرام، اضغط تأكيد والإرسال عبر تيليجرام.',
                      })}
                    </li>
                    <li>
                      {getLocalized({
                        en: 'We will send our reply directly to your private Telegram chat.',
                        am: 'ምላሻችንን ቀጥታ በምስጢር በቴሌግራም እንልክልዎታለን።',
                        ar: 'سنرسل إجابتنا إليك مباشرة وبكل خصوصية عبر تيليجرام.',
                      })}
                    </li>
                  </ol>
                  <div className="pt-2.5 border-t border-sky-500/20 space-y-1.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                    <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {getLocalized({
                        en: 'Important notes',
                        am: 'ማስታወሻ',
                        ar: 'ملاحظات مهمة',
                      })}
                    </p>
                    <p>
                      {getLocalized({
                        en: 'You only need to Start the bot once; future questions will connect automatically.',
                        am: 'ቦቱን አንድ ጊዜ Start ማድረግ በቂ ነው፤ በሚቀጥለው ጊዜ እራሱ ይገናኛል።',
                        ar: 'تحتاج لتفعيل البوت Start مرة واحدة فقط، وسيبقى متصلاً في المرات القادمة.',
                      })}
                    </p>
                    <p>
                      {getLocalized({
                        en: 'To ensure thorough and attentive replies, we accept one open question at a time until answered.',
                        am: 'ጥንቃቄ የተሞላበት ምላሽ ለመስጠት እንድንችል፤ አንድ ጥያቄ ተመልሶ እስኪጠናቀቅ ድረስ ሌላ አዲስ ጥያቄ አንቀበልም።',
                        ar: 'لضمان تقديم إجابة دقيقة، نستقبل سؤالاً واحداً فقط في كل مرة حتى يتم الرد عليه.',
                      })}
                    </p>
                  </div>
                </section>

                {/* Path B — Email */}
                <section className="space-y-2.5 rounded-xl border border-[#A91F24]/20 bg-[#A91F24]/5 p-4">
                  <h3 className="text-sm font-bold text-[#A91F24]">
                    {getLocalized({
                      en: 'Path B — Email',
                      am: 'መንገድ ለ — ኢሜይል',
                      ar: 'المسار الثاني — البريد الإلكتروني',
                    })}
                  </h3>
                  <ol className="list-decimal list-outside ms-4 space-y-2 text-sm leading-relaxed">
                    <li>
                      {getLocalized({
                        en: 'Select Email.',
                        am: 'ኢሜይል የሚለውን ይምረጡ።',
                        ar: 'اختر البريد الإلكتروني.',
                      })}
                    </li>
                    <li>
                      {getLocalized({
                        en: 'If you are not signed in, tap Continue with Google (your primary Gmail address will be used automatically).',
                        am: 'ቀድመው ካልገቡ «በGoogle ይቀጥሉ» የሚለውን ተጭነው ይግቡ (የGoogle ኢሜይልዎ በራስ-ሰር ይያዛል)።',
                        ar: 'إذا لم تسجل الدخول، اضغط على المتابعة باستخدام Google لتسجيل الدخول.',
                      })}
                    </li>
                    <li>
                      {getLocalized({
                        en: 'Once redirected back to the question page, tap Confirm & Send via Email.',
                        am: 'ወደ ጥያቄው ገጽ ሲመለሱ «አረጋግጥና በኢሜይል ላክ» የሚለውን ይጫኑ።',
                        ar: 'عند العودة إلى الصفحة، اضغط على تأكيد والإرسال عبر البريد الإلكتروني.',
                      })}
                    </li>
                    <li>
                      {getLocalized({
                        en: 'We will send our reply directly to your Gmail inbox.',
                        am: 'ምላሻችንን ቀጥታ በኢሜይልዎ (Gmail) እንልክልዎታለን።',
                        ar: 'سنرسل إجابتنا مباشرة إلى بريدك الإلكتروني (Gmail).',
                      })}
                    </li>
                  </ol>
                  <div className="pt-2.5 border-t border-[#A91F24]/15 space-y-1.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                    <p className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {getLocalized({
                        en: 'Important notes',
                        am: 'ማስታወሻ',
                        ar: 'ملاحظات مهمة',
                      })}
                    </p>
                    <p>
                      {getLocalized({
                        en: 'Your email is retrieved securely from Google — no manual entry required.',
                        am: 'ኢሜይልዎ ከGoogle መለያዎ በራስ-ሰር የሚወሰድ በመሆኑ መጻፍ አያስፈልግዎትም።',
                        ar: 'يتم جلب بريدك الإلكتروني تلقائياً من Google دون الحاجة لكتابته.',
                      })}
                    </p>
                    <p>
                      {getLocalized({
                        en: 'We accept one open question at a time until completed.',
                        am: 'አንድ የላኩት ጥያቄ ተመልሶ እስኪጠናቀቅ ድረስ ተጨማሪ ጥያቄ ማቅረብ አይቻልም።',
                        ar: 'نستقبل سؤالاً واحداً فقط في كل مرة حتى يتم الإجابة عنه.',
                      })}
                    </p>
                  </div>
                </section>

                <p className="text-[11px] text-neutral-500">
                  <a
                    href={ASK_URL}
                    className="text-[#A91F24] underline underline-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    sileqelbachin1.com/ask-question
                  </a>
                </p>
              </div>

              <footer className="shrink-0 border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 sm:px-6 safe-area-pb">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl bg-[#A91F24] py-3 text-sm font-bold text-white hover:bg-red-700 transition"
                >
                  {getLocalized({
                    en: 'Close',
                    am: 'ዝጋ',
                    ar: 'إغلاق',
                  })}
                </button>
              </footer>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex max-w-full items-center gap-1 text-left text-sm font-semibold text-[#A91F24] hover:text-red-700 transition leading-snug"
      >
        <span className="underline underline-offset-4 decoration-2">
          {getLocalized({
            en: 'How to ask a question — full guide',
            am: 'ጥያቄ እንዴት እንደሚጠየቅ — ሙሉ መመሪያ',
            ar: 'كيف تطرح سؤالاً — الدليل الكامل',
          })}
        </span>
        <span className="no-underline text-base leading-none" aria-hidden>
          ↗
        </span>
      </button>
      {reader}
    </>
  )
}
