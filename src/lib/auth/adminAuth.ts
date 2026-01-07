import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');

    if (!sessionCookie) {
      return false;
    }

    // Decode and verify session
    const session = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    );

    // Check if session is still valid
    if (session.authenticated && session.timestamp) {
      const elapsed = Date.now() - session.timestamp;
      return elapsed < SESSION_DURATION;
    }

    return false;
  } catch (error) {
    console.error('Session verification error:', error);
    return false;
  }
}

export async function requireAdminAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const isAuthenticated = await verifyAdminSession(request);

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    return handler(request);
  };
}
