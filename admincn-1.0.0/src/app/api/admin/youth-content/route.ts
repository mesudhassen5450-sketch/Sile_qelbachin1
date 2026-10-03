import { NextResponse } from 'next/server'

import { requireApiPermission } from '@/lib/auth/guards'
import {
  deleteYouthContent,
  listYouthContent,
  upsertYouthContent,
  type YouthKind,
} from '@/lib/cms/youth-content'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KINDS = new Set(['marriage', 'articles', 'questions'])

function parseKind(raw: unknown): YouthKind | null {
  const k = String(raw || '')
  return KINDS.has(k) ? (k as YouthKind) : null
}

export async function GET(request: Request) {
  const gate = await requireApiPermission(['kitabs.view', 'kitabs.edit'])
  if ('response' in gate) return gate.response
  const kind = parseKind(new URL(request.url).searchParams.get('kind'))
  if (!kind) return NextResponse.json({ ok: false, error: 'kind required.' }, { status: 400 })
  try {
    const rows = await listYouthContent(kind)
    return NextResponse.json({ ok: true, kind, count: rows.length, rows })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Load failed.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const gate = await requireApiPermission(['kitabs.create', 'kitabs.publish'])
  if ('response' in gate) return gate.response
  const body = await request.json().catch(() => ({}))
  const kind = parseKind(body.kind)
  if (!kind) return NextResponse.json({ ok: false, error: 'kind required.' }, { status: 400 })
  try {
    const row = await upsertYouthContent(kind, body)
    return NextResponse.json({
      ok: true,
      row,
      message:
        kind === 'questions'
          ? 'Saved. Appears on /questions (and home featured slots if Featured is checked).'
          : 'Saved and visible on the website when published.',
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Save failed.' },
      { status: 400 }
    )
  }
}

export async function PATCH(request: Request) {
  const gate = await requireApiPermission(['kitabs.edit', 'kitabs.publish'])
  if ('response' in gate) return gate.response
  const body = await request.json().catch(() => ({}))
  const kind = parseKind(body.kind)
  if (!kind || !body.id) {
    return NextResponse.json({ ok: false, error: 'kind and id required.' }, { status: 400 })
  }
  try {
    const row = await upsertYouthContent(kind, body)
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
  const kind = parseKind(body.kind)
  const id = String(body.id || '')
  if (!kind || !id) {
    return NextResponse.json({ ok: false, error: 'kind and id required.' }, { status: 400 })
  }
  try {
    await deleteYouthContent(kind, id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Delete failed.' },
      { status: 400 }
    )
  }
}
