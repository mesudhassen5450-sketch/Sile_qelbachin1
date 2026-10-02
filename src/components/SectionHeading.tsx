'use client'

import type { ReactNode } from 'react'
import { Heart } from 'lucide-react'

type SectionHeadingProps = {
  /** Small eyebrow — uses heart accent */
  label?: string
  /** Main category title — gold */
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

/** Main category = gold title · secondary label = heart accent */
export default function SectionHeading({
  label,
  title,
  description,
  action,
  icon,
  className = '',
}: SectionHeadingProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0 space-y-1.5">
        {label ? (
          <div className="label-heart">
            <Heart className="w-3.5 h-3.5 fill-current heart-pulse" aria-hidden />
            {icon}
            <span>{label}</span>
          </div>
        ) : null}
        <h2 className="title-gold text-2xl sm:text-3xl leading-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xl leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
