'use client';

import { useState, useEffect } from 'react';
import { useBookingStore, VehicleType } from '@/store/bookingStore';
import { Button, Badge, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Users, MapPin, Clock, ExternalLink, CheckCircle2, Pencil, Calendar, MessageCircle } from 'lucide-react';
import {
  getVehicleTypeName,
  getVehicleCapacity,
  getVehicleModelExamples,
  getAllPackagePrices,
  getAllRoutePrices,
  formatPrice,
  PriceResult,
} from '@/lib/pricing';
import { getMinBookingDate, formatDate } from '@/lib/booking';
import { useVehicleLabels } from '@/hooks/useVehicleLabels';
import { useSiteConfig } from '@/hooks/useSiteConfig';

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

export default function Step1PackageSelection() {
  const {
    bookingType,
    packageId,
    routeId,
    packageTitle,
    vehicleType,
    tripDate,
    setBookingType,
    setPackage,
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

  // Whether the picker is open is derived, never initialized from packageId:
  // on first render after a package-arrival, packageId is still null (the
  // entry contract applies a moment later via the booking-entry hook). A
  // useState(!packageId) initializer would latch open forever once that
  // value flips true, since initializers only run once. isEditing is the
  // only piece of real state; showPicker is computed from it every render.
  // routeId is included alongside packageId since a route-based transfer
  // arrival (BookingWidget) should also collapse to the summary card.
  const [isEditing, setIsEditing] = useState(false);
  const showPicker = isEditing || !(packageId || routeId);

  useEffect(() => {
    if (!showPicker) return;
    fetchPackages();
    // Only refetch when the picker is open and the type filter changes —
    // skip entirely while collapsed behind a summary card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingType, showPicker]);

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

  const handlePackageSelect = (pkg: Package) => {
    setPackage(pkg.id, pkg.title, pkg.slug);
    setSelectedPackageData(pkg);
    setIsEditing(false);
    setError('');
  };

  const selectedVehiclePriceMissing =
    !!vehicleType && !!tripDate && !pricingLoading && !pricesByVehicle[vehicleType];

  const handleNext = () => {
    if ((!packageId && !routeId) || !vehicleType || !tripDate || selectedVehiclePriceMissing) {
      setError('Please select a package, a date, and a vehicle type with an available price');
      return;
    }
    setError('');
    nextStep();
  };

  return (
    <div className="space-y-8">
      {!showPicker ? (
        <div>
          <label className="block text-sm font-bold text-[#2D3436] mb-3">
            Your Trip
          </label>
          <div className="flex items-center justify-between gap-4 p-6 rounded-2xl border-4 border-[#FFD93D] bg-[#FFF8E7]">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#4D96FF] flex-shrink-0" />
              <span className="font-bold text-lg text-[#2D3436]">
                {selectedPackageData?.title || packageTitle}
              </span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-sm font-semibold text-[#4D96FF] hover:text-[#2D3436] transition-colors flex-shrink-0"
            >
              <Pencil className="w-4 h-4" />
              Change
            </button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-3xl font-bold text-[#2D3436] mb-2">
              Choose Your Adventure
            </h2>
            <p className="text-gray-600">
              Select a package and your preferred vehicle
            </p>
          </div>

          {/* Booking Type Selector */}
          <div>
            <label className="block text-sm font-bold text-[#2D3436] mb-3">
              What are you looking for?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setBookingType('tour')}
                className={`
                  p-6 rounded-2xl border-4 transition-all duration-200
                  ${
                    bookingType === 'tour'
                      ? 'border-[#FFD93D] bg-[#FFF8E7] shadow-[4px_4px_0px_#FFD93D]'
                      : 'border-[#2D3436] bg-white hover:shadow-[4px_4px_0px_#2D3436]'
                  }
                `}
              >
                <div className="text-3xl mb-2">🏔️</div>
                <div className="font-bold text-[#2D3436]">Tour Packages</div>
                <div className="text-xs text-gray-500 mt-1">Sightseeing tours</div>
              </button>

              <button
                onClick={() => setBookingType('transfer')}
                className={`
                  p-6 rounded-2xl border-4 transition-all duration-200
                  ${
                    bookingType === 'transfer'
                      ? 'border-[#FFD93D] bg-[#FFF8E7] shadow-[4px_4px_0px_#FFD93D]'
                      : 'border-[#2D3436] bg-white hover:shadow-[4px_4px_0px_#2D3436]'
                  }
                `}
              >
                <div className="text-3xl mb-2">✈️</div>
                <div className="font-bold text-[#2D3436]">Transfers</div>
                <div className="text-xs text-gray-500 mt-1">Airport & station</div>
              </button>
            </div>
          </div>

          {/* Package Selection */}
          {bookingType && (
            <div>
              <label className="block text-sm font-bold text-[#2D3436] mb-3">
                Select Package
              </label>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading packages...</div>
              ) : (
                <div className="grid gap-4">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`
                        relative p-6 rounded-2xl border-4 transition-all duration-200
                        ${
                          packageId === pkg.id
                            ? 'border-[#FFD93D] bg-gradient-to-br from-[#FFF8E7] to-[#FFF0D4] shadow-[6px_6px_0px_#FFD93D] ring-4 ring-[#FFD93D]/30'
                            : 'border-[#2D3436] bg-white hover:shadow-[4px_4px_0px_#2D3436]'
                        }
                      `}
                    >
                      <button
                        onClick={() => handlePackageSelect(pkg)}
                        className="text-left w-full"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className={`font-bold text-lg mb-1 ${packageId === pkg.id ? 'text-[#2D3436]' : 'text-[#2D3436]'}`}>
                              {pkg.title}
                            </h3>
                            <div className="flex flex-wrap gap-2 items-center text-sm text-gray-600">
                              {pkg.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{pkg.duration}</span>
                                </div>
                              )}
                              {pkg.distance && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{pkg.distance}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {pkg.is_popular && (
                            <Badge variant="accent">Popular</Badge>
                          )}
                        </div>

                        {pkg.places_covered && pkg.places_covered.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">Covers:</span>{' '}
                            {pkg.places_covered.slice(0, 3).join(', ')}
                            {pkg.places_covered.length > 3 && ` +${pkg.places_covered.length - 3} more`}
                          </div>
                        )}
                      </button>

                      {/* View Details Button */}
                      <div className="mt-4 pt-4 border-t-2 border-gray-200">
                        <a
                          href={`/tour/${pkg.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#4D96FF] hover:text-[#2D3436] transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Full Details
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Date + Vehicle Type Selection — ungated from packageId so a
          vehicle-only fleet arrival can show its pre-ticked chip before a
          package is chosen */}
      {(packageId || routeId || vehicleType) && (
        <div className="space-y-6">
          {/* Date Selection — collected here (rather than Step 2) so every
              vehicle card below can show its own real, date-specific price */}
          <div>
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
          </div>

          <div>
            <label className="block text-sm font-bold text-[#2D3436] mb-3">
              Choose Your Vehicle
            </label>
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:overflow-visible">
              {vehicleTypes.map((vehicle) => {
                const routeName = packageTitle || 'your trip';
                const formattedTripDate = tripDate ? formatDate(tripDate) : '';
                const priceResult = pricesByVehicle[vehicle.type];
                const isPriceUnavailable = Boolean(tripDate) && !pricingLoading && !priceResult;
                const selectVehicle = () => {
                  if (isPriceUnavailable) return;
                  setVehicleType(vehicle.type);
                };
                return (
                  <div
                    key={vehicle.type}
                    role="button"
                    tabIndex={0}
                    aria-disabled={isPriceUnavailable}
                    onClick={selectVehicle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectVehicle();
                      }
                    }}
                    className={`
                      min-w-[260px] snap-start sm:min-w-0
                      p-6 rounded-2xl border-4 transition-all duration-200 text-left
                      ${isPriceUnavailable ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                      ${
                        vehicleType === vehicle.type
                          ? 'border-[#4D96FF] bg-[#E8F4F8] shadow-[4px_4px_0px_#4D96FF]'
                          : isPriceUnavailable
                          ? 'border-[#2D3436] bg-white'
                          : 'border-[#2D3436] bg-white hover:shadow-[4px_4px_0px_#2D3436]'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-3xl">{vehicle.emoji}</div>
                      {vehicle.badge && (
                        <Badge variant="secondary" size="sm">
                          {vehicle.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="font-bold text-[#2D3436] mb-0.5 truncate">
                      {vehicleLabels[vehicle.type] ?? getVehicleTypeName(vehicle.type)}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {getVehicleModelExamples(vehicle.type)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>Up to {getVehicleCapacity(vehicle.type)} passengers</span>
                    </div>

                    {tripDate && (
                      <div className="mt-3 pt-3 border-t-2 border-dashed border-gray-200">
                        {pricingLoading ? (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-gray-300 border-t-gray-500" />
                            Checking price...
                          </div>
                        ) : priceResult ? (
                          <>
                            <div className="text-xs text-gray-500">Total price</div>
                            <div className="text-xl font-bold text-[#2D3436]">
                              {formatPrice(priceResult.price)}
                            </div>
                          </>
                        ) : (
                          <a
                            href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                              `Hi! 👋 Need a quick quote for ${routeName} on ${formattedTripDate}. 🚕`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20BA59] px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            Price unavailable. 💬 Tap for a live quote via WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <p className="text-sm font-body text-red-700">{error}</p>
            </div>
          )}

          {/* Next Button */}
          <div className="flex justify-end pt-6 border-t-2 border-gray-200">
            <Button
              onClick={handleNext}
              disabled={(!packageId && !routeId) || !vehicleType || !tripDate || selectedVehiclePriceMissing}
              size="lg"
              className="group"
            >
              Continue to Trip Details
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
