import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionFromRequest } from '@/lib/auth/adminAuth';
import { buildCsp } from '@/lib/security/csp';

// Runs on effectively every document/page + API request (CSP must apply
// site-wide), excluding build output and static asset files where a nonce
// and admin-auth check are both meaningless.
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff|woff2|ttf|otf)$).*)',
  ],
};

/**
 * Two responsibilities live here:
 *  1. Per-request CSP nonce injection (site-wide).
 *  2. The auth gate for the admin UI, every /api/admin/* route, and the
 *     admin-only /api/availability route — unchanged from Milestone 1,
 *     just re-scoped now that the matcher above covers the whole site.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  // Next.js auto-detects a nonce present in the CSP header on the request
  // and applies it to its own injected RSC/hydration scripts.
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const next = () => NextResponse.next({ request: { headers: requestHeaders } });
  const withCsp = (response: NextResponse) => {
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  };

  const isAdminAuthRoute = pathname.startsWith('/api/admin/auth');
  const isAdminApi = pathname.startsWith('/api/admin');
  const isAvailabilityApi = pathname.startsWith('/api/availability');
  const isAdminSurface = pathname.startsWith('/admin');
  // Header/footer/contact config is public, non-sensitive data the homepage
  // itself needs (logo, nav links, phone number) — only the GET is public;
  // POST/PUT (writes) stay behind the admin gate below.
  const isPublicSiteConfigRead =
    pathname === '/api/admin/site-config' && request.method === 'GET';

  // Public site route (the vast majority of the newly-widened matcher) —
  // no auth gate, just the CSP/nonce headers.
  if (!isAdminApi && !isAvailabilityApi && !isAdminSurface) {
    return withCsp(next());
  }

  // Login/logout/verify must stay reachable without an existing session.
  if (isAdminAuthRoute || isPublicSiteConfigRead) {
    return withCsp(next());
  }

  const authenticated = await verifyAdminSessionFromRequest(request);

  if (isAdminApi || isAvailabilityApi) {
    if (!authenticated) {
      return withCsp(
        NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
      );
    }
    return withCsp(next());
  }

  // /admin itself renders its own password-gate UI, so let it through even
  // when unauthenticated. Any deeper admin page redirects back to it.
  if (pathname === '/admin') {
    return withCsp(next());
  }

  if (!authenticated) {
    return withCsp(NextResponse.redirect(new URL('/admin', request.url)));
  }

  return withCsp(next());
}
