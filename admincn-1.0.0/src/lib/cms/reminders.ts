import {
  appendAudit,
  loadLocalStore,
  newId,
  nowIso,
  saveLocalStore
} from '@/lib/cms/local-store'
import type { AnalyticsEvent, ContentStatus, ReminderRecord } from '@/lib/cms/types'

export async function listReminders() {
  const store = loadLocalStore()
  return [...(store.reminders || [])].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
    return Date.parse(b.updated_at) - Date.parse(a.updated_at)
  })
}

export async function createReminder(input: {
  title_en?: string | null
  title_am?: string | null
  title_ar?: string | null
  description_en?: string | null
  description_am?: string | null
  description_ar?: string | null
  status?: ContentStatus
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
    sort_order: (store.reminders?.length || 0) + 1,
    metadata: { source: 'admin_ui' },
    created_at: now,
    updated_at: now,
    published_at: status === 'published' ? now : null
  }
  store.reminders = [...(store.reminders || []), row]
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
  return row
}

export async function updateReminder(input: {
  id: string
  title_en?: string | null
  title_am?: string | null
  description_en?: string | null
  description_am?: string | null
  status?: ContentStatus
}): Promise<ReminderRecord> {
  const store = loadLocalStore()
  const idx = (store.reminders || []).findIndex(r => r.id === input.id)
  if (idx < 0) throw new Error('Reminder not found.')
  const prev = store.reminders[idx]
  const now = nowIso()
  const next: ReminderRecord = {
    ...prev,
    title_en: input.title_en !== undefined ? input.title_en : prev.title_en,
    title_am: input.title_am !== undefined ? input.title_am : prev.title_am,
    description_en:
      input.description_en !== undefined ? input.description_en : prev.description_en,
    description_am:
      input.description_am !== undefined ? input.description_am : prev.description_am,
    status: input.status || prev.status,
    updated_at: now,
    published_at:
      (input.status || prev.status) === 'published' ? prev.published_at || now : prev.published_at
  }
  store.reminders[idx] = next
  saveLocalStore(store)
  return next
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
  const count = (name: string, platform?: string) =>
    events.filter(e => e.event === name && (!platform || e.platform === platform)).length

  const pageViews = count('page_view', 'website')
  const sessions = count('session_start', 'website')
  const visitorsApprox = new Set(
    events
      .filter(e => e.platform === 'website' && (e.event === 'page_view' || e.event === 'session_start'))
      .map(e => String(e.meta?.visitor_id || e.path || e.id))
  ).size

  return {
    days,
    content: {
      kitabs: store.kitabs.filter(k => k.status === 'published').length,
      ders: store.ders.filter(d => d.status === 'published').length,
      audio: store.audio_items.filter(a => a.status === 'published').length,
      video: store.video_items.filter(v => v.status === 'published').length,
      pdfs: store.pdf_items.filter(p => p.status === 'published').length,
      reminders: (store.reminders || []).filter(r => r.status === 'published').length,
      media_files: store.media_assets.length
    },
    website: {
      visitors: visitorsApprox,
      sessions,
      page_views: pageViews,
      audio_plays: count('audio_play', 'website'),
      video_plays: count('video_play', 'website'),
      pdf_plays: count('pdf_open', 'website')
    },
    mobile: {
      registered: 0,
      active_30d: 0,
      app_opens: count('app_open', 'mobile'),
      audio_plays: count('audio_play', 'mobile'),
      video_plays: count('video_play', 'mobile'),
      pdf_plays: count('pdf_open', 'mobile')
    },
    events_total: events.length,
    captured_at: nowIso()
  }
}
