import { NextRequest, NextResponse } from 'next/server';
import { sendContactEnquiry } from '@/lib/notifications';
import { checkContactRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    const rl = await checkContactRateLimit(ip);
    if (!rl.success) {
      const retryAfterSeconds = Math.max(0, Math.ceil((rl.reset - Date.now()) / 1000));
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again in a few minutes.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
      );
    }

    const body = await request.json();

    // Honeypot — a hidden field real users never see or fill. Bots that
    // blindly fill every input trip it. Respond exactly like a normal
    // success so the bot gets no signal it was caught, but drop the submission.
    if (typeof body.company === 'string' && body.company.trim().length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Enquiry received! We will contact you shortly.',
      });
    }

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
