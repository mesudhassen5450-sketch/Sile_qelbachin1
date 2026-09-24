import { createClient } from '@supabase/supabase-js'

import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env'

/** Server-only privileged client. Never import from client components. */
export function createServiceClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseServiceRoleKey()
  if (!url || !key) {
    throw new Error('Supabase service role is not configured.')
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
}
