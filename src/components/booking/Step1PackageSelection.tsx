'use client';

import { useState, useEffect } from 'react';
import { useBookingStore, VehicleType, BookingType } from '@/store/bookingStore';
import { Button, Badge } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { ArrowRight, Users, MapPin, Clock, Car } from 'lucide-react';
import { getVehicleTypeName, getVehicleCapacity } from '@/lib/pricing';

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
    vehicleType,
    setBookingType,
    setPackage,
    setVehicleType,
    nextStep,
  } = useBookingStore();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackageData, setSelectedPackageData] = useState<Package | null>(null);

  useEffect(() => {
    fetchPackages();
  }, [bookingType]);

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

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching packages:', error);
    } else {
      setPackages(data || []);
    }

    setLoading(false);
  }

  const handlePackageSelect = (pkg: Package) => {
    setPackage(pkg.id, pkg.title);
    setSelectedPackageData(pkg);
  };

  const handleNext = () => {
    if (!packageId || !vehicleType) {
      alert('Please select both a package and vehicle type');
      return;
    }
    nextStep();
  };

  return (
    <div className="space-y-8">
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
                <button
                  key={pkg.id}
                  onClick={() => handlePackageSelect(pkg)}
                  className={`
                    text-left p-6 rounded-2xl border-4 transition-all duration-200
                    ${
                      packageId === pkg.id
                        ? 'border-[#4D96FF] bg-[#E8F4F8] shadow-[4px_4px_0px_#4D96FF]'
                        : 'border-[#2D3436] bg-white hover:shadow-[4px_4px_0px_#2D3436]'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-[#2D3436] mb-1">
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
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vehicle Type Selection */}
      {packageId && (
        <div>
          <label className="block text-sm font-bold text-[#2D3436] mb-3">
            Choose Your Vehicle
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            {vehicleTypes.map((vehicle) => (
              <button
                key={vehicle.type}
                onClick={() => setVehicleType(vehicle.type)}
                className={`
                  p-6 rounded-2xl border-4 transition-all duration-200 text-left
                  ${
                    vehicleType === vehicle.type
                      ? 'border-[#4D96FF] bg-[#E8F4F8] shadow-[4px_4px_0px_#4D96FF]'
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
                <div className="font-bold text-[#2D3436] mb-1">
                  {getVehicleTypeName(vehicle.type)}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Up to {getVehicleCapacity(vehicle.type)} passengers</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-6 border-t-2 border-gray-200">
        <Button
          onClick={handleNext}
          disabled={!packageId || !vehicleType}
          size="lg"
          className="group"
        >
          Continue to Trip Details
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
