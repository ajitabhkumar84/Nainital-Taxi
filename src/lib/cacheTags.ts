/**
 * CACHE TAG REGISTRY
 *
 * One tag per content domain. Every public content read in
 * src/lib/supabase/queries_enhanced.ts is wrapped in unstable_cache() and
 * tagged from this list; every admin write route calls revalidateContent()
 * (src/lib/revalidateContent.ts) with the tags it invalidated.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every route in this app renders dynamically — src/app/layout.tsx reads
 * headers() for the per-request CSP nonce, which opts the whole app out of
 * static rendering. That is deliberate (a nonce cannot be prerendered), but it
 * means there is no Full Route Cache to lean on: without a data cache, every
 * page view would re-run every query against Supabase.
 *
 * unstable_cache is the layer that makes that affordable. The page still
 * re-renders per request, but the queries behind it hit Next's data cache
 * instead of Supabase, which is the resource actually under a free-tier quota.
 *
 * IMPORTANT CONSTRAINT
 * --------------------
 * unstable_cache throws if the wrapped function calls cookies() or headers().
 * That means anything cached with these tags must use the plain
 * @supabase/supabase-js singleton (src/lib/supabase/client.ts) — NEVER the
 * @supabase/ssr client from src/lib/supabase/server.ts, which reads cookies.
 *
 * Keeping tag strings here rather than inline avoids the classic failure mode
 * where a write route revalidates 'destination' and the read is tagged
 * 'destinations', so the cache silently never busts.
 */

// This module must stay dependency-free — no imports, ever.
//
// It is imported by the query layer, which is imported (transitively) by
// branding.ts / footerConfig.ts / trackingScripts.ts. Re-exporting their tag
// constants from here to make one tidy registry closed that loop into a
// circular import, and webpack resolved it as a TDZ crash at build time
// ("Cannot access 'i' before initialization") rather than anything that named
// the actual problem. Their three tags are listed below as plain strings
// instead, with the constants left where they are.
export const CACHE_TAGS = {
  destinations: 'destinations',
  packages: 'packages',
  pricing: 'pricing',
  routes: 'routes',
  routeCategories: 'route-categories',
  reviews: 'reviews',
  vehicles: 'vehicles',
  seasons: 'seasons',
  trustSection: 'trust-section',
  tourTrustSection: 'tour-trust-section',
  pageContent: 'page-content',
  temples: 'temples',
  ticker: 'ticker',
  addons: 'addons',
  pickupLocations: 'pickup-locations',
  multiDayRental: 'multi-day-rental',
  contactPage: 'contact-page',
  oneWayTaxi: 'one-way-taxi',
  adminSettings: 'admin-settings',

  // These three mirror constants that already existed before this registry and
  // are still declared (and imported by /api/admin/site-config) from their own
  // modules: HEADER_CONFIG_CACHE_TAG in src/lib/branding.ts,
  // FOOTER_CONFIG_CACHE_TAG in src/lib/footerConfig.ts, and
  // TRACKING_CONFIG_CACHE_TAG in src/lib/trackingScripts.ts. Duplicated as
  // literals here only so this file remains a complete index of every tag in
  // the app; the strings must stay in sync with those three declarations.
  siteHeaderConfig: 'site-header-config',
  siteFooterConfig: 'site-footer-config',
  siteTrackingConfig: 'site-tracking-config',
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/**
 * Default TTL for cached content reads, in seconds.
 *
 * This is a *safety net*, not the primary freshness mechanism — admin saves
 * bust the relevant tag immediately via revalidateContent(). The TTL only
 * matters when a tag never fires, which happens in exactly one situation worth
 * planning for: rows edited **directly in the Supabase table editor**. Those
 * bypass the API routes entirely, so nothing invalidates them and the site
 * keeps serving the old value until the TTL expires.
 *
 * 300s in production matches the TTL the pre-existing cached config reads
 * already use (src/lib/branding.ts, src/lib/footerConfig.ts,
 * src/lib/trackingScripts.ts), so the whole app has one staleness ceiling
 * rather than two.
 *
 * 1s in development because the cost/benefit inverts locally: there is no
 * free-tier traffic to protect, and a cache that outlives an edit turns
 * ordinary content work into "I saved it and nothing changed" debugging. Kept
 * at 1 rather than 0 so the code path stays identical to production and
 * per-render deduping still works.
 *
 * NOTE: this TTL cannot help across *processes*. unstable_cache persists to
 * .next/cache/fetch-cache on disk, so a `next build && next start` server has
 * its own cache that a `next dev` server's revalidateTag will never reach. If
 * a local production build is serving stale content after an admin save,
 * `rm -rf .next/cache` is the fix. On Vercel this does not arise: the admin
 * routes and the public pages are the same deployment sharing one Data Cache.
 */
export const CONTENT_CACHE_TTL =
  process.env.NODE_ENV === 'production' ? 300 : 1;
