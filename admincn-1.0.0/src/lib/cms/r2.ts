import { ListObjectsV2Command, S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'
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

export function getR2Env(): R2Env {
  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '26e435690c62468180455b796d21b3ab'
  const endpoint =
    process.env.R2_ENDPOINT ||
    process.env.R2_S3_ENDPOINT ||
    `https://${accountId}.r2.cloudflarestorage.com`

  return {
    accountId,
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET_NAME || 'sileqelbachinmediea',
    endpoint,
    publicBaseUrl: (
      process.env.R2_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_R2_PUBLIC_BASE ||
      'https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev'
    ).replace(/\/+$/, ''),
    objectPrefix: (
      process.env.NEXT_PUBLIC_R2_OBJECT_PREFIX ||
      process.env.R2_OBJECT_PREFIX ||
      'sileqelbachin-meadia'
    ).replace(/^\/+|\/+$/g, ''),
    mediaMirrorPath: process.env.R2_MEDIA_MIRROR_PATH || null
  }
}

export function hasR2ApiCredentials(env = getR2Env()): boolean {
  return Boolean(env.accessKeyId && env.secretAccessKey)
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
    forcePathStyle: true
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
