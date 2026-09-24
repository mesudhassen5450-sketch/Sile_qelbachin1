import { NextResponse } from 'next/server'

import { requireApiPermission, writeAuditLog } from '@/lib/auth/guards'
import { scanAndImportMedia } from '@/lib/cms/scan-import'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: Request) {
  const gate = await requireApiPermission('media.scan')
  if ('response' in gate) return gate.response

  try {
    const result = await scanAndImportMedia({
      adminEmail: gate.ctx.user.email || 'admin'
    })
    await writeAuditLog({
      userId: gate.ctx.user.id,
      adminEmail: gate.ctx.user.email,
      action: 'media_scan',
      entityType: 'media_assets',
      after: {
        total: result.run.total_objects,
        imported: result.run.imported,
        updated: result.run.updated
      }
    })

    return NextResponse.json({
      ok: true,
      message: 'Scan complete',
      ...result,
      summary: {
        total_r2_objects: result.run.total_objects,
        existing_records_matched: result.run.matched,
        new_objects: result.run.new_objects,
        changed_objects: result.run.changed_objects,
        missing_objects: result.run.missing_objects,
        orphan_objects: result.run.orphan_objects,
        imported: result.run.imported,
        updated: result.run.updated,
        skipped: result.run.skipped,
        failed: result.run.failed,
        needs_review: result.run.needs_review,
        source: result.run.source,
        by_type: result.run.by_type
      }
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    )
  }
}
