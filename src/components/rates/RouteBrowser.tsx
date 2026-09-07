"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Car, Phone, Search, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { tomorrowIso } from "@/lib/bookingLink";
import type { CategoryWithRoutes } from "@/lib/supabase";
import type { RouteWithCategory, RoutePricing } from "@/lib/supabase/types";
import type { VehicleType } from "@/store/bookingStore";
import RateCalculator from "./RateCalculator";
import RouteCard from "./RouteCard";

type RouteWithPricing = RouteWithCategory & { pricing?: RoutePricing[] };

interface RouteBrowserProps {
  categories: CategoryWithRoutes[];
}

/**
 * Client-only piece of /rates: the fare calculator, the search box and which
 * tab is active. The route data itself is passed in already-fetched from the
 * server component (src/app/rates/page.tsx) — every category's routes render
 * into the DOM on first paint and switching tabs only toggles a `hidden`
 * class, so nothing here depends on JS running for the content to exist.
 *
 * The editorial copy, the crawlable route/destination links and the FAQ block
 * deliberately live in the server component instead, not in here: this file is
 * a Client Component, and prose behind a 'use client' boundary is prose
 * Googlebot has to render JS to reach.
 *
 * Vehicle, date and time are held here rather than inside RateCalculator
 * because the route rows price against them too — picking "Innova Crysta"
 * once reprices the entire list, which is what removed the old four-box
 * pricing grid from every card.
 */
export default function RouteBrowser({ categories }: RouteBrowserProps) {
  const [active, setActive] = useState<string>("all");
  const [query, setQuery] = useState("");
  // The input itself always reflects `query` so typing never lags; the value
  // actually used to filter/re-render the rows trails behind via
  // useDeferredValue so React can keep the keystroke responsive on low-end
  // mobile even while re-rendering dozens of rows below.
  const deferredQuery = useDeferredValue(query);

  const allRoutes = useMemo(() => categories.flatMap((c) => c.routes), [categories]);

  // Calculator state, shared with every row.
  const [vehicle, setVehicle] = useState<VehicleType>("sedan");
  const [date, setDate] = useState<string>(() => tomorrowIso());
  const [time, setTime] = useState("09:00");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");

  const handlePickupChange = useCallback((value: string) => {
    setPickup(value);
    // The old drop is almost never a leg we price from the new pick-up, and
    // leaving it set would show "no fare for this route" rather than an empty
    // field the user can act on.
    setDropoff("");
  }, []);

  // Tapping a row loads it into the calculator instead of navigating, so the
  // page keeps exactly one price surface. Scrolling is what makes that legible
  // on a phone, where the calculator is off-screen by the time you are reading
  // the list.
  const handleSelectRoute = useCallback((route: RouteWithPricing) => {
    setPickup(route.pickup_location);
    setDropoff(route.drop_location);
    document
      .getElementById("fare-calculator")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const trimmedQuery = query.trim();
  const trimmedDeferred = deferredQuery.trim();
  const isSearching = trimmedDeferred.length > 0;
  const q = trimmedDeferred.toLowerCase();

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return allRoutes.filter(
      (r) =>
        r.pickup_location.toLowerCase().includes(q) ||
        r.drop_location.toLowerCase().includes(q)
    );
  }, [allRoutes, q, isSearching]);

  if (categories.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-12 text-center">
        <Car className="mx-auto mb-4 h-10 w-10 text-slate-300" />
        <h3 className="mb-2 font-display text-xl font-semibold text-ink">No routes available</h3>
        <p className="mb-6 text-slate-500">
          We&apos;re updating our routes. Please check back soon or contact us directly.
        </p>
        <Button variant="primary" size="md" asChild>
          <Link href="/contact">
            <Phone className="mr-2 h-4 w-4" />
            Contact Us
          </Link>
        </Button>
      </div>
    );
  }

  const tabClass = (id: string) =>
    cn(
      "shrink-0 pb-3 text-sm whitespace-nowrap border-b-2 transition-colors",
      (active === id && !isSearching) || (isSearching && id === "all")
        ? "text-ink border-sunshine font-medium"
        : "text-slate-500 border-transparent hover:text-ink",
      isSearching && id !== "all" && "opacity-40 pointer-events-none"
    );

  const rowProps = { vehicle, date, pickup, dropoff, onSelect: handleSelectRoute };

  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
      {/* Calculator — sticky beside the list from lg: up, stacked above it below that. */}
      <div className="lg:col-span-5 lg:sticky lg:top-20 xl:col-span-4">
        <RateCalculator
          routes={allRoutes}
          pickup={pickup}
          dropoff={dropoff}
          date={date}
          time={time}
          vehicle={vehicle}
          onPickupChange={handlePickupChange}
          onDropoffChange={setDropoff}
          onDateChange={setDate}
          onTimeChange={setTime}
          onVehicleChange={setVehicle}
        />
      </div>

      <div className="lg:col-span-7 xl:col-span-8">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
          Or browse our fixed fares
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
          Tap any route to load it into the calculator. Fares shown are for the vehicle selected
          there.
        </p>

        {/* Filter bar */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-white/95 p-4 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by pickup or drop location…"
              aria-label="Search routes"
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 overflow-x-auto border-t border-slate-200 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-6">
              <button type="button" onClick={() => setActive("all")} className={tabClass("all")}>
                All routes <span className="tabular-nums text-slate-400">{allRoutes.length}</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setActive(category.id)}
                  disabled={isSearching}
                  className={tabClass(category.id)}
                >
                  {category.category_name}{" "}
                  <span className="tabular-nums text-slate-400">{category.routes.length}</span>
                </button>
              ))}
            </div>
          </div>
          {isSearching && (
            <p className="mt-2 text-xs text-slate-400">
              Showing results across all categories — clear search to browse by category.
            </p>
          )}
        </div>

        {/* Results */}
        <div className="mt-4">
          {isSearching ? (
            searchResults.length > 0 ? (
              <RouteList routes={searchResults} visible {...rowProps} />
            ) : (
              <NoSearchResults query={trimmedQuery} />
            )
          ) : (
            <>
              <RouteList routes={allRoutes} visible={active === "all"} {...rowProps} />
              {categories.map((category) => (
                <RouteList
                  key={category.id}
                  routes={category.routes}
                  visible={active === category.id}
                  {...rowProps}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RouteList({
  routes,
  visible,
  vehicle,
  date,
  pickup,
  dropoff,
  onSelect,
}: {
  routes: RouteWithPricing[];
  visible: boolean;
  vehicle: VehicleType;
  date: string;
  pickup: string;
  dropoff: string;
  onSelect: (route: RouteWithPricing) => void;
}) {
  return (
    <ul className={cn("border-t border-slate-200", !visible && "hidden")}>
      {routes.map((route) => (
        <RouteCard
          key={route.id}
          route={route}
          vehicle={vehicle}
          date={date}
          active={route.pickup_location === pickup && route.drop_location === dropoff}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function NoSearchResults({ query }: { query: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-12 text-center">
      <Search className="mx-auto mb-4 h-10 w-10 text-slate-300" />
      <h3 className="mb-2 font-display text-xl font-semibold text-ink">
        No routes found for &ldquo;{query}&rdquo;
      </h3>
      <p className="mb-6 text-slate-500">
        Contact us for a custom quote — we can arrange most routes on request.
      </p>
      <Button variant="whatsapp" size="md" asChild>
        <Link
          href="https://wa.me/918445206116?text=Hi,%20I%20need%20a%20custom%20taxi%20route"
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp Us
        </Link>
      </Button>
    </div>
  );
}
