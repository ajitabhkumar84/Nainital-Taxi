import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/adminAuth';

export async function GET() {
  try {
    const authenticated = await verifyAdminSession();
    return NextResponse.json({ authenticated });
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
