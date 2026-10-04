/**
 * Published CMS client for the public website.
 * Prefer same-origin `/api/cms` (Netlify → Admin) so home works on every computer,
 * even when Admin on Render is cold-starting. Falls back to Admin public URL.
 *
 * Override with NEXT_PUBLIC_CMS_API_BASE in Netlify / .env.local if needed.
 */
const DEFAULT_ADMIN_CMS = 'https://admin.sileqelbachin1.com/api/public/v1'
const ENV_CMS = (process.env.NEXT_PUBLIC_CMS_API_BASE || '').replace(/\/+$/, '')

export function getCmsApiBase(): string {
  if (typeof window !== 'undefined') return '/api/cms'
  return ENV_CMS || DEFAULT_ADMIN_CMS
}

export function isCmsApiEnabled(): boolean {
  return true
}

function cmsBasesToTry(): string[] {
  const bases: string[] = []
  // Browser: same-origin proxy first (reliable for all visitors)
  if (typeof window !== 'undefined') {
    bases.push('/api/cms')
  }
  if (ENV_CMS) bases.push(ENV_CMS)
  bases.push(DEFAULT_ADMIN_CMS)
  // Local rewrite target used in .env.local
  if (ENV_CMS && ENV_CMS.includes('/api/cms') && typeof window === 'undefined') {
    bases.push(DEFAULT_ADMIN_CMS)
  }
  return [...new Set(bases.filter(Boolean))]
}

async function getJson<T>(resource: string): Promise<T | null> {
  const bases = cmsBasesToTry()
  for (const base of bases) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const url = `${base.replace(/\/+$/, '')}/${resource}?t=${Date.now()}`
        const res = await fetch(url, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(typeof window !== 'undefined' ? 18000 : 22000),
        })
        if (!res.ok) break
        const body = await res.json()
        if (!body?.ok) break
        return body.data as T
      } catch {
        if (attempt === 0) {
          await new Promise(r => setTimeout(r, 600))
          continue
        }
      }
    }
  }
  return null
}

export type CmsLoc = { am?: string | null; ar?: string | null; en?: string | null }

export type CmsKitab = {
  slug: string
  title: CmsLoc
  author: CmsLoc
  description?: CmsLoc
  coverImage?: string | null
  pdfUrl?: string | null
  dersCount?: number
  dersList?: Array<{
    id: string
    title: CmsLoc
    speaker: CmsLoc
    duration?: string
    audioUrl?: string
  }>
  featured?: boolean
  priority?: number
  created_at?: string
  updated_at?: string
}

export type CmsAudio = {
  id: string
  title: CmsLoc
  description?: CmsLoc
  fileUrl?: string
  coverUrl?: string | null
  category?: string
  isMuhadara?: boolean
  featured?: boolean
  priority?: number
}

export type CmsVideo = {
  id: string
  title: CmsLoc
  description?: CmsLoc
  fileUrl?: string
  thumbnailUrl?: string | null
  coverUrl?: string | null
  category?: string
}

export type CmsPdf = {
  id: string
  title: CmsLoc
  fileUrl?: string
  coverUrl?: string | null
}

export type CmsReminder = {
  id: string
  title: CmsLoc
  description: CmsLoc
  featured?: boolean
  priority?: number
  updatedAt?: string
}

export type CmsOneMinute = {
  id: string
  kind: 'text' | 'audio' | 'video' | 'image'
  title: CmsLoc
  body: CmsLoc
  mediaUrl?: string | null
  coverUrl?: string | null
  soundUrl?: string | null
  featured?: boolean
  priority?: number
  sortOrder?: number | null
  durationSeconds?: number | null
  updatedAt?: string
}

export type CmsQuranRecitation = {
  id: string
  title: CmsLoc
  reciter?: CmsLoc
  description?: CmsLoc
  audioUrl?: string | null
  coverUrl?: string | null
  tafsir?: {
    text?: CmsLoc
    audioUrl?: string | null
    videoUrl?: string | null
  }
  duration?: string | null
  series?: string | null
  episode?: number | null
  featured?: boolean
  publishedAt?: string | null
}

export async function fetchPublishedKitabs<T = CmsKitab>(): Promise<T[] | null> {
  return getJson<T[]>('kitabs')
}

export async function fetchPublishedAudio<T = CmsAudio>(): Promise<T[] | null> {
  return getJson<T[]>('audio')
}

export async function fetchPublishedVideos<T = CmsVideo>(): Promise<T[] | null> {
  return getJson<T[]>('video')
}

export async function fetchPublishedPdfs<T = CmsPdf>(): Promise<T[] | null> {
  return getJson<T[]>('pdfs')
}

export async function fetchPublishedReminders<T = CmsReminder>(): Promise<T[] | null> {
  return getJson<T[]>('reminders')
}

export async function fetchPublishedOneMinute<T = CmsOneMinute>(): Promise<T[] | null> {
  return getJson<T[]>('one-minute')
}

export async function fetchPublishedQuranRecitations<T = CmsQuranRecitation>(): Promise<T[] | null> {
  return getJson<T[]>('quran-recitations')
}

export async function fetchPublishedArticles<T = unknown>(): Promise<T[] | null> {
  return getJson<T[]>('articles')
}

export async function fetchPublishedMarriage<T = unknown>(): Promise<T[] | null> {
  return getJson<T[]>('marriage')
}

export async function fetchPublishedQuestions<T = unknown>(): Promise<T[] | null> {
  return getJson<T[]>('questions')
}

/** Browser-side parallel home feed (Admin → API → website). */
export async function fetchHomeCmsBundle() {
  const [kitabs, audio, video, pdfs, reminders, oneMinute, articles, marriage, questions] =
    await Promise.all([
      fetchPublishedKitabs(),
      fetchPublishedAudio(),
      fetchPublishedVideos(),
      fetchPublishedPdfs(),
      fetchPublishedReminders(),
      fetchPublishedOneMinute(),
      fetchPublishedArticles(),
      fetchPublishedMarriage(),
      fetchPublishedQuestions(),
    ])
  return {
    kitabs: kitabs || [],
    audio: audio || [],
    video: video || [],
    pdfs: pdfs || [],
    reminders: reminders || [],
    oneMinute: oneMinute || [],
    articles: articles || [],
    marriage: marriage || [],
    questions: questions || [],
  }
}
