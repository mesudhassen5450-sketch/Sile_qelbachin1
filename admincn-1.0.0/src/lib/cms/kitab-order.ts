/** Classic site order — Intebih first, Adewae second, … */
export const CANONICAL_KITAB_SLUG_ORDER = [
  'intebih-ante-murakeb',
  'adewae-kitab',
  'fatihu-awliya',
  'alwasail-almufida',
  'teshilu-alimu-sheria',
  'yekelb-medreq',
  'betewbet-mengede-lay',
  'betewbet-menged'
] as const

export function isStaffAddedKitab(k: {
  legacy_source?: string | null
  metadata?: Record<string, unknown> | null
}): boolean {
  const src = k.legacy_source || ''
  const metaSrc = typeof k.metadata?.source === 'string' ? k.metadata.source : ''
  return (
    src === 'admin_create' ||
    src === 'admin_ui' ||
    metaSrc === 'admin_ui' ||
    metaSrc === 'admin_create'
  )
}

/**
 * Display order:
 * 1) Newly added kitabs from Admin (newest first)
 * 2) Classic library in fixed order (Intebih, Adewae, …)
 */
export function sortKitabsForDisplay<
  T extends {
    slug: string
    legacy_source?: string | null
    metadata?: Record<string, unknown> | null
    created_at?: string | null
    updated_at?: string | null
  }
>(rows: T[]): T[] {
  const rank = new Map(CANONICAL_KITAB_SLUG_ORDER.map((s, i) => [s, i]))
  const staffOnly: T[] = []
  const classicOnly: T[] = []

  for (const row of rows) {
    const known = rank.has(row.slug as (typeof CANONICAL_KITAB_SLUG_ORDER)[number])
    if (known && !isStaffAddedKitab(row)) classicOnly.push(row)
    else staffOnly.push(row)
  }

  staffOnly.sort((a, b) => {
    const ta = Date.parse(a.created_at || a.updated_at || '') || 0
    const tb = Date.parse(b.created_at || b.updated_at || '') || 0
    return tb - ta
  })

  classicOnly.sort((a, b) => {
    const ra = rank.get(a.slug as (typeof CANONICAL_KITAB_SLUG_ORDER)[number]) ?? 999
    const rb = rank.get(b.slug as (typeof CANONICAL_KITAB_SLUG_ORDER)[number]) ?? 999
    if (ra !== rb) return ra - rb
    return (a.slug || '').localeCompare(b.slug || '')
  })

  return [...staffOnly, ...classicOnly]
}
