'use client';

import { useEffect, useRef, useState } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { Input } from '@/components/ui';
import { validatePhone, formatDate } from '@/lib/booking';
import { formatPrice } from '@/lib/pricing';
import { User, Mail, MessageSquare } from 'lucide-react';
import StepShell from './StepShell';
import { FIELD_LABEL } from './fieldStyles';
import { capture } from '@/lib/analytics/capture';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { bookingProperties } from '@/lib/analytics/properties';

export default function Step3ContactInfo() {
  const {
    packageTitle,
    tripDate,
    tripTime,
    calculatedPrice,
    addonsTotal,
    customerName,
    customerPhone,
    customerCountryCode,
    customerEmail,
    specialRequests,
    setCustomerName,
    setCustomerPhone,
    setCustomerCountryCode,
    setCustomerEmail,
    setSpecialRequests,
    nextStep,
    prevStep,
  } = useBookingStore();

  const isInternational = customerCountryCode !== '91';

  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Clear a standing message as soon as the user edits any of the fields it
  // could have been about, so a corrected form doesn't keep accusing itself.
  useEffect(() => {
    setError(null);
  }, [customerName, customerPhone, customerEmail, customerCountryCode]);

  /**
   * Point the user at the field that failed.
   *
   * The message renders in the sticky rail (desktop) or the fixed action bar
   * (mobile), which can be a long way from the offending input — on a phone it
   * may be off-screen entirely. The inline message says *what* is wrong; this
   * says *where*. preventScroll on the focus call stops it fighting the smooth
   * scroll that is already in flight.
   */
  const failWith = (
    message: string,
    reason: string,
    field: React.RefObject<HTMLInputElement>
  ) => {
    setError(message);
    capture(ANALYTICS_EVENTS.bookingValidationFailed, {
      ...bookingProperties(useBookingStore.getState()),
      step: 3,
      reason,
    });
    field.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.current?.focus({ preventScroll: true });
  };

  // Contact details are PII and never travel as event properties — see the
  // note at the top of src/lib/analytics/properties.ts. The events below carry
  // only the shape of the failure (which field, which format), never a value.
  const handleNext = () => {
    if (!customerName || !customerPhone) {
      failWith(
        'Please enter your name and phone number.',
        !customerName ? 'no_name' : 'no_phone',
        !customerName ? nameRef : phoneRef
      );
      return;
    }

    if (!validatePhone(customerPhone, customerCountryCode)) {
      failWith(
        isInternational
          ? 'Please enter a valid phone number, including your country code.'
          : 'Please enter a valid 10-digit phone number.',
        'invalid_phone',
        phoneRef
      );
      return;
    }

    // Validate email if provided
    if (customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        failWith('Please enter a valid email address.', 'invalid_email', emailRef);
        return;
      }
    }

    setError(null);
    capture(ANALYTICS_EVENTS.bookingStepCompleted, {
      ...bookingProperties(useBookingStore.getState()),
      step: 3,
    });

    nextStep();
  };

  const total = calculatedPrice !== null ? calculatedPrice + addonsTotal : null;

  return (
    <StepShell
      rail={{
        summary: [
          Boolean(packageTitle) && { label: 'Trip', value: packageTitle },
          Boolean(tripDate) && { label: 'Date', value: formatDate(tripDate!) },
          Boolean(tripTime) && { label: 'Pickup', value: tripTime },
        ],
        price: {
          label: 'Total trip cost',
          amount: total,
          note: addonsTotal > 0 ? `Includes ${formatPrice(addonsTotal)} of extras` : undefined,
        },
      }}
      primary={{
        label: 'Continue to Payment',
        onClick: handleNext,
        disabled: !customerName || !customerPhone,
      }}
      secondary={{ label: 'Back', onClick: prevStep }}
      error={error}
    >
      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
        {/* Full Name — kept first in DOM order so the wizard's per-step
            auto-focus lands here rather than on the phone field. */}
        <div>
          <label htmlFor="customer-name" className={FIELD_LABEL}>
            Full Name <span className="text-coral">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <Input
              id="customer-name"
              ref={nameRef}
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Name as per your ID proof"
              className="pl-10"
              required
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="customer-phone" className={FIELD_LABEL}>
            Phone Number <span className="text-coral">*</span>
          </label>
          {isInternational ? (
            <Input
              id="customer-phone"
              ref={phoneRef}
              type="tel"
              value={customerPhone}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d+\s-]/g, '');
                setCustomerPhone(value);
              }}
              placeholder="+1 415 555 2671"
              required
            />
          ) : (
            <div className="flex">
              <div className="flex items-center justify-center h-11 px-3 bg-slate-100 border border-r-0 border-slate-300 rounded-l-md font-semibold text-ink">
                +91
              </div>
              <Input
                id="customer-phone"
                ref={phoneRef}
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  // Only allow numbers
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    setCustomerPhone(value);
                  }
                }}
                placeholder="9876543210"
                className="rounded-l-none"
                maxLength={10}
                required
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-3 mt-1">
            <p className="text-xs text-slate-500">Confirmation comes on WhatsApp</p>
            <button
              type="button"
              onClick={() => {
                setCustomerCountryCode(isInternational ? '91' : 'INTL');
                setCustomerPhone('');
              }}
              className="text-xs font-semibold text-sunshine hover:underline whitespace-nowrap"
            >
              {isInternational ? 'Use +91' : 'Outside India?'}
            </button>
          </div>
        </div>

        {/* Email Address (Optional) */}
        <div className="sm:col-span-2">
          <label htmlFor="customer-email" className={FIELD_LABEL}>
            Email Address <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <Input
              id="customer-email"
              ref={emailRef}
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="pl-10"
            />
          </div>
        </div>

        {/* Special Requests */}
        <div className="sm:col-span-2">
          <label htmlFor="special-requests" className={FIELD_LABEL}>
            Special Requests <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3.5 top-3 text-slate-400 w-4 h-4 pointer-events-none" />
            <textarea
              id="special-requests"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Child seat, extra luggage space, a different pickup time…"
              className="w-full pl-10 pr-3.5 py-3 min-h-[76px] border border-slate-300 rounded-md bg-slate-50 font-body text-ink placeholder:text-slate-400 focus:outline-none focus:border-sunshine focus:ring-4 focus:ring-sunshine-50 transition-colors resize-y"
              rows={2}
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        🔒 We use your details only for this booking and important updates, and never
        share them with third parties.
      </p>
    </StepShell>
  );
}
