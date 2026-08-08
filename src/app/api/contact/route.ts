import { NextRequest, NextResponse } from 'next/server';
import { sendContactEnquiry } from '@/lib/notifications';
import { checkContactRateLimit, getClientIp } from '@/lib/rateLimit';
import { getContactPageContent } from '@/lib/contactPage';

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
    const { name, phone, email, message, pickup, drop, date, time, passengers, vehicle } = body;

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
      time: time?.trim() || '',
      passengers: passengers?.trim() || '',
      vehicle: vehicle?.trim() || '',
    };

    // Recipient is admin-editable at /admin/pages/contact; falls back to the
    // ADMIN_EMAIL env var when unset.
    const { enquiry_recipient_email } = await getContactPageContent();

    // Send emails via Resend
    const emailSent = await sendContactEnquiry(contactData, enquiry_recipient_email);

    if (!emailSent) {
      // There is no database record of contact enquiries — email IS the
      // delivery mechanism. Reporting success here would tell the visitor
      // we'd received an enquiry that in fact reached nobody, and they'd
      // wait for a callback that never comes. Fail loudly and point them at
      // WhatsApp instead.
      console.error(
        'Contact enquiry email failed to send — enquiry not delivered. ' +
        'Check RESEND_API_KEY and that the FROM_EMAIL domain is verified in Resend.'
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'We could not submit your enquiry just now. Please message us on WhatsApp or call us directly.',
        },
        { status: 502 }
      );
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
