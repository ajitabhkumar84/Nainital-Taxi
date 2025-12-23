/**
 * SUPABASE CLIENT CONFIGURATION
 *
 * Browser-safe client for interacting with Supabase
 * Used in Client Components
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Environment variables (add these to your .env.local file)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file'
  );
}

/**
 * Create a Supabase client for browser-side operations
 * This client includes Row Level Security (RLS) enforcement
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'nainital-fun-taxi',
    },
  },
});

/**
 * Type-safe helper to get the current user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Type-safe helper to sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
