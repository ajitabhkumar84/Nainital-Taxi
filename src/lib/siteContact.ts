import { cache } from 'react';
import { supabase } from '@/lib/supabase';
import { DEFAULT_SITE_CONFIG, type SiteConfig } from '@/lib/supabase/types';

// Server-side read of the site's WhatsApp contact number, from the same
// `admin_settings` rows the client-side useSiteConfig hook uses. Falls back to
// DEFAULT_SITE_CONFIG.contact.whatsapp — never hardcode a phone number in a
// page/component instead of calling this.
//
// Queries Supabase directly rather than fetching this app's own /api route over
// HTTP: the old self-fetch depended on NEXT_PUBLIC_SITE_URL matching the live
// origin, and on failure it silently served the fallback number — meaning live
// WhatsApp links could point at the wrong phone. Uses the cookie-free anon
// client so public pages stay statically renderable.
export const getSiteWhatsappNumber = cache(async (): Promise<string> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('admin_settings') as any)
      .select('value')
      .eq('key', 'site_config_contact')
      .single();

    if (error || !data) return DEFAULT_SITE_CONFIG.contact.whatsapp;

    const contact = data.value as SiteConfig['contact'] | null;
    return contact?.whatsapp || DEFAULT_SITE_CONFIG.contact.whatsapp;
  } catch (error) {
    console.error('Error fetching site contact config:', error);
    return DEFAULT_SITE_CONFIG.contact.whatsapp;
  }
});
