import { NextRequest } from 'next/server';

export const ADMIN_SESSION_COOKIE = 'admin_session';

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'SESSION_SECRET is not set (or is too short). Set a strong random value (32+ chars) in your environment.'
    );
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return toBase64Url(new Uint8Array(signature));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Creates a signed session token: base64url(payload) + "." + HMAC-SHA256 signature.
 * Unlike the previous plain-base64 cookie, this cannot be forged without SESSION_SECRET.
 */
export async function createSessionToken(): Promise<string> {
  const payload = JSON.stringify({ iat: Date.now() });
  const payloadEncoded = toBase64Url(new TextEncoder().encode(payload));
  const signature = await hmacSign(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadEncoded, signature] = parts;

  let expectedSignature: string;
  try {
    expectedSignature = await hmacSign(payloadEncoded);
  } catch (error) {
    console.error('Session verification error:', error);
    return false;
  }

  if (!timingSafeEqual(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadEncoded))) as { iat?: number };
    if (typeof payload.iat !== 'number') return false;
    return Date.now() - payload.iat < SESSION_DURATION_MS;
  } catch {
    return false;
  }
}

/** For use inside Route Handlers / Server Components (reads cookies() from next/headers). */
export async function verifyAdminSession(): Promise<boolean> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidSessionToken(token);
}

/** For use inside middleware (reads directly from NextRequest, no next/headers). */
export async function verifyAdminSessionFromRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidSessionToken(token);
}
