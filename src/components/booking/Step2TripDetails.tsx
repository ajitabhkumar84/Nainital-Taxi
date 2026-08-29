'use client';

import { useState, useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { Button, Input, Select } from '@/components/ui';
import { ArrowRight, ArrowLeft, Calendar, Users, MapPin, Phone, MessageCircle, ExternalLink, Pencil } from 'lucide-react';
import { getPackagePrice, getRoutePrice, getAvailabilityForDate, formatPrice, getVehicleCapacity, getVehicleTypeName } from '@/lib/pricing';
import { formatTime, formatDate, getMinBookingDate } from '@/lib/booking';
import { useVehicleLabels } from '@/hooks/useVehicleLabels';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { generateAvailabilityInquiryWhatsAppLink } from '@/lib/messageGenerators';
import AddonSelector from './AddonSelector';
import BlockedDateNotice from './BlockedDateNotice';
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

  const handleNext = () => {
    // Every failure branch below reports before returning. These are surfaced
    // to the user with alert() rather than an error state var, so unlike step 1
    // there is nothing rendered we could observe after the fact — the event is
    // the only record that the customer was stopped here.
    if (!tripDate || !tripTime || !pickupLocation) {
      alert('Please fill in all required fields');
      capture(ANALYTICS_EVENTS.bookingValidationFailed, {
        ...bookingProperties(useBookingStore.getState()),
        step: 2,
        reason: !tripDate ? 'no_date' : !tripTime ? 'no_time' : 'no_pickup',
      });
      return;
    }

    const parsedPassengerCount = parseInt(passengerInput, 10);
    if (passengerInput === '' || isNaN(parsedPassengerCount) || parsedPassengerCount < 1) {
      setPassengerInput('1');
      setPassengerCount(1);
      capture(ANALYTICS_EVENTS.bookingValidationFailed, {
        ...bookingProperties(useBookingStore.getState()),
        step: 2,
        reason: 'invalid_passenger_count',
      });
      return;
    }

    if (availabilityStatus === 'sold_out' || availabilityStatus === 'blocked') {
      alert('This date is not available. Please contact us or choose another date.');
      capture(ANALYTICS_EVENTS.bookingValidationFailed, {
        ...bookingProperties(useBookingStore.getState()),
        step: 2,
        reason: availabilityStatus === 'sold_out' ? 'sold_out' : 'blocked_date',
      });
      return;
    }

    if (capacityExceeded) {
      alert('This vehicle is too small for your passenger count. Please go back and choose a larger vehicle.');
      capture(ANALYTICS_EVENTS.bookingValidationFailed, {
        ...bookingProperties(useBookingStore.getState()),
        step: 2,
        reason: 'capacity_exceeded',
      });
      return;
    }

    capture(ANALYTICS_EVENTS.bookingStepCompleted, {
      ...bookingProperties(useBookingStore.getState()),
      step: 2,
    });

    nextStep();
  };

  const getAvailabilityColor = () => {
    switch (availabilityStatus) {
      case 'available':
        return 'bg-green-50 border-green-500 text-green-700';
      case 'limited':
        return 'bg-yellow-50 border-yellow-500 text-yellow-700';
      case 'sold_out':
        return 'bg-red-50 border-red-500 text-red-700';
      case 'blocked':
        return 'bg-gray-50 border-gray-500 text-gray-700';
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-[#2D3436] mb-2">
          Trip Details
        </h2>
        <p className="text-gray-600">
          When and where do you want to go?
        </p>
      </div>

      {/* Booking Summary */}
      {(packageId || routeId) && vehicleType && (
        <div className="p-3 sm:p-4 rounded-2xl border-4 border-[#2D3436] bg-[#F7F7F7] flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-0.5">
              Your Trip
            </div>
            <div className="font-bold text-sm sm:text-base text-[#2D3436] leading-snug break-words">
              {packageTitle}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {vehicleLabels[vehicleType] ?? getVehicleTypeName(vehicleType)}
            </div>
            {resolvedSlug && bookingType === 'tour' && (
              <a
                href={`/tour/${resolvedSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4D96FF] hover:text-[#2D3436] transition-colors mt-1"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Package Details
              </a>
            )}
          </div>
          <button
            onClick={prevStep}
            className="flex items-center gap-1 text-xs font-semibold text-[#4D96FF] hover:text-[#2D3436] transition-colors flex-shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            Change
          </button>
        </div>
      )}

      {/* Date — normally already picked in Step 1 (needed there to show
          per-vehicle pricing), so this is a read-only summary with a way
          back to change it. The editable input is only a fallback for a
          direct/URL entry that lands on Step 2 without a date. */}
      <div>
        {tripDate ? (
          <div>
            <label className="block text-sm font-bold text-[#2D3436] mb-2">
              Travel Date
            </label>
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border-4 border-[#2D3436] bg-[#F7F7F7]">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <span className="font-bold text-[#2D3436]">{formatDate(tripDate)}</span>
              </div>
              <button
                onClick={prevStep}
                className="flex items-center gap-1 text-xs font-semibold text-[#4D96FF] hover:text-[#2D3436] transition-colors flex-shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
                Change
              </button>
            </div>
          </div>
        ) : (
          <>
            <label className="block text-sm font-bold text-[#2D3436] mb-2">
              Select Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="date"
                value={tripDate || ''}
                onChange={(e) => setTripDate(e.target.value)}
                min={getMinBookingDate()}
                className="pl-12"
                required
              />
            </div>
          </>
        )}

        {/* Availability Status */}
        {checkingAvailability && tripDate && (
          <div className="mt-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
              <span>Checking availability...</span>
            </div>
          </div>
        )}

        {!checkingAvailability && tripDate && availabilityStatus === 'blocked' && (
          <BlockedDateNotice
            date={tripDate}
            tripLabel={packageTitle || 'your trip'}
            pickupLocation={pickupLocation || undefined}
            dropoffLocation={dropoffLocation || undefined}
            message={blockedMessage}
            className="mt-3"
          />
        )}

        {!checkingAvailability && tripDate && availabilityStatus && availabilityStatus !== 'blocked' && (
          <div className={`mt-3 p-4 rounded-xl border-2 ${getAvailabilityColor()}`}>
            <p className="font-medium">{getAvailabilityMessage()}</p>

            {/* Show contact buttons for sold out */}
            {availabilityStatus === 'sold_out' && (
              <div className="flex flex-wrap gap-3 mt-4">
                <a
                  href={generateAvailabilityInquiryWhatsAppLink(
                    siteConfig.contact.whatsapp,
                    { tripLabel: packageTitle || 'your trip', pickupLocation, dropoffLocation },
                    tripDate
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20BA59] transition-colors"
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
                  className="flex items-center gap-2 px-4 py-2 bg-[#4D96FF] text-white rounded-xl font-bold hover:bg-[#3D86EF] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {!isBlocked && (
      <>
      {/* Price Unavailable */}
      {tripDate && !checkingAvailability && !fetchingPrice && priceError && (
        <div className="p-6 rounded-2xl border-4 border-red-400 bg-red-50">
          <p className="font-medium text-red-700">
            We couldn&apos;t find a price for this package, vehicle and date combination.
            Please try a different date or vehicle, or contact us directly.
          </p>
        </div>
      )}

      {/* Price Display */}
      {tripDate && calculatedPrice !== null && (
        <div className="p-4 rounded-2xl border-4 border-[#FFD93D] bg-[#FFF8E7]">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-gray-600 mb-0.5">
                {addonsTotal > 0 ? 'Base Package Price' : 'Estimated Price'}
              </div>
              <div className="text-2xl font-bold text-[#2D3436]">
                {formatPrice(calculatedPrice)}
              </div>
              {involvesNainitalEntry && (
                <div className="text-xs text-gray-500 mt-1">
                  Nainital entry and car parking charges extra (approx. Rs. 300 in total)
                </div>
              )}
              {seasonName && (
                <div className="text-xs text-gray-600 mt-0.5">
                  {seasonName} pricing
                </div>
              )}

              {/* Addons Breakdown */}
              {addonsTotal > 0 && (
                <div className="mt-2.5 pt-2.5 border-t-2 border-yellow-300">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Selected Addons</span>
                    <span className="text-sm font-bold text-gray-900">+{formatPrice(addonsTotal)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-yellow-300">
                    <span className="font-bold text-gray-900">Total Amount</span>
                    <span className="text-xl font-bold text-[#2D3436]">
                      {formatPrice(calculatedPrice + addonsTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {fetchingPrice && (
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-gray-300 border-t-[#FFD93D]" />
            )}
          </div>
        </div>
      )}

      {/* Time Selection */}
      <div>
        <label htmlFor="pickup-time" className="block text-sm font-bold text-[#2D3436] mb-2">
          Pickup Time <span className="text-red-500">*</span>
        </label>
        <Select
          id="pickup-time"
          value={tripTime ?? ''}
          onChange={(e) => setTripTime(e.target.value)}
          required
        >
          <option value="" disabled>Select a pickup time</option>
          {timeSlots.map((time) => (
            <option key={time} value={time}>{formatTime(time)}</option>
          ))}
        </Select>
        <p className="text-xs text-gray-500 mt-1.5">
          For any other time, please contact us on WhatsApp or call us.
        </p>
      </div>

      {/* Passenger Count */}
      <div>
        <label className="block text-sm font-bold text-[#2D3436] mb-2">
          Number of Passengers <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="number"
            value={passengerInput}
            onChange={(e) => handlePassengerChange(e.target.value)}
            onBlur={handlePassengerBlur}
            min={1}
            max={10}
            className="pl-12"
            required
          />
        </div>

        {capacityExceeded && vehicleType && (
          <div className="mt-3 p-4 rounded-xl border-2 border-amber-500 bg-amber-50">
            <p className="font-medium text-amber-700">
              This vehicle seats up to {getVehicleCapacity(vehicleType)} passengers.
            </p>
            <a
              href={`https://wa.me/918445206116?text=${encodeURIComponent(
                `Hi, I need a vehicle for ${passengerCount} passengers${
                  tripDate ? ` on ${tripDate}` : ''
                }. Can you help with a larger-group arrangement?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20BA59] transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Ask us on WhatsApp for larger-group arrangements
            </a>
          </div>
        )}
      </div>

      {/* Pickup Location */}
      <div>
        <label className="block text-sm font-bold text-[#2D3436] mb-2">
          Pickup Location <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            placeholder="e.g., Hotel Manu Maharani, Nainital"
            className="pl-12"
            required
          />
        </div>
        {isNainitalPickup && (
          <p className="text-xs text-gray-500 mt-2">
            Note: Pickups from Zoo Road, Birla Road, or Snow View Point are not possible.
            We can easily pick you up from Mall Road, High Court, Ayarpatta, or your specific hotel.
          </p>
        )}
      </div>

      {/* Drop-off Location (Optional) */}
      <div>
        <label className="block text-sm font-bold text-[#2D3436] mb-2">
          Drop-off Location (Optional)
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            value={dropoffLocation}
            onChange={(e) => setDropoffLocation(e.target.value)}
            placeholder="Same as pickup (if not specified)"
            className="pl-12"
          />
        </div>
      </div>

      {/* Addons Section — the wrapper box only renders once the fetch inside
          AddonSelector confirms there's something to show, so an empty box
          never flashes when a package has zero addons. */}
      {tripDate && calculatedPrice !== null && seasonName && (
        <div className={hasAddons ? 'p-6 rounded-2xl border-4 border-[#4D96FF] bg-[#E8F4F8]' : undefined}>
          <AddonSelector
            packageId={packageId || undefined}
            routeId={routeId || undefined}
            destinationId={routeContext?.destinationSlug || undefined}
            seasonName={seasonName as 'Off-Season' | 'Season'}
            stage="before_booking"
            onAvailabilityChange={setHasAddons}
          />
        </div>
      )}
      </>
      )}

      {/* Navigation Buttons */}
      <div className={`flex pt-6 border-t-2 border-gray-200 ${isBlocked ? 'justify-start' : 'justify-between'}`}>
        <Button
          onClick={prevStep}
          variant="secondary"
          size="lg"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        {!isBlocked && (
          <Button
            onClick={handleNext}
            disabled={
              !tripDate ||
              !tripTime ||
              !pickupLocation ||
              priceError ||
              availabilityStatus === 'sold_out' ||
              capacityExceeded
            }
            size="lg"
            className="group"
          >
            Continue to Contact Info
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </div>
    </div>
  );
}
