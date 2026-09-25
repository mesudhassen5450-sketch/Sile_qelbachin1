import { NextResponse } from 'next/server'

import { requireApiPermission } from '@/lib/auth/guards'
import { loadLocalStore } from '@/lib/cms/local-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Real activity from Admin actions (no fake rows). */
export async function GET() {
  const gate = await requireApiPermission(['audit.view', 'security.view', 'admins.view'])
  if ('response' in gate) return gate.response

  const store = loadLocalStore()
  const rows = (store.audit_logs || []).slice(0, 200).map(a => ({
    id: a.id,
    title: a.action,
    meta: a.admin_email || a.entity_type || '—',
    entity: a.entity_type,
    entity_id: a.entity_id,
    status: 'Recorded',
    updated: a.created_at
  }))

  return NextResponse.json({ ok: true, count: rows.length, rows })
}
