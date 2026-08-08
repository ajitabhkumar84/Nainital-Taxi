import { cache } from 'react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SITE_CONFIG, type SiteConfig } from '@/lib/supabase/types';

// Server-side read of the site's contact details (phone, WhatsApp, email,
// address), from the same `admin_settings` row the client-side useSiteConfig
// hook uses. This is the single source of truth for those four values — never
// hardcode a phone number or email in a page/component instead of calling this.
//
// Queries Supabase directly rather than fetching this app's own /api route over
// HTTP: the old self-fetch depended on NEXT_PUBLIC_SITE_URL matching the live
// origin, and on failure it silently served the fallback number — meaning live
// WhatsApp links could point at the wrong phone. Uses the cookie-free anon
// client so public pages stay statically renderable.
export const getSiteContactConfig = cache(async (): Promise<SiteConfig['contact']> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('admin_settings') as any)
      .select('value')
      .eq('key', 'site_config_contact')
      .single();

    if (error || !data) return DEFAULT_SITE_CONFIG.contact;

    const contact = data.value as Partial<SiteConfig['contact']> | null;
    // Merge rather than replace: a row saved before a field existed would
    // otherwise return undefined for it.
    return { ...DEFAULT_SITE_CONFIG.contact, ...(contact || {}) };
  } catch (error) {
    console.error('Error fetching site contact config:', error);
    return DEFAULT_SITE_CONFIG.contact;
  }
});

export const getSiteWhatsappNumber = cache(async (): Promise<string> => {
  const contact = await getSiteContactConfig();
  return contact.whatsapp || DEFAULT_SITE_CONFIG.contact.whatsapp;
});
