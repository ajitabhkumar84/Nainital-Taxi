/**
 * EMAIL NOTIFICATIONS
 *
 * Email notification system using Resend API.
 * Sends booking confirmations, payment verifications, and admin alerts.
 */

import {
  formatPrice,
  formatDate,
  formatTime,
  getVehicleDisplayName,
  calculateAdvanceAmount,
  getAdvanceLabelKind,
  UPI_ID,
} from './booking';
import { SITE_URL } from './siteUrl';

// Configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'bookings@nainitaltaxi.in';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bookings@nainitaltaxi.in';
const BUSINESS_NAME = 'Nainital Taxi';
const BUSINESS_PHONE = '8445206116';
const BUSINESS_WHATSAPP = '918445206116';

// Deliberately SITE_URL, not process.env.NEXT_PUBLIC_SITE_URL — same reasoning
// as siteUrl.ts, which exists precisely to stop this. That var is localhost:3000
// in .env.local and resolves to the *deployment's* .vercel.app URL on Vercel, so
// reading it here put a .vercel.app link in the footer of live customer emails
// (2026-09-02). The production origin is a constant; keep it one.
const WEBSITE_URL = SITE_URL;

// Where guest replies should land. FROM_EMAIL is a send-only Resend identity —
// without an explicit Reply-To, a customer hitting "Reply" on a confirmation
// mails an inbox nobody reads.
const GUEST_REPLY_TO = 'taxinainital@gmail.com';

// The UPI QR shown on the checkout screen (public/nainital-upi.jpg), served from
// the production origin so Resend can fetch it. Attached by content_id rather
// than linked as a remote <img>: Gmail and Outlook block remote images from
// unknown senders by default, which is exactly the case for a first
// confirmation email, and a blocked QR is an unpayable booking.
const UPI_QR_URL = `${SITE_URL}/nainital-upi.jpg`;
const UPI_QR_CID = 'nainital-upi-qr';
const UPI_QR_FILENAME = 'nainital-upi-qr.jpg';

interface EmailAttachment {
  filename: string;
  /** Public URL Resend fetches server-side. Preferred over `content` here: the
   *  file lives in public/, which is NOT reliably readable from a route
   *  handler's filesystem on Vercel (it is served statically, not traced into
   *  the lambda bundle). */
  path?: string;
  /** Base64 alternative to `path`. */
  content?: string;
  /** Referenced from the HTML as `cid:<value>` to render inline. */
  content_id?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

/**
 * Escape a value for safe interpolation into email HTML. Defence in depth:
 * booking/contact fields ultimately trace back to URL params or form input
 * (e.g. ?packageTitle=<img onerror=...>), and the server never validates
 * their content beyond what's needed for pricing/lookup.
 */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface BookingData {
  id: string;
  booking_id: string;
  customer_name: string;
  customer_phone: string;
  customer_country_code?: string | null;
  customer_email?: string | null;
  package_name: string;
  vehicle_type: string;
  booking_date: string;
  pickup_time: string;
  pickup_location: string;
  dropoff_location?: string | null;
  passengers: number;
  final_price: number;
  advance_amount?: number;
  status: string;
  payment_status: string;
  special_requests?: string | null;
  // Everything below is optional so the shape stays compatible with a bare
  // `bookings` row spread. /api/bookings/create passes the extras explicitly —
  // base_price and addons are computed there and never persisted as columns.
  base_price?: number;
  addons_total?: number;
  addons?: Array<{ addon_name: string; addon_price: number }>;
  season_name?: string | null;
  package_id?: string | null;
  route_id?: string | null;
  booking_source?: string | null;
}

/**
 * The customer's number in the digits-only, country-code-prefixed form the
 * wa.me and tel: schemes require (e.g. 919876543210). Two things to get right:
 *
 * - India ('91', the default) stores a bare 10-digit number, so the dial code
 *   has to be prepended. The international fallback stores the customer's full
 *   self-typed number, already complete.
 * - Everything that is not a digit is then stripped. normalizePhone() only
 *   removes spaces, dashes and a leading '+', so a number typed as
 *   "+91 (98765) 43210" still reaches the DB carrying parentheses — and wa.me
 *   silently fails to open a chat on anything but a clean digit string.
 */
function toDialableNumber(
  phone: string,
  countryCode?: string | null
): string {
  const withCode = !countryCode || countryCode === '91' ? `91${phone}` : phone;
  return withCode.replace(/\D/g, '');
}

/**
 * The advance the customer is actually asked for. Must go through
 * calculateAdvanceAmount() — it floors to the nearest Rs 50, and the ad-hoc
 * `Math.round(final_price * 0.25)` these templates used until 2026-09-02 did
 * not, so a Rs 4,300 booking told the customer Rs 1,075 in the confirmation
 * email and Rs 1,050 on the checkout screen. advance_amount is not a column the
 * create route writes, so the fallback was always the branch taken.
 */
function resolveAdvance(booking: BookingData): number {
  return booking.advance_amount || calculateAdvanceAmount(booking.final_price);
}

/** Label for the advance figure that does not claim an exact 25% when the
 *  round-down or the Rs 500 floor made it something else. */
function advanceLabel(totalAmount: number): string {
  const kind = getAdvanceLabelKind(totalAmount);
  if (kind === 'exact') return 'Advance Payment (25%)';
  if (kind === 'approx') return 'Advance Payment (approx. 25%)';
  return 'Advance Payment (minimum)';
}

type SendResult = { ok: true } | { ok: false; reason: string };

/**
 * Send email via Resend API, reporting *why* a failure happened (invalid/missing
 * key, unverified domain, network error, ...) rather than just a boolean —
 * callers that need to log a specific cause use this; sendEmail() below stays
 * boolean for the callers that don't.
 */
async function sendEmailWithResult(options: EmailOptions): Promise<SendResult> {
  if (!RESEND_API_KEY) {
    const reason = 'RESEND_API_KEY is not set in this environment';
    console.warn(`[notifications] ${reason}. Email not sent.`);
    return { ok: false, reason };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${BUSINESS_NAME} <${FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        // Spread conditionally rather than sending null/[]: Resend rejects an
        // empty-string reply_to outright, and a bookings-without-email guest
        // legitimately has no address to reply to.
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
        ...(options.attachments?.length ? { attachments: options.attachments } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const reason = `Resend API ${response.status}: ${errorData?.message || JSON.stringify(errorData)}`;
      console.error(`[notifications] ${reason}`);
      return { ok: false, reason };
    }

    return { ok: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown fetch error';
    console.error('[notifications] Failed to reach Resend API:', error);
    return { ok: false, reason };
  }
}

/**
 * Send email via Resend API
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
  return (await sendEmailWithResult(options)).ok;
}

/**
 * Generate booking confirmation email HTML
 */
function generateBookingConfirmationEmail(booking: BookingData): string {
  const advanceAmount = resolveAdvance(booking);
  const remainingAmount = booking.final_price - advanceAmount;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation - ${booking.booking_id}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: #2D3436; font-size: 28px;">Booking Received!</h1>
      <p style="margin: 8px 0 0; color: #2D3436; font-size: 16px;">Thank you for choosing ${BUSINESS_NAME}</p>
    </div>

    <!-- Booking ID -->
    <div style="padding: 24px; text-align: center; border-bottom: 2px dashed #eee;">
      <p style="margin: 0 0 8px; color: #666; font-size: 14px;">Your Booking ID</p>
      <p style="margin: 0; font-size: 32px; font-weight: bold; color: #2D3436; letter-spacing: 2px;">
        ${booking.booking_id}
      </p>
      <p style="margin: 16px 0 0; padding: 8px 16px; display: inline-block; background-color: #FFF3CD; border-radius: 20px; color: #856404; font-size: 12px;">
        Awaiting Payment Verification
      </p>
    </div>

    <!-- Trip Details -->
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #2D3436; font-size: 18px;">Trip Details</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">Package</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #2D3436; font-weight: 600; text-align: right;">
            ${escapeHtml(booking.package_name)}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">Vehicle</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #2D3436; font-weight: 600; text-align: right;">
            ${escapeHtml(getVehicleDisplayName(booking.vehicle_type))}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">Travel Date</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #2D3436; font-weight: 600; text-align: right;">
            ${formatDate(booking.booking_date)}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">Pickup Time</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #2D3436; font-weight: 600; text-align: right;">
            ${formatTime(booking.pickup_time)}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">Pickup Location</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #2D3436; font-weight: 600; text-align: right;">
            ${escapeHtml(booking.pickup_location)}
          </td>
        </tr>
        ${booking.dropoff_location ? `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">Drop-off</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #2D3436; font-weight: 600; text-align: right;">
            ${escapeHtml(booking.dropoff_location)}
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #666;">Passengers</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #2D3436; font-weight: 600; text-align: right;">
            ${booking.passengers}
          </td>
        </tr>
      </table>
    </div>

    <!-- Payment Summary -->
    <div style="padding: 24px; background-color: #f8f9fa;">
      <h2 style="margin: 0 0 16px; color: #2D3436; font-size: 18px;">Payment Summary</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Total Amount</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600; text-align: right;">
            ${formatPrice(booking.final_price)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #28a745; font-weight: 600;">${advanceLabel(booking.final_price)}</td>
          <td style="padding: 8px 0; color: #28a745; font-weight: bold; text-align: right; font-size: 18px;">
            ${formatPrice(advanceAmount)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Remaining (Pay to Driver)</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600; text-align: right;">
            ${formatPrice(remainingAmount)}
          </td>
        </tr>
      </table>
    </div>

    <!-- Pay Now: the QR from the checkout screen, so the booking stays payable
         after the customer closes the tab. The image is a cid: attachment
         (see UPI_QR_CID) because remote images are blocked by default in Gmail
         and Outlook for a sender the customer has never mailed before. The UPI
         ID and amount are repeated as plain text below it so payment is still
         possible if no image renders at all. -->
    <div style="padding: 24px; border-top: 1px solid #eee;">
      <h2 style="margin: 0 0 4px; color: #2D3436; font-size: 18px;">Pay Your Advance</h2>
      <p style="margin: 0 0 16px; color: #666; font-size: 14px;">
        Scan this QR with any UPI app, or use the ID below.
      </p>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: top; padding-right: 16px;" width="220">
            <div style="padding: 12px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; text-align: center;">
              <img src="cid:${UPI_QR_CID}"
                   alt="UPI QR code for ${escapeHtml(UPI_ID)}"
                   width="196" height="196"
                   style="display: block; width: 196px; height: 196px; margin: 0 auto; border-radius: 8px;">
            </div>
            <p style="margin: 8px 0 0; text-align: center; font-size: 12px; color: #999;">
              Can't see the code?
              <a href="${UPI_QR_URL}" style="color: #4D96FF;">Open it here</a>
            </p>
          </td>
          <td style="vertical-align: top;">
            <div style="padding: 14px; background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 10px;">
              <p style="margin: 0; color: #166534; font-size: 13px; font-weight: 600;">Pay now (advance)</p>
              <p style="margin: 4px 0 0; color: #15803d; font-size: 26px; font-weight: bold;">
                ${formatPrice(advanceAmount)}
              </p>
            </div>
            <p style="margin: 14px 0 4px; color: #666; font-size: 13px;">UPI ID</p>
            <p style="margin: 0; padding: 10px 12px; background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 8px; color: #2D3436; font-size: 15px; font-weight: 600; word-break: break-all;">
              ${escapeHtml(UPI_ID)}
            </p>
            <p style="margin: 14px 0 0; color: #666; font-size: 13px;">
              Quote booking ID <strong style="color: #2D3436;">${booking.booking_id}</strong> with your payment.
            </p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Next Steps -->
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #2D3436; font-size: 18px;">Next Steps</h2>
      <ol style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
        <li>Pay the advance amount of <strong>${formatPrice(advanceAmount)}</strong> via UPI</li>
        <li>Take a screenshot of the payment confirmation</li>
        <li>Share the screenshot on WhatsApp to confirm your booking</li>
        <li>You'll receive confirmation within 15 minutes</li>
      </ol>
    </div>

    <!-- Contact -->
    <div style="padding: 24px; background-color: #2D3436; color: #fff; text-align: center;">
      <p style="margin: 0 0 16px; font-size: 14px;">Need help? Contact us</p>
      <a href="https://wa.me/${BUSINESS_WHATSAPP}" style="display: inline-block; padding: 12px 24px; background-color: #25D366; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 8px;">
        WhatsApp
      </a>
      <a href="tel:+91${BUSINESS_PHONE}" style="display: inline-block; padding: 12px 24px; background-color: #4D96FF; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Call Us
      </a>
      <p style="margin: 16px 0 0; font-size: 12px; color: #aaa;">
        ${BUSINESS_NAME} | ${WEBSITE_URL}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate payment verified email HTML
 */
function generatePaymentVerifiedEmail(booking: BookingData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Verified - ${booking.booking_id}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 32px; text-align: center;">
      <div style="width: 64px; height: 64px; background-color: #fff; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px;">&#10003;</span>
      </div>
      <h1 style="margin: 0; color: #fff; font-size: 28px;">Payment Verified!</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Your booking is now confirmed</p>
    </div>

    <!-- Booking ID -->
    <div style="padding: 24px; text-align: center; border-bottom: 2px dashed #eee;">
      <p style="margin: 0 0 8px; color: #666; font-size: 14px;">Booking ID</p>
      <p style="margin: 0; font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 2px;">
        ${booking.booking_id}
      </p>
      <p style="margin: 16px 0 0; padding: 8px 16px; display: inline-block; background-color: #d4edda; border-radius: 20px; color: #155724; font-size: 12px; font-weight: 600;">
        CONFIRMED
      </p>
    </div>

    <!-- Trip Summary -->
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #2D3436; font-size: 18px;">Trip Summary</h2>

      <div style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px; color: #666; font-size: 14px;">
          ${formatDate(booking.booking_date)} at ${formatTime(booking.pickup_time)}
        </p>
        <p style="margin: 0; font-size: 18px; color: #2D3436; font-weight: 600;">
          ${escapeHtml(booking.pickup_location)} ${booking.dropoff_location ? `&#8594; ${escapeHtml(booking.dropoff_location)}` : ''}
        </p>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Package</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600; text-align: right;">
            ${escapeHtml(booking.package_name)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Vehicle</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600; text-align: right;">
            ${escapeHtml(getVehicleDisplayName(booking.vehicle_type))}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Passengers</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600; text-align: right;">
            ${booking.passengers}
          </td>
        </tr>
      </table>
    </div>

    <!-- What's Next -->
    <div style="padding: 24px; background-color: #e3f2fd;">
      <h2 style="margin: 0 0 16px; color: #2D3436; font-size: 18px;">What's Next?</h2>
      <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
        <li>Driver details will be shared 3 hours before pickup</li>
        <li>Pay the remaining amount to the driver in cash</li>
        <li>Save this email for your records</li>
      </ul>
    </div>

    <!-- Contact -->
    <div style="padding: 24px; background-color: #2D3436; color: #fff; text-align: center;">
      <p style="margin: 0 0 16px; font-size: 14px;">Questions about your trip?</p>
      <a href="https://wa.me/${BUSINESS_WHATSAPP}" style="display: inline-block; padding: 12px 24px; background-color: #25D366; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        WhatsApp Us
      </a>
      <p style="margin: 16px 0 0; font-size: 12px; color: #aaa;">
        ${BUSINESS_NAME} | ${WEBSITE_URL}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate admin notification email HTML
 */
function generateAdminNewBookingEmail(booking: BookingData): string {
  const advanceAmount = resolveAdvance(booking);
  const remainingAmount = booking.final_price - advanceAmount;
  const dialable = toDialableNumber(booking.customer_phone, booking.customer_country_code);
  const displayPhone = `+${dialable}`;

  // route_id and package_id are mutually exclusive (see bookingLink.ts), so
  // which one is set is what distinguishes a point-to-point transfer from a
  // tour package. Worth stating outright: the two are serviced differently and
  // package_name alone ("Kathgodam to Nainital") does not always make it clear.
  const isTransfer = Boolean(booking.route_id);
  const tripKind = isTransfer ? 'Transfer' : 'Tour package';
  const referenceId = booking.route_id || booking.package_id || null;

  const addons = booking.addons || [];
  const addonsTotal =
    booking.addons_total ?? addons.reduce((sum, a) => sum + a.addon_price, 0);
  // Falls back to subtracting addons so the row is still right for a caller
  // that did not pass base_price explicitly.
  const basePrice = booking.base_price ?? booking.final_price - addonsTotal;

  const row = (label: string, value: string) => `
        <tr>
          <td style="padding: 8px 0; color: #666; width: 40%; vertical-align: top;">${escapeHtml(label)}</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600;">${value}</td>
        </tr>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking - ${booking.booking_id}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background-color: #FF6B6B; padding: 24px; text-align: center;">
      <h1 style="margin: 0; color: #fff; font-size: 24px;">New Booking Alert!</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
        ${booking.booking_id} &middot; ${escapeHtml(tripKind)}
      </p>
    </div>

    <!-- Awaiting-payment banner. The booking row exists but nothing has been
         paid yet: this fires the moment the customer reaches the QR screen. -->
    <div style="padding: 12px 24px; background-color: #FFF3CD; text-align: center;">
      <p style="margin: 0; color: #856404; font-size: 13px; font-weight: 600;">
        Customer is on the payment screen &mdash; advance of ${formatPrice(advanceAmount)} not yet confirmed.
      </p>
    </div>

    <!-- Quick Actions. wa.me requires a digits-only number including the
         country code; toDialableNumber() guarantees that shape. -->
    <div style="padding: 16px; background-color: #f8f9fa; text-align: center;">
      <a href="https://wa.me/${dialable}" style="display: inline-block; padding: 10px 20px; background-color: #25D366; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 8px; font-size: 14px;">
        WhatsApp
      </a>
      <a href="tel:+${dialable}" style="display: inline-block; padding: 10px 20px; background-color: #4D96FF; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-right: 8px;">
        Call
      </a>
      ${booking.customer_email ? `
      <a href="mailto:${escapeHtml(booking.customer_email)}" style="display: inline-block; padding: 10px 20px; background-color: #2D3436; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Email
      </a>
      ` : ''}
    </div>

    <!-- Customer Details -->
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #2D3436; font-size: 16px; border-bottom: 2px solid #eee; padding-bottom: 8px;">
        Customer Details
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${row('Name', escapeHtml(booking.customer_name))}
        ${row('Phone', `<a href="https://wa.me/${dialable}" style="color: #2D3436; text-decoration: none;">${escapeHtml(displayPhone)}</a>`)}
        ${booking.customer_email
          ? row('Email', `<a href="mailto:${escapeHtml(booking.customer_email)}" style="color: #2D3436;">${escapeHtml(booking.customer_email)}</a>`)
          : row('Email', '<span style="color: #999; font-weight: 400;">Not provided</span>')}
      </table>
    </div>

    <!-- Trip Details -->
    <div style="padding: 0 24px 24px;">
      <h2 style="margin: 0 0 16px; color: #2D3436; font-size: 16px; border-bottom: 2px solid #eee; padding-bottom: 8px;">
        Trip Details
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${row('Booking type', escapeHtml(tripKind))}
        ${row('Package', escapeHtml(booking.package_name))}
        ${row('Vehicle', escapeHtml(getVehicleDisplayName(booking.vehicle_type)))}
        ${row('Date', formatDate(booking.booking_date))}
        ${row('Time', formatTime(booking.pickup_time))}
        ${row('Pickup', escapeHtml(booking.pickup_location))}
        ${booking.dropoff_location ? row('Drop-off', escapeHtml(booking.dropoff_location)) : ''}
        ${row('Passengers', String(booking.passengers))}
        ${booking.season_name ? row('Season', escapeHtml(booking.season_name)) : ''}
      </table>
    </div>

    <!-- Add-ons the customer selected before booking. Rendered explicitly even
         when empty: "no add-ons" and "add-ons section missing from the email"
         look identical otherwise, and the difference is money. -->
    <div style="padding: 0 24px 24px;">
      <h2 style="margin: 0 0 16px; color: #2D3436; font-size: 16px; border-bottom: 2px solid #eee; padding-bottom: 8px;">
        Add-ons
      </h2>
      ${addons.length > 0 ? `
      <table style="width: 100%; border-collapse: collapse;">
        ${addons.map((addon) => `
        <tr>
          <td style="padding: 8px 0; color: #2D3436; border-bottom: 1px solid #f1f5f9;">${escapeHtml(addon.addon_name)}</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${formatPrice(addon.addon_price)}</td>
        </tr>`).join('')}
        <tr>
          <td style="padding: 8px 0; color: #666;">Add-ons total</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: bold; text-align: right;">${formatPrice(addonsTotal)}</td>
        </tr>
      </table>
      ` : `
      <p style="margin: 0; color: #999; font-size: 14px;">None selected.</p>
      `}
    </div>

    <!-- Pricing -->
    <div style="padding: 24px; background-color: #f8f9fa;">
      <h2 style="margin: 0 0 16px; color: #2D3436; font-size: 16px;">Pricing</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Base fare</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600; text-align: right;">${formatPrice(basePrice)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Add-ons</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600; text-align: right;">${formatPrice(addonsTotal)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600; border-top: 1px solid #e2e8f0;">Total Amount</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: bold; text-align: right; font-size: 18px; border-top: 1px solid #e2e8f0;">
            ${formatPrice(booking.final_price)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #28a745; font-weight: 600;">Advance Required</td>
          <td style="padding: 8px 0; color: #28a745; font-weight: bold; text-align: right;">
            ${formatPrice(advanceAmount)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Balance (pay to driver)</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600; text-align: right;">${formatPrice(remainingAmount)}</td>
        </tr>
      </table>
    </div>

    ${booking.special_requests ? `
    <!-- Special Requests -->
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 8px; color: #2D3436; font-size: 16px;">Special Requests</h2>
      <p style="margin: 0; padding: 12px; background-color: #fff3cd; border-radius: 6px; color: #856404; white-space: pre-wrap;">
        ${escapeHtml(booking.special_requests)}
      </p>
    </div>
    ` : ''}

    <!-- Reference -->
    <div style="padding: 0 24px 24px;">
      <h2 style="margin: 0 0 16px; color: #2D3436; font-size: 16px; border-bottom: 2px solid #eee; padding-bottom: 8px;">
        Reference
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${row('Booking ID', escapeHtml(booking.booking_id))}
        ${referenceId ? row(isTransfer ? 'Route ID' : 'Package ID', `<span style="font-family: monospace; font-size: 12px; font-weight: 400;">${escapeHtml(referenceId)}</span>`) : ''}
        ${row('Row ID', `<span style="font-family: monospace; font-size: 12px; font-weight: 400;">${escapeHtml(booking.id)}</span>`)}
        ${booking.booking_source ? row('Source', escapeHtml(booking.booking_source)) : ''}
        ${row('Status', `${escapeHtml(booking.status)} / payment ${escapeHtml(booking.payment_status)}`)}
      </table>
    </div>

    <!-- Footer -->
    <div style="padding: 16px; background-color: #2D3436; text-align: center;">
      <p style="margin: 0; color: #aaa; font-size: 12px;">
        Nainital Taxi Admin | ${new Date().toLocaleString('en-IN')}
      </p>
      <p style="margin: 6px 0 0; color: #aaa; font-size: 12px;">
        ${booking.customer_email ? 'Reply to this email to reach the customer directly.' : 'No customer email on file &mdash; use WhatsApp or call.'}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send booking confirmation email to customer
 */
export async function sendBookingConfirmation(booking: BookingData): Promise<boolean> {
  if (!booking.customer_email) {
    console.log('No customer email provided, skipping confirmation email');
    return false;
  }

  return sendEmail({
    to: booking.customer_email,
    subject: `Booking Received - ${booking.booking_id} | ${BUSINESS_NAME}`,
    html: generateBookingConfirmationEmail(booking),
    replyTo: GUEST_REPLY_TO,
    // Both inline and saveable: content_id makes it render in the body without
    // tripping remote-image blocking, and it still lands in the attachment bar
    // so the customer can reopen the QR after closing the email.
    attachments: [
      {
        filename: UPI_QR_FILENAME,
        path: UPI_QR_URL,
        content_id: UPI_QR_CID,
      },
    ],
  });
}

/**
 * Send payment verified email to customer
 */
export async function sendPaymentVerified(booking: BookingData): Promise<boolean> {
  if (!booking.customer_email) {
    console.log('No customer email provided, skipping payment verified email');
    return false;
  }

  return sendEmail({
    to: booking.customer_email,
    subject: `Booking Confirmed - ${booking.booking_id} | ${BUSINESS_NAME}`,
    html: generatePaymentVerifiedEmail(booking),
    replyTo: GUEST_REPLY_TO,
  });
}

/**
 * Send new booking notification to admin
 */
export async function sendAdminNotification(booking: BookingData): Promise<boolean> {
  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Booking: ${booking.booking_id} - ${booking.customer_name}`,
    html: generateAdminNewBookingEmail(booking),
    // Hitting Reply on the alert mails the customer. Omitted entirely when they
    // booked without an email — Resend rejects an empty reply_to.
    replyTo: booking.customer_email || undefined,
  });
}

/**
 * Contact Enquiry Email Templates
 */

interface ContactData {
  name: string;
  phone: string;
  email?: string | null;
  message?: string;
  pickup?: string;
  drop?: string;
  date?: string;
  time?: string;
  passengers?: string;
  vehicle?: string;
  source?: 'contact_page' | 'mobile_quick_enquiry';
}

/**
 * Generate contact enquiry admin notification email HTML
 */
function generateContactEnquiryAdminEmail(data: ContactData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Enquiry</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background-color: #4D96FF; padding: 24px; text-align: center;">
      <h1 style="margin: 0; color: #fff; font-size: 24px;">New Contact Enquiry!</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
        ${new Date().toLocaleString('en-IN')}
      </p>
    </div>

    <!-- Quick Actions -->
    <div style="padding: 16px; background-color: #f8f9fa; text-align: center;">
      <a href="https://wa.me/91${escapeHtml(data.phone)}" style="display: inline-block; padding: 10px 20px; background-color: #25D366; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 8px; font-size: 14px;">
        WhatsApp
      </a>
      <a href="tel:+91${escapeHtml(data.phone)}" style="display: inline-block; padding: 10px 20px; background-color: #4D96FF; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
        Call
      </a>
    </div>

    <!-- Customer Details -->
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #2D3436; font-size: 16px; border-bottom: 2px solid #eee; padding-bottom: 8px;">
        Customer Details
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666; width: 40%;">Name</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600;">${escapeHtml(data.name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Phone</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600;">${escapeHtml(data.phone)}</td>
        </tr>
        ${data.email ? `
        <tr>
          <td style="padding: 8px 0; color: #666;">Email</td>
          <td style="padding: 8px 0; color: #2D3436;">${escapeHtml(data.email)}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    ${(data.pickup || data.drop || data.date || data.time || data.passengers || data.vehicle) ? `
    <!-- Trip Details -->
    <div style="padding: 0 24px 24px;">
      <h2 style="margin: 0 0 16px; color: #2D3436; font-size: 16px; border-bottom: 2px solid #eee; padding-bottom: 8px;">
        Trip Details
      </h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${data.pickup ? `
        <tr>
          <td style="padding: 8px 0; color: #666; width: 40%;">Pickup</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600;">${escapeHtml(data.pickup)}</td>
        </tr>
        ` : ''}
        ${data.drop ? `
        <tr>
          <td style="padding: 8px 0; color: #666;">Drop</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600;">${escapeHtml(data.drop)}</td>
        </tr>
        ` : ''}
        ${data.date ? `
        <tr>
          <td style="padding: 8px 0; color: #666;">Date</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600;">${escapeHtml(data.date)}</td>
        </tr>
        ` : ''}
        ${data.time ? `
        <tr>
          <td style="padding: 8px 0; color: #666;">Preferred Time</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600;">${escapeHtml(data.time)}</td>
        </tr>
        ` : ''}
        ${data.passengers ? `
        <tr>
          <td style="padding: 8px 0; color: #666;">Passengers</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600;">${escapeHtml(data.passengers)}</td>
        </tr>
        ` : ''}
        ${data.vehicle ? `
        <tr>
          <td style="padding: 8px 0; color: #666;">Vehicle</td>
          <td style="padding: 8px 0; color: #2D3436; font-weight: 600;">${escapeHtml(data.vehicle)}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    ` : ''}

    ${data.message ? `
    <!-- Message -->
    <div style="padding: 24px; background-color: #f8f9fa;">
      <h2 style="margin: 0 0 8px; color: #2D3436; font-size: 16px;">Message</h2>
      <p style="margin: 0; padding: 12px; background-color: #fff; border-radius: 6px; color: #2D3436; white-space: pre-wrap;">
        ${escapeHtml(data.message)}
      </p>
    </div>
    ` : ''}

    <!-- Footer -->
    <div style="padding: 16px; background-color: #2D3436; text-align: center;">
      <p style="margin: 0; color: #aaa; font-size: 12px;">
        Nainital Taxi Admin | ${new Date().toLocaleString('en-IN')}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate contact enquiry auto-reply email HTML
 */
function generateContactAutoReplyEmail(data: ContactData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Received Your Enquiry</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%); padding: 32px; text-align: center;">
      <h1 style="margin: 0; color: #2D3436; font-size: 28px;">Thank You!</h1>
      <p style="margin: 8px 0 0; color: #2D3436; font-size: 16px;">We received your enquiry</p>
    </div>

    <!-- Confirmation Message -->
    <div style="padding: 24px; text-align: center;">
      <div style="width: 64px; height: 64px; background-color: #4D96FF; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px; color: white;">✓</span>
      </div>
      <h2 style="margin: 0 0 8px; color: #2D3436; font-size: 20px;">Hi ${escapeHtml(data.name)}!</h2>
      <p style="margin: 0; color: #666; font-size: 16px;">
        Thank you for your enquiry. Our team will contact you shortly.
      </p>
    </div>

    <!-- Your Details -->
    <div style="padding: 24px; background-color: #f8f9fa;">
      <h3 style="margin: 0 0 12px; color: #2D3436; font-size: 16px;">Your Enquiry Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #666;">Name</td>
          <td style="padding: 6px 0; color: #2D3436; font-weight: 600; text-align: right;">${escapeHtml(data.name)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #666;">Phone</td>
          <td style="padding: 6px 0; color: #2D3436; font-weight: 600; text-align: right;">${escapeHtml(data.phone)}</td>
        </tr>
        ${data.pickup ? `
        <tr>
          <td style="padding: 6px 0; color: #666;">Pickup</td>
          <td style="padding: 6px 0; color: #2D3436; font-weight: 600; text-align: right;">${escapeHtml(data.pickup)}</td>
        </tr>
        ` : ''}
        ${data.drop ? `
        <tr>
          <td style="padding: 6px 0; color: #666;">Drop</td>
          <td style="padding: 6px 0; color: #2D3436; font-weight: 600; text-align: right;">${escapeHtml(data.drop)}</td>
        </tr>
        ` : ''}
        ${data.date ? `
        <tr>
          <td style="padding: 6px 0; color: #666;">Date</td>
          <td style="padding: 6px 0; color: #2D3436; font-weight: 600; text-align: right;">${escapeHtml(data.date)}</td>
        </tr>
        ` : ''}
        ${data.time ? `
        <tr>
          <td style="padding: 6px 0; color: #666;">Preferred Time</td>
          <td style="padding: 6px 0; color: #2D3436; font-weight: 600; text-align: right;">${escapeHtml(data.time)}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <!-- What's Next -->
    <div style="padding: 24px;">
      <h3 style="margin: 0 0 12px; color: #2D3436; font-size: 16px;">What Happens Next?</h3>
      <ol style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8;">
        <li>Our team will review your enquiry</li>
        <li>We'll call or WhatsApp you within 15-30 minutes</li>
        <li>We'll provide a detailed quote and answer any questions</li>
        <li>Book your ride when you're ready!</li>
      </ol>
    </div>

    <!-- Contact -->
    <div style="padding: 24px; background-color: #2D3436; color: #fff; text-align: center;">
      <p style="margin: 0 0 16px; font-size: 14px;">Need immediate assistance?</p>
      <a href="https://wa.me/${BUSINESS_WHATSAPP}" style="display: inline-block; padding: 12px 24px; background-color: #25D366; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 8px;">
        WhatsApp
      </a>
      <a href="tel:+91${BUSINESS_PHONE}" style="display: inline-block; padding: 12px 24px; background-color: #4D96FF; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Call Us
      </a>
      <p style="margin: 16px 0 0; font-size: 12px; color: #aaa;">
        ${BUSINESS_NAME} | ${WEBSITE_URL}
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send contact enquiry emails (admin notification + customer auto-reply).
 *
 * `recipient` comes from the contact page's admin settings
 * (contact_page_content.enquiry_recipient_email) so the business can redirect
 * enquiries without an env change or redeploy; it falls back to the
 * ADMIN_EMAIL env var when unset.
 *
 * The result reflects the *admin* notification only — the auto-reply is a
 * courtesy and its failure must not make a received enquiry look lost.
 */
export async function sendContactEnquiry(
  data: ContactData,
  recipient?: string | null
): Promise<SendResult> {
  try {
    // Always send admin notification
    const adminResult = await sendEmailWithResult({
      to: recipient?.trim() || ADMIN_EMAIL,
      subject: `New Contact Enquiry - ${data.name}`,
      html: generateContactEnquiryAdminEmail(data),
      replyTo: data.email?.trim() || undefined,
    });

    // Send auto-reply only if customer provided email
    if (data.email && data.email.trim().length > 0) {
      const autoReplyResult = await sendEmailWithResult({
        to: data.email,
        subject: `We Received Your Enquiry | ${BUSINESS_NAME}`,
        html: generateContactAutoReplyEmail(data),
        replyTo: GUEST_REPLY_TO,
      });
      if (!autoReplyResult.ok) {
        console.error('[notifications] Auto-reply email failed:', autoReplyResult.reason);
      }
    }

    return adminResult;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown error';
    console.error('[notifications] Failed to send contact enquiry emails:', error);
    return { ok: false, reason };
  }
}
