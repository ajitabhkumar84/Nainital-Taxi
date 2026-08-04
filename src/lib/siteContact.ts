import { DEFAULT_SITE_CONFIG } from '@/lib/supabase/types';

// Server-side fetch of the site's WhatsApp contact number, same source
// (`GET /api/admin/site-config`, public-read) as the client-side
// useSiteConfig hook, but usable from Server Components. Falls back to
// DEFAULT_SITE_CONFIG.contact.whatsapp if the fetch fails — never hardcode
// a phone number in a page/component instead of calling this.
export async function getSiteWhatsappNumber(): Promise<string> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/site-config`
    );
    if (!response.ok) return DEFAULT_SITE_CONFIG.contact.whatsapp;
    const config = await response.json();
    return config?.contact?.whatsapp || DEFAULT_SITE_CONFIG.contact.whatsapp;
  } catch (error) {
    console.error('Error fetching site contact config:', error);
    return DEFAULT_SITE_CONFIG.contact.whatsapp;
  }
}
