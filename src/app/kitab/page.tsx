import { Suspense } from 'react'

import { loadKitabsForWebsite } from '@/lib/loadKitabs'
import KitabPageClient from './KitabPageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function KitabPage() {
  const { kitabs, source } = await loadKitabsForWebsite()
  return (
    <Suspense fallback={<div className="p-8 text-sm text-neutral-500">Loading kitabs…</div>}>
      <KitabPageClient kitabs={kitabs} source={source} />
    </Suspense>
  )
}
