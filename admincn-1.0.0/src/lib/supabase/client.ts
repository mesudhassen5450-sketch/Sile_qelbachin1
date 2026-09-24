'use client'

import { createBrowserClient } from '@supabase/ssr'

import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env'

export function createClient() {
  const url = getSupabaseUrl()
  const key = getSupabasePublishableKey()
  if (!url || !key) {
    throw new Error('Supabase Auth is not configured.')
  }
  return createBrowserClient(url, key)
}
