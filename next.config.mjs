/** @type {import('next').NextConfig} */

// Content-Security-Policy is intentionally NOT here — it needs a per-request
// nonce (see src/middleware.ts + src/lib/security/csp.ts), which next.config's
// static headers() can't generate. Everything else here is global and static.
const securityHeaders = [
  // 2 years, includeSubDomains, preload. `preload` in the header alone does
  // NOT enroll the domain in browsers' HSTS preload list — that requires a
  // one-time manual submission at https://hstspreload.org once this is live
  // in production on the real domain (nainitaltaxi.in).
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // No navigator.geolocation, camera, mic, or payment-request usage exists
  // anywhere in the app today — deny all by default.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
];

const nextConfig = {
  // next/image refuses any remote host that isn't listed here. Admin-uploaded
  // media (hero images, vehicle photos, package galleries) all live in the
  // Supabase Storage `images` bucket, so without this every <Image> pointing
  // at Supabase throws "hostname is not configured" at render time.
  //
  // Wildcard host mirrors the CSP's `img-src ... https://*.supabase.co`
  // (src/lib/security/csp.ts) so a project-ref change doesn't break both.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],

    // ---------------------------------------------------------------------
    // Image transformation budget
    // ---------------------------------------------------------------------
    // Vercel bills *transformations*: one per unique source image x width x
    // format x quality, cached for 30 days. The defaults generate 8 deviceSizes
    // + 8 imageSizes and negotiate both AVIF and WebP, so a single hero photo
    // can cost well over a dozen transformations before anyone has seen it at
    // more than one size.
    //
    // These four settings cut that by roughly 4x without any visible quality
    // loss. They matter here because nearly every image on this site is an
    // admin upload from Supabase Storage — an unbounded, growing set.
    //
    // Note this is the opposite of setting `unoptimized: true`, which is
    // deliberately NOT used globally: Supabase-hosted images served unoptimized
    // are fetched from Supabase by every visitor and count against the 5GB/month
    // Supabase egress limit, which is by far the tighter of the two quotas.
    // Letting Vercel optimize and cache them is what keeps those bytes off it.

    // From the 8 defaults down to 4. 640 covers phones (~80% of this site's
    // traffic), 828 large phones, 1200 tablets/laptops, 1920 desktop. Dropping
    // 2048/3840 costs nothing visible — the source uploads are rarely that
    // large to begin with.
    deviceSizes: [640, 828, 1200, 1920],

    // Only used by images with a `sizes` smaller than a viewport width —
    // thumbnails and vehicle cards here. Two entries is enough for both.
    imageSizes: [128, 256],

    // WebP only. Serving AVIF as well doubles the transformation count per
    // image for a marginal extra saving, and WebP is supported by every browser
    // this audience uses.
    formats: ['image/webp'],

    // 31 days. Transformations are billed per cache window, so a longer TTL
    // directly reduces recurring cost. Content changes go through an admin
    // upload, which produces a new URL and therefore a new cache entry, so a
    // long TTL cannot serve a stale image.
    minimumCacheTTL: 2678400,
  },

  // PostHog's paths are slash-sensitive; Next's default trailing-slash
  // normalisation would rewrite /ingest/decide/ into a redirect the SDK does
  // not follow, and events would silently stop arriving.
  skipTrailingSlashRedirect: true,

  /**
   * PostHog reverse proxy.
   *
   * Analytics is served from our own origin rather than posthog.com for two
   * reasons:
   *
   *  1. CSP. src/lib/security/csp.ts uses 'strict-dynamic' and an explicit
   *     connect-src allowlist. Same-origin requests are already covered by
   *     `connect-src 'self'`, so this needs no CSP change at all — whereas
   *     direct ingestion would mean allowlisting PostHog's hosts by hand, the
   *     way every other vendor in that file had to be.
   *  2. Ad blockers drop requests to posthog.com outright. On a consumer
   *     travel site that silently under-counts the funnel by a fifth or more,
   *     which is worse than useless — it looks like real data.
   *
   * The cost is that every event becomes a Vercel function invocation and
   * counts against bandwidth. That is why autocapture and session replay are
   * both off (see src/components/analytics/PostHogProvider.tsx): event volume
   * stays proportional to real user actions rather than every click.
   *
   * Two upstreams are required. The assets host serves the SDK's own bundles
   * (recorder, surveys, toolbar); the ingest host takes the events. Pointing
   * both at the ingest host is a common mistake and breaks asset loading.
   */
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },

  async redirects() {
    return [
      {
        // /packages/[slug] previously redirected inside a page component,
        // which meant a full server render on every hit and a 307 that passes
        // no link equity. A 308 here is resolved before rendering and is
        // permanent, so search engines transfer ranking to the canonical
        // /tour/[slug] URL the sitemap already lists.
        source: '/packages/:slug',
        destination: '/tour/:slug',
        permanent: true,
      },
      {
        // /booking-simple was a noindex prototype of a condensed 2-step wizard
        // that never finished: its final step console.log'd the booking and
        // rendered a success screen without ever calling /api/bookings/create,
        // so anyone who completed it believed they had booked a taxi and had
        // not. Deleted 2026-09-02. It was never in the sitemap and nothing
        // linked to it, but it was a live URL, so send its traffic to the real
        // flow rather than a 404. 'booking-simple' deliberately STAYS in
        // RESERVED_PAGE_SLUGS (src/lib/slug.ts) — freeing the slug would let an
        // admin-authored custom page claim a URL with real inbound history.
        source: '/booking-simple',
        destination: '/booking',
        permanent: true,
      },

      // ----------------------------------------------------------------------
      // WordPress -> Next.js migration (nainitaltaxi.in). `source` values omit
      // the trailing slash the WordPress URLs actually used (e.g. /haridwar/)
      // deliberately: Next.js normalizes trailing-slash requests against the
      // `trailingSlash` config (unset here, so default `false`) before
      // matching redirects. Spot-check both slash forms against staging before
      // relying on this for the real cutover — see the migration audit notes.
      // ----------------------------------------------------------------------

      // Confirmed tour/package redirects
      { source: '/mukteshwar-tour-itinerary', destination: '/tour/mukteshwar-day-tour', permanent: true },
      { source: '/lake-tour-itinerary', destination: '/tour/lake-tour-kainchi-dham', permanent: true },
      { source: '/nainital-city-tour', destination: '/tour/nainital-darshan', permanent: true },
      { source: '/car-rental-nainital', destination: '/taxi-rental', permanent: true },
      { source: '/innova-crysta-rental', destination: '/taxi-rental', permanent: true },

      // Cruft retirement — thin/stale content with no direct replacement
      { source: '/wedding-taxi-rental', destination: '/taxi-rental', permanent: true },
      { source: '/blog', destination: '/', permanent: true },

      // One-way taxi info page -> its modern equivalent
      { source: '/one-way-taxi-services', destination: '/rates', permanent: true },

      // New /routes/[slug] landing pages (10 old URLs -> 8 new pages;
      // /kathgodam + /railway-station and /ranikhet-taxi + /ranikheet-sightseeing
      // each consolidate to one page). These 8 routes must exist in the
      // `routes` table with is_active=true before cutover — see
      // supabase/add_route_landing_page_fields.sql, which seeds them inactive.
      { source: '/haridwar', destination: '/routes/haridwar', permanent: true },
      { source: '/kathgodam', destination: '/routes/kathgodam', permanent: true },
      { source: '/railway-station', destination: '/routes/kathgodam', permanent: true },
      { source: '/delhi-taxi', destination: '/routes/delhi', permanent: true },
      { source: '/pantnagar-airport', destination: '/routes/pantnagar-airport', permanent: true },
      { source: '/ranikhet-taxi', destination: '/routes/ranikhet', permanent: true },
      { source: '/ranikheet-sightseeing', destination: '/routes/ranikhet', permanent: true },
      { source: '/almora', destination: '/routes/almora', permanent: true },
      { source: '/kausani', destination: '/routes/kausani', permanent: true },
      { source: '/dehradun', destination: '/routes/dehradun', permanent: true },

      // Retired new-site page — /fleet's public-facing role is now /taxi-rental
      { source: '/fleet', destination: '/taxi-rental', permanent: true },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
