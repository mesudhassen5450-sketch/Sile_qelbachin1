import {
  appendAudit,
  loadLocalStore,
  newId,
  nowIso,
  saveLocalStore
} from '@/lib/cms/local-store'
import { compareByPriorityThenDate } from '@/lib/cms/editorial'
import { claimPriorityInStore, insertNewAtFront } from '@/lib/cms/priority-cascade'
import { listQuestionSubmissions } from '@/lib/cms/question-submissions'
import type { AnalyticsEvent, ContentStatus, ReminderRecord } from '@/lib/cms/types'

export async function listReminders() {
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
    metadata: { source: 'admin_ui', feed: 'one-minute' },
    created_at: now,
    updated_at: now,
    published_at: status === 'published' ? now : null
  }
  store.reminders = [row, ...(store.reminders || [])]
  await insertNewAtFront(store, 'reminders', row.id, now, { persist: false })
  // Keep sort_order aligned with priority for legacy home consumers
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
  return store.reminders.find(r => r.id === next.id) || next
}

export async function deleteReminder(id: string): Promise<void> {
  const store = loadLocalStore()
  store.reminders = (store.reminders || []).filter(r => r.id !== id)
  saveLocalStore(store)
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
