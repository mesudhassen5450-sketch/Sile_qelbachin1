/**
 * Load published kitabs for the official website.
 * Prefer Admin public CMS API. Fall back to static JSON.
 * Order: new Admin kitabs first, then Intebih → Adewae → …
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

function asLoc(v: Kitab['title'] | string | undefined | null) {
  if (!v) return { am: '', ar: '', en: '' }
  if (typeof v === 'string') return { am: v, ar: '', en: v }
  return {
    am: v.am || '',
    ar: v.ar || '',
    en: v.en || ''
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
    coverImage: row.coverImage || undefined,
    coverBg: row.coverBg || undefined,
    pdfUrl: row.pdfUrl || undefined,
    dersCount: row.dersCount ?? dersList.length,
    description: loc(row.description),
    dersList,
    _created: row.created_at || row.updated_at || '',
    _legacy: row.legacy_source || null
  }
}

function isStaff(row: { slug: string; _legacy?: string | null }): boolean {
  const known = CANONICAL_ORDER.includes(row.slug)
  const src = row._legacy || ''
  if (src === 'admin_create' || src === 'admin_ui') return true
  return !known
}

function sortForSite(rows: Array<Kitab & { _created?: string; _legacy?: string | null }>): Kitab[] {
  const rank = new Map(CANONICAL_ORDER.map((s, i) => [s, i]))
  const staff: typeof rows = []
  const classic: typeof rows = []
  for (const row of rows) {
    if (isStaff(row)) staff.push(row)
    else classic.push(row)
  }
  staff.sort((a, b) => Date.parse(b._created || '') - Date.parse(a._created || ''))
  classic.sort((a, b) => (rank.get(a.slug) ?? 999) - (rank.get(b.slug) ?? 999))
  return [...staff, ...classic].map(({ _created, _legacy, ...k }) => k)
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

  const mapped = remote.map(mapCmsKitab)
  const bySlug = new Map<string, Kitab & { _created?: string; _legacy?: string | null }>()

  for (const k of kitabsData) {
    bySlug.set(k.slug, { ...k, _created: '', _legacy: 'static' })
  }
  for (const k of mapped) {
    const prev = bySlug.get(k.slug)
    if (!prev) {
      bySlug.set(k.slug, k)
      continue
    }
    // Prefer CMS text/media, but keep static cover/PDF/audio if CMS left them empty
    const prevTitle = asLoc(prev.title)
    const nextTitle = asLoc(k.title)
    const prevAuthor = asLoc(prev.author)
    const nextAuthor = asLoc(k.author)
    const prevDesc = asLoc(prev.description)
    const nextDesc = asLoc(k.description)
    bySlug.set(k.slug, {
      ...prev,
      ...k,
      title: {
        am: nextTitle.am || prevTitle.am,
        ar: nextTitle.ar || prevTitle.ar,
        en: nextTitle.en || prevTitle.en
      },
      author: {
        am: nextAuthor.am || prevAuthor.am,
        ar: nextAuthor.ar || prevAuthor.ar,
        en: nextAuthor.en || prevAuthor.en
      },
      description: {
        am: nextDesc.am || prevDesc.am,
        ar: nextDesc.ar || prevDesc.ar,
        en: nextDesc.en || prevDesc.en
      },
      coverImage: k.coverImage || prev.coverImage,
      pdfUrl: k.pdfUrl || prev.pdfUrl,
      dersList: k.dersList?.length ? k.dersList : prev.dersList,
      dersCount: k.dersList?.length ? k.dersCount : prev.dersCount
    })
  }

  return { kitabs: sortForSite(Array.from(bySlug.values())), source: 'cms+static' }
}

export async function loadKitabBySlug(slug: string): Promise<Kitab | null> {
  const { kitabs } = await loadKitabsForWebsite()
  return kitabs.find(k => k.slug === slug) || null
}
