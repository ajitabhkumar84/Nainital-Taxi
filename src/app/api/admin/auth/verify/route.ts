import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Session duration: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false });
    }

    // Decode and verify session
    try {
      const session = JSON.parse(
        Buffer.from(sessionCookie.value, 'base64').toString()
      );

      // Check if session is still valid
      if (session.authenticated && session.timestamp) {
        const elapsed = Date.now() - session.timestamp;

        if (elapsed < SESSION_DURATION) {
          return NextResponse.json({ authenticated: true });
        }
      }
    } catch (decodeError) {
      // Invalid session format
      console.error('Invalid session format:', decodeError);
    }

    // Session invalid or expired - clear cookie
    cookieStore.delete('admin_session');
    return NextResponse.json({ authenticated: false });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}
