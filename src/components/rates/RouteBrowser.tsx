"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Car, Phone, Search, X } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useVehicleLabels } from "@/hooks/useVehicleLabels";
import type { CategoryWithRoutes } from "@/lib/supabase";
import type { RouteWithCategory, RoutePricing } from "@/lib/supabase/types";
import RouteCard from "./RouteCard";

type RouteWithPricing = RouteWithCategory & { pricing?: RoutePricing[] };

interface RouteBrowserProps {
  categories: CategoryWithRoutes[];
}

/**
 * Client-only piece of /rates: search + which tab is active. The route data
 * itself is passed in already-fetched from the server component
 * (src/app/rates/page.tsx) — every category's routes render into the DOM
 * on first paint, and switching tabs only toggles a `hidden` class, so
 * nothing here depends on JS running for the content to exist.
 */
export default function RouteBrowser({ categories }: RouteBrowserProps) {
  const [active, setActive] = useState<string>("all");
  const [query, setQuery] = useState("");
  // The input itself always reflects `query` so typing never lags; the value
  // actually used to filter/re-render the card grid trails behind via
  // useDeferredValue so React can keep the keystroke responsive on low-end
  // mobile even while re-rendering dozens of pricing-grid cards below.
  const deferredQuery = useDeferredValue(query);

  const allRoutes = useMemo(
    () => categories.flatMap((c) => c.routes),
    [categories]
  );

  // Vehicle labels are resolved once here (not inside RouteCard) because
  // useVehicleLabels' cache is time-based with no in-flight-request guard —
  // one hook call per card would fire a duplicate admin-settings fetch per
  // card on first paint of a route-heavy category.
  const { labels: vehicleLabels } = useVehicleLabels();

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
      (active === id && !isSearching) || (isSearching && id === "all")
        ? "text-ink border-sunshine font-medium"
        : "text-slate-500 border-transparent hover:text-ink",
      isSearching && id !== "all" && "opacity-40 pointer-events-none"
    );

  return (
    <div>
      {/* Filter bar — sticky from md: up only, so a phone screen isn't
          permanently eaten by a pinned bar above the cards. */}
      <div className="md:sticky md:top-20 md:z-40 mb-8 rounded-lg border border-slate-200 bg-white/95 backdrop-blur-sm p-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by pickup or drop location…"
            className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sunshine focus:outline-none"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-t border-slate-200 mt-3 pt-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                disabled={isSearching}
                className={tabClass(category.id)}
              >
                {category.category_name}{" "}
                <span className="text-slate-400 tabular-nums">{category.routes.length}</span>
              </button>
            ))}
          </div>
        </div>
        {isSearching && (
          <p className="text-xs text-slate-400 mt-2">
            Showing results across all categories — clear search to browse by category.
          </p>
        )}
      </div>

      {/* Results */}
      {isSearching ? (
        searchResults.length > 0 ? (
          <RouteGrid routes={searchResults} vehicleLabels={vehicleLabels} visible />
        ) : (
          <NoSearchResults query={trimmedQuery} />
        )
      ) : (
        <>
          <RouteGrid routes={allRoutes} vehicleLabels={vehicleLabels} visible={active === "all"} />
          {categories.map((category) => (
            <RouteGrid
              key={category.id}
              routes={category.routes}
              vehicleLabels={vehicleLabels}
              visible={active === category.id}
            />
          ))}
        </>
      )}
    </div>
  );
}

function RouteGrid({
  routes,
  vehicleLabels,
  visible,
}: {
  routes: RouteWithPricing[];
  vehicleLabels: ReturnType<typeof useVehicleLabels>["labels"];
  visible: boolean;
}) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", !visible && "hidden")}>
      {routes.map((route) => (
        <RouteCard key={route.id} route={route} vehicleLabels={vehicleLabels} />
      ))}
    </div>
  );
}

function NoSearchResults({ query }: { query: string }) {
  return (
    <div className="max-w-xl mx-auto rounded-lg border border-slate-200 bg-white p-12 text-center">
      <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
      <h3 className="text-xl font-display font-semibold text-ink mb-2">
        No routes found for &ldquo;{query}&rdquo;
      </h3>
      <p className="text-slate-500 mb-6">
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
