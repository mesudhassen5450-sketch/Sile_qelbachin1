/**
 * Load published kitabs for the official website.
 *
 * Rule: Admin CMS is the source of truth.
 * - If a slug exists in the public CMS API, use that row as-is (no static fallback for that slug).
 * - Static JSON is only used for slugs that Admin has not published yet, or if CMS is unreachable.
 */
import { kitabsData, type Kitab } from '@/data/channelData'
import { fetchPublishedKitabs, isCmsApiEnabled } from '@/lib/cmsClient'

const CANONICAL_ORDER = [
  'intebih-ante-murakeb',
  'adewae-kitab',
  'fatihu-awliya',
  'alwasail-almufida',
  'teshilu-alimu-sheria',
  'yekelb-medreq',
  'betewbet-mengede-lay',
  'betewbet-menged'
]

type CmsKitab = {
  slug: string
  title?: { am?: string | null; ar?: string | null; en?: string | null }
  author?: { am?: string | null; ar?: string | null; en?: string | null }
  category?: { am?: string | null; ar?: string | null; en?: string | null }
  description?: { am?: string | null; ar?: string | null; en?: string | null }
  coverImage?: string | null
  coverBg?: string | null
  pdfUrl?: string | null
  dersCount?: number
  dersList?: Array<{
    id: string
    title?: { am?: string | null; ar?: string | null; en?: string | null }
    speaker?: { am?: string | null; ar?: string | null; en?: string | null }
    duration?: string
    audioUrl?: string
    kitabId?: string
  }>
  legacy_source?: string | null
  created_at?: string | null
  updated_at?: string | null
}

function loc(v?: { am?: string | null; ar?: string | null; en?: string | null } | null) {
  return {
    am: v?.am || '',
    ar: v?.ar || '',
    en: v?.en || ''
  }
}

function mapCmsKitab(row: CmsKitab): Kitab & { _created?: string; _legacy?: string | null } {
  const dersList = (row.dersList || []).map(d => ({
    id: d.id,
    title: loc(d.title),
    speaker: loc(d.speaker),
    duration: d.duration || '',
    audioUrl: d.audioUrl || '',
    kitabId: d.kitabId || row.slug,
    kitabTitle: loc(row.title)
  }))

  return {
    slug: row.slug,
    title: loc(row.title),
    author: loc(row.author),
    category: loc(row.category),
    // Keep empty string vs undefined: empty means Admin cleared / no cover — do NOT restore static
    coverImage: row.coverImage || undefined,
    coverBg: row.coverBg || undefined,
    pdfUrl: row.pdfUrl || undefined,
    dersCount: row.dersCount ?? dersList.length,
    description: loc(row.description),
    dersList,
    _created: row.created_at || row.updated_at || '',
    _legacy: row.legacy_source || 'cms'
  }
}

function sortForSite(rows: Array<Kitab & { _created?: string; _legacy?: string | null }>): Kitab[] {
  const rank = new Map(CANONICAL_ORDER.map((s, i) => [s, i]))
  return [...rows]
    .sort((a, b) => {
      const ra = rank.get(a.slug)
      const rb = rank.get(b.slug)
      if (ra !== undefined && rb !== undefined) return ra - rb
      if (ra !== undefined) return -1
      if (rb !== undefined) return 1
      return Date.parse(b._created || '') - Date.parse(a._created || '')
    })
    .map(({ _created, _legacy, ...k }) => k)
}

export async function loadKitabsForWebsite(): Promise<{
  kitabs: Kitab[]
  source: 'cms' | 'static' | 'cms+static'
}> {
  if (!isCmsApiEnabled()) {
    return { kitabs: kitabsData, source: 'static' }
  }

  const remote = await fetchPublishedKitabs<CmsKitab>()
  if (!remote || !Array.isArray(remote) || remote.length === 0) {
    return { kitabs: kitabsData, source: 'static' }
  }

  const cmsBySlug = new Map(remote.map(r => [r.slug, mapCmsKitab(r)]))
  const merged: Array<Kitab & { _created?: string; _legacy?: string | null }> = []

  // 1) Every CMS published kitab wins completely (new text/cover/pdf/ders — no static merge)
  for (const row of cmsBySlug.values()) {
    merged.push(row)
  }

  // 2) Static only for slugs Admin has never published
  for (const k of kitabsData) {
    if (!cmsBySlug.has(k.slug)) {
      merged.push({ ...k, _created: '', _legacy: 'static' })
    }
  }

  return {
    kitabs: sortForSite(merged),
    source: cmsBySlug.size ? 'cms' : 'static'
  }
}

export async function loadKitabBySlug(slug: string): Promise<Kitab | null> {
  const { kitabs } = await loadKitabsForWebsite()
  return kitabs.find(k => k.slug === slug) || null
}
