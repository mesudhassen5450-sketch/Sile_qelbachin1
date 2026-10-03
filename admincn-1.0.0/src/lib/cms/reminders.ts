import {
  appendAudit,
  loadLocalStore,
  newId,
  nowIso,
  saveLocalStore
} from '@/lib/cms/local-store'
import { compareByPriorityThenDate } from '@/lib/cms/editorial'
import { claimPriorityInStore, insertNewAtFront } from '@/lib/cms/priority-cascade'
import { getObjectTextFromR2, putObjectToR2 } from '@/lib/cms/r2'
import { getServiceSupabase } from '@/lib/cms/supabase'
import { listQuestionSubmissions } from '@/lib/cms/question-submissions'
import type { AnalyticsEvent, ContentStatus, ReminderRecord } from '@/lib/cms/types'

const R2_KEY = 'cms-backups/reminders.json'

function normalizeReminder(r: Partial<ReminderRecord> & { id: string }): ReminderRecord {
  return {
    id: r.id,
    title_en: r.title_en ?? null,
    title_am: r.title_am ?? null,
    title_ar: r.title_ar ?? null,
    description_en: r.description_en ?? null,
    description_am: r.description_am ?? null,
    description_ar: r.description_ar ?? null,
    status: (r.status as ContentStatus) || 'published',
    sort_order: typeof r.sort_order === 'number' ? r.sort_order : 100,
    priority: typeof r.priority === 'number' && r.priority >= 1 ? r.priority : 100,
    featured: Boolean(r.featured),
    scheduled_at: r.scheduled_at || null,
    metadata: (r.metadata as Record<string, unknown>) || {},
    created_at: r.created_at || nowIso(),
    updated_at: r.updated_at || nowIso(),
    published_at: r.published_at ?? null,
  }
}

function rowToDb(r: ReminderRecord) {
  return {
    id: r.id,
    title_en: r.title_en,
    title_am: r.title_am,
    title_ar: r.title_ar,
    description_en: r.description_en,
    description_am: r.description_am,
    description_ar: r.description_ar,
    status: r.status,
    sort_order: r.sort_order,
    priority: r.priority,
    featured: r.featured,
    scheduled_at: r.scheduled_at,
    metadata: r.metadata || {},
    created_at: r.created_at,
    updated_at: r.updated_at,
    published_at: r.published_at,
  }
}

async function loadFromSupabase(): Promise<ReminderRecord[] | null> {
  const sb = getServiceSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('cms_reminders').select('*')
  if (error) {
    if (/relation|does not exist|schema cache/i.test(error.message)) return null
    throw new Error(`Could not load reminders: ${error.message}`)
  }
  return (data || []).map(r => normalizeReminder(r as ReminderRecord))
}

async function loadFromR2(): Promise<ReminderRecord[] | null> {
  try {
    const text = await getObjectTextFromR2(R2_KEY)
    if (!text) return null
    const raw = JSON.parse(text)
    if (!Array.isArray(raw)) return null
    return raw.map(r => normalizeReminder(r))
  } catch {
    return null
  }
}

function mirrorLocal(rows: ReminderRecord[]) {
  const store = loadLocalStore()
  store.reminders = rows
  saveLocalStore(store)
}

async function persistDurable(rows: ReminderRecord[]): Promise<{ backend: string }> {
  mirrorLocal(rows)

  let r2Ok = false
  try {
    await putObjectToR2({
      objectKey: R2_KEY,
      body: Buffer.from(JSON.stringify(rows, null, 2), 'utf8'),
      contentType: 'application/json',
      cacheControl: 'no-cache',
    })
    r2Ok = true
  } catch (err) {
    console.warn('[reminders] R2 backup failed:', err instanceof Error ? err.message : err)
  }

  const sb = getServiceSupabase()
  if (!sb) {
    if (r2Ok) return { backend: 'r2' }
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      throw new Error(
        'Could not save reminders permanently (Supabase + R2 unavailable). Check Admin env on Render.'
      )
    }
    return { backend: 'local' }
  }

  const payload = rows.map(rowToDb)
  if (payload.length) {
    const { error } = await sb.from('cms_reminders').upsert(payload, { onConflict: 'id' })
    if (error) {
      if (/relation|does not exist|schema cache/i.test(error.message)) {
        if (r2Ok) {
          console.warn('[reminders] cms_reminders table missing — saved to R2 only. Apply migration 006.')
          return { backend: 'r2' }
        }
        throw new Error(
          'Supabase table cms_reminders is missing. Run migration 006_cms_reminders.sql in the Supabase SQL Editor, then save again.'
        )
      }
      throw new Error(`Could not save reminders: ${error.message}`)
    }
  } else {
    const { error } = await sb.from('cms_reminders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error && !/relation|does not exist|schema cache/i.test(error.message)) {
      throw new Error(`Could not clear reminders: ${error.message}`)
    }
  }

  const { data: existing, error: listErr } = await sb.from('cms_reminders').select('id')
  if (!listErr && existing) {
    const keep = new Set(rows.map(r => r.id))
    const toDelete = existing.map(r => String(r.id)).filter(id => !keep.has(id))
    if (toDelete.length) {
      await sb.from('cms_reminders').delete().in('id', toDelete)
    }
  }

  return { backend: 'supabase' }
}

/**
 * Load reminders: Supabase → R2 → local disk.
 * Local alone is ephemeral on Render.
 */
export async function listReminders() {
  const fromDb = await loadFromSupabase()
  if (fromDb && fromDb.length) {
    mirrorLocal(fromDb)
    return [...fromDb].sort(compareByPriorityThenDate)
  }

  const fromR2 = await loadFromR2()
  if (fromR2 && fromR2.length) {
    mirrorLocal(fromR2)
    try {
      await persistDurable(fromR2)
    } catch {
      /* migration may still be missing */
    }
    return [...fromR2].sort(compareByPriorityThenDate)
  }

  if (fromDb) {
    mirrorLocal([])
    return []
  }

  const store = loadLocalStore()
  return [...(store.reminders || [])].sort(compareByPriorityThenDate)
}

export async function createReminder(input: {
  title_en?: string | null
  title_am?: string | null
  title_ar?: string | null
  description_en?: string | null
  description_am?: string | null
  description_ar?: string | null
  status?: ContentStatus
  priority?: number | null
  featured?: boolean | null
  scheduled_at?: string | null
  adminEmail?: string | null
}): Promise<ReminderRecord> {
  const rows = await listReminders()
  const store = loadLocalStore()
  const now = nowIso()
  const status: ContentStatus = input.status || 'published'
  if (!input.title_en?.trim() && !input.title_am?.trim()) {
    throw new Error('Title is required.')
  }
  const row: ReminderRecord = {
    id: newId(),
    title_en: input.title_en?.trim() || null,
    title_am: input.title_am?.trim() || null,
    title_ar: input.title_ar?.trim() || null,
    description_en: input.description_en?.trim() || null,
    description_am: input.description_am?.trim() || null,
    description_ar: input.description_ar?.trim() || null,
    status,
    sort_order: 1,
    priority: 1,
    featured: Boolean(input.featured),
    scheduled_at: input.scheduled_at || null,
    metadata: { source: 'admin_ui', feed: 'reminders' },
    created_at: now,
    updated_at: now,
    published_at: status === 'published' ? now : null
  }

  store.reminders = [row, ...rows]
  await insertNewAtFront(store, 'reminders', row.id, now, { persist: false })
  store.reminders = (store.reminders || []).map(r => ({
    ...r,
    sort_order: r.priority ?? r.sort_order,
  }))
  appendAudit(store, {
    admin_id: null,
    admin_email: input.adminEmail || null,
    action: 'reminder_created',
    entity_type: 'reminders',
    entity_id: row.id,
    before_data: null,
    after_data: { title: row.title_en || row.title_am }
  })
  saveLocalStore(store)
  await persistDurable(store.reminders || [])
  return store.reminders.find(r => r.id === row.id) || row
}

export async function updateReminder(input: {
  id: string
  title_en?: string | null
  title_am?: string | null
  description_en?: string | null
  description_am?: string | null
  status?: ContentStatus
  priority?: number | null
  featured?: boolean | null
  scheduled_at?: string | null
}): Promise<ReminderRecord> {
  await listReminders()
  const store = loadLocalStore()
  const idx = (store.reminders || []).findIndex(r => r.id === input.id)
  if (idx < 0) throw new Error('Reminder not found.')
  const prev = store.reminders[idx]
  const now = nowIso()
  const nextStatus = (input.status || prev.status) as ContentStatus
  const next: ReminderRecord = {
    ...prev,
    title_en: input.title_en !== undefined ? input.title_en : prev.title_en,
    title_am: input.title_am !== undefined ? input.title_am : prev.title_am,
    description_en:
      input.description_en !== undefined ? input.description_en : prev.description_en,
    description_am:
      input.description_am !== undefined ? input.description_am : prev.description_am,
    status: nextStatus,
    priority:
      input.priority !== undefined && input.priority !== null
        ? Math.min(9999, Math.max(1, Math.floor(Number(input.priority) || 1)))
        : prev.priority ?? 1,
    featured: input.featured !== undefined ? Boolean(input.featured) : Boolean(prev.featured),
    scheduled_at:
      input.scheduled_at !== undefined ? input.scheduled_at || null : prev.scheduled_at || null,
    updated_at: now,
    published_at: nextStatus === 'published' ? prev.published_at || now : prev.published_at
  }
  store.reminders[idx] = next
  if (input.priority !== undefined && input.priority !== null) {
    await claimPriorityInStore(store, 'reminders', next.id, next.priority, now, {
      persist: false,
    })
  }
  store.reminders = (store.reminders || []).map(r => ({
    ...r,
    sort_order: r.priority ?? r.sort_order,
  }))
  saveLocalStore(store)
  await persistDurable(store.reminders || [])
  return store.reminders.find(r => r.id === next.id) || next
}

export async function deleteReminder(id: string): Promise<void> {
  await listReminders()
  const store = loadLocalStore()
  store.reminders = (store.reminders || []).filter(r => r.id !== id)
  saveLocalStore(store)
  await persistDurable(store.reminders || [])
}

export function recordAnalyticsEvent(input: {
  event: string
  path?: string | null
  platform?: 'website' | 'mobile' | 'unknown'
  meta?: Record<string, unknown>
}): AnalyticsEvent {
  const store = loadLocalStore()
  const row: AnalyticsEvent = {
    id: newId(),
    event: input.event.slice(0, 80),
    path: input.path?.slice(0, 300) || null,
    platform: input.platform || 'website',
    created_at: nowIso(),
    meta: input.meta
  }
  const prev = store.analytics_events || []
  store.analytics_events = [row, ...prev].slice(0, 50000)
  saveLocalStore(store)
  return row
}

export function aggregateAnalytics(days = 7) {
  const store = loadLocalStore()
  const since = Date.now() - days * 24 * 60 * 60 * 1000
  const events = (store.analytics_events || []).filter(e => Date.parse(e.created_at) >= since)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayMs = todayStart.getTime()
  const todayEvents = events.filter(e => Date.parse(e.created_at) >= todayMs)

  const count = (name: string, platform?: string, pool = events) =>
    pool.filter(e => e.event === name && (!platform || e.platform === platform)).length

  const uniqueVisitors = (platform?: string, pool = events) =>
    new Set(
      pool
        .filter(
          e =>
            (!platform || e.platform === platform) &&
            (e.event === 'page_view' || e.event === 'session_start' || e.event === 'app_open')
        )
        .map(e => String(e.meta?.visitor_id || e.path || e.id))
    ).size

  const platformBlock = (platform: 'website' | 'mobile', pool = events) => ({
    visitors: uniqueVisitors(platform, pool),
    unique_visitors: uniqueVisitors(platform, pool),
    sessions: count('session_start', platform, pool) + count('app_open', platform, pool),
    page_views: count('page_view', platform, pool),
    audio_plays: count('audio_play', platform, pool),
    video_plays: count('video_play', platform, pool),
    pdf_opens: count('pdf_open', platform, pool),
    downloads: count('download', platform, pool),
    searches: count('search', platform, pool),
    kitab_opens: count('kitab_open', platform, pool),
    featured_clicks: count('featured_click', platform, pool),
  })

  const website = platformBlock('website')
  const mobile = {
    ...platformBlock('mobile'),
    app_opens: count('app_open', 'mobile'),
    registered: 0,
    active_30d: 0,
  }

  const combine = (a: ReturnType<typeof platformBlock>, b: typeof mobile) => ({
    visitors: a.visitors + b.visitors,
    unique_visitors: a.unique_visitors + b.unique_visitors,
    sessions: a.sessions + b.sessions,
    page_views: a.page_views + b.page_views,
    audio_plays: a.audio_plays + b.audio_plays,
    video_plays: a.video_plays + b.video_plays,
    pdf_opens: a.pdf_opens + b.pdf_opens,
    pdf_plays: a.pdf_opens + b.pdf_opens,
    downloads: a.downloads + b.downloads,
    searches: a.searches + b.searches,
    kitab_opens: a.kitab_opens + b.kitab_opens,
    featured_clicks: a.featured_clicks + b.featured_clicks,
  })

  let questionsSubmitted = 0
  let questionsAnswered = 0
  let responseTimeSum = 0
  let responseTimeN = 0
  try {
    const qs = listQuestionSubmissions()
    questionsSubmitted = qs.filter(r => Date.parse(r.created_at) >= since).length
    questionsAnswered = qs.filter(
      r => r.status === 'answered' && r.answered_at && Date.parse(r.answered_at) >= since
    ).length
    for (const r of qs) {
      if (r.answered_at && r.created_at) {
        const ms = Date.parse(r.answered_at) - Date.parse(r.created_at)
        if (ms > 0 && Date.parse(r.answered_at) >= since) {
          responseTimeSum += ms
          responseTimeN += 1
        }
      }
    }
  } catch {
    /* question store optional */
  }

  const aiRequests = count('ai_request')
  const aiSuccess = count('ai_success')
  const aiFailure = count('ai_failure')

  return {
    days,
    content: {
      kitabs: store.kitabs.filter(k => k.status === 'published').length,
      ders: store.ders.filter(d => d.status === 'published').length,
      audio: store.audio_items.filter(a => a.status === 'published').length,
      video: store.video_items.filter(v => v.status === 'published').length,
      pdfs: store.pdf_items.filter(p => p.status === 'published').length,
      reminders: (store.reminders || []).filter(r => r.status === 'published').length,
      media_files: store.media_assets.length,
    },
    website: {
      ...website,
      pdf_plays: website.pdf_opens,
    },
    mobile,
    combined: combine(website, mobile),
    today: {
      website: {
        ...platformBlock('website', todayEvents),
        pdf_plays: count('pdf_open', 'website', todayEvents),
      },
      mobile: {
        ...platformBlock('mobile', todayEvents),
        app_opens: count('app_open', 'mobile', todayEvents),
        pdf_plays: count('pdf_open', 'mobile', todayEvents),
      },
      combined: (() => {
        const tw = platformBlock('website', todayEvents)
        const tm = {
          ...platformBlock('mobile', todayEvents),
          app_opens: count('app_open', 'mobile', todayEvents),
        }
        return combine(tw, tm as typeof mobile)
      })(),
    },
    community: {
      question_submissions: questionsSubmitted,
      questions_answered: questionsAnswered,
      avg_response_hours:
        responseTimeN > 0
          ? Math.round((responseTimeSum / responseTimeN / 3_600_000) * 10) / 10
          : null,
    },
    ai: {
      requests: aiRequests,
      successful: aiSuccess,
      failures: aiFailure,
    },
    content_usage: {
      kitab_opens: count('kitab_open'),
      audio_plays: count('audio_play'),
      video_views: count('video_play'),
      pdf_opens: count('pdf_open'),
      downloads: count('download'),
      searches: count('search'),
      featured_clicks: count('featured_click'),
      top_paths: Object.entries(
        events
          .filter(e => e.path)
          .reduce<Record<string, number>>((acc, e) => {
            const p = e.path || '/'
            acc[p] = (acc[p] || 0) + 1
            return acc
          }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([path, hits]) => ({ path, hits })),
    },
    events_total: events.length,
    captured_at: nowIso(),
  }
}
