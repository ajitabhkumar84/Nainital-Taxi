"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { buildBookingUrl, tomorrowIso } from "@/lib/bookingLink";
import {
  VEHICLE_ORDER,
  formatPrice,
  getVehicleCapacity,
  getVehicleModelExamples,
  getVehicleShortName,
  seasonNameForDate,
} from "@/lib/pricing";
import { routeDetailsHref } from "@/lib/routeLinks";
import type { VehicleType } from "@/store/bookingStore";
import type { RouteWithCategory, RoutePricing } from "@/lib/supabase/types";

type RouteWithPricing = RouteWithCategory & { pricing?: RoutePricing[] };

interface RateCalculatorProps {
  routes: RouteWithPricing[];
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  vehicle: VehicleType;
  onPickupChange: (value: string) => void;
  onDropoffChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onVehicleChange: (value: VehicleType) => void;
}

/**
 * Price for one route + vehicle + date, read from the pricing rows already
 * embedded in the route by getRoutesWithCategories(). No network call: the
 * whole point of the calculator is that switching vehicle or date is instant.
 *
 * Falls back to the cheapest active row for that vehicle when the exact season
 * has no row — a route priced only for Off-Season should still show a number
 * in May rather than reading "on request". /api/bookings/create recomputes the
 * real figure server-side either way.
 */
export function priceFor(
  route: RouteWithPricing,
  vehicle: VehicleType,
  date: string
): number | null {
  const active = (route.pricing || []).filter(
    (p) => p.is_active && p.price > 0 && p.vehicle_type === vehicle
  );
  if (active.length === 0) return null;

  const seasonName = seasonNameForDate(date);
  const exact = active.filter((p) => p.season_name === seasonName);
  const pool = exact.length > 0 ? exact : active;
  return Math.min(...pool.map((p) => p.price));
}

/** Cheapest fare across every vehicle, for the "from ₹X" fallback on a row. */
export function cheapestFare(route: RouteWithPricing, date: string): number | null {
  const prices = VEHICLE_ORDER.map((v) => priceFor(route, v, date)).filter(
    (p): p is number => p !== null
  );
  return prices.length > 0 ? Math.min(...prices) : null;
}

const fieldClass =
  "h-11 w-full rounded-md border border-white/20 bg-white/10 px-3 text-sm font-medium text-white " +
  "focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/25 " +
  // The native pickers render their popup list in the OS theme, so options
  // need an explicit dark-on-light or they inherit the panel's white text.
  "[&>option]:bg-white [&>option]:text-ink";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-white/60";

/**
 * The single price surface on /rates.
 *
 * Sits on an inverted panel so it reads as one instrument rather than another
 * card in the stack, and so the route list below it never looks like a second,
 * competing set of prices. Tapping a route in that list loads it in here (see
 * RouteBrowser) instead of navigating — one fare display, fed from two places.
 */
export default function RateCalculator({
  routes,
  pickup,
  dropoff,
  date,
  time,
  vehicle,
  onPickupChange,
  onDropoffChange,
  onDateChange,
  onTimeChange,
  onVehicleChange,
}: RateCalculatorProps) {
  const minDate = tomorrowIso();

  const pickups = useMemo(
    () => Array.from(new Set(routes.map((r) => r.pickup_location))).sort(),
    [routes]
  );

  // Only legs we actually price, in the direction they are priced. The reverse
  // of a route is a separate row (routes.reverse_of_route_id) with its own
  // fare, so inferring one from the other here would invent prices.
  const dropoffs = useMemo(
    () =>
      Array.from(
        new Set(routes.filter((r) => r.pickup_location === pickup).map((r) => r.drop_location))
      ).sort(),
    [routes, pickup]
  );

  const route = useMemo(
    () =>
      routes.find((r) => r.pickup_location === pickup && r.drop_location === dropoff) || null,
    [routes, pickup, dropoff]
  );

  const availableVehicles = useMemo(
    () => (route ? VEHICLE_ORDER.filter((v) => priceFor(route, v, date) !== null) : VEHICLE_ORDER),
    [route, date]
  );

  const price = route ? priceFor(route, vehicle, date) : null;
  const detailsHref = route ? routeDetailsHref(route) : null;
  const isSeason = seasonNameForDate(date) === "Season";

  const bookingUrl =
    route && price !== null
      ? buildBookingUrl({
          routeId: route.id,
          packageType: "transfer",
          packageTitle: `${route.pickup_location} to ${route.drop_location}`,
          vehicle,
          date,
          time,
          pickup: route.pickup_location,
          dropoff: route.drop_location,
        })
      : null;

  return (
    <section
      id="fare-calculator"
      aria-label="Fare calculator"
      className="rounded-lg bg-ink p-4 text-white md:p-5"
    >
      <h2 className="font-display text-lg font-semibold tracking-tight">
        What will my taxi cost?
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-white/70">
        Pick the leg and the date. The fare is fixed — fuel and driver included.
      </p>

      {/* Pick-up / drop */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="calc-pickup">
            Pick-up
          </label>
          <select
            id="calc-pickup"
            className={fieldClass}
            value={pickup}
            onChange={(e) => onPickupChange(e.target.value)}
          >
            <option value="">Select pick-up</option>
            {pickups.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="calc-dropoff">
            Drop
          </label>
          <select
            id="calc-dropoff"
            className={fieldClass}
            value={dropoff}
            onChange={(e) => onDropoffChange(e.target.value)}
            disabled={!pickup}
          >
            <option value="">{pickup ? "Select drop" : "Choose a pick-up first"}</option>
            {dropoffs.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date / time */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="calc-date">
            Travel date
          </label>
          <input
            id="calc-date"
            type="date"
            min={minDate}
            value={date}
            onChange={(e) => onDateChange(e.target.value || minDate)}
            className={cn(fieldClass, "tabular-nums [color-scheme:dark]")}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="calc-time">
            Pick-up time
          </label>
          <input
            id="calc-time"
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className={cn(fieldClass, "tabular-nums [color-scheme:dark]")}
          />
        </div>
      </div>

      {/* Vehicle */}
      <fieldset className="mt-3">
        <legend className={labelClass}>Vehicle</legend>
        <div className="grid grid-cols-4 gap-1.5">
          {VEHICLE_ORDER.map((v) => {
            const unavailable = !availableVehicles.includes(v);
            const selected = v === vehicle && !unavailable;
            return (
              <button
                key={v}
                type="button"
                onClick={() => onVehicleChange(v)}
                disabled={unavailable}
                aria-pressed={selected}
                className={cn(
                  "min-h-[52px] rounded-md border px-1 py-1.5 text-center transition-colors",
                  selected ? "border-white bg-white/15" : "border-white/20",
                  unavailable && "opacity-30"
                )}
              >
                <span className="block text-[12px] font-semibold leading-tight">
                  {getVehicleShortName(v)}
                </span>
                <span className="block text-[10px] tabular-nums text-white/60">
                  {getVehicleCapacity(v)} seats
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Result */}
      <div className="mt-4">
        {!route ? (
          <p className="rounded-md border border-white/20 p-3.5 text-[13px] leading-relaxed text-white/70">
            Choose both ends of the trip and the fare appears here — no form to fill in and no
            waiting for a callback.
          </p>
        ) : price === null ? (
          <div className="rounded-md border border-white/20 p-3.5">
            <p className="text-[13px] leading-relaxed text-white/80">
              We do not have a published {getVehicleShortName(vehicle)} fare for this leg. Pick
              another vehicle above, or ask us and we will quote it.
            </p>
          </div>
        ) : (
          <div className="rounded-md bg-white/10 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
                  {isSeason ? "Season fare" : "Off-season fare"}
                </div>
                <div className="mt-0.5 font-display text-3xl font-semibold leading-none tracking-tight tabular-nums">
                  {formatPrice(price)}
                </div>
                <div className="mt-1.5 text-[12px] text-white/70">
                  {getVehicleShortName(vehicle)} · {getVehicleModelExamples(vehicle)}
                </div>
              </div>
              {(route.distance || route.duration) && (
                <div className="shrink-0 rounded-md border border-white/20 px-2 py-1.5 text-right text-[11.5px] leading-tight tabular-nums text-white/75">
                  {route.distance ? <div>{route.distance} km</div> : null}
                  {route.duration ? <div>{route.duration}</div> : null}
                </div>
              )}
            </div>

            <dl className="mt-3 space-y-1.5 border-t border-white/20 pt-3 text-[12.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-white/70">Fuel &amp; driver allowance</dt>
                <dd className="font-semibold">Included</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-white/70">Toll, parking, state permit</dt>
                <dd className="font-semibold text-white/80">At actuals</dd>
              </div>
            </dl>

            {detailsHref && (
              <Link
                href={detailsHref}
                className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white underline underline-offset-2"
              >
                About {route.drop_location}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="mt-3">
        {route && !route.enable_online_booking ? (
          <Button variant="secondary" size="md" asChild className="min-h-[44px] w-full">
            <Link href="/contact">Enquire about this route</Link>
          </Button>
        ) : bookingUrl ? (
          <Button variant="secondary" size="md" asChild className="min-h-[44px] w-full">
            <Link href={bookingUrl}>Book this fare</Link>
          </Button>
        ) : (
          <Button variant="secondary" size="md" disabled className="min-h-[44px] w-full">
            Book this fare
          </Button>
        )}
      </div>

      <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-white/55">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" />
        <span>
          Mid-March to June is season in Kumaon and priced higher. Availability for your date is
          confirmed at the next step.
        </span>
      </p>
    </section>
  );
}
