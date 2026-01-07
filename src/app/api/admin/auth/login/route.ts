import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Admin credentials - stored server-side only
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nainital2024';

// Session duration: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Verify password
    if (password !== ADMIN_PASSWORD) {
      // Add a small delay to prevent brute force attacks
      await new Promise(resolve => setTimeout(resolve, 1000));

      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Generate session token (simple timestamp-based for now)
    // In production, use a proper JWT or session token library
    const sessionToken = Buffer.from(
      JSON.stringify({
        authenticated: true,
        timestamp: Date.now(),
      })
    ).toString('base64');

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000, // Convert to seconds
      path: '/admin',
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
