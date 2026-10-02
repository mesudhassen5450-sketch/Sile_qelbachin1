/**
 * Apply claimPriority / insert-at-front across CMS collections (section-aware pools).
 */
import {
  applyPriorityAssignments,
  claimPriority,
  compareByPriorityThenDate,
  insertAtFrontPriorities,
  matchesAudioSection,
  matchesPdfSection,
  matchesVideoSection,
  reindexPriorities,
  type PriorityAssignment,
} from '@/lib/cms/editorial'
import type { CmsStoreSnapshot } from '@/lib/cms/types'
import { getServiceSupabase, isSupabaseConfigured } from '@/lib/cms/supabase'

export type CascadeCollection =
  | 'kitabs'
  | 'audio'
  | 'video'
  | 'pdfs'
  | 'reminders'
  | 'ders'

function audioSectionFor(row: {
  category?: string | null
  is_muhadara?: boolean | null
  metadata?: Record<string, unknown> | null
}) {
  if (matchesAudioSection(row, 'one_minute')) return 'one_minute' as const
  if (matchesAudioSection(row, 'dawah')) return 'dawah' as const
  return 'quran' as const
}

function videoSectionFor(row: {
  category?: string | null
  metadata?: Record<string, unknown> | null
}) {
  return matchesVideoSection(row, 'one_minute') ? ('one_minute' as const) : ('long' as const)
}

function pdfSectionFor(row: { category?: string | null }) {
  return matchesPdfSection(row, 'notes') ? ('notes' as const) : ('pdfs' as const)
}

/** Peers that share the same Admin/public section pool as `id`. */
export function siblingsInPool(
  store: CmsStoreSnapshot,
  collection: CascadeCollection,
  id: string,
  opts?: { kitabId?: string | null }
): Array<{
  id: string
  priority?: number | null
  featured?: boolean | null
  updated_at?: string | null
  created_at?: string | null
}> {
  if (collection === 'kitabs') {
    return store.kitabs.map(k => ({
      id: k.id,
      priority: k.priority,
      featured: k.featured,
      updated_at: k.updated_at,
      created_at: k.created_at,
    }))
  }
  if (collection === 'reminders') {
    return (store.reminders || []).map(r => ({
      id: r.id,
      priority: r.priority,
      featured: r.featured,
      updated_at: r.updated_at,
      created_at: r.created_at,
    }))
  }
  if (collection === 'ders') {
    const self = store.ders.find(d => d.id === id)
    const kitabId = opts?.kitabId || self?.kitab_id
    if (!kitabId) return []
    return store.ders
      .filter(d => d.kitab_id === kitabId)
      .map(d => ({
        id: d.id,
        priority: d.priority,
        featured: d.featured,
        updated_at: d.updated_at,
        created_at: d.created_at,
      }))
  }
  if (collection === 'audio') {
    const self = store.audio_items.find(a => a.id === id)
    if (!self) return []
    const section = audioSectionFor(self)
    return store.audio_items
      .filter(a => matchesAudioSection(a, section))
      .map(a => ({
        id: a.id,
        priority: a.priority,
        featured: a.featured,
        updated_at: a.updated_at,
        created_at: a.created_at,
      }))
  }
  if (collection === 'video') {
    const self = store.video_items.find(v => v.id === id)
    if (!self) return []
    const section = videoSectionFor(self)
    return store.video_items
      .filter(v => matchesVideoSection(v, section))
      .map(v => ({
        id: v.id,
        priority: v.priority,
        featured: v.featured,
        updated_at: v.updated_at,
        created_at: v.created_at,
      }))
  }
  const self = store.pdf_items.find(p => p.id === id)
  if (!self) return []
  const section = pdfSectionFor(self)
  return store.pdf_items
    .filter(p => matchesPdfSection(p, section))
    .map(p => ({
      id: p.id,
      priority: p.priority,
      featured: p.featured,
      updated_at: p.updated_at,
      created_at: p.created_at,
    }))
}

function applyToStore(
  store: CmsStoreSnapshot,
  collection: CascadeCollection,
  assignments: PriorityAssignment[],
  now: string
) {
  if (!assignments.length) return
  if (collection === 'kitabs') {
    store.kitabs = applyPriorityAssignments(store.kitabs, assignments, now)
  } else if (collection === 'audio') {
    store.audio_items = applyPriorityAssignments(store.audio_items, assignments, now)
  } else if (collection === 'video') {
    store.video_items = applyPriorityAssignments(store.video_items, assignments, now)
  } else if (collection === 'pdfs') {
    store.pdf_items = applyPriorityAssignments(store.pdf_items, assignments, now)
  } else if (collection === 'reminders') {
    store.reminders = applyPriorityAssignments(store.reminders || [], assignments, now)
  } else if (collection === 'ders') {
    store.ders = applyPriorityAssignments(store.ders, assignments, now)
  }
}

function supabaseTable(collection: CascadeCollection): string | null {
  if (collection === 'kitabs') return 'kitabs'
  if (collection === 'audio') return 'audio_items'
  if (collection === 'video') return 'video_items'
  if (collection === 'pdfs') return 'pdf_items'
  if (collection === 'ders') return 'ders'
  return null
}

export async function syncPriorityAssignments(
  collection: CascadeCollection,
  assignments: PriorityAssignment[],
  now: string
) {
  const table = supabaseTable(collection)
  if (!table || !assignments.length || !isSupabaseConfigured()) return
  const sb = getServiceSupabase()
  if (!sb) return
  await Promise.all(
    assignments.map(async a => {
      const { error } = await sb
        .from(table)
        .update({ priority: a.priority, updated_at: now })
        .eq('id', a.id)
      if (error && /column|schema cache/i.test(error.message) && /priority/i.test(error.message)) {
        // Older schema: stash priority in metadata only
        const { data: existing } = await sb
          .from(table)
          .select('metadata')
          .eq('id', a.id)
          .maybeSingle()
        const meta = {
          ...((existing?.metadata as Record<string, unknown>) || {}),
          priority: a.priority,
        }
        await sb.from(table).update({ metadata: meta, updated_at: now }).eq('id', a.id)
      }
    })
  )
}

export async function claimPriorityInStore(
  store: CmsStoreSnapshot,
  collection: CascadeCollection,
  id: string,
  newPriority: number,
  now: string,
  opts?: { kitabId?: string | null; persist?: boolean }
): Promise<PriorityAssignment[]> {
  const peers = siblingsInPool(store, collection, id, opts)
  const assignments = claimPriority(peers, id, newPriority)
  applyToStore(store, collection, assignments, now)
  if (opts?.persist !== false) {
    await syncPriorityAssignments(collection, assignments, now)
  }
  return assignments
}

export async function insertNewAtFront(
  store: CmsStoreSnapshot,
  collection: CascadeCollection,
  newId: string,
  now: string,
  opts?: { kitabId?: string | null; persist?: boolean }
): Promise<PriorityAssignment[]> {
  const peers = siblingsInPool(store, collection, newId, opts).filter(p => p.id !== newId)
  const assignments = insertAtFrontPriorities(peers, newId)
  applyToStore(store, collection, assignments, now)
  if (opts?.persist !== false) {
    await syncPriorityAssignments(collection, assignments, now)
  }
  return assignments
}

function poolNeedsReindex(peers: Array<{ priority?: number | null }>): boolean {
  if (peers.length <= 1) return false
  const ranks = peers.map(p => {
    const n = typeof p.priority === 'number' ? p.priority : Number(p.priority)
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : null
  })
  if (ranks.every(r => r == null)) return true
  const defined = ranks.filter((r): r is number => r != null)
  if (defined.length < peers.length) return true
  const unique = new Set(defined)
  if (unique.size === 1 && peers.length > 1) return true
  const sorted = [...defined].sort((a, b) => a - b)
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) return true
  }
  return false
}

/**
 * Repair every section pool to consecutive priorities 1..n
 * (newest first when many rows share the same priority like 100).
 */
export function reindexAllContentPools(
  store: CmsStoreSnapshot,
  now = new Date().toISOString()
): number {
  let touched = 0

  const reindexScoped = (
    collection: CascadeCollection,
    peers: Array<{
      id: string
      priority?: number | null
      featured?: boolean | null
      updated_at?: string | null
      created_at?: string | null
    }>
  ) => {
    if (!peers.length || !poolNeedsReindex(peers)) return
    const ordered = [...peers].sort((a, b) => {
      const byPri = compareByPriorityThenDate(a, b)
      if (byPri !== 0) return byPri
      return String(a.id).localeCompare(String(b.id))
    })
    const assignments = reindexPriorities(ordered)
    applyToStore(store, collection, assignments, now)
    touched += assignments.length
  }

  reindexScoped(
    'kitabs',
    store.kitabs.map(k => ({
      id: k.id,
      priority: k.priority,
      featured: k.featured,
      updated_at: k.updated_at,
      created_at: k.created_at,
    }))
  )

  reindexScoped(
    'reminders',
    (store.reminders || []).map(r => ({
      id: r.id,
      priority: r.priority,
      featured: r.featured,
      updated_at: r.updated_at,
      created_at: r.created_at,
    }))
  )

  for (const section of ['one_minute', 'dawah', 'quran'] as const) {
    reindexScoped(
      'audio',
      store.audio_items
        .filter(a => matchesAudioSection(a, section))
        .map(a => ({
          id: a.id,
          priority: a.priority,
          featured: a.featured,
          updated_at: a.updated_at,
          created_at: a.created_at,
        }))
    )
  }

  for (const section of ['one_minute', 'long'] as const) {
    reindexScoped(
      'video',
      store.video_items
        .filter(v => matchesVideoSection(v, section))
        .map(v => ({
          id: v.id,
          priority: v.priority,
          featured: v.featured,
          updated_at: v.updated_at,
          created_at: v.created_at,
        }))
    )
  }

  for (const section of ['pdfs', 'notes'] as const) {
    reindexScoped(
      'pdfs',
      store.pdf_items
        .filter(p => matchesPdfSection(p, section))
        .map(p => ({
          id: p.id,
          priority: p.priority,
          featured: p.featured,
          updated_at: p.updated_at,
          created_at: p.created_at,
        }))
    )
  }

  const kitabIds = new Set(store.ders.map(d => d.kitab_id).filter(Boolean) as string[])
  for (const kitabId of kitabIds) {
    reindexScoped(
      'ders',
      store.ders
        .filter(d => d.kitab_id === kitabId)
        .map(d => ({
          id: d.id,
          priority: d.priority,
          featured: d.featured,
          updated_at: d.updated_at,
          created_at: d.created_at,
        }))
    )
  }

  return touched
}
