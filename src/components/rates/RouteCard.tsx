"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice, getVehicleShortName } from "@/lib/pricing";
import { routeDetailsHref } from "@/lib/routeLinks";
import { cheapestFare, priceFor } from "./RateCalculator";
import type { VehicleType } from "@/store/bookingStore";
import type { RouteWithCategory, RoutePricing } from "@/lib/supabase/types";

type RouteWithPricing = RouteWithCategory & { pricing?: RoutePricing[] };

interface RouteCardProps {
  route: RouteWithPricing;
  /** Vehicle currently selected in the calculator — the row prices against it. */
  vehicle: VehicleType;
  date: string;
  /** True when this route is the one loaded in the calculator above. */
  active: boolean;
  onSelect: (route: RouteWithPricing) => void;
}

/**
 * One route on /rates, as a list row rather than a card.
 *
 * Replaces the old 2x2 grid of per-vehicle price boxes. That grid showed four
 * fares per route labelled with the raw admin `vehicle_category_labels`
 * strings ("DZIRE,AMAZE,XCENT(4PAX)"), which cost roughly 230px of height per
 * route and put four numbers in front of someone who wanted one. Now the
 * calculator above owns the vehicle choice and every row shows that vehicle's
 * fare, so a phone screen fits ten routes instead of two.
 *
 * Tapping the row does not navigate: it loads the route into the calculator
 * (see RouteBrowser), keeping one price surface on the page. The separate
 * details link is the only navigation, and it is a real anchor so it stays
 * crawlable.
 */
export default function RouteCard({ route, vehicle, date, active, onSelect }: RouteCardProps) {
  const price = priceFor(route, vehicle, date);
  const fallback = price === null ? cheapestFare(route, date) : null;
  const detailsHref = routeDetailsHref(route);

  const meta = [
    route.distance ? `${route.distance} km` : null,
    route.duration,
    route.enable_online_booking ? null : "on request",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      className={cn(
        "flex items-center gap-2 border-b border-slate-200 transition-colors",
        active && "bg-sunshine-50"
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(route)}
        aria-current={active ? "true" : undefined}
        className="flex min-h-[60px] flex-1 items-center gap-3 py-3 pl-1 pr-1 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[14.5px] font-semibold leading-snug text-ink">
            {route.pickup_location} <span className="font-normal text-slate-400">→</span>{" "}
            {route.drop_location}
          </span>
          {meta && (
            <span className="mt-0.5 block text-xs tabular-nums text-slate-500">{meta}</span>
          )}
        </span>

        <span className="shrink-0 text-right">
          {price !== null ? (
            <>
              <span className="block text-[15.5px] font-semibold leading-tight tabular-nums text-ink">
                {formatPrice(price)}
              </span>
              <span className="block text-[11px] text-slate-500">
                {getVehicleShortName(vehicle)}
              </span>
            </>
          ) : fallback !== null ? (
            <>
              <span className="block text-[15.5px] font-semibold leading-tight tabular-nums text-slate-500">
                {formatPrice(fallback)}
              </span>
              <span className="block text-[11px] text-slate-400">from</span>
            </>
          ) : (
            <span className="block text-[13px] font-medium text-slate-400">On request</span>
          )}
        </span>

        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
      </button>

      {detailsHref && (
        <Link
          href={detailsHref}
          className="shrink-0 self-stretch px-2 py-3 text-[11.5px] font-semibold text-sunshine underline underline-offset-2 sm:px-3"
        >
          Details
        </Link>
      )}
    </li>
  );
}
