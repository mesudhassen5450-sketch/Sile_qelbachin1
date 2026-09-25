import { NextResponse } from 'next/server'

import { requireApiPermission, writeAuditLog } from '@/lib/auth/guards'
import { matchStaticContent } from '@/lib/cms/match-static'
import { promoteOrphanMedia } from '@/lib/cms/promote-orphans'
import { scanAndImportMedia } from '@/lib/cms/scan-import'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * One-click: list Cloudflare R2 → media_assets → match kitabs / ders / audio / video / pdfs.
 * Official website/mobile then read published rows from the public API.
 */
export async function POST(request: Request) {
  const gate = await requireApiPermission('media.scan')
  if ('response' in gate) return gate.response

  const body = await request.json().catch(() => ({}))
  const publish = body.publish !== false

  try {
    const scan = await scanAndImportMedia({
      adminEmail: gate.ctx.user.email || 'admin'
    })
    const match = await matchStaticContent({
      adminEmail: gate.ctx.user.email || 'admin',
      publish
    })
    const orphans = await promoteOrphanMedia({
      adminEmail: gate.ctx.user.email || 'admin',
      publish
    })

    await writeAuditLog({
      userId: gate.ctx.user.id,
      adminEmail: gate.ctx.user.email,
      action: 'media_sync_r2',
      entityType: 'content',
      after: {
        scan: {
          total: scan.run.total_objects,
          imported: scan.run.imported,
          updated: scan.run.updated
        },
        match,
        orphans
      }
    })

    return NextResponse.json({
      ok: true,
      message:
        'Synced Cloudflare R2 into Admin. Kitabs / Audio / Video / PDFs are ready to manage and published to the public API.',
      scan: {
        total_r2_objects: scan.run.total_objects,
        imported: scan.run.imported,
        updated: scan.run.updated,
        skipped: scan.run.skipped,
        by_type: scan.run.by_type,
        source: scan.run.source
      },
      match,
      orphans
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
