"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { buildBookingUrl } from "@/lib/bookingLink";
import { VEHICLE_ORDER } from "@/lib/pricing";
import type { VehicleType } from "@/store/bookingStore";
import type { RouteWithCategory, RoutePricing } from "@/lib/supabase/types";

type RouteWithPricing = RouteWithCategory & { pricing?: RoutePricing[] };

interface RouteCardProps {
  route: RouteWithPricing;
  vehicleLabels: Record<VehicleType, string>;
}

/**
 * One route on /rates. Replaces the old table-row layout with a card that
 * shows a full per-vehicle price matrix instead of a single "starts from"
 * figure, so a visitor can compare vehicle options without clicking through.
 * `vehicleLabels` is resolved once by the parent RouteBrowser (see its
 * comment on why useVehicleLabels() isn't called per-card) and passed down.
 */
export default function RouteCard({ route, vehicleLabels }: RouteCardProps) {
  const activePrices = (route.pricing || []).filter((p) => p.is_active && p.price > 0);

  // Per-vehicle price = cheapest active row for that vehicle type, collapsing
  // Off-Season/Season into one figure — a full season x vehicle breakdown
  // doesn't fit a compact browse card (see plan notes).
  const priceFor = (vt: VehicleType): number | null => {
    const prices = activePrices.filter((p) => p.vehicle_type === vt).map((p) => p.price);
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const available = VEHICLE_ORDER.filter((vt) => priceFor(vt) !== null);

  const cheapest = activePrices.length > 0
    ? activePrices.reduce((a, b) => (b.price < a.price ? b : a))
    : null;

  const bookingUrl = buildBookingUrl({
    routeId: route.id,
    packageType: "transfer",
    packageTitle: `${route.pickup_location} to ${route.drop_location}`,
    ...(cheapest ? { vehicle: cheapest.vehicle_type } : {}),
    pickup: route.pickup_location,
    dropoff: route.drop_location,
  });

  // Prefer the linked /destinations/[slug] page (richer tourist content) when
  // set; otherwise fall back to this route's own /routes/[slug] SEO landing
  // page when the admin has opted it in and it's actually live — a route with
  // show_as_route_page=true but is_active=false 404s, so it must not be linked.
  const detailsHref = route.destination_slug
    ? `/destinations/${route.destination_slug}`
    : route.show_as_route_page && route.is_active
    ? `/routes/${route.slug}`
    : null;
  const bookingEnabled = route.enable_online_booking;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div>
        <div className="text-[15px] font-display font-semibold text-ink">
          {route.pickup_location} → {route.drop_location}
        </div>
        <div className="text-sm text-slate-500 tabular-nums mt-1">
          {route.distance ? `${route.distance} km` : "—"}
          {route.duration ? ` • ${route.duration}` : ""}
        </div>
      </div>

      {available.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {available.map((vt) => (
            <div
              key={vt}
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2"
            >
              <div className="text-[11px] uppercase tracking-wide text-slate-500 truncate">
                {vehicleLabels[vt]}
              </div>
              <div className="text-sm font-semibold text-ink tabular-nums">
                ₹{priceFor(vt)!.toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-400">On request</div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mt-1 pt-3 border-t border-slate-200">
        {detailsHref && (
          <Button variant="outline" size="sm" asChild className="min-h-[44px]">
            <Link href={detailsHref}>View Details</Link>
          </Button>
        )}
        {bookingEnabled ? (
          <Button variant="primary" size="sm" asChild className="min-h-[44px]">
            <Link href={bookingUrl}>Book Now</Link>
          </Button>
        ) : (
          <Button variant="primary" size="sm" asChild className="min-h-[44px]">
            <Link href="/contact">Enquire</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
