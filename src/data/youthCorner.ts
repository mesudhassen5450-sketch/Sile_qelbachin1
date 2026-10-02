/** Youth & Heart Corner — CMS-backed on public pages; no mock Q&A / marriage / articles. */

export type Localized = { en: string; am: string; ar: string }

export type QaItem = {
  id: string
  category: Localized
  question: Localized
  answer: Localized
}

export type MarriageTopic = {
  id: string
  title: Localized
  summary: Localized
  href?: string
}

export type ArticleItem = {
  id: string
  title: Localized
  excerpt: Localized
  body: Localized
  tag: Localized
}

/** @deprecated Empty — public Q&A uses Admin CMS only. */
export const qaItems: QaItem[] = []

/** @deprecated Empty — public Marriage uses Admin CMS only. */
export const marriageTopics: MarriageTopic[] = []

/** @deprecated Empty — public Articles use Admin CMS only. */
export const articleItems: ArticleItem[] = []
