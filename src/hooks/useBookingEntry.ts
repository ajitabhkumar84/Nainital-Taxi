'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookingStore, BookingEntryPatch, BookingStep } from '@/store/bookingStore';
import { parseBookingEntry } from '@/lib/bookingLink';
import { capture } from '@/lib/analytics/capture';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

/**
 * Applies the /booking URL entry contract to the store exactly once per
 * distinct URL, then reports readiness. The ref guard (rather than relying
 * solely on the effect's dependency array) means later re-renders driven by
 * in-flow store changes — e.g. the user hitting Back, which changes
 * currentStep — never re-trigger the entry patch and snap them back forward.
 */
export function useBookingEntry(): { ready: boolean } {
  const searchParams = useSearchParams();
  const applyEntry = useBookingStore((state) => state.applyEntry);
  const [ready, setReady] = useState(false);
  const appliedForRef = useRef<string | null>(null);

  useEffect(() => {
    // `step` is managed separately by useBookingStepUrlSync (browser
    // Back/Forward support) and must never be part of this comparison —
    // otherwise every step transition would look like a new entry URL and
    // re-run applyEntry, wiping trip/contact details the user already typed.
    const entryParams = new URLSearchParams(searchParams.toString());
    entryParams.delete('step');
    const qs = entryParams.toString();
    if (appliedForRef.current === qs) return;
    appliedForRef.current = qs;

    const parsed = parseBookingEntry(searchParams);

    // Only a package/route + vehicle together mean every Step 1 decision is
    // already made; anything less still needs Step 1 (collapsed summary, or
    // the full picker with a vehicle pre-ticked for a fleet-only arrival).
    const currentStep: BookingStep = (parsed.packageId || parsed.routeId) && parsed.vehicle ? 2 : 1;

    const patch: BookingEntryPatch = { currentStep };
    if (parsed.packageId) patch.packageId = parsed.packageId;
    if (parsed.routeId) patch.routeId = parsed.routeId;
    if (parsed.packageTitle) patch.packageTitle = parsed.packageTitle;
    if (parsed.packageSlug) patch.packageSlug = parsed.packageSlug;
    if (parsed.packageType) patch.bookingType = parsed.packageType;
    if (parsed.vehicle) patch.vehicleType = parsed.vehicle;
    if (parsed.date) patch.tripDate = parsed.date;
    if (parsed.time) patch.tripTime = parsed.time;
    if (parsed.pickup) patch.pickupLocation = parsed.pickup;
    if (parsed.dropoff) patch.dropoffLocation = parsed.dropoff;
    if (parsed.passengers) patch.passengerCount = parsed.passengers;

    applyEntry(patch);

    // The top of the funnel. Reports how much of the booking was already
    // decided by the link the visitor arrived on, which is what distinguishes
    // a warm arrival from /rates (route + vehicle prefilled, lands on step 2)
    // from a cold /booking visit that has to walk all four steps.
    capture(ANALYTICS_EVENTS.bookingEntry, {
      landing_step: currentStep,
      booking_type: parsed.packageType ?? null,
      package_id: parsed.packageId ?? null,
      route_id: parsed.routeId ?? null,
      vehicle_type: parsed.vehicle ?? null,
      has_date: Boolean(parsed.date),
      has_pickup: Boolean(parsed.pickup),
      prefilled_field_count: Object.keys(patch).length - 1, // minus currentStep
      is_deep_link: currentStep === 2,
    });

    setReady(true);
  }, [searchParams, applyEntry]);

  return { ready };
}
