import { NextResponse } from 'next/server'

import { requireApiPermission, writeAuditLog } from '@/lib/auth/guards'
import { matchStaticContent } from '@/lib/cms/match-static'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: Request) {
  const gate = await requireApiPermission('media.scan')
  if ('response' in gate) return gate.response

  try {
    const body = await request.json().catch(() => ({}))
    const result = await matchStaticContent({
      adminEmail: gate.ctx.user.email || 'admin',
      publish: body.publish !== false
    })
    await writeAuditLog({
      userId: gate.ctx.user.id,
      adminEmail: gate.ctx.user.email,
      action: 'match_static_content',
      entityType: 'content',
      after: result
    })
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
