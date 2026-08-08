/**
 * Builds the Content-Security-Policy header value for a single request.
 * `nonce` must be freshly generated per request (see src/middleware.ts) —
 * CSP nonces are single-use by design and must never be reused across requests.
 */
export function buildCsp(nonce: string): string {
  // Next.js dev mode's HMR/react-refresh runtime evaluates code via eval(),
  // which a strict CSP blocks outright (breaks all client-side JS, not just
  // hot-reload). Production builds (`next build`) don't use eval, so this
  // stays strict there — only `next dev` gets the relaxation.
  const isDev = process.env.NODE_ENV === 'development';
  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? ` 'unsafe-eval'` : ''}`,
    // Tailwind compiles to a static stylesheet, but several components use
    // React inline style={{...}} (e.g. SeasonalHero.tsx, ContactHero.tsx).
    // CSP nonces only cover <style> elements, never the
    // style="" HTML attribute — only 'unsafe-inline' does. Tightening this
    // would require refactoring every inline style to a Tailwind class first;
    // out of scope for this milestone.
    `style-src 'self' 'unsafe-inline'`,
    // Supabase Storage serves uploaded images publicly at
    // https://<project-ref>.supabase.co/storage/v1/object/public/...
    //
    // images.unsplash.com is TEMPORARY: destinations.hero_image_url,
    // packages.image_url and vehicles.featured_image_url currently hold
    // Unsplash placeholder URLs (22 rows as of this writing). Without this
    // entry those images are blocked outright. Remove it once real owned
    // photography has been uploaded to Supabase Storage and those rows
    // repointed — at that stage nothing should load from a third-party host.
    //
    // facebook.com / px.ads.linkedin.com: Facebook/LinkedIn pixels fall back to
    // an <img> beacon when their script can't fire (e.g. ad blockers) — part of
    // the tracking allowlist described above connect-src.
    `img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://www.facebook.com https://px.ads.linkedin.com`,
    `font-src 'self' data:`,
    // Browser Supabase client (src/lib/supabase/client.ts) calls Supabase
    // directly for auth — no realtime/websocket usage in this app.
    //
    // The rest of this list is the admin-configurable tracking/analytics
    // allowlist (src/app/admin/site-config → Tracking tab, src/lib/trackingScripts.ts).
    // 'strict-dynamic' in script-src already lets any of these vendors' scripts
    // load and spawn further scripts regardless of host — these entries exist
    // purely so the *data* those scripts collect isn't blocked as an outbound
    // request. Adding a brand-new vendor beyond this list means their network
    // calls get silently blocked until a host is added here (report-uri below
    // surfaces exactly which host that is).
    `connect-src 'self' https://*.supabase.co ` +
      `https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com ` +
      `https://www.facebook.com https://connect.facebook.net ` +
      `https://*.clarity.ms ` +
      `https://*.hotjar.com wss://*.hotjar.com ` +
      `https://px.ads.linkedin.com https://www.linkedin.com ` +
      `https://analytics.tiktok.com`,
    // GTM's <noscript> fallback (src/components/TrackingScripts.tsx) is a plain
    // iframe to googletagmanager.com/ns.html — only exercised with JS disabled.
    //
    // google.com/maps: the embedded map on /contact (src/lib/contactPage.ts
    // builds the URL). Without this the iframe is blocked outright and the
    // browser paints its "This content is blocked" placeholder in its place.
    // www.google.com covers both the keyless ?output=embed form and a pasted
    // /maps/embed?pb=... URL; maps.google.com is the legacy host Google still
    // redirects some share links to.
    `frame-src 'self' https://www.googletagmanager.com https://www.google.com https://maps.google.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
    // Reports every blocked directive to /api/csp-report so a newly-pasted
    // custom tracking script that calls an unlisted domain shows up in the
    // server logs instead of failing silently in visitors' browsers.
    `report-uri /api/csp-report`,
  ];
  return directives.join('; ');
}
