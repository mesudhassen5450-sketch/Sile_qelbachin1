import { NextResponse } from 'next/server'

import { requireApiPermission } from '@/lib/auth/guards'
import { diagnoseR2Credentials, getR2Env, verifyR2Connection } from '@/lib/cms/r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Quick Cloudflare R2 credential / bucket check for Admin UI banners. */
export async function GET() {
  const gate = await requireApiPermission(['media.upload', 'media.view', 'media.scan'])
  if ('response' in gate) return gate.response

  const env = getR2Env()
  const diag = diagnoseR2Credentials(env)
  const live = await verifyR2Connection()

  return NextResponse.json({
    ok: live.ok,
    bucket: live.bucket,
    endpoint: live.endpoint,
    object_prefix: env.objectPrefix,
    access_key_len: env.accessKeyId.length,
    secret_key_len: env.secretAccessKey.length,
    issues: live.error ? [...diag.issues, live.error] : diag.issues,
    sample_keys: live.sampleKeys,
    fix:
      'Cloudflare dashboard → R2 → Overview → Manage R2 API Tokens → Create API token (Object Read & Write). Copy Access Key ID (32 chars) and Secret Access Key (~64 chars) into admincn-1.0.0/.env.local as R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY, set R2_BUCKET_NAME to your exact bucket name, then restart Admin.'
  })
}
