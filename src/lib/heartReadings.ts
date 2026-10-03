/**
 * Shared heart readings for home / articles / Da’wah+Library reminders.
 *
 * - Articles (Youth → Articles) are the main source (enter once).
 * - Reminders (cms_reminders via Admin Reminders) merge in when present —
 *   they survive refresh from Supabase/R2 (migration 006).
 * - Home strip: Featured first, then priority — top 4 titles.
 */
import {
  fetchPublishedArticles,
  fetchPublishedReminders,
  type CmsLoc,
  type CmsReminder,
} from '@/lib/cmsClient'

export type HeartReading = {
  id: string
  title: CmsLoc
  body: CmsLoc
  featured?: boolean
  priority?: number
  source: 'article' | 'reminder'
}

type YouthArticle = {
  id: string
  title?: CmsLoc
  excerpt?: CmsLoc
  body?: CmsLoc
  featured?: boolean
  priority?: number
}

function fromArticle(a: YouthArticle): HeartReading | null {
  const title = a.title || {}
  if (!(title.en || title.am || title.ar)) return null
  const body = a.body || a.excerpt || {}
  return {
    id: a.id,
    title,
    body,
    featured: Boolean(a.featured),
    priority: typeof a.priority === 'number' ? a.priority : undefined,
    source: 'article',
  }
}

function fromReminder(r: CmsReminder): HeartReading | null {
  const title = r.title || {}
  if (!(title.en || title.am || title.ar)) return null
  return {
    id: r.id,
    title,
    body: r.description || {},
    featured: Boolean(r.featured),
    priority: typeof r.priority === 'number' ? r.priority : undefined,
    source: 'reminder',
  }
}

/** Merge articles + durable reminders (articles first; reminders fill / add Featured). */
export async function fetchHeartReadings(): Promise<HeartReading[]> {
  const [articles, reminders] = await Promise.all([
    fetchPublishedArticles<YouthArticle>(),
    fetchPublishedReminders(),
  ])

  const fromArts = (articles || []).map(fromArticle).filter((x): x is HeartReading => Boolean(x))
  const fromRems = (reminders || []).map(fromReminder).filter((x): x is HeartReading => Boolean(x))

  if (!fromArts.length && !fromRems.length) return []

  // Prefer articles when both exist; keep reminder-only ids; Featured reminders still count for home.
  const seen = new Set(fromArts.map(a => a.id))
  const merged = [...fromArts]
  for (const r of fromRems) {
    if (!seen.has(r.id)) {
      merged.push(r)
      seen.add(r.id)
    }
  }
  return merged
}

/** Home: Featured first, then priority — always up to `limit` titles. */
export function featuredHeartFirst(rows: HeartReading[], limit: number): HeartReading[] {
  const scored = [...rows].sort((a, b) => {
    const fa = a.featured ? 1 : 0
    const fb = b.featured ? 1 : 0
    if (fa !== fb) return fb - fa
    const pa = typeof a.priority === 'number' && a.priority >= 1 ? a.priority : 9999
    const pb = typeof b.priority === 'number' && b.priority >= 1 ? b.priority : 9999
    if (pa !== pb) return pa - pb
    // Prefer articles slightly when tied (same priority / featured)
    if (a.source !== b.source) return a.source === 'article' ? -1 : 1
    return 0
  })
  const featured = scored.filter(r => r.featured)
  if (featured.length >= limit) return featured.slice(0, limit)
  return scored.slice(0, limit)
}
