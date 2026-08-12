import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SITE_CONFIG, HeaderConfig } from '@/lib/supabase/types';

// Shared between here and src/app/api/admin/site-config/route.ts, which calls
// revalidateTag(HEADER_CONFIG_CACHE_TAG) on save so an admin edit (favicon,
// logo, nav links) takes effect on the live site within seconds instead of
// waiting out the TTL below. Mirrors TRACKING_CONFIG_CACHE_TAG in
// src/lib/trackingScripts.ts.
export const HEADER_CONFIG_CACHE_TAG = 'site-header-config';

interface HeaderConfigWithTimestamp {
  header: HeaderConfig;
  updatedAt: string;
}

async function fetchHeaderConfig(): Promise<HeaderConfigWithTimestamp> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('admin_settings') as any)
      .select('value, updated_at')
      .eq('key', 'site_config_header')
      .single();

    if (error || !data) {
      return { header: DEFAULT_SITE_CONFIG.header, updatedAt: '' };
    }

    return {
      header: (data.value as HeaderConfig) ?? DEFAULT_SITE_CONFIG.header,
      updatedAt: (data.updated_at as string) ?? '',
    };
  } catch (error) {
    console.error('Error fetching header config:', error);
    return { header: DEFAULT_SITE_CONFIG.header, updatedAt: '' };
  }
}

// src/app/layout.tsx wraps every page, so an uncached call here would hit
// Supabase on every single page view. 300s is just a safety-net TTL — the
// admin save path busts this via revalidateTag well before that.
const getCachedHeaderConfig = unstable_cache(
  fetchHeaderConfig,
  ['site-header-config'],
  { tags: [HEADER_CONFIG_CACHE_TAG], revalidate: 300 }
);

/**
 * Resolves the admin-uploaded favicon URL, with a cache-busting `?v=` query
 * param derived from the settings row's `updated_at` — browsers cache
 * favicons aggressively and won't refetch an unchanged URL, so the query
 * param only changes (forcing a refetch) when the admin actually saves.
 * Returns undefined when no favicon has been uploaded, so callers can fall
 * back to the static /favicon.ico.
 */
export async function getFaviconUrl(): Promise<string | undefined> {
  const { header, updatedAt } = await getCachedHeaderConfig();
  if (!header.faviconUrl) return undefined;
  return `${header.faviconUrl}?v=${encodeURIComponent(updatedAt)}`;
}
