import { NextResponse } from 'next/server'

import { requireApiPermission } from '@/lib/auth/guards'
import { aggregateAnalytics } from '@/lib/cms/reminders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Real library counts + website/mobile events captured from the public site (no mock numbers). */
export async function GET(request: Request) {
  const gate = await requireApiPermission(['dashboard.view', 'analytics.view'])
  if ('response' in gate) return gate.response
  const days = Number(new URL(request.url).searchParams.get('days') || 7)
  const stats = aggregateAnalytics(Number.isFinite(days) ? days : 7)
  return NextResponse.json({ ok: true, ...stats })
}
