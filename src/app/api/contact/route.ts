import { NextRequest, NextResponse } from 'next/server';
import { sendContactEnquiry } from '@/lib/notifications';
import { checkContactRateLimit, getClientIp } from '@/lib/rateLimit';
import { getContactPageContent } from '@/lib/contactPage';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';

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
      source: (body.source === 'mobile_quick_enquiry' ? 'mobile_quick_enquiry' : 'contact_page') as
        | 'mobile_quick_enquiry'
        | 'contact_page',
    };

    // Persist first — this is now the durable record of the enquiry, independent
    // of whether email delivery works. Never let a DB problem take down email,
    // or vice versa (see the dbSaved/emailResult check below).
    let dbSaved = false;
    try {
      const supabaseAdmin = getAdminSupabaseClient();
      const { error: dbError } = await supabaseAdmin.from('contact_enquiries').insert({
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email,
        message: contactData.message,
        pickup: contactData.pickup || null,
        drop_location: contactData.drop || null,
        travel_date: contactData.date || null,
        travel_time: contactData.time || null,
        passengers: contactData.passengers || null,
        vehicle: contactData.vehicle || null,
        source: contactData.source,
      });

      if (dbError) {
        console.error('[api/contact] Supabase insert failed:', dbError);
      } else {
        dbSaved = true;
      }
    } catch (error) {
      console.error('[api/contact] Unexpected error saving enquiry to Supabase:', error);
    }

    // Recipient is admin-editable at /admin/pages/contact; falls back to the
    // ADMIN_EMAIL env var when unset.
    const { enquiry_recipient_email } = await getContactPageContent();
    const emailResult = await sendContactEnquiry(contactData, enquiry_recipient_email);

    if (!emailResult.ok) {
      console.error(
        `[api/contact] Enquiry email not delivered — ${emailResult.reason || 'unknown reason'}. ` +
        'Check RESEND_API_KEY and that the FROM_EMAIL domain is verified in Resend.'
      );
    }

    if (!dbSaved && !emailResult.ok) {
      // Both the durable record and the notification failed — genuinely nothing
      // was captured. This is the only case worth failing loudly to the visitor.
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
    console.error(
      '[api/contact] Unexpected error processing enquiry:',
      error instanceof Error ? error.stack || error.message : error
    );
    return NextResponse.json(
      { success: false, error: 'Failed to process enquiry. Please try again.' },
      { status: 500 }
    );
  }
}
