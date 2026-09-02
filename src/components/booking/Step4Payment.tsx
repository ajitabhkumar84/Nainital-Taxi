'use client';

import { useState, useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { Button } from '@/components/ui';
import {
  Copy,
  Check,
  MessageCircle,
  Mail,
  Phone,
  CheckCircle,
  Shield,
  UserCheck,
  Heart,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { calculateAdvanceAmount, formatPrice, formatDate, getAdvanceLabelKind } from '@/lib/booking';
import AddonSelector from './AddonSelector';
import StepShell from './StepShell';
import { FIELD_LABEL } from './fieldStyles';
import { capture } from '@/lib/analytics/capture';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { bookingProperties, CTA_PLACEMENTS } from '@/lib/analytics/properties';

// The live UPI handle. Hardcoded rather than read from admin_settings.upi_id
// because it must match the QR code baked into public/nainital-upi.jpg below —
// an admin editing the settings field would change the text a customer copies
// without changing the code they scan, sending the two to different accounts.
// Changing the handle therefore means replacing that image too, and updating
// the DEFAULT_SETTINGS fallback in src/app/admin/settings/page.tsx.
const UPI_ID = 'gokumaon@ptyes';
const WHATSAPP_NUMBER = '8445206116';

export default function Step4Payment() {
  const booking = useBookingStore();
  // The India path stores a bare 10-digit number ("+91" is implied); the
  // international fallback stores whatever full number the customer typed,
  // so it's already display-ready as-is.
  const displayPhone =
    booking.customerCountryCode === '91' ? `+91 ${booking.customerPhone}` : booking.customerPhone;
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isBookingCreated, setIsBookingCreated] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [createdAdvanceAmount, setCreatedAdvanceAmount] = useState<number | null>(null);
  const [createdTotalAmount, setCreatedTotalAmount] = useState<number | null>(null);
  const [hasAddons, setHasAddons] = useState(false);

  // Pre-submit estimate only — for the success screen, the authoritative
  // total/advance/remaining come from the create API response (see below).
  const totalAmount = (booking.calculatedPrice || 0) + booking.addonsTotal;
  const advanceAmount = calculateAdvanceAmount(totalAmount);
  const remainingAmount = totalAmount - advanceAmount;
  const advanceLabelKind = getAdvanceLabelKind(totalAmount);

  // Authoritative figures for the success screen, once known.
  const confirmedTotal = createdTotalAmount ?? totalAmount;
  const confirmedAdvance = createdAdvanceAmount ?? advanceAmount;
  const confirmedRemaining = confirmedTotal - confirmedAdvance;

  // Whether this trip actually incurs Nainital entry/parking charges — true
  // for every local tour package, and for any transfer that touches Nainital
  // on either end (not just transfers *out of* Nainital, which don't).
  const involvesNainitalEntry =
    booking.bookingType === 'tour' ||
    booking.pickupLocation.toLowerCase().includes('nainital') ||
    (booking.dropoffLocation || '').toLowerCase().includes('nainital');

  // Flattened so the review grid is a plain map rather than a JSX ladder with
  // three conditional branches inlined in the middle of it.
  const reviewRows: Array<[string, React.ReactNode]> = [
    ['Package', booking.packageTitle || 'Custom'],
    ['Vehicle', booking.vehicleType],
    ['Date', formatDate(booking.tripDate || '')],
    ['Time', booking.tripTime],
    ['Passengers', booking.passengerCount],
    ['Pickup', booking.pickupLocation],
    ...(booking.seasonName ? ([['Season', booking.seasonName]] as Array<[string, React.ReactNode]>) : []),
    ['Name', booking.customerName],
    ['Phone', displayPhone],
    ...(booking.customerEmail ? ([['Email', booking.customerEmail]] as Array<[string, React.ReactNode]>) : []),
  ];

  // Check if booking was already created (from store)
  useEffect(() => {
    if (booking.isBookingComplete && booking.bookingId) {
      setIsBookingCreated(true);
      setCreatedBookingId(booking.bookingId);
      setCreatedAdvanceAmount(booking.advanceAmount);
      setCreatedTotalAmount(booking.confirmedTotalAmount);
    }
  }, [booking.isBookingComplete, booking.bookingId, booking.advanceAmount, booking.confirmedTotalAmount]);

  /**
   * The end of the funnel: the confirmation screen prompting the customer to
   * send their payment screenshot on WhatsApp.
   *
   * This needs its own event rather than a pageview because it shares the
   * ?step=4 URL with the pre-submission payment form — nothing in the URL
   * distinguishes "looking at the QR" from "booking placed". Keyed on the
   * booking id so it fires once per booking, including when the screen is
   * restored from the persisted store on a remount, which is a real view.
   */
  useEffect(() => {
    if (!isBookingCreated || !createdBookingId) return;

    capture(ANALYTICS_EVENTS.bookingConfirmationViewed, {
      ...bookingProperties(useBookingStore.getState()),
      booking_id: createdBookingId,
      price_total: createdTotalAmount,
      price_advance: createdAdvanceAmount,
    });
    // createdTotalAmount/createdAdvanceAmount are set in the same tick as the
    // two below, so keying on the id alone avoids a duplicate emission.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBookingCreated, createdBookingId]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);

      // Copying the UPI handle is the strongest signal we have that the
      // customer is actually about to pay — there is no payment gateway
      // callback to tell us, so this and the screenshot share are the only
      // observable steps between "booking created" and money arriving.
      if (field === 'upi') {
        capture(ANALYTICS_EVENTS.paymentUpiCopied, {
          ...bookingProperties(booking),
          booking_id: createdBookingId,
          price_advance: confirmedAdvance,
        });
      }

      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      alert('Failed to copy. Please copy manually.');
    }
  };

  // Create booking via API
  const handleSubmitBooking = async () => {
    if (isBookingCreated) return;

    setIsSubmitting(true);
    setSubmitError(null);

    capture(ANALYTICS_EVENTS.bookingSubmitted, {
      ...bookingProperties(booking),
      price_total_estimate: totalAmount,
      price_advance_estimate: advanceAmount,
    });

    // Set when the failure has already been reported with an HTTP status, so
    // the catch below does not double-report it as a network error.
    let failureReported = false;

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerCountryCode: booking.customerCountryCode,
          customerEmail: booking.customerEmail || undefined,
          packageId: booking.packageId || undefined,
          routeId: booking.routeId || undefined,
          packageName: booking.packageTitle || 'Custom Booking',
          vehicleType: booking.vehicleType,
          tripDate: booking.tripDate,
          tripTime: booking.tripTime,
          pickupLocation: booking.pickupLocation,
          dropoffLocation: booking.dropoffLocation || undefined,
          passengers: booking.passengerCount,
          totalAmount: booking.calculatedPrice || 0, // Base price only
          addonsTotal: booking.addonsTotal,
          selectedAddons: booking.selectedAddons,
          seasonName: booking.seasonName || 'Off-Season',
          specialRequests: booking.specialRequests || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        capture(ANALYTICS_EVENTS.bookingFailed, {
          ...bookingProperties(booking),
          error_status: response.status,
          // 409 is the availability guard refusing a blocked date — a distinct
          // funnel outcome from a genuine server error, and the one worth
          // alerting on because it means the customer did everything right.
          reason: response.status === 409 ? 'blocked_date' : 'api_error',
        });
        failureReported = true;

        // A blocked-date 409 from the availability guard is a distinct,
        // expected condition (not a generic server failure) — surface a
        // clearer message pointing the user back to date selection.
        if (response.status === 409) {
          throw new Error(
            data.error || 'This date is no longer available for online booking. Please go back and choose a different date.'
          );
        }
        throw new Error(data.error || 'Failed to create booking');
      }

      // Update store with the authoritative result (server-computed, not booking.calculatedPrice)
      booking.setBookingResult(data.bookingId, data.advanceAmount, data.totalAmount);

      // THE CONVERSION. Amounts come from the API response, never from the
      // client-side estimate above: /api/bookings/create recomputes price
      // server-side and body.totalAmount is never trusted, so the estimate can
      // legitimately differ from what the customer is actually charged.
      capture(ANALYTICS_EVENTS.bookingCreated, {
        ...bookingProperties(booking),
        booking_id: data.bookingId,
        price_total: data.totalAmount,
        price_advance: data.advanceAmount,
        price_remaining: data.totalAmount - data.advanceAmount,
      });

      // Update local state
      setCreatedBookingId(data.bookingId);
      setCreatedAdvanceAmount(data.advanceAmount);
      setCreatedTotalAmount(data.totalAmount);
      setIsBookingCreated(true);
    } catch (error) {
      console.error('Booking creation error:', error);
      if (!failureReported) {
        capture(ANALYTICS_EVENTS.bookingFailed, {
          ...bookingProperties(booking),
          error_status: null,
          reason: 'network_error',
        });
      }
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to create booking. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate WhatsApp message with booking ID and advance
  const generateWhatsAppMessage = () => {
    const bookingIdText = createdBookingId || 'Pending';

    const message = `Hi, I have made the advance payment for my booking.

*Booking ID:* ${bookingIdText}

*Booking Details:*
- Package: ${booking.packageTitle || 'Custom Booking'}
- Vehicle: ${booking.vehicleType}
- Date: ${formatDate(booking.tripDate || '')}
- Time: ${booking.tripTime}
- Pickup: ${booking.pickupLocation}
- Passengers: ${booking.passengerCount}

*Payment:*
- Total Amount: ${formatPrice(confirmedTotal)}
- Advance Paid: ${formatPrice(confirmedAdvance)}
- Remaining: ${formatPrice(confirmedRemaining)}

*Customer:*
- Name: ${booking.customerName}
- Phone: ${displayPhone}
${booking.customerEmail ? `- Email: ${booking.customerEmail}` : ''}

Please confirm my booking. I will share the payment screenshot shortly.`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppShare = () => {
    // The true final step. A booking is only confirmed once the customer sends
    // proof of the UPI transfer, so the gap between booking_created and this
    // event is the "paid but never told us" cohort worth chasing.
    capture(ANALYTICS_EVENTS.paymentScreenshotShared, {
      ...bookingProperties(booking),
      booking_id: createdBookingId,
      price_advance: confirmedAdvance,
    });
    capture(ANALYTICS_EVENTS.contactWhatsappClicked, {
      placement: CTA_PLACEMENTS.bookingConfirmation,
      context: 'payment_screenshot',
    });

    const link = `https://wa.me/91${WHATSAPP_NUMBER}?text=${generateWhatsAppMessage()}`;
    window.open(link, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(
      `Booking Confirmation - ${createdBookingId || booking.packageTitle}`
    );
    const body = generateWhatsAppMessage();

    capture(ANALYTICS_EVENTS.paymentDetailsEmailed, {
      ...bookingProperties(booking),
      booking_id: createdBookingId,
    });

    window.location.href = `mailto:bookings@nainitaltaxi.in?subject=${subject}&body=${body}`;
  };

  const handleNewBooking = () => {
    booking.resetBooking();
    window.location.href = '/booking';
  };

  // Success State - Booking Created
  //
  // This screen is deliberately exempt from the wizard's one-viewport rule. It
  // is a receipt to act on, not a form to complete: conversion already
  // happened, so there is no friction left to remove, and the two ways to force
  // it into a single screen (accordion the QR, or shrink it) both get between
  // "booking created" and "pay". The QR has to stay scannable by a phone camera
  // at arm's length.
  //
  // The rule it follows instead: everything needed to PAY is in the first
  // viewport — booking ID, the advance amount, the QR and the UPI ID. The
  // upsell, the share buttons and the contact links sit below. On mobile the
  // share action gets its own fixed bar, because it used to sit ~1200px down
  // the page and it is the step that actually confirms the booking.
  if (isBookingCreated && createdBookingId) {
    return (
      <StepShell
        variant="full"
        rail={{ summary: [] }}
        primary={{ label: '', onClick: () => {} }}
      >
        <div className="space-y-5 pb-24 lg:pb-0">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 shrink-0 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-ink">Booking Created</h2>
              <p className="text-sm text-amber-800 font-semibold mt-0.5">
                Complete the payment below to confirm it.
              </p>
            </div>
          </div>

          {/* Pay-critical block: QR left, the numbers right. */}
          <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-5 lg:items-start space-y-5 lg:space-y-0">
            <div className="p-4 rounded-xl border border-sunshine bg-sunshine-50 text-center">
              <h3 className="font-bold text-ink mb-2">Pay advance via UPI</h3>
              <div className="inline-block p-3 bg-white rounded-xl border border-slate-200">
                <Image
                  src="/nainital-upi.jpg"
                  alt="UPI QR Code"
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>
              <p className="text-sm text-slate-500 mt-2">Scan to pay</p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-green-300 bg-green-50">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-slate-600">Your Booking ID</span>
                  <span className="text-2xl font-bold text-green-700 tracking-wider tabular-nums">
                    {createdBookingId}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 mt-2 pt-2 border-t border-green-200">
                  <span className="font-semibold text-green-800">Pay now (advance)</span>
                  <span className="text-3xl font-bold text-green-700 tabular-nums">
                    {formatPrice(confirmedAdvance)}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total amount</span>
                  <span className="font-semibold text-ink tabular-nums">
                    {formatPrice(confirmedTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pay to driver on the day</span>
                  <span className="font-semibold text-ink tabular-nums">
                    {formatPrice(confirmedRemaining)}
                  </span>
                </div>
              </div>

              <div>
                <label className={FIELD_LABEL}>UPI ID</label>
                <div className="flex gap-2">
                  <div className="flex-1 h-11 flex items-center px-3.5 bg-slate-50 rounded-md border border-slate-300 font-semibold text-ink">
                    {UPI_ID}
                  </div>
                  <Button
                    onClick={() => copyToClipboard(UPI_ID, 'upi')}
                    variant="secondary"
                    className="shrink-0"
                  >
                    {copiedField === 'upi' ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Account name: Go Kumaon</p>
              </div>
            </div>
          </div>

          {/* Share — the step that actually confirms the booking. */}
          <div className="p-4 rounded-xl border border-whatsapp bg-green-50">
            <h3 className="font-bold text-ink mb-1 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-whatsapp" />
              Send us the payment screenshot
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              Your booking is confirmed once we verify the payment — usually within 6 working
              hours of receiving your message.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Button
                onClick={handleWhatsAppShare}
                className="bg-whatsapp hover:brightness-95 text-white"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Share on WhatsApp
              </Button>
              <Button onClick={handleEmailShare} variant="secondary">
                <Mail className="w-5 h-5 mr-2" />
                Share via Email
              </Button>
            </div>
          </div>

          {/* After-Booking Upsell — the box/header only render once the fetch
              inside AddonSelector confirms there's something to show, so an
              empty box never flashes when there are no addons available. */}
          {booking.seasonName && (
            <div className={hasAddons ? 'p-4 rounded-xl border border-purple-300 bg-purple-50' : undefined}>
              {hasAddons && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">✨</span>
                  <div>
                    <h3 className="font-bold text-ink">Upgrade Your Experience</h3>
                    <p className="text-sm text-slate-600">Add these extras to your booking</p>
                  </div>
                </div>
              )}

              <AddonSelector
                packageId={booking.packageId || undefined}
                routeId={booking.routeId || undefined}
                destinationId={booking.routeContext?.destinationSlug || undefined}
                seasonName={booking.seasonName as 'Off-Season' | 'Season'}
                stage="after_booking"
                onAvailabilityChange={setHasAddons}
              />

              {booking.selectedAddons.length > 0 && (
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/bookings/add-addons', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          bookingId: createdBookingId,
                          addons: booking.selectedAddons.map(a => ({
                            addon_id: a.id,
                            addon_name: a.name,
                            addon_price: a.price,
                            season_name: a.season_name,
                            selected_at_stage: 'after_booking'
                          }))
                        })
                      });

                      if (response.ok) {
                        alert('Addons added successfully! Please update your advance payment to include the addon cost.');
                        booking.clearAddons();
                      } else {
                        alert('Failed to add addons. Please try again.');
                      }
                    } catch (error) {
                      console.error('Error adding addons:', error);
                      alert('Failed to add addons. Please try again.');
                    }
                  }}
                  className="w-full mt-3 bg-purple-600 hover:bg-purple-700"
                >
                  Add to My Booking (+{formatPrice(booking.addonsTotal)})
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <a
              href={`https://wa.me/91${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              data-analytics-cta="whatsapp"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-slate-300 bg-white font-semibold text-ink hover:bg-slate-50 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Need help?
            </a>
            <Button onClick={handleNewBooking} variant="secondary" className="w-full sm:w-auto">
              Create New Booking
            </Button>
            <Link href="/" className="text-sm text-slate-500 underline hover:text-ink sm:ml-auto">
              Return to homepage
            </Link>
          </div>
        </div>

        {/* Mobile: the share action was ~1200px down this page. Pin it. */}
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-4 pt-2.5"
          style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-slate-500 leading-tight">Pay now</div>
              <div className="text-base font-semibold text-ink leading-tight tabular-nums">
                {formatPrice(confirmedAdvance)}
              </div>
            </div>
            <Button
              onClick={handleWhatsAppShare}
              size="lg"
              className="shrink-0 py-3 bg-whatsapp hover:brightness-95 text-white"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Send screenshot
            </Button>
          </div>
        </div>
      </StepShell>
    );
  }

  // Pre-submission State
  return (
    <StepShell
      rail={{
        summary: [
          { label: 'Trip', value: booking.packageTitle || 'Custom' },
          { label: 'Vehicle', value: booking.vehicleType },
          { label: 'Date', value: formatDate(booking.tripDate || '') },
          { label: 'Pickup', value: `${booking.tripTime} · ${booking.pickupLocation}` },
          { label: 'Passengers', value: booking.passengerCount },
        ],
        price: {
          label: 'Total trip cost',
          amount: totalAmount,
          note: involvesNainitalEntry
            ? 'Nainital entry and parking extra (approx. Rs. 300)'
            : undefined,
          lines: [
            {
              label: 'Pay now (advance)',
              sub:
                advanceLabelKind === 'minimum'
                  ? 'Rs 500 minimum applied'
                  : advanceLabelKind === 'exact'
                    ? '25% of total'
                    : 'Approx. 25% of total',
              amount: advanceAmount,
              tone: 'advance' as const,
            },
            {
              label: 'Pay to driver',
              sub: 'On the day of the trip',
              amount: remainingAmount,
              tone: 'muted' as const,
            },
          ],
        },
      }}
      primary={{
        label: 'Submit Booking',
        onClick: handleSubmitBooking,
        disabled: !totalAmount,
        loading: isSubmitting,
        loadingLabel: 'Creating…',
        tone: 'confirm',
      }}
      secondary={{ label: 'Back', onClick: booking.prevStep, disabled: isSubmitting }}
      error={submitError}
    >
      {/* Booking summary repeated here rather than left only in the rail, so
          the customer can check what they entered without their eye leaving
          the column they have been working down. */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
        <h3 className="font-bold text-sm text-ink mb-2">Review your booking</h3>
        <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          {reviewRows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 min-w-0">
              <dt className="text-slate-500 shrink-0">{label}</dt>
              <dd className="font-semibold text-ink text-right break-words min-w-0">{value}</dd>
            </div>
          ))}
        </dl>

        {booking.selectedAddons.length > 0 && (
          <div className="pt-2 mt-2 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-1">EXTRAS</p>
            {booking.selectedAddons.map(addon => (
              <div key={addon.id} className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {addon.icon_emoji} {addon.name}
                </span>
                <span className="font-medium tabular-nums">{formatPrice(addon.price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-teal" />
          Verified drivers
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-coral" />
          Well maintained cars
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-sunshine" />
          Family-first service
        </span>
      </div>
    </StepShell>
  );
}
