/**
 * Print R2 env values for pasting into Render (Sile_qelbachin1-1 → Environment).
 * Reads admincn-1.0.0/.env.local — never commit the output.
 *
 *   npm run r2:print-render-env
 */
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

function line(key: string, value: string) {
  console.log(`${key}=${value}`)
}

const access = (process.env.R2_ACCESS_KEY_ID || '').trim()
const secret = (process.env.R2_SECRET_ACCESS_KEY || '').trim()

console.log('# Paste these into Render → Sile_qelbachin1-1 → Environment, then Manual Deploy')
console.log(`# Access Key ID length: ${access.length} (must be 32)`)
console.log(`# Secret length: ${secret.length} (must be ~64)`)
console.log('')
line('R2_ACCESS_KEY_ID', access)
line('R2_SECRET_ACCESS_KEY', secret)
line('R2_BUCKET_NAME', process.env.R2_BUCKET_NAME || 'sileqelbachinmediea')
line(
  'R2_ENDPOINT',
  process.env.R2_ENDPOINT ||
    'https://26e435690c62468180455b796d21b3ab.r2.cloudflarestorage.com'
)
line(
  'R2_PUBLIC_BASE_URL',
  process.env.R2_PUBLIC_BASE_URL ||
    'https://pub-03bea4f667534df5ab6c67f073c73d1e.r2.dev'
)
line('CLOUDFLARE_ACCOUNT_ID', process.env.CLOUDFLARE_ACCOUNT_ID || '26e435690c62468180455b796d21b3ab')
line('NEXT_PUBLIC_R2_PUBLIC_BASE', process.env.NEXT_PUBLIC_R2_PUBLIC_BASE || '')
line('NEXT_PUBLIC_R2_OBJECT_PREFIX', process.env.NEXT_PUBLIC_R2_OBJECT_PREFIX || 'sileqelbachin-meadia')
