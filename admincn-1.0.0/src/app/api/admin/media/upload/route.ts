import { NextResponse } from 'next/server'

import { requireApiPermission, writeAuditLog } from '@/lib/auth/guards'
import { uploadStaffMedia } from '@/lib/cms/staff-upload'
import { diagnoseR2Credentials, hasR2ApiCredentials } from '@/lib/cms/r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Max body handled by Next for this route (approx). */
export const maxDuration = 60

/**
 * Staff upload → online storage (never Cloudinary).
 * multipart/form-data: file, optional title fields handled by /api/admin/content publish.
 */
export async function POST(request: Request) {
  const gate = await requireApiPermission(['media.upload', 'media.scan'])
  if ('response' in gate) return gate.response

  if (!hasR2ApiCredentials()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Online storage is not configured for uploads. Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT on Render.'
      },
      { status: 503 }
    )
  }

  const diag = diagnoseR2Credentials()
  if (!diag.ok) {
    return NextResponse.json({ ok: false, error: diag.issues.join(' ') }, { status: 503 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'Expected multipart form upload.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'file field required.' }, { status: 400 })
  }

  const folder = String(form.get('folder') || 'staff-uploads')
  const publishAsset = String(form.get('publish_asset') || '') === 'true'
  const bytes = Buffer.from(await file.arrayBuffer())

  try {
    const result = await uploadStaffMedia({
      fileName: file.name || 'upload.bin',
      mimeType: file.type || null,
      bytes,
      folder,
      adminEmail: gate.ctx.user.email,
      publishAsset
    })

    await writeAuditLog({
      userId: gate.ctx.user.id,
      adminEmail: gate.ctx.user.email,
      action: 'media_uploaded',
      entityType: 'media_assets',
      entityId: result.asset.id,
      after: { object_key: result.object_key, public_url: result.public_url }
    })

    return NextResponse.json({
      ok: true,
      asset: result.asset,
      public_url: result.public_url,
      object_key: result.object_key,
      backend: result.backend,
      message:
        'File stored online. Create/publish a content item to show it on website and mobile.'
    })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Upload failed.' },
      { status: 500 }
    )
  }
}
