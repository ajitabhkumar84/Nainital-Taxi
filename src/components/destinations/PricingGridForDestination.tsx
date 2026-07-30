'use client';

import React from 'react';
import { IndianRupee, Users, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { buildBookingUrl } from '@/lib/bookingLink';

interface VehicleCategoryImages {
  sedan?: string;
  suv_normal?: string;
  suv_deluxe?: string;
  suv_luxury?: string;
}

interface PricingGridForDestinationProps {
  pricingByVehicle: Record<string, Record<string, number>>;
  seasonDates: string[];
  offSeasonDates: string[];
  vehicleCategoryImages?: VehicleCategoryImages;
  packageId: string;
  packageTitle: string;
  destinationSlug: string;
  destinationName: string;
}

type VehicleType = 'sedan' | 'suv_normal' | 'suv_deluxe' | 'suv_luxury';

const VEHICLE_DISPLAY: Record<VehicleType, { name: string; capacity: string; models: string }> = {
  sedan: {
    name: 'Sedan',
    capacity: '4 passengers',
    models: 'Dzire, Amaze, Xcent',
  },
  suv_normal: {
    name: 'SUV Normal',
    capacity: '6 passengers',
    models: 'Ertiga, Triber, Xylo',
  },
  suv_deluxe: {
    name: 'SUV Deluxe',
    capacity: '6 passengers',
    models: 'Innova, Marazzo',
  },
  suv_luxury: {
    name: 'SUV Luxury',
    capacity: '6 passengers',
    models: 'Innova Crysta',
  },
};

const VEHICLE_ORDER: VehicleType[] = ['sedan', 'suv_normal', 'suv_deluxe', 'suv_luxury'];

const VEHICLE_CARD_COLORS: Record<VehicleType, string> = {
  sedan: 'from-teal/10 to-lake border-l-teal',
  suv_normal: 'from-coral/10 to-sunrise border-l-coral',
  suv_deluxe: 'from-sunshine/15 to-sunrise border-l-sunshine-500',
  suv_luxury: 'from-teal/5 to-lake border-l-teal-500',
};

export default function PricingGridForDestination({
  pricingByVehicle,
  seasonDates,
  offSeasonDates,
  vehicleCategoryImages,
  packageId,
  packageTitle,
  destinationSlug,
  destinationName,
}: PricingGridForDestinationProps) {
  const router = useRouter();

  const seasons = ['Off-Season', 'Season'];

  const handleBookNow = (vehicleType: VehicleType) => {
    router.push(
      buildBookingUrl({
        packageId,
        packageTitle,
        packageType: 'transfer',
        vehicle: vehicleType,
      })
    );
  };

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-coral/10 via-sunshine/10 to-lake/20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3 flex items-center justify-center gap-3">
            <IndianRupee className="w-8 h-8 text-whatsapp" />
            Transparent Pricing
          </h2>
          <p className="text-ink/60 font-body">
            No hidden charges. All taxes included.
          </p>
        </div>

        {/* Season Date Ranges Info */}
        {(seasonDates.length > 0 || offSeasonDates.length > 0) && (
          <div className="mb-6 text-center">
            <div className="inline-flex flex-col gap-2 bg-white/70 rounded-xl p-4 border-2 border-ink/10">
              {offSeasonDates.length > 0 && (
                <p className="text-sm font-body text-ink/70">
                  <span className="font-bold">Off-Season:</span> {offSeasonDates.join(', ')}
                </p>
              )}
              {seasonDates.length > 0 && (
                <p className="text-sm font-body text-ink/70">
                  <span className="font-bold">Peak Season:</span> {seasonDates.join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Mobile: Stacked Cards per Vehicle */}
        <div className="md:hidden space-y-4">
          {VEHICLE_ORDER.filter((vt) => pricingByVehicle[vt]).map((vehicleType) => {
            const vehicle = VEHICLE_DISPLAY[vehicleType];
            const vehiclePricing = pricingByVehicle[vehicleType];
            const categoryImage = vehicleCategoryImages?.[vehicleType];

            return (
              <div
                key={vehicleType}
                className={`bg-gradient-to-br ${VEHICLE_CARD_COLORS[vehicleType]} rounded-2xl border-2 border-ink/15 border-l-[5px] overflow-hidden shadow-sm`}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {/* Vehicle Image or Icon */}
                    {categoryImage ? (
                      <div className="w-16 h-12 rounded-lg overflow-hidden border-2 border-ink/20 flex-shrink-0 bg-white">
                        <img src={categoryImage} alt={vehicle.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded-lg bg-white/60 border-2 border-ink/10 flex items-center justify-center flex-shrink-0">
                        <Car className="w-6 h-6 text-ink/30" />
                      </div>
                    )}
                    <div>
                      <div className="font-display text-lg text-ink">{vehicle.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-ink/50 font-body">
                        <Users className="w-3 h-3" />
                        {vehicle.capacity}
                        <span className="text-ink/30">|</span>
                        <span>{vehicle.models}</span>
                      </div>
                    </div>
                  </div>

                  {/* Season Prices */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {seasons.map((season) => {
                      const price = vehiclePricing[season] || 0;

                      return (
                        <div key={season} className="bg-white/70 rounded-xl p-3 text-center border border-ink/10">
                          <div className="text-[11px] text-ink/50 font-body mb-1 uppercase tracking-wide">
                            {season}
                          </div>
                          <div className="font-display text-xl text-ink">
                            ₹{price.toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Book Now Button */}
                  <button
                    onClick={() => handleBookNow(vehicleType)}
                    className="w-full bg-teal hover:bg-teal/90 text-white px-4 py-3 rounded-xl font-bold font-body border-3 border-ink shadow-retro hover:shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: Table with Vehicle Thumbnails */}
        <div className="hidden md:block bg-white rounded-2xl border-3 border-ink overflow-hidden shadow-retro">
          {/* Table Header */}
          <div className={`grid ${vehicleCategoryImages ? 'grid-cols-[80px,2fr,1fr,1fr,140px]' : 'grid-cols-[2fr,1fr,1fr,140px]'} border-b-3 border-ink bg-gradient-to-r from-sunshine/30 to-coral/10`}>
            {vehicleCategoryImages && (
              <div className="p-4 font-display text-ink text-sm"></div>
            )}
            <div className="p-4 font-display text-ink">Vehicle Type</div>
            {seasons.map((season) => (
              <div
                key={season}
                className="p-4 font-display text-ink text-center border-l-2 border-ink/20"
              >
                {season}
              </div>
            ))}
            <div className="p-4 font-display text-ink text-center border-l-2 border-ink/20">
              Action
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y-2 divide-ink/20">
            {VEHICLE_ORDER.filter((vt) => pricingByVehicle[vt]).map((vehicleType) => {
              const vehicle = VEHICLE_DISPLAY[vehicleType];
              const vehiclePricing = pricingByVehicle[vehicleType];
              const categoryImage = vehicleCategoryImages?.[vehicleType];

              return (
                <div
                  key={vehicleType}
                  className={`grid ${vehicleCategoryImages ? 'grid-cols-[80px,2fr,1fr,1fr,140px]' : 'grid-cols-[2fr,1fr,1fr,140px]'} hover:bg-sunrise/10 transition-colors`}
                >
                  {/* Vehicle Thumbnail */}
                  {vehicleCategoryImages && (
                    <div className="p-3 flex items-center justify-center">
                      {categoryImage ? (
                        <div className="w-16 h-12 rounded-lg overflow-hidden border-2 border-ink/15 bg-lake/30">
                          <img src={categoryImage} alt={vehicle.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-12 rounded-lg bg-lake/20 border-2 border-ink/10 flex items-center justify-center">
                          <Car className="w-5 h-5 text-ink/20" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vehicle Info */}
                  <div className="p-4">
                    <div className="font-display text-lg text-ink">{vehicle.name}</div>
                    <div className="flex items-center gap-2 text-sm text-ink/60 font-body mt-1">
                      <Users className="w-4 h-4" />
                      {vehicle.capacity}
                    </div>
                    <div className="text-xs text-ink/40 font-body mt-1">
                      {vehicle.models}
                    </div>
                  </div>

                  {/* Prices */}
                  {seasons.map((season) => {
                    const price = vehiclePricing[season] || 0;

                    return (
                      <div
                        key={season}
                        className="p-4 border-l-2 border-ink/20 flex flex-col items-center justify-center"
                      >
                        <div className="font-display text-2xl text-ink">
                          ₹{price.toLocaleString()}
                        </div>
                      </div>
                    );
                  })}

                  {/* Book Now Button */}
                  <div className="p-4 border-l-2 border-ink/20 flex items-center justify-center">
                    <button
                      onClick={() => handleBookNow(vehicleType)}
                      className="bg-teal hover:bg-teal/90 text-white px-4 py-2 rounded-lg font-bold font-body border-2 border-ink shadow-retro-sm hover:shadow-retro-pressed hover:translate-x-[1px] hover:translate-y-[1px] transition-all text-sm"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
