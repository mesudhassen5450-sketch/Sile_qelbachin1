import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { createReadStream, existsSync, readdirSync, statSync } from 'fs'
import { join, relative, sep } from 'path'
import { createHash } from 'crypto'

import type { R2ObjectInfo } from './types'
import { guessMimeFromExtension } from './media-type'

export type R2Env = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  endpoint: string
  publicBaseUrl: string
  objectPrefix: string
  mediaMirrorPath: string | null
}

function trimEnv(value: string | undefined): string {
  return (value || '').trim().replace(/^["']|["']$/g, '')
}

/** Reject common placeholders mistakenly pasted into Render / .env */
function sanitizeCredential(value: string): string {
  const v = trimEnv(value)
  if (!v) return ''
  const lower = v.toLowerCase()
  if (
    lower === 'value' ||
    lower === 'changeme' ||
    lower === 'your_key' ||
    lower === 'xxx' ||
    lower === 'key' ||
    lower === 'n/a' ||
    /^x+$/i.test(v) ||
    /^\.+$/.test(v)
  ) {
    return ''
  }
  return v
}

export function getR2Env(): R2Env {
  const accountId =
    sanitizeCredential(process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID) ||
    '26e435690c62468180455b796d21b3ab'
  const endpoint =
    trimEnv(process.env.R2_ENDPOINT || process.env.R2_S3_ENDPOINT) ||
    `https://${accountId}.r2.cloudflarestorage.com`

  return {
    accountId,
    accessKeyId: sanitizeCredential(process.env.R2_ACCESS_KEY_ID),
    secretAccessKey: sanitizeCredential(process.env.R2_SECRET_ACCESS_KEY),
    // CF dashboard / API bucket name (legacy spelling: mediea)
    bucket: trimEnv(process.env.R2_BUCKET_NAME) || 'sileqelbachinmediea',
    endpoint,
    publicBaseUrl: (
      trimEnv(process.env.R2_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_BASE) ||
      'https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev'
    ).replace(/\/+$/, ''),
    objectPrefix: (
      trimEnv(process.env.NEXT_PUBLIC_R2_OBJECT_PREFIX || process.env.R2_OBJECT_PREFIX) ||
      'sileqelbachin-meadia'
    ).replace(/^\/+|\/+$/g, ''),
    mediaMirrorPath: trimEnv(process.env.R2_MEDIA_MIRROR_PATH) || null
  }
}

export function hasR2ApiCredentials(env = getR2Env()): boolean {
  return Boolean(env.accessKeyId && env.secretAccessKey)
}

/** Cloudflare R2 Access Key ID is 32 chars; Secret Access Key is typically 64. */
export function diagnoseR2Credentials(env = getR2Env()): {
  ok: boolean
  issues: string[]
} {
  const issues: string[] = []
  if (!env.accessKeyId) issues.push('R2_ACCESS_KEY_ID is missing.')
  else if (env.accessKeyId.length !== 32) {
    issues.push(
      `R2_ACCESS_KEY_ID on this server is ${env.accessKeyId.length} characters (must be exactly 32). On Render → Sile_qelbachin1-1 → Environment: paste the Access Key ID from Cloudflare R2 → Manage R2 API Tokens (not the secret, not “key”).`
    )
  }
  if (!env.secretAccessKey) issues.push('R2_SECRET_ACCESS_KEY is missing on this server (Render env).')
  else if (env.secretAccessKey.length < 40) {
    issues.push(
      `R2_SECRET_ACCESS_KEY looks truncated (${env.secretAccessKey.length} chars). Paste the full ~64 character Secret Access Key into Render Environment, then Manual Deploy.`
    )
  }
  if (!env.bucket) issues.push('R2_BUCKET_NAME is missing.')
  if (!env.endpoint) issues.push('R2_ENDPOINT is missing.')
  return { ok: issues.length === 0, issues }
}

export function buildPublicUrl(objectKey: string, env = getR2Env()): string {
  const segments = objectKey.split('/').map(seg => {
    try {
      return encodeURIComponent(decodeURIComponent(seg))
    } catch {
      return encodeURIComponent(seg)
    }
  })
  return `${env.publicBaseUrl}/${segments.join('/')}`
}

function createS3Client(env: R2Env): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: env.endpoint,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey
    },
    forcePathStyle: true,
    // Avoid AWS SDK v3 default checksum headers that break R2 PutObject signatures
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED'
  })
}

async function listFromR2(env: R2Env): Promise<R2ObjectInfo[]> {
  const client = createS3Client(env)
  const objects: R2ObjectInfo[] = []
  let continuationToken: string | undefined

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: env.bucket,
        Prefix: env.objectPrefix ? `${env.objectPrefix}/` : undefined,
        ContinuationToken: continuationToken,
        MaxKeys: 1000
      })
    )

    for (const item of res.Contents || []) {
      if (!item.Key || item.Key.endsWith('/')) continue
      objects.push({
        object_key: item.Key,
        size: item.Size ?? null,
        last_modified: item.LastModified?.toISOString() ?? null,
        etag: item.ETag?.replace(/"/g, '') ?? null,
        mime_type: guessMimeFromExtension(item.Key)
      })
    }

    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (continuationToken)

  return objects
}

function walkMirror(dir: string, root: string, prefix: string, out: R2ObjectInfo[]) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      walkMirror(full, root, prefix, out)
      continue
    }
    const rel = relative(root, full).split(sep).join('/')
    const objectKey = prefix ? `${prefix}/${rel}` : rel
    out.push({
      object_key: objectKey,
      size: st.size,
      last_modified: st.mtime.toISOString(),
      etag: null,
      mime_type: guessMimeFromExtension(objectKey)
    })
  }
}

function listFromMirror(env: R2Env): R2ObjectInfo[] {
  const root = env.mediaMirrorPath
  if (!root || !existsSync(root)) {
    throw new Error(
      'R2 API credentials missing and R2_MEDIA_MIRROR_PATH is not set or does not exist.'
    )
  }
  const out: R2ObjectInfo[] = []
  walkMirror(root, root, env.objectPrefix, out)
  return out
}

export type ScanSource = 'r2' | 'mirror'

export async function listStorageObjects(): Promise<{
  objects: R2ObjectInfo[]
  source: ScanSource
  env: R2Env
}> {
  const env = getR2Env()
  if (hasR2ApiCredentials(env)) {
    try {
      const objects = await listFromR2(env)
      return { objects, source: 'r2', env }
    } catch (err) {
      if (env.mediaMirrorPath && existsSync(env.mediaMirrorPath)) {
        console.warn('[cms] R2 list failed, falling back to media mirror:', err)
        return { objects: listFromMirror(env), source: 'mirror', env }
      }
      throw err
    }
  }

  return { objects: listFromMirror(env), source: 'mirror', env }
}

export async function headObjectExists(objectKey: string): Promise<boolean> {
  const env = getR2Env()
  if (!hasR2ApiCredentials(env)) {
    if (!env.mediaMirrorPath) return false
    const rel = objectKey.startsWith(`${env.objectPrefix}/`)
      ? objectKey.slice(env.objectPrefix.length + 1)
      : objectKey
    return existsSync(join(env.mediaMirrorPath, rel))
  }

  try {
    const client = createS3Client(env)
    await client.send(new HeadObjectCommand({ Bucket: env.bucket, Key: objectKey }))
    return true
  } catch {
    return false
  }
}

/**
 * Upload bytes to Cloudflare R2 (S3 PutObject). Server-only — never expose R2 secrets to the browser.
 */
function formatR2SdkError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err)
  const name = err && typeof err === 'object' && 'name' in err ? String((err as { name: unknown }).name) : ''
  if (name === 'SignatureDoesNotMatch' || /signature we calculated does not match/i.test(msg)) {
    const diag = diagnoseR2Credentials()
    const hint = diag.issues.length
      ? diag.issues.join(' ')
      : 'Regenerate the R2 API token in Cloudflare → R2 → Manage R2 API Tokens, then set R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY in .env.local and restart Admin.'
    return new Error(`Cloudflare R2 auth failed (SignatureDoesNotMatch). ${hint}`)
  }
  return err instanceof Error ? err : new Error(msg)
}

export async function putObjectToR2(input: {
  objectKey: string
  body: Buffer | Uint8Array
  contentType?: string | null
  cacheControl?: string
}): Promise<{ objectKey: string; publicUrl: string; etag: string | null }> {
  const env = getR2Env()
  if (!hasR2ApiCredentials(env)) {
    throw new Error(
      'R2 upload requires R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY on the Admin server.'
    )
  }
  const diag = diagnoseR2Credentials(env)
  if (!diag.ok) {
    throw new Error(diag.issues.join(' '))
  }

  const client = createS3Client(env)
  try {
    const res = await client.send(
      new PutObjectCommand({
        Bucket: env.bucket,
        Key: input.objectKey,
        Body: input.body,
        ContentType: input.contentType || guessMimeFromExtension(input.objectKey) || undefined,
        CacheControl: input.cacheControl || 'public, max-age=31536000, immutable'
      })
    )

    return {
      objectKey: input.objectKey,
      publicUrl: buildPublicUrl(input.objectKey, env),
      etag: res.ETag?.replace(/"/g, '') ?? null
    }
  } catch (err) {
    throw formatR2SdkError(err)
  }
}

/** Delete one object from Cloudflare R2. Missing keys are treated as success. */
export async function deleteObjectFromR2(objectKey: string): Promise<{ deleted: boolean; objectKey: string }> {
  const env = getR2Env()
  if (!hasR2ApiCredentials(env)) {
    throw new Error('R2 delete requires R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.')
  }
  if (!objectKey?.trim()) return { deleted: false, objectKey }

  const client = createS3Client(env)
  try {
    await client.send(new DeleteObjectCommand({ Bucket: env.bucket, Key: objectKey }))
    return { deleted: true, objectKey }
  } catch (err) {
    throw formatR2SdkError(err)
  }
}

export async function verifyR2Connection(): Promise<{
  ok: boolean
  bucket: string
  endpoint: string
  issues: string[]
  sampleKeys: string[]
  error?: string
}> {
  const env = getR2Env()
  const diag = diagnoseR2Credentials(env)
  if (!diag.ok) {
    return {
      ok: false,
      bucket: env.bucket,
      endpoint: env.endpoint,
      issues: diag.issues,
      sampleKeys: []
    }
  }
  try {
    const client = createS3Client(env)
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: env.bucket,
        Prefix: env.objectPrefix ? `${env.objectPrefix}/` : undefined,
        MaxKeys: 5
      })
    )
    return {
      ok: true,
      bucket: env.bucket,
      endpoint: env.endpoint,
      issues: [],
      sampleKeys: (res.Contents || []).map(c => c.Key || '').filter(Boolean)
    }
  } catch (err) {
    const formatted = formatR2SdkError(err)
    return {
      ok: false,
      bucket: env.bucket,
      endpoint: env.endpoint,
      issues: diag.issues,
      sampleKeys: [],
      error: formatted.message
    }
  }
}

export function buildStaffUploadObjectKey(input: {
  mediaType: string
  fileName: string
  folder?: string
}): string {
  const env = getR2Env()
  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const safe = input.fileName
    .replace(/[^a-zA-Z0-9._\-\u1200-\u137F]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120)
  const folder = (input.folder || 'staff-uploads').replace(/^\/+|\/+$/g, '')
  const typeFolder = input.mediaType || 'other'
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return `${env.objectPrefix}/${folder}/${typeFolder}/${yyyy}/${mm}/${stamp}-${safe}`
}

export async function checksumLocalMirrorFile(objectKey: string): Promise<string | null> {
  const env = getR2Env()
  if (!env.mediaMirrorPath) return null
  const rel = objectKey.startsWith(`${env.objectPrefix}/`)
    ? objectKey.slice(env.objectPrefix.length + 1)
    : objectKey
  const full = join(env.mediaMirrorPath, rel)
  if (!existsSync(full)) return null

  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(full)
    stream.on('data', chunk => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
    stream.on('error', reject)
  })
}
