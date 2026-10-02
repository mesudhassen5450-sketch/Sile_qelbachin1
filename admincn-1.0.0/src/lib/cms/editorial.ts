/** Shared editorial helpers — priority 1 = highest on public lists. */

export type EditorialFields = {
  priority?: number | null
  featured?: boolean | null
  scheduled_at?: string | null
}

export type PrioritySibling = {
  id: string
  priority?: number | null
  featured?: boolean | null
  updated_at?: string | null
  created_at?: string | null
}

export type PriorityAssignment = { id: string; priority: number }

/** Missing/invalid priorities sort last (not a fake cluster at 100). */
export function normalizePriority(value: unknown, fallback = 9999): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.min(9999, Math.floor(n))
}

/** UI default when creating: next open rank at the end of the current pool. */
export function endPriorityDefault(existingCount: number): number {
  return Math.max(1, Math.floor(existingCount) + 1)
}

export function normalizeFeatured(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === 1 || value === '1') return true
  if (value === 'false' || value === 0 || value === '0') return false
  return fallback
}

export function normalizeScheduledAt(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  const s = String(value).trim()
  if (!s) return null
  const t = Date.parse(s)
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}

/** Sort for Admin + public: priority asc (1 first), then featured, then newest. */
export function compareByPriorityThenDate(
  a: { priority?: number | null; featured?: boolean | null; updated_at?: string | null; created_at?: string | null },
  b: { priority?: number | null; featured?: boolean | null; updated_at?: string | null; created_at?: string | null }
): number {
  const pa = normalizePriority(a.priority, 9999)
  const pb = normalizePriority(b.priority, 9999)
  if (pa !== pb) return pa - pb
  const fa = a.featured ? 1 : 0
  const fb = b.featured ? 1 : 0
  if (fa !== fb) return fb - fa
  return Date.parse(b.updated_at || b.created_at || '0') - Date.parse(a.updated_at || a.created_at || '0')
}

/**
 * Claim `newPriority` for `id` among siblings and renumber 1..n.
 * Previous #1 becomes #2 when another item claims 1, etc.
 */
export function claimPriority(
  siblings: PrioritySibling[],
  id: string,
  newPriority: number
): PriorityAssignment[] {
  if (!siblings.length) return []
  const target = siblings.find(s => s.id === id)
  if (!target) return []
  const rank = Math.max(1, Math.min(siblings.length, Math.floor(Number(newPriority)) || 1))
  const others = siblings
    .filter(s => s.id !== id)
    .slice()
    .sort((a, b) => {
      const byPri = compareByPriorityThenDate(a, b)
      if (byPri !== 0) return byPri
      return String(a.id).localeCompare(String(b.id))
    })
  const ordered = [...others]
  ordered.splice(rank - 1, 0, target)
  return ordered.map((row, i) => ({ id: row.id, priority: i + 1 }))
}

/** New publish: insert at front (priority 1) and shift peers down. */
export function insertAtFrontPriorities(
  existingSiblings: PrioritySibling[],
  newId: string
): PriorityAssignment[] {
  const pool: PrioritySibling[] = [{ id: newId, priority: 1 }, ...existingSiblings]
  return claimPriority(pool, newId, 1)
}

/** Re-number an already-ordered sibling pool to consecutive 1..n. */
export function reindexPriorities(siblings: PrioritySibling[]): PriorityAssignment[] {
  const ordered = [...siblings].sort((a, b) => {
    const byPri = compareByPriorityThenDate(a, b)
    if (byPri !== 0) return byPri
    return String(a.id).localeCompare(String(b.id))
  })
  return ordered.map((row, i) => ({ id: row.id, priority: i + 1 }))
}

export function applyPriorityAssignments<T extends { id: string; priority?: number | null; updated_at?: string }>(
  rows: T[],
  assignments: PriorityAssignment[],
  now?: string
): T[] {
  if (!assignments.length) return rows
  const map = new Map(assignments.map(a => [a.id, a.priority]))
  return rows.map(row => {
    const next = map.get(row.id)
    if (next === undefined) return row
    return {
      ...row,
      priority: next,
      ...(now ? { updated_at: now } : {}),
    }
  })
}

/** Whether a scheduled item is ready to show publicly. */
export function isScheduleLive(scheduled_at: string | null | undefined, now = Date.now()): boolean {
  if (!scheduled_at) return true
  const t = Date.parse(scheduled_at)
  if (!Number.isFinite(t)) return true
  return t <= now
}

export type AudioSection = 'quran' | 'dawah' | 'one_minute'
export type VideoSection = 'one_minute' | 'long'
export type PdfSection = 'pdfs' | 'notes'

function isOneMinuteCategory(category: string | null | undefined): boolean {
  const cat = String(category || '')
    .trim()
    .toLowerCase()
  return cat === 'one_minute' || cat === '1-minute' || cat === 'oneminute' || cat === '1_minute'
}

function isOneMinuteFeedMeta(metadata?: Record<string, unknown> | null): boolean {
  if (!metadata) return false
  const feed = String(metadata.feed || '').toLowerCase()
  return feed === 'one-minute' || feed === 'one_minute' || feed === '1-minute'
}

export function matchesAudioSection(
  row: {
    category?: string | null
    is_muhadara?: boolean | null
    metadata?: Record<string, unknown> | null
  },
  section: AudioSection
): boolean {
  const cat = String(row.category || '')
    .trim()
    .toLowerCase()
  const isOne = isOneMinuteCategory(cat) || isOneMinuteFeedMeta(row.metadata)
  if (section === 'dawah') {
    if (isOne) return false
    return Boolean(row.is_muhadara) || cat === 'dawah' || cat === 'muhadara'
  }
  if (section === 'one_minute') {
    return isOne
  }
  // quran: explicit quran, or legacy archive items that are not dawah/one_minute
  if (isOne) return false
  if (cat === 'quran' || cat === 'quran_recitation' || cat === 'recitation') return true
  if (cat === 'dawah' || cat === 'muhadara') return false
  if (row.is_muhadara) return false
  return true
}

export function matchesVideoSection(
  row: { category?: string | null; metadata?: Record<string, unknown> | null },
  section: VideoSection
): boolean {
  const isOne =
    isOneMinuteCategory(row.category) || isOneMinuteFeedMeta(row.metadata)
  return section === 'one_minute' ? isOne : !isOne
}

export function matchesPdfSection(
  row: { category?: string | null },
  section: PdfSection
): boolean {
  const cat = String(row.category || '')
    .trim()
    .toLowerCase()
  const isNotes = cat === 'notes' || cat === 'note'
  return section === 'notes' ? isNotes : !isNotes
}

export function defaultCategoryForAudioSection(section: AudioSection): string {
  if (section === 'dawah') return 'dawah'
  if (section === 'one_minute') return 'one_minute'
  return 'quran'
}

export function defaultCategoryForVideoSection(section: VideoSection): string {
  return section === 'one_minute' ? 'one_minute' : 'long'
}

export function defaultCategoryForPdfSection(section: PdfSection): string {
  return section === 'notes' ? 'notes' : 'pdf'
}
