import type { RouteWithCategory } from '@/lib/supabase/types';

/**
 * Where a route on /rates should link for more detail, or null when it has no
 * page of its own.
 *
 * Two page types can back a route and they answer different intents:
 *   /destinations/[slug] — the tourist guide for the place (what to see,
 *     when to go). Preferred when set, because it is the richer page.
 *   /routes/[slug]       — that leg's own fare/SEO landing page. Only linked
 *     when the admin has opted the route in AND the route is live: a route
 *     with show_as_route_page=true but is_active=false 404s, so linking it
 *     would ship a broken internal link to Googlebot.
 *
 * Extracted from RouteCard.tsx once src/app/rates/page.tsx started rendering
 * its own server-side link block — two copies of this rule would drift, and
 * the failure mode (a 404 in the crawlable link list) is invisible in the UI.
 */
export function routeDetailsHref(
  route: Pick<RouteWithCategory, 'destination_slug' | 'show_as_route_page' | 'is_active' | 'slug'>
): string | null {
  if (route.destination_slug) return `/destinations/${route.destination_slug}`;
  if (route.show_as_route_page && route.is_active) return `/routes/${route.slug}`;
  return null;
}
