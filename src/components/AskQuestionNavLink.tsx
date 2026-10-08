'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { ASK_QUESTION } from '@/config/siteNav'
import { SiteIcon } from '@/components/icons/SiteIcons'

type Props = {
  className?: string
  onClick?: () => void
  trailing?: ReactNode
}

/**
 * Ask Ustaz CTA — always opens /ask-question (no login gate).
 * Google is requested only if the visitor chooses Email delivery.
 */
export default function AskQuestionNavLink({ className, onClick, trailing }: Props) {
  const { getLocalized } = useLanguage()

  return (
    <Link href={ASK_QUESTION.href} onClick={onClick} className={className}>
      <SiteIcon name={ASK_QUESTION.icon} size={16} />
      <span>{getLocalized(ASK_QUESTION.label)}</span>
      {trailing}
    </Link>
  )
}
