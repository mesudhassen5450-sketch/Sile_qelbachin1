'use client'

import { useEffect, useState } from 'react'
import { Check, Copy, Facebook, Link2, Send, Share2, X } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

type ShareSheetProps = {
  open: boolean
  onClose: () => void
  title: string
  text?: string
  url?: string
}

export default function ShareSheet({ open, onClose, title, text, url }: ShareSheetProps) {
  const { getLocalized } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [shareUrl, setShareUrl] = useState(url || '')

  useEffect(() => {
    if (typeof window === 'undefined') return
    setShareUrl(url || window.location.href)
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [url, open])

  const shareText = text || title

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
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
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
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = shareUrl
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
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              {getLocalized({ en: 'Share', am: 'አጋራ', ar: 'شارك' })}
            </p>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white line-clamp-2 mt-1">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-interactive p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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
            className="btn-interactive w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold bg-red-600 hover:bg-red-500 text-white"
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
