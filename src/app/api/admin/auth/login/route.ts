import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from '@/lib/auth/adminAuth';
import { checkLoginRateLimit, getClientIp } from '@/lib/rateLimit';

// Admin password - server-side only. Must be set via env; no client-exposed fallback.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = await checkLoginRateLimit(ip);
    if (!rl.success) {
      const retryAfterSeconds = Math.max(0, Math.ceil((rl.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      );
    }

    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD is not configured on the server.');
      return NextResponse.json(
        { error: 'Admin login is not configured.' },
        { status: 500 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    if (password !== ADMIN_PASSWORD) {
      // Small delay to slow down brute-force attempts
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    const sessionToken = await createSessionToken();

    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
