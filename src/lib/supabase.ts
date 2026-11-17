import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

export const isConfigured = Boolean(
  url &&
  key &&
  /^https:\/\//i.test(url) &&
  key.length > 20
)

// Only the public anon key is ever used in the browser. Access is enforced by RLS + RPCs.
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null
