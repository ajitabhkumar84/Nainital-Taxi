import React from "react";
import Link from "next/link";
import { MapPin, Clock, ArrowRight, Car } from "lucide-react";
import { RouteWithCategory, RoutePricing } from "@/lib/supabase/types";

interface RouteCardProps {
  route: RouteWithCategory & { pricing?: RoutePricing[] };
}

export default function RouteCard({ route }: RouteCardProps) {
  // Get starting price (lowest price across all vehicles)
  const getStartingPrice = () => {
    if (!route.pricing || route.pricing.length === 0) return null;

    const prices = route.pricing
      .filter((p) => p.price > 0)
      .map((p) => p.price);

    if (prices.length === 0) return null;

    return Math.min(...prices);
  };

  const startingPrice = getStartingPrice();

  return (
    <Link
      href={`/routes/${route.slug}`}
      className="group bg-white rounded-2xl border-3 border-ink overflow-hidden shadow-retro hover:shadow-retro-lg transition-all hover:-translate-y-1"
    >
      {/* Header with Starting Price Badge */}
      <div className="relative bg-gradient-to-br from-sunrise to-sunshine p-6 border-b-3 border-ink">
        {startingPrice && (
          <div className="absolute top-4 right-4 bg-whatsapp text-white px-4 py-2 rounded-full border-2 border-ink shadow-retro-sm">
            <span className="text-sm font-body font-bold">
              From ₹{startingPrice}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="bg-white p-3 rounded-xl border-2 border-ink shadow-retro-sm">
            <Car className="w-6 h-6 text-coral" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-xl text-ink">
                {route.pickup_location}
              </h3>
              <ArrowRight className="w-5 h-5 text-coral flex-shrink-0" />
              <h3 className="font-display text-xl text-ink">
                {route.drop_location}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-4">
        {/* Distance & Duration */}
        <div className="flex items-center gap-4 text-sm text-ink/70 font-body">
          {route.distance && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{route.distance} km</span>
            </div>
          )}
          {route.duration && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{route.duration}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {route.description && (
          <p className="text-sm text-ink/70 font-body line-clamp-2">
            {route.description}
          </p>
        )}

        {/* Vehicle Types Available */}
        {route.pricing && route.pricing.length > 0 && (
          <div>
            <p className="text-xs text-ink/50 font-body mb-2">
              Available Vehicles:
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(
                new Set(
                  route.pricing
                    .filter((p) => p.price > 0)
                    .map((p) => p.vehicle_type)
                )
              ).map((vehicleType) => (
                <span
                  key={vehicleType}
                  className="px-3 py-1 text-xs font-body font-semibold rounded-full bg-lake/10 border-2 border-lake text-lake"
                >
                  {vehicleType
                    .replace("_", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="pt-4 border-t-2 border-ink/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-body text-ink/60">
              View Details & Book
            </span>
            <div className="w-8 h-8 bg-sunshine border-2 border-ink rounded-full flex items-center justify-center group-hover:bg-coral group-hover:text-white transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="px-6 pb-6 flex flex-wrap gap-2">
        {route.enable_online_booking && (
          <span className="px-3 py-1 text-xs font-body font-semibold rounded-full bg-whatsapp/10 border-2 border-whatsapp text-whatsapp">
            ✓ Online Booking
          </span>
        )}
        {route.has_hotel_option && (
          <span className="px-3 py-1 text-xs font-body font-semibold rounded-full bg-coral/10 border-2 border-coral text-coral">
            + Hotel Option
          </span>
        )}
      </div>
    </Link>
  );
}
