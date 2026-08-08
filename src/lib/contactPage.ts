import { cache } from 'react';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_CONTACT_PAGE_CONTENT,
  type ContactPageContent,
} from '@/lib/supabase/types';

export const CONTACT_PAGE_ID = '00000000-0000-0000-0000-000000000004';

/**
 * Server-side read of the /contact page's editable content (singleton row,
 * see supabase/create_contact_page_schema.sql). Falls back to
 * DEFAULT_CONTACT_PAGE_CONTENT — which mirrors the migration's seed — so the
 * page renders identically if the migration hasn't been applied yet.
 *
 * Uses the cookie-free anon client so /contact stays statically renderable.
 */
export const getContactPageContent = cache(async (): Promise<ContactPageContent> => {
  const fallback: ContactPageContent = {
    ...DEFAULT_CONTACT_PAGE_CONTENT,
    id: CONTACT_PAGE_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('contact_page_content') as any)
      .select('*')
      .eq('id', CONTACT_PAGE_ID)
      .single();

    if (error || !data) return fallback;

    // Merge over the defaults so a column added after the row was last saved
    // (or a NULL) never renders as blank/undefined.
    return { ...fallback, ...(data as Partial<ContactPageContent>) };
  } catch (error) {
    console.error('Error fetching contact page content:', error);
    return fallback;
  }
});

/**
 * The `src` for the embedded map iframe.
 *
 * A pasted embed URL from Google Maps (Share -> Embed a map) wins when present,
 * since it pins an exact location. Otherwise we build the keyless
 * `?output=embed` form from the Google Business listing name — this needs no
 * Maps API key and resolves the same way a normal Maps search would.
 *
 * Returns null when there's nothing to show, so callers can skip the iframe
 * rather than render an empty grey box.
 *
 * NOTE: whichever host this resolves to must be allowed by `frame-src` in
 * src/lib/security/csp.ts, or the browser blocks the iframe outright.
 */
export function buildMapEmbedUrl(
  googleBusinessName: string,
  mapEmbedUrl: string | null | undefined,
  addressFallback: string
): string | null {
  const override = mapEmbedUrl?.trim();
  if (override) return override;

  const query = googleBusinessName.trim() || addressFallback.trim();
  if (!query) return null;

  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

/**
 * Destination for the "Open in Google Maps" button — the listing name when set,
 * so the button lands on the business profile rather than a generic area pin.
 */
export function buildMapLinkUrl(
  googleBusinessName: string,
  addressFallback: string
): string {
  const query = googleBusinessName.trim() || addressFallback.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
