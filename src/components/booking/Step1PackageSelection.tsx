'use client';

import { useState, useEffect, useRef } from 'react';
import { useBookingStore, VehicleType } from '@/store/bookingStore';
import { Badge, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { Users, MapPin, Clock, ExternalLink, CheckCircle2, Pencil, Calendar, MessageCircle } from 'lucide-react';
import {
  getVehicleTypeName,
  getVehicleCapacity,
  getVehicleModelExamples,
  getAllPackagePrices,
  getAllRoutePrices,
  getAvailabilityForDate,
  formatPrice,
  PriceResult,
} from '@/lib/pricing';
import { getMinBookingDate, formatDate } from '@/lib/booking';
import { useVehicleLabels } from '@/hooks/useVehicleLabels';
import { capture } from '@/lib/analytics/capture';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { bookingProperties, CTA_PLACEMENTS } from '@/lib/analytics/properties';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import BlockedDateNotice from './BlockedDateNotice';
import TransferRouteSelector, { TransferRoute } from './TransferRouteSelector';
import StepShell from './StepShell';
import { FIELD_LABEL } from './fieldStyles';
import type { PickupLocationRow } from '@/lib/supabase/types';

interface Package {
  id: string;
  slug: string;
  title: string;
  type: 'tour' | 'transfer';
  duration: string;
  distance: string | null;
  places_covered: string[];
  description: string;
  is_popular: boolean;
}

const vehicleTypes: { type: VehicleType; emoji: string; badge?: string }[] = [
  { type: 'sedan', emoji: '🚗', badge: 'Economy' },
  { type: 'suv_normal', emoji: '🚙', badge: 'Popular' },
  { type: 'suv_deluxe', emoji: '⭐', badge: 'Comfort' },
  { type: 'suv_luxury', emoji: '👑', badge: 'Premium' },
];

interface Step1PackageSelectionProps {
  // Server-fetched by /booking's page component so the transfer picker's
  // dropdowns are populated on first paint (same prop-drilling shape the
  // homepage uses for BookingWidget).
  pickupLocations: PickupLocationRow[];
  transferRoutes: TransferRoute[];
}

export default function Step1PackageSelection({
  pickupLocations,
  transferRoutes,
}: Step1PackageSelectionProps) {
  const {
    bookingType,
    packageId,
    routeId,
    packageTitle,
    vehicleType,
    tripDate,
    pickupLocation,
    dropoffLocation,
    setBookingType,
    setPackage,
    setRoute,
    clearRoute,
    setPickupLocation,
    setDropoffLocation,
    setVehicleType,
    setTripDate,
    nextStep,
  } = useBookingStore();
  const { labels: vehicleLabels } = useVehicleLabels();
  const { config: siteConfig } = useSiteConfig();
  const whatsappNumber = siteConfig.contact.whatsapp.replace(/\D/g, '');

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackageData, setSelectedPackageData] = useState<Package | null>(null);
  const [error, setError] = useState('');
  const [pricesByVehicle, setPricesByVehicle] = useState<Partial<Record<VehicleType, PriceResult>>>({});
  const [pricingLoading, setPricingLoading] = useState(false);
  const [blockedInfo, setBlockedInfo] = useState<{ blocked: boolean; message?: string }>({ blocked: false });

  // Targets for the scroll-to-cause on a failed handleNext — the message now
  // renders in the sticky rail / mobile action bar rather than inline here.
  const dateRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const vehicleRef = useRef<HTMLDivElement>(null);

  // Fetch every vehicle's price in one shot once a date is picked, so the
  // vehicle cards below can show a real price instead of only revealing it
  // after the user picks a vehicle and reaches Step 2.
  useEffect(() => {
    if (!tripDate || (!packageId && !routeId)) {
      setPricesByVehicle({});
      return;
    }
    let cancelled = false;
    setPricingLoading(true);
    const fetchPrices = routeId
      ? getAllRoutePrices(routeId, tripDate)
      : getAllPackagePrices(packageId!, tripDate);
    fetchPrices
      .then((prices) => {
        if (!cancelled) setPricesByVehicle(prices);
      })
      .finally(() => {
        if (!cancelled) setPricingLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tripDate, packageId, routeId]);

  // Separately check whether the picked date is admin-blocked (either via
  // availability.is_blocked or a booking_blackout range) — this must hide
  // the vehicle grid entirely rather than just annotate a missing price,
  // since a blocked date can still have live pricing rows in the DB. The
  // `cancelled` guard (same pattern as the pricing effect above) means a
  // stale response for a previously-picked date can never clobber the state
  // for whatever date the user has since selected — picking a subsequent
  // valid date resets this cleanly back to `{ blocked: false }`.
  useEffect(() => {
    if (!tripDate || (!packageId && !routeId)) {
      setBlockedInfo({ blocked: false });
      return;
    }
    let cancelled = false;
    getAvailabilityForDate(tripDate).then((availability) => {
      if (cancelled) return;
      setBlockedInfo(
        availability?.status === 'blocked'
          ? { blocked: true, message: availability.message }
          : { blocked: false }
      );
    });
    return () => {
      cancelled = true;
    };
  }, [tripDate, packageId, routeId]);

  // Whether the picker is open is derived, never initialized from packageId:
  // on first render after a package-arrival, packageId is still null (the
  // entry contract applies a moment later via the booking-entry hook). A
  // useState(!packageId) initializer would latch open forever once that
  // value flips true, since initializers only run once. isEditing is the
  // only piece of real state; showPicker is computed from it every render.
  // routeId is included alongside packageId since a route-based transfer
  // arrival (BookingWidget) should also collapse to the summary card.
  const [isEditing, setIsEditing] = useState(false);
  // Set once the user resolves a route via the A-to-B picker below. Without
  // it, matching a route would immediately satisfy `routeId` and collapse the
  // picker to a summary card — yanking the From/To dropdowns out from under
  // someone who is still adjusting them. A deep-linked arrival (routeId from
  // the URL, pickedInline still false) still collapses as before.
  const [pickedInline, setPickedInline] = useState(false);
  const isTransfer = bookingType === 'transfer';
  const showPicker = isEditing || pickedInline || !(packageId || routeId);

  useEffect(() => {
    // Transfers are routes, not packages — the A-to-B picker reads from the
    // server-supplied `transferRoutes` prop, so there is nothing to fetch.
    if (!showPicker || isTransfer) return;
    fetchPackages();
    // Only refetch when the picker is open and the type filter changes —
    // skip entirely while collapsed behind a summary card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingType, showPicker, isTransfer]);

  // Switching trip type must drop whatever was selected under the old one.
  // Without this, picking a transfer route and then switching to Tour Packages
  // would leave routeId set and the vehicle cards priced against a route the
  // user can no longer see — the same stale-selection trap the A-to-B picker
  // guards with clearRoute() below.
  const handleBookingTypeChange = (type: 'tour' | 'transfer') => {
    if (type !== bookingType) {
      clearRoute();
      setPickedInline(false);
      setError('');
    }
    setBookingType(type);
  };

  // Mirrors the A-to-B dropdowns into the store on every change. The route is
  // cleared the moment the pair stops resolving, so a half-edited selection
  // can never leave a stale routeId behind for handleNext to submit.
  const handleTransferChange = (
    nextPickup: string,
    nextDropoff: string,
    route: TransferRoute | null
  ) => {
    setPickupLocation(nextPickup);
    setDropoffLocation(nextDropoff);

    if (!route) {
      clearRoute();
      return;
    }

    setRoute(route.id, `Transfer: ${nextPickup} to ${nextDropoff}`);
    setPickedInline(true);
    setError('');

    capture(ANALYTICS_EVENTS.bookingRouteSelected, {
      route_id: route.id,
      pickup_location: nextPickup,
      dropoff_location: nextDropoff,
      booking_type: 'transfer',
    });
  };

  async function fetchPackages() {
    setLoading(true);

    const query = supabase
      .from('packages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (bookingType) {
      query.eq('type', bookingType);
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching packages:', fetchError);
    } else {
      setPackages(data || []);
    }

    setLoading(false);
  }

  const selectedVehiclePriceMissing =
    !!vehicleType && !!tripDate && !pricingLoading && !pricesByVehicle[vehicleType];

  const handlePackageSelect = (pkg: Package) => {
    setPackage(pkg.id, pkg.title, pkg.slug);
    setSelectedPackageData(pkg);
    setIsEditing(false);
    setError('');

    capture(ANALYTICS_EVENTS.bookingPackageSelected, {
      package_id: pkg.id,
      package_slug: pkg.slug,
      booking_type: 'tour',
    });
  };

  const handleNext = () => {
    if ((!packageId && !routeId) || !vehicleType || !tripDate || selectedVehiclePriceMissing) {
      setError(
        isTransfer
          ? 'Please select a pick-up and drop-off location, a date, and a vehicle type with an available price'
          : 'Please select a package, a date, and a vehicle type with an available price'
      );

      // Report *which* field was missing rather than the rendered copy: the
      // message is one of two sentences covering four different causes, so the
      // string alone cannot tell us what to fix in the UI.
      capture(ANALYTICS_EVENTS.bookingValidationFailed, {
        ...bookingProperties(useBookingStore.getState()),
        step: 1,
        reason: !packageId && !routeId
          ? 'no_package_or_route'
          : !vehicleType
            ? 'no_vehicle'
            : !tripDate
              ? 'no_date'
              : 'price_unavailable',
      });

      // Point at the cause, the same way steps 2 and 3 do — the message now
      // renders in the sticky rail / action bar, which can be well away from
      // the control that needs attention.
      const target = !tripDate
        ? dateRef.current
        : !packageId && !routeId
          ? pickerRef.current
          : vehicleRef.current;
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setError('');

    capture(ANALYTICS_EVENTS.bookingStepCompleted, {
      ...bookingProperties(useBookingStore.getState()),
      step: 1,
    });

    nextStep();
  };

  const selectedPrice = vehicleType ? pricesByVehicle[vehicleType] : undefined;
  const isBlocked = Boolean(tripDate && blockedInfo.blocked);

  return (
    <StepShell
      rail={{
        summary: [
          Boolean(packageId || routeId) && {
            label: 'Trip',
            value: selectedPackageData?.title || packageTitle,
            onEdit: showPicker ? undefined : () => setIsEditing(true),
          },
          Boolean(tripDate) && { label: 'Date', value: formatDate(tripDate!) },
          Boolean(vehicleType) && {
            label: 'Vehicle',
            value: vehicleLabels[vehicleType!] ?? getVehicleTypeName(vehicleType!),
          },
        ],
        price: {
          label: 'Estimated price',
          // Step 1's price lives in local component state, not the store —
          // Step 2's availability check is what writes calculatedPrice. null
          // renders a prompt rather than a misleading ₹0.
          amount: isBlocked ? null : selectedPrice?.price ?? null,
          loading: pricingLoading,
          placeholder: isBlocked
            ? 'Not bookable on this date'
            : !tripDate
              ? 'Pick a date to see fares'
              : 'Choose a vehicle',
          note: selectedPrice?.seasonName ? `${selectedPrice.seasonName} pricing` : undefined,
        },
      }}
      primary={{
        label: 'Continue to Trip Details',
        onClick: handleNext,
        disabled:
          isBlocked || (!packageId && !routeId) || !vehicleType || !tripDate || selectedVehiclePriceMissing,
      }}
      error={error || null}
    >
      {!showPicker ? (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-sunshine bg-sunshine-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-sunshine shrink-0" />
            <span className="font-semibold text-ink truncate">
              {selectedPackageData?.title || packageTitle}
            </span>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-sm font-semibold text-sunshine hover:text-ink transition-colors shrink-0"
          >
            <Pencil className="w-4 h-4" />
            Change
          </button>
        </div>
      ) : (
        <>
          {/* Trip type and date share a row: the date drives the per-vehicle
              prices below, so both belong above the picker rather than the
              date sitting under a package list of unpredictable length. */}
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <span className={FIELD_LABEL}>What are you looking for?</span>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['tour', '🏔️', 'Tour Packages'],
                    ['transfer', '✈️', 'Transfers'],
                  ] as const
                ).map(([type, emoji, label]) => (
                  <button
                    key={type}
                    onClick={() => handleBookingTypeChange(type)}
                    aria-pressed={bookingType === type}
                    className={`
                      h-11 px-3 rounded-md border text-sm font-semibold transition-colors
                      inline-flex items-center justify-center gap-1.5
                      ${
                        bookingType === type
                          ? 'border-sunshine bg-sunshine-50 text-ink'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span aria-hidden>{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

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
          </div>

          <div ref={pickerRef}>
            {/* Transfers are point-to-point routes, so they get an A-to-B picker
                rather than a list of pre-built packages. The date + vehicle
                blocks further down already key off routeId, so they work
                unchanged once this sets one. */}
            {isTransfer ? (
              <TransferRouteSelector
                pickupLocations={pickupLocations}
                routes={transferRoutes}
                pickup={pickupLocation}
                dropoff={dropoffLocation}
                onChange={handleTransferChange}
              />
            ) : (
              bookingType && (
                <div>
                  <span className={FIELD_LABEL}>Select Package</span>
                  {loading ? (
                    <div className="py-6 text-center text-slate-500">Loading packages…</div>
                  ) : (
                    /*
                      The package list is the only genuinely unbounded thing on
                      this screen — it grows with however many packages are
                      active. On desktop it gets its own bounded scroll pane so
                      the page height stops depending on that count; `38vh`
                      rather than a fixed pixel height so it adapts to the
                      viewport instead of needing a media-query ladder.

                      Deliberately NOT bounded below `lg`: a nested scroll pane
                      inside a page that also scrolls is a scroll trap on touch.
                      On mobile the list runs to its natural length and the
                      fixed action bar is what keeps the price and CTA reachable.
                    */
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <div
                        role="radiogroup"
                        aria-label="Select package"
                        className="lg:max-h-[min(340px,38vh)] lg:overflow-y-auto overscroll-contain snap-y divide-y divide-slate-200"
                      >
                        {packages.map((pkg) => {
                          const selected = packageId === pkg.id;
                          return (
                            <div
                              key={pkg.id}
                              className={`flex items-start gap-3 p-3 snap-start transition-colors ${
                                selected ? 'bg-sunshine-50' : 'bg-white hover:bg-slate-50'
                              }`}
                            >
                              <button
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => handlePackageSelect(pkg)}
                                className="text-left flex-1 min-w-0"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {selected && (
                                    <CheckCircle2 className="w-4 h-4 text-sunshine shrink-0" />
                                  )}
                                  <h3 className="font-semibold text-ink line-clamp-1">
                                    {pkg.title}
                                  </h3>
                                  {pkg.is_popular && (
                                    <Badge variant="accent" size="sm">
                                      Popular
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate-500 mt-0.5">
                                  {pkg.duration && (
                                    <span className="inline-flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5" />
                                      {pkg.duration}
                                    </span>
                                  )}
                                  {pkg.distance && (
                                    <span className="inline-flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {pkg.distance}
                                    </span>
                                  )}
                                  {pkg.places_covered?.length > 0 && (
                                    <span className="line-clamp-1">
                                      {pkg.places_covered.slice(0, 3).join(', ')}
                                      {pkg.places_covered.length > 3 &&
                                        ` +${pkg.places_covered.length - 3}`}
                                    </span>
                                  )}
                                </div>
                              </button>

                              <a
                                href={`/tour/${pkg.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`View full details for ${pkg.title}`}
                                title="View full details"
                                className="shrink-0 p-2 rounded-md text-slate-400 hover:text-sunshine hover:bg-white transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </>
      )}

      {/* Vehicle selection — ungated from packageId so a vehicle-only fleet
          arrival can show its pre-ticked chip before a package is chosen. */}
      {(packageId || routeId || vehicleType) &&
        (isBlocked ? (
          <BlockedDateNotice
            date={tripDate!}
            tripLabel={packageTitle || 'your trip'}
            message={blockedInfo.message}
          />
        ) : (
          <div ref={vehicleRef}>
            <span className={FIELD_LABEL}>Choose Your Vehicle</span>
            {/* Horizontal snap-carousel on phones (unchanged — it is the right
                pattern there), a single 4-across row from lg so all four fares
                are comparable at a glance without a second row. */}
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
              {vehicleTypes.map((vehicle) => {
                const routeName = packageTitle || 'your trip';
                const formattedTripDate = tripDate ? formatDate(tripDate) : '';
                const priceResult = pricesByVehicle[vehicle.type];
                const isPriceUnavailable = Boolean(tripDate) && !pricingLoading && !priceResult;
                const selectVehicle = () => {
                  if (isPriceUnavailable) return;
                  setVehicleType(vehicle.type);

                  // The price comes from local `pricesByVehicle`, not the
                  // store: on step 1 the store's calculatedPrice is still null
                  // (Step 2's availability check is what writes it), so this is
                  // the only point in the funnel where the fare the customer
                  // actually saw when choosing a vehicle is observable.
                  capture(ANALYTICS_EVENTS.bookingVehicleSelected, {
                    vehicle_type: vehicle.type,
                    price_shown: priceResult?.price ?? null,
                    season_name: priceResult?.seasonName ?? null,
                    booking_type: bookingType,
                    package_id: packageId,
                    route_id: routeId,
                  });
                };
                return (
                  <div
                    key={vehicle.type}
                    role="button"
                    tabIndex={0}
                    aria-disabled={isPriceUnavailable}
                    aria-pressed={vehicleType === vehicle.type}
                    onClick={selectVehicle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectVehicle();
                      }
                    }}
                    className={`
                      min-w-[210px] snap-start sm:min-w-0
                      p-3 rounded-xl border transition-colors text-left
                      ${isPriceUnavailable ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                      ${
                        vehicleType === vehicle.type
                          ? 'border-sunshine bg-sunshine-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-2xl" aria-hidden>
                        {vehicle.emoji}
                      </span>
                      {vehicle.badge && (
                        <Badge variant="secondary" size="sm">
                          {vehicle.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="font-semibold text-ink truncate">
                      {vehicleLabels[vehicle.type] ?? getVehicleTypeName(vehicle.type)}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {getVehicleModelExamples(vehicle.type)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-slate-600 mt-0.5">
                      <Users className="w-3.5 h-3.5" />
                      Up to {getVehicleCapacity(vehicle.type)}
                    </div>

                    {tripDate && (
                      <div className="mt-2 pt-2 border-t border-dashed border-slate-200">
                        {pricingLoading ? (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-slate-300 border-t-slate-500" />
                            Checking price…
                          </div>
                        ) : priceResult ? (
                          <div className="text-xl font-bold text-ink tabular-nums">
                            {formatPrice(priceResult.price)}
                          </div>
                        ) : (
                          <a
                            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                              `Hi! 👋 Need a quick quote for ${routeName} on ${formattedTripDate}. 🚕`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-analytics-cta="whatsapp"
                            onClick={(e) => {
                              e.stopPropagation();
                              // A route we have no price for. The customer
                              // wanted this trip and the site could not quote
                              // it — worth sizing separately from ordinary
                              // WhatsApp traffic.
                              capture(ANALYTICS_EVENTS.contactWhatsappClicked, {
                                placement: CTA_PLACEMENTS.bookingStep1,
                                context: 'price_unavailable',
                                route_id: routeId,
                                vehicle_type: vehicle.type,
                              });
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-whatsapp hover:brightness-95 px-2.5 py-1.5 rounded-md transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                            Get a live quote
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </StepShell>
  );
}
