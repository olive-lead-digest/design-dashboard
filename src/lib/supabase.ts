import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { IS_TESTER_MODE } from './constants';

/**
 * Server-side Supabase client (service role) — API routes only, never shipped to browser.
 * Returns null in tester mode or when env is absent → callers fall back to the mock store.
 */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (IS_TESTER_MODE || !url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Browser client (anon key, RLS enforced). Null in tester mode. */
export function getBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (IS_TESTER_MODE || !url || !key) return null;
  return createClient(url, key);
}
