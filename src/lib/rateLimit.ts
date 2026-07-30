import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    console.warn(
      '[rateLimit] No UPSTASH_REDIS_REST_URL/TOKEN (or KV_REST_API_URL/TOKEN) configured — ' +
        'rate limiting is DISABLED (fail-open). Fine for local dev; set these in production.'
    );
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
    analytics: false,
    prefix: `ratelimit:${prefix}`,
  });
}

// 5 attempts / 10 min per IP — strict, matches brute-force protection for a
// single shared admin password.
const loginLimiter = makeLimiter(5, '10 m', 'admin-login');
// 4 / 5 min per IP — close to the previous in-memory limiter's 3/5min behavior.
const contactLimiter = makeLimiter(4, '5 m', 'contact-form');

export async function checkLoginRateLimit(ip: string): Promise<RateLimitResult> {
  if (!loginLimiter) return { success: true, limit: 0, remaining: 0, reset: 0 };
  return loginLimiter.limit(ip);
}

export async function checkContactRateLimit(ip: string): Promise<RateLimitResult> {
  if (!contactLimiter) return { success: true, limit: 0, remaining: 0, reset: 0 };
  return contactLimiter.limit(ip);
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
