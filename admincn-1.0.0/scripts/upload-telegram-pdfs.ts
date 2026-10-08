/**
 * One-shot: upload PDFs from a Telegram ChatExport folder to R2,
 * register media_assets, and attach them to matching pdf_items (Supabase + local).
 *
 * Usage:
 *   npx tsx scripts/upload-telegram-pdfs.ts "/path/to/ChatExport_.../files"
 */
import { config } from 'dotenv'
import { createHash } from 'crypto'
import { readdirSync, readFileSync, statSync, copyFileSync, mkdirSync, existsSync } from 'fs'
import { basename, join, resolve } from 'path'
import { randomUUID } from 'crypto'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

function nowIso() {
  return new Date().toISOString()
}

function nfc(s: string) {
  return s.normalize('NFC')
}

function normName(s: string) {
  return nfc(s || '')
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/t\.me\/\S+/gi, '')
    .replace(/[\s_\-·•|❝❞▢▣⭕️😀📜]+/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '')
}

async function main() {
  const srcDir = process.argv[2]
  if (!srcDir) {
    console.error('Usage: npx tsx scripts/upload-telegram-pdfs.ts <export-files-dir>')
    process.exit(1)
  }

  const {
    putObjectToR2,
    getR2Env,
    hasR2ApiCredentials,
    buildPublicUrl
  } = await import('../src/lib/cms/r2')
  const { upsertMediaAssetsRemote, getServiceSupabase, isSupabaseConfigured, loadSupabaseSnapshot } =
    await import('../src/lib/cms/supabase')
  const {
    loadLocalStore,
    saveLocalStore,
    upsertMediaAsset,
    nowIso: storeNow
  } = await import('../src/lib/cms/local-store')

  const env = getR2Env()
  if (!hasR2ApiCredentials(env)) {
    throw new Error('Missing R2 credentials in .env.local')
  }

  const files = readdirSync(srcDir)
    .filter(f => /\.pdf$/i.test(f))
    .map(f => join(srcDir, f))

  console.log(`Found ${files.length} PDFs in ${srcDir}`)
  if (!files.length) process.exit(1)

  // Optional: mirror into local media folder
  const mirrorRoot = env.mediaMirrorPath
    ? join(env.mediaMirrorPath, 'files')
    : null
  if (mirrorRoot) {
    mkdirSync(mirrorRoot, { recursive: true })
  }

  type Uploaded = {
    filename: string
    objectKey: string
    publicUrl: string
    size: number
    checksum: string
  }
  const uploaded: Uploaded[] = []

  for (const filePath of files) {
    const filename = basename(filePath)
    const body = readFileSync(filePath)
    const size = statSync(filePath).size
    const checksum = createHash('sha256').update(body).digest('hex')
    const objectKey = `${env.objectPrefix}/files/${filename}`

    process.stdout.write(`Upload ${filename} (${Math.round(size / 1024)} KB)… `)
    const res = await putObjectToR2({
      objectKey,
      body,
      contentType: 'application/pdf'
    })
    console.log('ok')

    if (mirrorRoot) {
      const dest = join(mirrorRoot, filename)
      try {
        copyFileSync(filePath, dest)
      } catch (err) {
        console.warn('  mirror copy skipped:', err instanceof Error ? err.message : err)
      }
    }

    uploaded.push({
      filename,
      objectKey: res.objectKey,
      publicUrl: res.publicUrl || buildPublicUrl(res.objectKey, env),
      size,
      checksum
    })
  }

  // Build media asset records
  const bucket = env.bucket
  const assetsInput = uploaded.map(u => ({
    id: randomUUID(),
    media_type: 'pdf' as const,
    storage_provider: 'cloudflare_r2' as const,
    bucket,
    object_key: u.objectKey,
    public_url: u.publicUrl,
    mime_type: 'application/pdf',
    file_size: u.size,
    duration_seconds: null,
    checksum: u.checksum,
    etag: null,
    last_modified: nowIso(),
    status: 'published' as const,
    health_status: 'healthy' as const,
    is_imported: true,
    is_orphan: false,
    needs_review: false,
    detected_content: {
      kind: 'unknown',
      needsReview: false
    },
    metadata: {
      source: 'telegram-export',
      original_filename: u.filename
    },
    last_verified_at: nowIso(),
    created_at: nowIso(),
    updated_at: nowIso()
  }))

  console.log('\nRegistering media_assets…')
  let resolvedAssets = assetsInput
  if (isSupabaseConfigured()) {
    resolvedAssets = (await upsertMediaAssetsRemote(assetsInput as never)) as typeof assetsInput
    console.log(`  Supabase media_assets upserted: ${resolvedAssets.length}`)
  }

  // Local store upsert
  const store = loadLocalStore()
  for (const asset of resolvedAssets) {
    upsertMediaAsset(store, {
      ...asset,
      last_verified_at: storeNow()
    } as never)
  }

  // Load pdf_items (prefer supabase snapshot)
  let pdfItems = store.pdf_items
  if (isSupabaseConfigured()) {
    const snap = await loadSupabaseSnapshot()
    if (snap?.pdf_items?.length) pdfItems = snap.pdf_items as typeof pdfItems
  }

  const byNorm = new Map<string, (typeof resolvedAssets)[0]>()
  for (const a of resolvedAssets) {
    const fn =
      (a.metadata as { original_filename?: string } | undefined)?.original_filename ||
      a.object_key.split('/').pop() ||
      ''
    byNorm.set(normName(fn), a)
    byNorm.set(normName(a.object_key.split('/').pop() || ''), a)
  }

  function findAssetForTitle(...parts: Array<string | null | undefined>) {
    const blob = normName(parts.filter(Boolean).join(' '))
    if (!blob) return null
    // exact
    for (const [n, a] of byNorm) {
      if (!n) continue
      if (blob === n || blob.includes(n) || n.includes(blob)) return a
      // significant shared prefix
      if (n.length >= 12 && blob.includes(n.slice(0, Math.min(24, n.length)))) return a
    }
    return null
  }

  let linked = 0
  const unmatchedPdfs: string[] = []
  const updatedPdfRows: typeof pdfItems = []

  for (const p of pdfItems) {
    const meta = (p.metadata || {}) as Record<string, unknown>
    const asset = findAssetForTitle(
      p.title_am,
      p.title_ar,
      p.title_en,
      typeof meta.rawFilename === 'string' ? meta.rawFilename : null,
      p.legacy_id
    )
    if (!asset) {
      unmatchedPdfs.push(p.legacy_id || p.id)
      updatedPdfRows.push(p)
      continue
    }
    const next = {
      ...p,
      media_asset_id: asset.id,
      updated_at: nowIso(),
      status: p.status || 'published',
      published_at: p.published_at || nowIso()
    }
    updatedPdfRows.push(next)
    linked += 1
    console.log(`Link ${p.legacy_id || p.id} → ${asset.object_key.split('/').pop()}`)
  }

  store.pdf_items = updatedPdfRows
  saveLocalStore(store)

  if (isSupabaseConfigured()) {
    const sb = getServiceSupabase()!
    // Upsert only rows we linked (safer)
    const toUpsert = updatedPdfRows.filter(p => p.media_asset_id)
    if (toUpsert.length) {
      const { error } = await sb.from('pdf_items').upsert(toUpsert, { onConflict: 'id' })
      if (error) {
        // try legacy_id conflict
        const { error: err2 } = await sb.from('pdf_items').upsert(toUpsert, {
          onConflict: 'legacy_id'
        })
        if (err2) throw new Error(`pdf_items upsert failed: ${error.message} / ${err2.message}`)
      }
      console.log(`Supabase pdf_items linked: ${linked}`)
    }
  }

  // Create published pdf_items for uploaded files with no CMS match
  const linkedAssetIds = new Set(
    updatedPdfRows.map(p => p.media_asset_id).filter(Boolean) as string[]
  )
  const orphanUploads = resolvedAssets.filter(a => !linkedAssetIds.has(a.id))
  if (orphanUploads.length) {
    console.log(`\nCreating ${orphanUploads.length} new pdf_items for unmatched uploads…`)
    const news = orphanUploads.map(a => {
      const filename =
        (a.metadata as { original_filename?: string })?.original_filename ||
        a.object_key.split('/').pop() ||
        'document.pdf'
      const title = filename.replace(/\.pdf$/i, '')
      return {
        id: randomUUID(),
        legacy_id: `export-${normName(filename).slice(0, 40) || randomUUID().slice(0, 8)}`,
        kitab_id: null,
        title_am: title,
        title_ar: title,
        title_en: title,
        media_asset_id: a.id,
        version_label: null,
        view_count: 0,
        download_count: 0,
        status: 'published' as const,
        category: 'PDF',
        priority: 100,
        featured: false,
        scheduled_at: null,
        metadata: { rawFilename: filename, source: 'telegram-export' },
        created_at: nowIso(),
        updated_at: nowIso(),
        published_at: nowIso()
      }
    })
    store.pdf_items = [...news, ...store.pdf_items]
    saveLocalStore(store)
    if (isSupabaseConfigured()) {
      const sb = getServiceSupabase()!
      const { error } = await sb.from('pdf_items').upsert(news, { onConflict: 'legacy_id' })
      if (error) console.warn('new pdf_items upsert:', error.message)
      else console.log(`Created ${news.length} new published PDFs`)
    }
  }

  // Update website content.json fileUrls to flat files/<name> now that they exist on R2
  const contentPath = resolve(process.cwd(), '../src/data/content.json')
  if (existsSync(contentPath)) {
    const raw = JSON.parse(readFileSync(contentPath, 'utf8'))
    let fixed = 0
    const nameToRel = new Map(
      uploaded.map(u => [normName(u.filename), `files/${u.filename}`] as const)
    )
    function walk(x: unknown) {
      if (Array.isArray(x)) x.forEach(walk)
      else if (x && typeof x === 'object') {
        const o = x as Record<string, unknown>
        if (o.type === 'pdf') {
          const name = nfc(String(o.rawFilename || basename(String(o.fileUrl || ''))))
          const rel = nameToRel.get(normName(name))
          if (rel && o.fileUrl !== rel) {
            o.fileUrl = rel
            fixed += 1
          }
        }
        Object.values(o).forEach(v => {
          if (v && typeof v === 'object') walk(v)
        })
      }
    }
    walk(raw)
    const { writeFileSync } = await import('fs')
    writeFileSync(contentPath, JSON.stringify(raw, null, 2) + '\n', 'utf8')
    console.log(`content.json paths updated: ${fixed}`)
  }

  console.log('\nDone.')
  console.log(`Uploaded: ${uploaded.length}`)
  console.log(`Linked existing CMS PDFs: ${linked}`)
  console.log(`Unmatched existing CMS rows: ${unmatchedPdfs.length}`)
  if (unmatchedPdfs.length) console.log('  ', unmatchedPdfs.join(', '))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
