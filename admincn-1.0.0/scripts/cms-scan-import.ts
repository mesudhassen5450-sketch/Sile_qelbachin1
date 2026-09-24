/**
 * CLI: scan R2/mirror + match static content into local CMS store.
 * Usage: npx tsx scripts/cms-scan-import.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

async function main() {
  const { scanAndImportMedia } = await import('../src/lib/cms/scan-import')
  const { matchStaticContent } = await import('../src/lib/cms/match-static')
  const { getContentStats, loadLocalStore } = await import('../src/lib/cms/local-store')

  console.log('Scanning storage…')
  const scan1 = await scanAndImportMedia({ adminEmail: 'cli' })
  console.log('Scan 1 summary:', JSON.stringify(scan1.run, null, 2))

  console.log('Re-scanning (idempotency check)…')
  const scan2 = await scanAndImportMedia({ adminEmail: 'cli' })
  console.log('Scan 2 summary:', {
    total: scan2.run.total_objects,
    imported: scan2.run.imported,
    updated: scan2.run.updated,
    skipped: scan2.run.skipped,
    failed: scan2.run.failed
  })

  console.log('Matching static content…')
  const match = await matchStaticContent({ adminEmail: 'cli', publish: true })
  console.log('Match:', JSON.stringify(match, null, 2))

  const stats = getContentStats(loadLocalStore())
  console.log('Final stats:', JSON.stringify(stats, null, 2))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
