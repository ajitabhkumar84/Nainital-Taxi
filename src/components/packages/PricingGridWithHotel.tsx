"use client";

import React, { useState } from "react";
import { IndianRupee, Users, Hotel } from "lucide-react";
import { cn } from "@/lib/utils";
import { VehicleType, HotelOption, Pricing } from "@/lib/supabase/types";

interface PricingGridWithHotelProps {
  pricing: Pricing[];
  hotelOptions?: HotelOption[];
  showHotelPricing?: boolean;
}

const VEHICLE_DISPLAY: Record<VehicleType, { name: string; capacity: string; models: string }> = {
  sedan: {
    name: "Sedan",
    capacity: "4 passengers",
    models: "Dzire, Amaze, Xcent",
  },
  suv_normal: {
    name: "SUV Normal",
    capacity: "6 passengers",
    models: "Ertiga, Triber, Xylo",
  },
  suv_deluxe: {
    name: "SUV Deluxe",
    capacity: "6 passengers",
    models: "Innova, Marazzo",
  },
  suv_luxury: {
    name: "SUV Luxury",
    capacity: "6 passengers",
    models: "Innova Crysta",
  },
};

const VEHICLE_ORDER: VehicleType[] = ["sedan", "suv_normal", "suv_deluxe", "suv_luxury"];

export default function PricingGridWithHotel({
  pricing,
  hotelOptions = [],
  showHotelPricing = false,
}: PricingGridWithHotelProps) {
  const [selectedHotelOption, setSelectedHotelOption] = useState<string | null>(
    hotelOptions.length > 0 ? hotelOptions[0].id : null
  );

  // Get unique seasons from pricing
  const seasons = Array.from(new Set(pricing.map((p) => p.season_name))).sort((a) =>
    a === "Off-Season" ? -1 : 1
  );

  // Group pricing by vehicle type
  const pricingByVehicle: Record<VehicleType, Record<string, number>> = {} as Record<
    VehicleType,
    Record<string, number>
  >;

  pricing.forEach((p) => {
    if (!pricingByVehicle[p.vehicle_type]) {
      pricingByVehicle[p.vehicle_type] = {};
    }
    pricingByVehicle[p.vehicle_type][p.season_name] = p.price;
  });

  const selectedHotel = hotelOptions.find((h) => h.id === selectedHotelOption);

  const getHotelAdjustedPrice = (basePrice: number, vehicleType: VehicleType) => {
    if (!showHotelPricing || !selectedHotel) return basePrice;
    return basePrice + (selectedHotel.price_modifier?.[vehicleType] || 0);
  };

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-sunrise/20 to-white">
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

        {/* Hotel Option Selector */}
        {showHotelPricing && hotelOptions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Hotel className="w-5 h-5 text-coral" />
              <span className="font-body font-semibold text-ink">Select Hotel Option:</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedHotelOption(null)}
                className={cn(
                  "px-4 py-2 rounded-xl font-body text-sm border-2 transition-all",
                  selectedHotelOption === null
                    ? "bg-ink text-white border-ink"
                    : "bg-white border-ink/30 hover:border-ink"
                )}
              >
                Without Hotel
              </button>
              {hotelOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedHotelOption(option.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl font-body text-sm border-2 transition-all",
                    selectedHotelOption === option.id
                      ? "bg-coral text-white border-coral"
                      : "bg-white border-ink/30 hover:border-coral"
                  )}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pricing Table */}
        <div className="bg-white rounded-2xl border-3 border-ink overflow-hidden shadow-retro">
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-[2fr,1fr,1fr] border-b-3 border-ink bg-sunshine/30">
            <div className="p-4 font-display text-ink">Vehicle Type</div>
            {seasons.map((season) => (
              <div
                key={season}
                className="p-4 font-display text-ink text-center border-l-2 border-ink/20"
              >
                {season}
              </div>
            ))}
          </div>

          {/* Table Body */}
          <div className="divide-y-2 divide-ink/20">
            {VEHICLE_ORDER.filter((vt) => pricingByVehicle[vt]).map((vehicleType) => {
              const vehicle = VEHICLE_DISPLAY[vehicleType];
              const vehiclePricing = pricingByVehicle[vehicleType];

              return (
                <div
                  key={vehicleType}
                  className="grid md:grid-cols-[2fr,1fr,1fr] hover:bg-sunrise/10 transition-colors"
                >
                  {/* Vehicle Info */}
                  <div className="p-4 border-b md:border-b-0">
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
                    const basePrice = vehiclePricing[season] || 0;
                    const displayPrice =
                      selectedHotelOption !== null
                        ? getHotelAdjustedPrice(basePrice, vehicleType)
                        : basePrice;

                    return (
                      <div
                        key={season}
                        className="p-4 md:border-l-2 md:border-ink/20 flex flex-col items-center justify-center"
                      >
                        <div className="md:hidden text-xs text-ink/60 font-body mb-1">
                          {season}
                        </div>
                        <div className="font-display text-2xl text-ink">
                          ₹{displayPrice.toLocaleString()}
                        </div>
                        {selectedHotelOption !== null && selectedHotel && (
                          <div className="text-xs text-coral font-body mt-1">
                            +₹{(selectedHotel.price_modifier?.[vehicleType] || 0).toLocaleString()} hotel
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
