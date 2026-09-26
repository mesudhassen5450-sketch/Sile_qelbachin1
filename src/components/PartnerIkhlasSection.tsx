'use client'

import { useCallback, useEffect, useId, useState } from 'react'
import { MapPin, Phone, Send, X } from 'lucide-react'

const PARTNER_NAME = 'ኢኽላስ የቁርኣን እና የተርቢያ ማዕከል'
const ALERT_BANNER = '👉 መስከረም 25 መዝገባ ይዘጋል!!'
const MAPS_URL = 'https://maps.app.goo.gl/29NH6VZjdLRNRVyE9?g_st=atm'

/**
 * Brother/partner organization — homepage section above the footer.
 * Circular badge opens a full Amharic announcement modal.
 */
export default function PartnerIkhlasSection() {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const descId = useId()

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, close])

  return (
    <>
      <section
        aria-label={PARTNER_NAME}
        className="relative w-screen left-1/2 -translate-x-1/2 mt-8 sm:mt-12 border-t border-neutral-800 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <p className="text-center text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-red-400/90 mb-6">
            Partner · ወንድም ድርጅት
          </p>

          <div className="flex flex-col items-center gap-5">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 rounded-full"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={open ? titleId : undefined}
            >
              <span className="absolute inset-0 rounded-full bg-red-600/20 blur-xl scale-110 opacity-0 group-hover:opacity-100 transition duration-300" />
              <span className="relative flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-full border-2 border-red-500/70 bg-gradient-to-br from-neutral-900 via-neutral-950 to-red-950/40 shadow-[0_0_0_6px_rgba(197,40,40,0.12)] transition duration-300 group-hover:border-red-400 group-hover:scale-[1.03]">
                <span className="absolute inset-2 rounded-full border border-red-800/40" />
                <span className="relative z-[1] px-4 text-center">
                  <span className="block text-2xl sm:text-3xl font-extrabold text-white tracking-wide leading-none mb-1">
                    ኢኽላስ
                  </span>
                  <span className="block text-[10px] sm:text-[11px] font-semibold text-red-300/90 leading-snug">
                    የቁርኣን እና የተርቢያ ማዕከል
                  </span>
                </span>
              </span>
            </button>

            <h2 className="text-center text-base sm:text-lg font-bold text-white max-w-md leading-snug">
              {PARTNER_NAME}
            </h2>

            <div
              role="status"
              className="w-full max-w-lg rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-center shadow-lg"
            >
              <p className="text-sm sm:text-base font-extrabold text-amber-200 tracking-wide">
                {ALERT_BANNER}
              </p>
              <p className="mt-1 text-[11px] text-amber-200/70">
                ለዝርዝር መረጃ ክብ አርማውን ይጫኑ
              </p>
            </div>
          </div>
        </div>
      </section>

      {open ? (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close"
            onClick={close}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            dir="rtl"
            lang="am"
            className="relative z-[81] w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-neutral-700 bg-neutral-950 text-neutral-100 shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur">
              <h3 id={titleId} className="text-sm sm:text-base font-bold text-white leading-snug pe-2">
                {PARTNER_NAME}
              </h3>
              <button
                type="button"
                onClick={close}
                className="shrink-0 rounded-full p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div id={descId} className="space-y-5 px-4 sm:px-6 py-5 text-right">
              <div className="rounded-xl border border-amber-500/35 bg-amber-950/35 px-3 py-2.5 text-center">
                <p className="text-sm font-extrabold text-amber-200">{ALERT_BANNER}</p>
              </div>

              <p className="text-base sm:text-lg font-extrabold text-red-300 leading-relaxed">
                📢 አስደሳች ዜና ለጠቅላላው የሙስሊም ማህበረሰብ!
              </p>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-neutral-500">ፕሮግራም</p>
                <p className="text-sm sm:text-[15px] text-neutral-200 leading-relaxed">
                  10 ወር የቆይታ ጊዜ ያለው የበጋ ልዩ ኮርስ በወንድም አብዱረዛቅ አል-ባጂ አስተምህሮ።
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-neutral-500">ትምህርቶች</p>
                <p className="text-sm sm:text-[15px] text-neutral-200 leading-relaxed">
                  ዓቂዳህ፣ ፊቅህ አሻፊኢይ፣ ኡሱሉል ፊቅህ፣ ቀዋዒዱል ፊቅሂ፣ አዳብ እና ሱሉክ።
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                <p className="text-xs font-semibold text-neutral-500 flex items-center justify-end gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-red-400" />
                  ቦታ
                </p>
                <p className="text-sm text-neutral-200 leading-relaxed">
                  ቦሌ ሚካኤል — ከእግረኛ ድልድዩ ወደ ውስጥ 50 ሜትር ገባ ብሎ
                </p>
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-red-400 hover:text-red-300 transition"
                >
                  <MapPin className="h-4 w-4" />
                  በካርታ ይመልከቱ
                </a>
              </div>

              <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                <p className="text-xs font-semibold text-neutral-500">አገናኝ</p>
                <a
                  href="tel:0911119260"
                  className="flex items-center justify-end gap-2 text-sm text-neutral-200 hover:text-white"
                >
                  0911119260
                  <Phone className="h-4 w-4 text-red-400" />
                </a>
                <a
                  href="tel:0919829850"
                  className="flex items-center justify-end gap-2 text-sm text-neutral-200 hover:text-white"
                >
                  0919829850
                  <Phone className="h-4 w-4 text-red-400" />
                </a>
                <a
                  href="https://t.me/bajjiz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-end gap-2 text-sm font-semibold text-sky-300 hover:text-sky-200"
                >
                  @bajjiz
                  <Send className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="sticky bottom-0 border-t border-neutral-800 bg-neutral-950/95 px-4 py-3 backdrop-blur">
              <button
                type="button"
                onClick={close}
                className="w-full rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold py-3 text-sm transition"
              >
                ዝጋ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
