/**
 * IP rate limiting for public mutations, backed by Upstash Redis / Vercel KV.
 *
 * ---------------------------------------------------------------------------
 * RULE: only ever call these from POST/PATCH/DELETE handlers.
 * ---------------------------------------------------------------------------
 * Never from a GET, and never from middleware. The free Redis tiers bill per
 * command, and middleware runs on effectively every document request in this
 * app (see the matcher in src/middleware.ts) — wiring a limiter in there would
 * let ordinary bot crawling exhaust the daily quota in minutes, at which point
 * the limiter fails open and protects nothing. Gating only the handful of
 * endpoints that actually write keeps consumption proportional to real
 * submissions, which for this business is a few dozen a day.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    // console.error rather than warn in production: this is fail-open, so the
    // only signal that brute-force protection is off is this line. As a warn
    // it was easy to miss in Vercel's log view — which is how it stayed
    // unnoticed that no Redis credentials were ever set.
    const message =
      '[rateLimit] No UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN) configured — ' +
      'rate limiting is DISABLED (fail-open). Admin login brute-force and contact spam are UNPROTECTED.';
    if (process.env.NODE_ENV === 'production') {
      console.error(message);
    } else {
      console.warn(`${message} Fine for local dev; set these in production.`);
    }
    redis = null;
    return redis;
  }

  redis = new Redis({ url, token });
  return redis;
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // unix ms timestamp
};

function makeLimiter(requests: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`, prefix: string) {
  const client = getRedis();
  if (!client) return null;
  return new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(requests, window),
    // analytics writes an extra key per call, roughly doubling command spend,
    // and nothing in this app reads those stats. Keep it off.
    analytics: false,
    // Blocks an IP that is already over its limit from memory, with no Redis
    // round-trip at all. A sliding-window check costs 2-3 commands, so the
    // traffic most likely to drain the daily quota — one source retrying in a
    // loop — is exactly the traffic this makes free after its first block.
    // Per-instance and lost on cold start, which is fine: it is an
    // optimisation over the Redis window, not a replacement for it.
    ephemeralCache: new Map<string, number>(),
    prefix: `ratelimit:${prefix}`,
  });
}

// 5 attempts / 10 min per IP — strict, matches brute-force protection for a
// single shared admin password.
const loginLimiter = makeLimiter(5, '10 m', 'admin-login');
// 4 / 5 min per IP — close to the previous in-memory limiter's 3/5min behavior.
const contactLimiter = makeLimiter(4, '5 m', 'contact-form');
// 10 / 5 min per IP. Looser than the contact form because a quote is a
// browsing action a genuine visitor may repeat while comparing vehicles, but
// still bounded — the endpoint is an unauthenticated POST that queries pricing,
// so without a ceiling it is a free way to generate database load.
const quoteLimiter = makeLimiter(10, '5 m', 'instant-quote');

export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  if (!loginLimiter) return { success: true, limit: 0, remaining: 0, reset: 0 };
  return loginLimiter.limit(ip);
}

export async function checkContactRateLimit(ip: string): Promise<RateLimitResult> {
  if (!contactLimiter) return { success: true, limit: 0, remaining: 0, reset: 0 };
  return contactLimiter.limit(ip);
}

export async function checkQuoteRateLimit(ip: string): Promise<RateLimitResult> {
  if (!quoteLimiter) return { success: true, limit: 0, remaining: 0, reset: 0 };
  return quoteLimiter.limit(ip);
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
