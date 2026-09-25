import { NextResponse } from 'next/server'

import { requireApiPermission } from '@/lib/auth/guards'
import {
  createReminder,
  deleteReminder,
  listReminders,
  updateReminder
} from '@/lib/cms/reminders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const gate = await requireApiPermission(['kitabs.view', 'kitabs.edit'])
  if ('response' in gate) return gate.response
  const rows = await listReminders()
  return NextResponse.json({ ok: true, count: rows.length, rows })
}

export async function POST(request: Request) {
  const gate = await requireApiPermission(['kitabs.create', 'kitabs.publish'])
  if ('response' in gate) return gate.response
  const body = await request.json().catch(() => ({}))
  try {
    const row = await createReminder({
      title_en: body.title_en,
      title_am: body.title_am,
      title_ar: body.title_ar,
      description_en: body.description_en,
      description_am: body.description_am,
      description_ar: body.description_ar,
      status: body.status || 'published',
      adminEmail: gate.ctx.user.email
    })
    return NextResponse.json({
      ok: true,
      row,
      message: 'Reminder published. It appears on the home page.'
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Create failed.' },
      { status: 400 }
    )
  }
}

export async function PATCH(request: Request) {
  const gate = await requireApiPermission(['kitabs.edit', 'kitabs.publish'])
  if ('response' in gate) return gate.response
  const body = await request.json().catch(() => ({}))
  try {
    const row = await updateReminder({
      id: String(body.id || ''),
      title_en: body.title_en,
      title_am: body.title_am,
      description_en: body.description_en,
      description_am: body.description_am,
      status: body.status
    })
    return NextResponse.json({ ok: true, row })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Update failed.' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request) {
  const gate = await requireApiPermission(['kitabs.archive', 'kitabs.edit'])
  if ('response' in gate) return gate.response
  const body = await request.json().catch(() => ({}))
  const id = String(body.id || '')
  if (!id) return NextResponse.json({ ok: false, error: 'id required.' }, { status: 400 })
  await deleteReminder(id)
  return NextResponse.json({ ok: true, message: 'Reminder deleted from Admin and home page.' })
}
