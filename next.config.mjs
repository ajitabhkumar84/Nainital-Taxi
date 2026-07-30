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
