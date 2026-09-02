'use client';

import { useState, useEffect, useRef } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { Input, Select } from '@/components/ui';
import { Calendar, Users, MapPin, Phone, MessageCircle, ExternalLink, Plus, Check } from 'lucide-react';
import { getPackagePrice, getRoutePrice, getAvailabilityForDate, formatPrice, getVehicleCapacity, getVehicleTypeName } from '@/lib/pricing';
import { formatTime, formatDate, getMinBookingDate } from '@/lib/booking';
import { useVehicleLabels } from '@/hooks/useVehicleLabels';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { generateAvailabilityInquiryWhatsAppLink } from '@/lib/messageGenerators';
import AddonSelector from './AddonSelector';
import BlockedDateNotice from './BlockedDateNotice';
import StepShell from './StepShell';
import { FIELD_LABEL } from './fieldStyles';
import { capture } from '@/lib/analytics/capture';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { bookingProperties, CTA_PLACEMENTS } from '@/lib/analytics/properties';

// Hourly pickup-time options within our staffed window. Both flows cut off
// at 3 PM (15:00) so the trip has daylight to complete; tours additionally
// can't start before the park/gate opens, so they start two hours later
// than transfers.
function generateHourlyTimeSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
}

export default function Step2TripDetails() {
  const {
    packageId,
    routeId,
    packageTitle,
    packageSlug,
    bookingType,
    vehicleType,
    tripDate,
    tripTime,
    passengerCount,
    pickupLocation,
    dropoffLocation,
    setTripDate,
    setTripTime,
    setPassengerCount,
    setPickupLocation,
    setDropoffLocation,
    setCalculatedPrice,
    setAvailability,
    availabilityStatus,
    carsAvailable,
    calculatedPrice,
    seasonName,
    routeContext,
    selectedAddons,
    addonsTotal,
    nextStep,
    prevStep,
  } = useBookingStore();
  const { labels: vehicleLabels } = useVehicleLabels();
  const { config: siteConfig } = useSiteConfig();

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [priceError, setPriceError] = useState(false);
  const [hasAddons, setHasAddons] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLSelectElement>(null);
  const passengerRef = useRef<HTMLInputElement>(null);
  const pickupRef = useRef<HTMLInputElement>(null);

  // Tours don't start until the park/gate opens; transfers can be picked up
  // earlier for airport/rail connections. Both cut off at 3 PM.
  const timeSlots = bookingType === 'tour'
    ? generateHourlyTimeSlots(9, 15)  // 9:00 AM – 3:00 PM
    : generateHourlyTimeSlots(7, 15); // 7:00 AM – 3:00 PM

  // Passenger count needs to allow a temporarily-empty field while the user
  // is backspacing to retype a value — clamping to 1 on every keystroke traps
  // them mid-edit. The minimum is only enforced on blur/submit.
  const [passengerInput, setPassengerInput] = useState(String(passengerCount));
  useEffect(() => {
    setPassengerInput(String(passengerCount));
  }, [passengerCount]);

  // Clear a standing validation message once the user touches anything it
  // could have been about.
  useEffect(() => {
    setError(null);
  }, [tripDate, tripTime, pickupLocation, passengerInput, vehicleType]);

  const handlePassengerChange = (value: string) => {
    if (value === '') {
      setPassengerInput('');
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setPassengerInput(value);
      setPassengerCount(num);
    }
  };

  const handlePassengerBlur = () => {
    const num = parseInt(passengerInput, 10);
    if (passengerInput === '' || isNaN(num) || num < 1) {
      setPassengerInput('1');
      setPassengerCount(1);
    }
  };

  // packageSlug is a URL-only field (never persisted). If it's missing on
  // arrival — e.g. a hand-built /booking URL, or a non-tour entry path —
  // fall back to resolving it from packageId rather than just hiding the
  // details link.
  const [resolvedSlug, setResolvedSlug] = useState(packageSlug);
  useEffect(() => {
    setResolvedSlug(packageSlug);
  }, [packageSlug]);

  useEffect(() => {
    if (packageSlug || !packageId || bookingType !== 'tour') return;
    let cancelled = false;
    // Fetched via a route handler rather than importing getPackageById
    // directly — getPackageById is unstable_cache-wrapped, which throws
    // "incrementalCache missing" when invoked from a Client Component.
    fetch(`/api/packages/${packageId}`)
      .then((r) => r.json())
      .then(({ data: pkg }) => {
        if (!cancelled && pkg?.slug) setResolvedSlug(pkg.slug);
      })
      .catch((error) => {
        console.error('Error resolving package slug:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [packageId, packageSlug, bookingType]);

  useEffect(() => {
    if (tripDate && (packageId || routeId) && vehicleType) {
      checkAvailabilityAndPrice(tripDate);
    }
  }, [tripDate, packageId, routeId, vehicleType]);

  async function checkAvailabilityAndPrice(date: string) {
    if ((!packageId && !routeId) || !vehicleType) return;

    setCheckingAvailability(true);
    setFetchingPrice(true);
    setPriceError(false);

    try {
      // Check availability
      const availabilityData = await getAvailabilityForDate(date);
      if (availabilityData) {
        setAvailability(availabilityData.status, availabilityData.carsAvailable);
        setBlockedMessage(availabilityData.message);

        if (
          availabilityData.status === 'sold_out' ||
          availabilityData.status === 'blocked'
        ) {
          capture(ANALYTICS_EVENTS.bookingUnavailable, {
            reason: availabilityData.status,
            trip_date: date,
            cars_available: availabilityData.carsAvailable ?? null,
          });
        }
      }

      // Get price — routeId and packageId are mutually exclusive
      const priceData = routeId
        ? await getRoutePrice(routeId, vehicleType, date)
        : await getPackagePrice(packageId!, vehicleType, date);
      if (priceData) {
        setCalculatedPrice(priceData.price, priceData.seasonId, priceData.seasonName);

        // The first authoritative price in the funnel. Step 1 only ever showed
        // a per-vehicle quote from local state; this is the figure the rest of
        // the booking is built on, so revenue analysis anchors here.
        capture(ANALYTICS_EVENTS.bookingPriceResolved, {
          price_total: priceData.price,
          season_name: priceData.seasonName,
          vehicle_type: vehicleType,
          package_id: packageId,
          route_id: routeId,
          trip_date: date,
        });
      } else {
        setPriceError(true);

        // No price row for this package/vehicle/season combination. A silent
        // dead end for the customer, so it needs to be visible to us.
        capture(ANALYTICS_EVENTS.bookingUnavailable, {
          reason: 'no_price',
          vehicle_type: vehicleType,
          package_id: packageId,
          route_id: routeId,
          trip_date: date,
        });
      }
    } catch (error) {
      console.error('Error checking availability and price:', error);
      setPriceError(true);
    } finally {
      setCheckingAvailability(false);
      setFetchingPrice(false);
    }
  }

  const capacityExceeded = Boolean(
    vehicleType && passengerCount > getVehicleCapacity(vehicleType)
  );

  // Blocked dates have nothing left to configure — no price to show, no
  // pickup time/passengers/location to collect, nothing to continue to.
  // Everything below the availability notice stays hidden until the user
  // picks a different date.
  const isBlocked = availabilityStatus === 'blocked';

  // Case-insensitive substring match rather than a strict canonical-value
  // check: transfers always carry an exact "Nainital" pickup, but tour
  // pickups are free-typed hotel addresses (e.g. "Manu Maharani Hotel,
  // Nainital") that should still surface this note.
  const isNainitalPickup = pickupLocation.toLowerCase().includes('nainital');

  // Whether this trip actually incurs Nainital entry/parking charges — true
  // for every local tour package, and for any transfer that touches Nainital
  // on either end (not just transfers *out of* Nainital, which don't).
  const involvesNainitalEntry =
    bookingType === 'tour' ||
    isNainitalPickup ||
    (dropoffLocation || '').toLowerCase().includes('nainital');

  /**
   * Report the failure, say what is wrong, and take the user to where it is
   * wrong. The message renders in the sticky rail / fixed action bar, which on
   * a phone can be nowhere near the field — so the scroll is what makes the
   * inline message actionable. This replaces alert(), which blocked the main
   * thread and dismissed the iOS keyboard.
   *
   * The capture() call is unchanged in name, properties and `reason` values.
   */
  const failWith = (
    message: string,
    reason: string,
    field?: React.RefObject<HTMLElement>
  ) => {
    setError(message);
    capture(ANALYTICS_EVENTS.bookingValidationFailed, {
      ...bookingProperties(useBookingStore.getState()),
      step: 2,
      reason,
    });
    field?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field?.current?.focus({ preventScroll: true });
  };

  const handleNext = () => {
    if (!tripDate || !tripTime || !pickupLocation) {
      failWith(
        !tripDate
          ? 'Please choose a travel date.'
          : !tripTime
            ? 'Please choose a pickup time.'
            : 'Please tell us where to pick you up.',
        !tripDate ? 'no_date' : !tripTime ? 'no_time' : 'no_pickup',
        !tripDate ? dateRef : !tripTime ? timeRef : pickupRef
      );
      return;
    }

    const parsedPassengerCount = parseInt(passengerInput, 10);
    if (passengerInput === '' || isNaN(parsedPassengerCount) || parsedPassengerCount < 1) {
      setPassengerInput('1');
      setPassengerCount(1);
      // Previously this branch silently self-healed with no message at all, so
      // the field changed under the user with no explanation.
      failWith('Please enter at least 1 passenger.', 'invalid_passenger_count', passengerRef);
      return;
    }

    if (availabilityStatus === 'sold_out' || availabilityStatus === 'blocked') {
      failWith(
        'This date is not available. Please contact us or choose another date.',
        availabilityStatus === 'sold_out' ? 'sold_out' : 'blocked_date'
      );
      return;
    }

    if (capacityExceeded) {
      failWith(
        'This vehicle is too small for your passenger count. Go back and choose a larger vehicle.',
        'capacity_exceeded',
        passengerRef
      );
      return;
    }

    setError(null);
    capture(ANALYTICS_EVENTS.bookingStepCompleted, {
      ...bookingProperties(useBookingStore.getState()),
      step: 2,
    });

    nextStep();
  };

  const getAvailabilityColor = () => {
    switch (availabilityStatus) {
      case 'available':
        return 'bg-green-50 border-green-300 text-green-800';
      case 'limited':
        return 'bg-amber-50 border-amber-300 text-amber-800';
      case 'sold_out':
        return 'bg-red-50 border-red-300 text-red-800';
      default:
        return '';
    }
  };

  const getAvailabilityMessage = () => {
    switch (availabilityStatus) {
      case 'available':
        return `✅ Great! We have ${carsAvailable} cars available on this date.`;
      case 'limited':
        return `⚠️ Hurry! Only ${carsAvailable} car${carsAvailable === 1 ? '' : 's'} left for this date!`;
      case 'sold_out':
        return '❌ All cars are booked for this date. Please contact us for alternatives.';
      case 'blocked':
        return '🚫 Online booking unavailable for this date. Please contact us directly.';
      default:
        return '';
    }
  };

  const total = calculatedPrice !== null ? calculatedPrice + addonsTotal : null;

  /**
   * Add-ons are collapsed by default.
   *
   * AddonSelector renders a 2-column grid of ~120px cards; six add-ons is
   * ~390px, which on its own pushes the required fields off a 768px screen. An
   * optional upsell displacing required fields is backwards, so it lives behind
   * a disclosure — but the summary line has to say whether any are *selected*,
   * not just available, or a collapsed section would hide the fact that the
   * customer already added ₹300 of extras.
   *
   * AddonSelector stays mounted (details/summary hides its body without
   * unmounting) so onAvailabilityChange still fires and `hasAddons` is correct.
   */
  const addonSummary =
    selectedAddons.length > 0
      ? `${selectedAddons.length} selected · +${formatPrice(addonsTotal)}`
      : 'Add extras';

  return (
    <StepShell
      rail={{
        summary: [
          Boolean(packageTitle) && {
            label: 'Trip',
            value: (
              <>
                {packageTitle}
                {resolvedSlug && bookingType === 'tour' && (
                  <a
                    href={`/tour/${resolvedSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 ml-1.5 text-xs font-semibold text-sunshine hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Details
                  </a>
                )}
              </>
            ),
            onEdit: prevStep,
          },
          Boolean(vehicleType) && {
            label: 'Vehicle',
            value: vehicleLabels[vehicleType!] ?? getVehicleTypeName(vehicleType!),
            onEdit: prevStep,
          },
          Boolean(tripDate) && {
            label: 'Date',
            value: formatDate(tripDate!),
            onEdit: prevStep,
          },
        ],
        price: {
          label: addonsTotal > 0 ? 'Total trip cost' : 'Estimated price',
          amount: isBlocked || priceError ? null : total,
          loading: fetchingPrice || checkingAvailability,
          placeholder: priceError
            ? 'No price for this combination'
            : 'Select a date to see your fare',
          note: (
            <>
              {addonsTotal > 0 && (
                <span className="block">
                  {formatPrice(calculatedPrice ?? 0)} trip + {formatPrice(addonsTotal)} extras
                </span>
              )}
              {seasonName && <span className="block">{seasonName} pricing</span>}
              {involvesNainitalEntry && (
                <span className="block">
                  Nainital entry and parking extra (approx. Rs. 300)
                </span>
              )}
            </>
          ),
        },
      }}
      primary={{
        label: 'Continue to Contact Info',
        onClick: handleNext,
        disabled:
          isBlocked ||
          !tripDate ||
          !tripTime ||
          !pickupLocation ||
          priceError ||
          availabilityStatus === 'sold_out' ||
          capacityExceeded,
      }}
      secondary={{ label: 'Back', onClick: prevStep }}
      error={error}
    >
      {/* Availability status. Stays in the form column rather than the rail:
          when a date is sold out this block carries its own Call/WhatsApp
          actions, which need room the rail doesn't have. */}
      {checkingAvailability && tripDate && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-slate-500" />
          Checking availability…
        </div>
      )}

      {!checkingAvailability && tripDate && availabilityStatus === 'blocked' && (
        <BlockedDateNotice
          date={tripDate}
          tripLabel={packageTitle || 'your trip'}
          pickupLocation={pickupLocation || undefined}
          dropoffLocation={dropoffLocation || undefined}
          message={blockedMessage}
        />
      )}

      {!checkingAvailability && tripDate && availabilityStatus && availabilityStatus !== 'blocked' && (
        <div className={`p-3 rounded-xl border text-sm ${getAvailabilityColor()}`}>
          <p className="font-medium">{getAvailabilityMessage()}</p>

          {availabilityStatus === 'sold_out' && (
            <div className="flex flex-wrap gap-2 mt-3">
              <a
                href={generateAvailabilityInquiryWhatsAppLink(
                  siteConfig.contact.whatsapp,
                  { tripLabel: packageTitle || 'your trip', pickupLocation, dropoffLocation },
                  tripDate
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-whatsapp text-white rounded-md text-sm font-semibold hover:brightness-95 transition"
              >
                <MessageCircle className="w-4 h-4" />
                Contact on WhatsApp
              </a>
              <a
                href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`}
                data-analytics-cta="call"
                onClick={() =>
                  capture(ANALYTICS_EVENTS.contactCallClicked, {
                    placement: CTA_PLACEMENTS.bookingStep2,
                    context: 'sold_out',
                  })
                }
                className="flex items-center gap-2 px-3 py-2 bg-sunshine text-white rounded-md text-sm font-semibold hover:bg-sunshine-500 transition"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </a>
            </div>
          )}
        </div>
      )}

      {priceError && tripDate && !checkingAvailability && !fetchingPrice && (
        <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-sm text-red-800">
          We couldn&apos;t find a price for this package, vehicle and date combination.
          Please try a different date or vehicle, or contact us directly.
        </div>
      )}

      {!isBlocked && (
        <>
          {/* Date is normally already picked in Step 1 (it's needed there to
              show per-vehicle pricing), so it lives in the rail as a summary
              row. This editable input is the fallback for a direct/URL entry
              that lands on Step 2 without one. */}
          {!tripDate && (
            <div>
              <label htmlFor="trip-date" className={FIELD_LABEL}>
                Travel Date <span className="text-coral">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <Input
                  id="trip-date"
                  ref={dateRef}
                  type="date"
                  value={tripDate || ''}
                  onChange={(e) => setTripDate(e.target.value)}
                  min={getMinBookingDate()}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label htmlFor="pickup-time" className={FIELD_LABEL}>
                Pickup Time <span className="text-coral">*</span>
              </label>
              <Select
                id="pickup-time"
                ref={timeRef}
                value={tripTime ?? ''}
                onChange={(e) => setTripTime(e.target.value)}
                required
              >
                <option value="" disabled>Select a pickup time</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>{formatTime(time)}</option>
                ))}
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Need another time? Message us on WhatsApp.
              </p>
            </div>

            <div>
              <label htmlFor="passenger-count" className={FIELD_LABEL}>
                Passengers <span className="text-coral">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <Input
                  id="passenger-count"
                  ref={passengerRef}
                  type="number"
                  value={passengerInput}
                  onChange={(e) => handlePassengerChange(e.target.value)}
                  onBlur={handlePassengerBlur}
                  min={1}
                  max={10}
                  className="pl-10"
                  aria-invalid={capacityExceeded || undefined}
                  required
                />
              </div>
              {capacityExceeded && vehicleType && (
                <p className="text-xs text-amber-700 mt-1">
                  This vehicle seats up to {getVehicleCapacity(vehicleType)}.{' '}
                  <a
                    href={`https://wa.me/${siteConfig.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hi, I need a vehicle for ${passengerCount} passengers${
                        tripDate ? ` on ${tripDate}` : ''
                      }. Can you help with a larger-group arrangement?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-analytics-cta="whatsapp"
                    className="font-semibold text-whatsapp hover:underline"
                  >
                    Ask about larger groups →
                  </a>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="pickup-location" className={FIELD_LABEL}>
                Pickup Location <span className="text-coral">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <Input
                  id="pickup-location"
                  ref={pickupRef}
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. Hotel Manu Maharani, Nainital"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="dropoff-location" className={FIELD_LABEL}>
                Drop-off Location <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <Input
                  id="dropoff-location"
                  type="text"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  placeholder="Same as pickup if not specified"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {isNainitalPickup && (
            <p className="text-xs text-slate-500">
              Note: pickups from Zoo Road, Birla Road or Snow View Point aren&apos;t possible.
              We can pick you up from Mall Road, High Court, Ayarpatta, or your hotel.
            </p>
          )}

          {/* Add-ons — collapsed by default; see the addonSummary comment. */}
          {tripDate && calculatedPrice !== null && seasonName && (
            <details className={hasAddons ? 'group rounded-xl border border-slate-200' : 'hidden'}>
              <summary className="flex items-center justify-between gap-3 px-3.5 py-3 cursor-pointer list-none select-none">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  {selectedAddons.length > 0 ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Plus className="w-4 h-4 text-sunshine" />
                  )}
                  {addonSummary}
                </span>
                <span className="text-xs text-slate-500 group-open:hidden">Show</span>
                <span className="text-xs text-slate-500 hidden group-open:inline">Hide</span>
              </summary>
              <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-200">
                <AddonSelector
                  packageId={packageId || undefined}
                  routeId={routeId || undefined}
                  destinationId={routeContext?.destinationSlug || undefined}
                  seasonName={seasonName as 'Off-Season' | 'Season'}
                  stage="before_booking"
                  onAvailabilityChange={setHasAddons}
                  compact
                />
              </div>
            </details>
          )}
        </>
      )}
    </StepShell>
  );
}
