import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the service-role key (bypasses RLS).
 * Never import this from a "use client" component.
 *
 * Throws instead of silently falling back to the anon key, so a missing
 * key fails loudly at request time rather than quietly writing with
 * insufficient privileges (or, worse, appearing to "work" against RLS-open tables).
 *
 * Untyped (no `Database` generic): the generated `Database` type only models
 * a subset of tables, and admin routes touch tables outside that subset.
 */
export function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set.');
  }
  if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key-here' || serviceRoleKey === 'your_supabase_service_role_key_here') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations require the service-role key.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
