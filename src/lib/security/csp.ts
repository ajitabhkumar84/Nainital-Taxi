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
    `img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com`,
    `font-src 'self' data:`,
    // Browser Supabase client (src/lib/supabase/client.ts) calls Supabase
    // directly for auth — no realtime/websocket usage in this app.
    `connect-src 'self' https://*.supabase.co`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ];
  return directives.join('; ');
}
