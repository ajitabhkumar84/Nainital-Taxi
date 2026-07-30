import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_SESSION_COOKIE } from '@/lib/auth/adminAuth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_SESSION_COOKIE);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
