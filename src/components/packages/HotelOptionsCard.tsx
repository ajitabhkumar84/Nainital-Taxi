"use client";

import React from "react";
import { Hotel, Star, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { HotelOption, VehicleType } from "@/lib/supabase/types";

interface HotelOptionsCardProps {
  options: HotelOption[];
  selectedVehicle?: VehicleType;
  basePrice?: number;
  onSelect?: (optionId: string) => void;
  selectedOptionId?: string;
}

export default function HotelOptionsCard({
  options,
  selectedVehicle = "sedan",
  basePrice = 0,
  onSelect,
  selectedOptionId,
}: HotelOptionsCardProps) {
  if (!options || options.length === 0) {
    return null;
  }

  const getTierStyle = (index: number) => {
    switch (index) {
      case 0:
        return "border-teal bg-teal/10";
      case 1:
        return "border-sunshine bg-sunshine/10";
      case 2:
        return "border-coral bg-coral/10";
      default:
        return "border-ink bg-white";
    }
  };

  const getTierBadge = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("budget") || lower.includes("basic")) {
      return { icon: "💰", label: "Best Value" };
    }
    if (lower.includes("standard") || lower.includes("comfort")) {
      return { icon: "⭐", label: "Popular Choice" };
    }
    if (lower.includes("deluxe") || lower.includes("premium") || lower.includes("luxury")) {
      return { icon: "👑", label: "Premium" };
    }
    return null;
  };

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3 flex items-center justify-center gap-3">
            <Hotel className="w-8 h-8 text-coral" />
            Hotel Options
          </h2>
          <p className="text-ink/60 font-body">
            Choose your accommodation preference
          </p>
        </div>

        <div className={cn(
          "grid gap-6",
          options.length === 1 && "max-w-md mx-auto",
          options.length === 2 && "md:grid-cols-2 max-w-3xl mx-auto",
          options.length >= 3 && "md:grid-cols-3"
        )}>
          {options.map((option, index) => {
            const badge = getTierBadge(option.name);
            const additionalPrice = option.price_modifier?.[selectedVehicle] || 0;
            const totalPrice = basePrice + additionalPrice;
            const isSelected = selectedOptionId === option.id;

            return (
              <div
                key={option.id}
                className={cn(
                  "relative rounded-2xl border-3 p-6 transition-all",
                  getTierStyle(index),
                  isSelected && "ring-4 ring-whatsapp shadow-retro",
                  onSelect && "cursor-pointer hover:shadow-retro"
                )}
                onClick={() => onSelect?.(option.id)}
              >
                {/* Badge */}
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-ink text-white font-body text-sm rounded-full">
                      {badge.icon} {badge.label}
                    </span>
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 rounded-full bg-whatsapp flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Tier Name */}
                <div className="text-center mb-4 mt-2">
                  <h3 className="font-display text-2xl text-ink">{option.name}</h3>
                  {option.description && (
                    <p className="text-ink/60 font-body text-sm mt-1">
                      {option.description}
                    </p>
                  )}
                </div>

                {/* Price */}
                {basePrice > 0 && (
                  <div className="text-center mb-4 py-3 border-y-2 border-ink/10">
                    {additionalPrice > 0 ? (
                      <>
                        <div className="font-display text-3xl text-ink">
                          ₹{totalPrice.toLocaleString()}
                        </div>
                        <div className="text-sm text-ink/60 font-body">
                          Base + ₹{additionalPrice.toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-display text-3xl text-ink">
                          ₹{basePrice.toLocaleString()}
                        </div>
                        <div className="text-sm text-whatsapp font-body font-semibold">
                          No additional charge
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Hotels Included */}
                {option.hotels_included && option.hotels_included.length > 0 && (
                  <div>
                    <h4 className="font-body font-semibold text-ink text-sm mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4 text-sunshine" />
                      Sample Hotels
                    </h4>
                    <ul className="space-y-1">
                      {option.hotels_included.map((hotel, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm font-body text-ink/70"
                        >
                          <Check className="w-3 h-3 text-whatsapp flex-shrink-0" />
                          {hotel}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Select Button */}
                {onSelect && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(option.id);
                    }}
                    className={cn(
                      "w-full mt-4 py-3 rounded-xl font-body font-semibold border-2 transition-all",
                      isSelected
                        ? "bg-whatsapp text-white border-whatsapp"
                        : "bg-white border-ink hover:bg-sunrise/30"
                    )}
                  >
                    {isSelected ? "Selected" : "Select This Option"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
