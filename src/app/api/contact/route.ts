import { NextRequest, NextResponse } from 'next/server';
import { sendContactEnquiry } from '@/lib/notifications';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 3;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of rateLimitMap.entries()) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 60 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const { name, phone, email, message, pickup, drop, date, passengers, vehicle } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!phone || typeof phone !== 'string' || !/^\d{10}$/.test(phone.trim())) {
      return NextResponse.json(
        { success: false, error: 'Valid 10-digit phone number is required' },
        { status: 400 }
      );
    }

    // Email is optional but must be valid if provided
    if (email && typeof email === 'string' && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { success: false, error: 'Invalid email address' },
          { status: 400 }
        );
      }
    }

    // Prepare contact data
    const contactData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      message: message?.trim() || '',
      pickup: pickup?.trim() || '',
      drop: drop?.trim() || '',
      date: date?.trim() || '',
      passengers: passengers?.trim() || '',
      vehicle: vehicle?.trim() || '',
    };

    // Send emails via Resend
    const emailSent = await sendContactEnquiry(contactData);

    if (!emailSent) {
      console.warn('Email notification failed, but enquiry was received');
    }

    return NextResponse.json({
      success: true,
      message: 'Enquiry received! We will contact you shortly.',
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process enquiry. Please try again.' },
      { status: 500 }
    );
  }
}
