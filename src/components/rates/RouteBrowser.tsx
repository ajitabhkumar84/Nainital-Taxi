"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Car, Phone } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { buildBookingUrl } from "@/lib/bookingLink";
import type { CategoryWithRoutes } from "@/lib/supabase";
import type { RouteWithCategory, RoutePricing } from "@/lib/supabase/types";

type RouteWithPricing = RouteWithCategory & { pricing?: RoutePricing[] };

interface RouteBrowserProps {
  categories: CategoryWithRoutes[];
}

/**
 * Client-only piece of /rates: holds which tab is active. The route data
 * itself is passed in already-fetched from the server component
 * (src/app/rates/page.tsx) — every category's routes render into the DOM
 * on first paint, and switching tabs only toggles a `hidden` class, so
 * nothing here depends on JS running for the content to exist.
 */
export default function RouteBrowser({ categories }: RouteBrowserProps) {
  const [active, setActive] = useState<string>("all");

  const allRoutes = useMemo(
    () => categories.flatMap((c) => c.routes),
    [categories]
  );

  if (categories.length === 0) {
    return (
      <div className="max-w-xl mx-auto rounded-lg border border-slate-200 bg-white p-12 text-center">
        <Car className="w-10 h-10 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-display font-semibold text-ink mb-2">
          No routes available
        </h3>
        <p className="text-slate-500 mb-6">
          We&apos;re updating our routes. Please check back soon or contact us directly.
        </p>
        <Button variant="primary" size="md" asChild>
          <Link href="/contact">
            <Phone className="w-4 h-4 mr-2" />
            Contact Us
          </Link>
        </Button>
      </div>
    );
  }

  const tabClass = (id: string) =>
    cn(
      "shrink-0 pb-3 text-sm whitespace-nowrap border-b-2 transition-colors",
      active === id
        ? "text-ink border-sunshine font-medium"
        : "text-slate-500 border-transparent hover:text-ink"
    );

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-slate-200 mb-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-6 min-w-max">
          <button type="button" onClick={() => setActive("all")} className={tabClass("all")}>
            All routes{" "}
            <span className="text-slate-400 tabular-nums">{allRoutes.length}</span>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActive(category.id)}
              className={tabClass(category.id)}
            >
              {category.category_name}{" "}
              <span className="text-slate-400 tabular-nums">{category.routes.length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Panels — all rendered, only visibility toggles */}
      <RoutesTable routes={allRoutes} visible={active === "all"} />
      {categories.map((category) => (
        <RoutesTable key={category.id} routes={category.routes} visible={active === category.id} />
      ))}
    </div>
  );
}

function RoutesTable({ routes, visible }: { routes: RouteWithPricing[]; visible: boolean }) {
  return (
    <div className={cn("rounded-lg border border-slate-200 overflow-hidden bg-white", !visible && "hidden")}>
      <div className="hidden md:grid grid-cols-[2fr_0.7fr_0.7fr_1fr_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
        <span>Route</span>
        <span>Distance</span>
        <span>Time</span>
        <span>Starts from</span>
        <span></span>
      </div>

      {routes.map((route) => (
        <RouteRow key={route.id} route={route} />
      ))}
    </div>
  );
}

function RouteRow({ route }: { route: RouteWithPricing }) {
  const activePrices = (route.pricing || []).filter((p) => p.is_active && p.price > 0);
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

  const showViewDetails = !!route.destination_slug;
  const bookingEnabled = route.enable_online_booking;

  return (
    <div className="flex flex-col gap-3 px-6 py-5 border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition-colors md:grid md:grid-cols-[2fr_0.7fr_0.7fr_1fr_auto] md:items-center md:gap-4">
      <div className="text-[15px] font-semibold text-ink">
        {route.pickup_location} → {route.drop_location}
      </div>
      <div className="text-sm text-slate-500 tabular-nums">
        {route.distance ? `${route.distance} km` : "—"}
      </div>
      <div className="text-sm text-slate-500 tabular-nums">
        {route.duration || "—"}
      </div>
      <div className="text-sm text-ink tabular-nums">
        {cheapest ? (
          <>
            <span className="text-slate-500">Starts from </span>
            ₹{cheapest.price.toLocaleString("en-IN")}
          </>
        ) : (
          <span className="text-slate-400">On request</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
        {showViewDetails && (
          <Button variant="outline" size="sm" asChild className="min-h-[44px]">
            <Link href={`/destinations/${route.destination_slug}`}>View Details</Link>
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
