'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy, Facebook, Link2, Send, Share2, X } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

type ShareSheetProps = {
  open: boolean
  onClose: () => void
  title: string
  text?: string
  /** Public page / file link shown in Telegram, WhatsApp, Copy */
  url?: string
  /**
   * Optional direct media URL (e.g. PDF on R2).
   * When set, "Share PDF file" tries Web Share with the actual file on mobile.
   */
  fileUrl?: string
  fileName?: string
}

/** Undo accidental double-encoding so Telegram opens a real R2/site URL. */
function normalizeShareUrl(raw: string): string {
  if (!raw) return raw
  let current = raw.trim()
  for (let i = 0; i < 3; i++) {
    try {
      if (!/%[0-9A-Fa-f]{2}/.test(current)) break
      const next = decodeURIComponent(current)
      if (next === current) break
      // Stop if decoding breaks the URL scheme
      if (i > 0 && !/^https?:\/\//i.test(next) && /^https?:\/\//i.test(raw)) {
        break
      }
      current = next
    } catch {
      break
    }
  }
  try {
    const u = new URL(current)
    // Re-encode each path segment once (handles Arabic/Amharic safely)
    u.pathname = u.pathname
      .split('/')
      .map(seg => {
        if (!seg) return ''
        try {
          return encodeURIComponent(decodeURIComponent(seg))
        } catch {
          return encodeURIComponent(seg)
        }
      })
      .join('/')
    return u.toString()
  } catch {
    return current
  }
}

function shortShareText(title: string, extra?: string): string {
  const t = (extra || title || '').replace(/\s+/g, ' ').trim()
  return t.length > 160 ? `${t.slice(0, 157)}…` : t
}

export default function ShareSheet({
  open,
  onClose,
  title,
  text,
  url,
  fileUrl,
  fileName,
}: ShareSheetProps) {
  const { getLocalized } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [canShareFiles, setCanShareFiles] = useState(false)
  const [sharingFile, setSharingFile] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return normalizeShareUrl(url || '')
    return normalizeShareUrl(url || window.location.href)
  }, [url, open])

  const shareText = shortShareText(title, text)

  useEffect(() => {
    if (typeof window === 'undefined' || !open) return
    setShareError(null)
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
    let filesOk = false
    try {
      if (fileUrl && typeof navigator.canShare === 'function') {
        const probe = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 't.pdf', {
          type: 'application/pdf',
        })
        filesOk = navigator.canShare({ files: [probe] })
      }
    } catch {
      filesOk = false
    }
    setCanShareFiles(filesOk)
  }, [open, fileUrl])

  if (!open) return null

  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedText = encodeURIComponent(shareText)
  const encodedTitle = encodeURIComponent(title)

  const platforms = [
    {
      id: 'telegram',
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      className: 'bg-sky-600 hover:bg-sky-500 text-white',
      icon: Send,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
      className: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      icon: Share2,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      className: 'bg-blue-600 hover:bg-blue-500 text-white',
      icon: Facebook,
    },
    {
      id: 'x',
      label: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      className: 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-600',
      icon: Share2,
    },
  ]

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = `${shareText}\n${shareUrl}`
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }

  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text: shareText, url: shareUrl })
        onClose()
      }
    } catch {
      /* user cancelled */
    }
  }

  const sharePdfFile = async () => {
    if (!fileUrl) return
    setSharingFile(true)
    setShareError(null)
    try {
      // Prefer same-origin download proxy (avoids CORS + works for all R2 PDFs)
      const proxy = `/api/download?${new URLSearchParams({
        url: fileUrl,
        name: fileName || title || 'document.pdf',
      }).toString()}`
      let res = await fetch(proxy)
      if (!res.ok) {
        res = await fetch(fileUrl, { mode: 'cors', credentials: 'omit' })
      }
      if (!res.ok) throw new Error(`fetch ${res.status}`)
      const blob = await res.blob()
      const name = (fileName || title || 'document').replace(/\.[Pp][Dd][Ff]$/, '') + '.pdf'
      const file = new File([blob], name, { type: 'application/pdf' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title,
          text: shareText,
        })
        onClose()
        return
      }
      // Desktop fallback: open Telegram with the public link
      window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setShareError(
        getLocalized({
          en: 'Could not share the file. Try Telegram or Copy link.',
          am: 'ፋይሉን ማጋራት አልተቻለም። ቴሌግራም ወይም ሊንክ ቅዳ ይሞክሩ።',
          ar: 'تعذر مشاركة الملف. جرّب تيليجرام أو نسخ الرابط.',
        })
      )
    } finally {
      setSharingFile(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close share sheet"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#D4AF37]/50 bg-white dark:bg-neutral-950 shadow-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              {getLocalized({ en: 'Share', am: 'አጋራ', ar: 'شارك' })}
            </p>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-2 mt-1">
              {title}
            </h3>
            <p className="mt-1 text-[11px] text-neutral-500 break-all line-clamp-2">{shareUrl}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-interactive p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {fileUrl ? (
          <button
            type="button"
            disabled={sharingFile}
            onClick={() => void sharePdfFile()}
            className="btn-interactive w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white"
          >
            <Share2 className="w-4 h-4" />
            {sharingFile
              ? getLocalized({ en: 'Preparing…', am: 'በዝግጅት ላይ…', ar: 'جارٍ التحضير…' })
              : getLocalized({
                  en: canShareFiles ? 'Share PDF file' : 'Share via Telegram',
                  am: canShareFiles ? 'PDF ፋይል አጋራ' : 'በቴሌግራም አጋራ',
                  ar: canShareFiles ? 'مشاركة ملف PDF' : 'مشاركة عبر تيليجرام',
                })}
          </button>
        ) : null}

        {shareError ? <p className="text-xs text-red-500">{shareError}</p> : null}

        <div className="grid grid-cols-2 gap-2.5">
          {platforms.map(p => {
            const Icon = p.icon
            return (
              <a
                key={p.id}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={`btn-interactive inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold ${p.className}`}
              >
                <Icon className="w-4 h-4" />
                {p.label}
              </a>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => void copyLink()}
          className="btn-interactive w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold border border-[#D4AF37]/60 bg-[#D4AF37]/10 text-neutral-900 dark:text-white hover:bg-[#D4AF37]/20"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          {copied
            ? getLocalized({ en: 'Link copied', am: 'ሊንክ ተቀድቷል', ar: 'تم نسخ الرابط' })
            : getLocalized({ en: 'Copy link', am: 'ሊንክ ቅዳ', ar: 'نسخ الرابط' })}
        </button>

        {canNativeShare ? (
          <button
            type="button"
            onClick={() => void nativeShare()}
            className="btn-interactive w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 text-white"
          >
            <Link2 className="w-4 h-4" />
            {getLocalized({
              en: 'More apps…',
              am: 'ተጨማሪ መተግበሪያዎች…',
              ar: 'المزيد من التطبيقات…',
            })}
          </button>
        ) : null}
      </div>
    </div>
  )
}
