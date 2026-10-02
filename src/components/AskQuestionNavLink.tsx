'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { ASK_QUESTION } from '@/config/siteNav'

type Props = {
  className?: string
  onClick?: () => void
  trailing?: ReactNode
}

/**
 * Ask Ustaz CTA:
 * - While auth is loading, still go to /ask-question (page waits / shows Loading).
 * - Never bounce a signed-in user through /login just because session is still hydrating.
 */
export default function AskQuestionNavLink({ className, onClick, trailing }: Props) {
  const { user, loading } = useAuth()
  const { getLocalized } = useLanguage()
  const href =
    loading || user ? ASK_QUESTION.href : '/login?next=/ask-question'

  return (
    <Link href={href} onClick={onClick} className={className}>
      <span>{ASK_QUESTION.emoji}</span>
      <span>{getLocalized(ASK_QUESTION.label)}</span>
      {trailing}
    </Link>
  )
}
