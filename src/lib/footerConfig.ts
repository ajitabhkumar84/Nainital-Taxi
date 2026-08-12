import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SITE_CONFIG, FooterConfig } from '@/lib/supabase/types';

// Shared between here and src/app/api/admin/site-config/route.ts, which calls
// revalidateTag(FOOTER_CONFIG_CACHE_TAG) on save so an admin edit (tagline,
// link sections, social links) takes effect on the live site within seconds
// instead of waiting out the TTL below. Mirrors HEADER_CONFIG_CACHE_TAG in
// src/lib/branding.ts and TRACKING_CONFIG_CACHE_TAG in
// src/lib/trackingScripts.ts.
export const FOOTER_CONFIG_CACHE_TAG = 'site-footer-config';

async function fetchFooterConfig(): Promise<FooterConfig> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('admin_settings') as any)
      .select('value')
      .eq('key', 'site_config_footer')
      .single();

    if (error || !data) {
      return DEFAULT_SITE_CONFIG.footer;
    }

    const saved = data.value as Partial<FooterConfig> | null;

    // Merge rather than replace (same reasoning as getSiteContactConfig in
    // src/lib/siteContact.ts): a row saved before a field existed would
    // otherwise return undefined for it. That matters more here than
    // elsewhere — Footer.tsx calls .filter() on linkSections, socialLinks and
    // ctaButtons, so a missing array is a render crash, not a blank section.
    return { ...DEFAULT_SITE_CONFIG.footer, ...(saved || {}) };
  } catch (error) {
    console.error('Error fetching footer config:', error);
    return DEFAULT_SITE_CONFIG.footer;
  }
}

// The footer renders on every public page, so an uncached call here would hit
// Supabase on every single page view. 300s is just a safety-net TTL — the
// admin save path busts this via revalidateTag well before that.
const getCachedFooterConfig = unstable_cache(
  fetchFooterConfig,
  ['site-footer-config'],
  { tags: [FOOTER_CONFIG_CACHE_TAG], revalidate: 300 }
);

export async function getFooterConfig(): Promise<FooterConfig> {
  return getCachedFooterConfig();
}
