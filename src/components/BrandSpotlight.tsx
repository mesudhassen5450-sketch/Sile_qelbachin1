'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { siteMetadata } from '@/data/channelData'

/**
 * Maroon→black brand panel (auth / featured sections) — matches the
 * “Ask with your real identity” visual language.
 */
export default function BrandSpotlight({
  eyebrow,
  title,
  subtitle,
  children,
  className = '',
  compact = false,
}: {
  eyebrow?: string
  title?: string
  subtitle?: string
  children?: ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] border border-[#e3e2e0] shadow-[0_2px_8px_rgba(70,50,35,0.05)] dark:hidden ${className}`}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 15% 10%, rgba(185,28,28,0.65), transparent 50%), radial-gradient(ellipse at 90% 90%, rgba(69,10,10,0.8), transparent 45%), linear-gradient(145deg, #4a0a0a 0%, #1a0505 42%, #050505 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.1]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
        }}
      />
      <div className={`relative z-10 ${compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8 lg:p-10'} space-y-4`}>
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/25 bg-white/10 flex-shrink-0">
            <Image src="/logo.jpg" alt="" fill sizes="36px" className="object-cover" />
          </div>
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[11px] font-bold uppercase tracking-wider text-red-300/90">{eyebrow}</p>
            ) : null}
            <p className="text-sm font-bold text-white truncate">{siteMetadata.channelName}</p>
          </div>
        </div>
        {title ? (
          <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight tracking-tight">{title}</h3>
        ) : null}
        {subtitle ? <p className="text-sm text-white/65 leading-relaxed max-w-xl">{subtitle}</p> : null}
        {children}
        <p className="text-2xs text-white/35 font-mono pt-1">{siteMetadata.telegramHandle}</p>
      </div>
    </div>
  )
}
