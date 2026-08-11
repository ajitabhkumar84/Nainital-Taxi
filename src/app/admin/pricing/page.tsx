"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Package as PackageIcon, Route as RouteIcon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Package as PackageType,
  Route,
  Pricing,
  RoutePricing,
  Season,
  SeasonName,
} from "@/lib/supabase/types";
import PricingCard, { PendingPriceEdit } from "@/components/admin/PricingCard";

type Tab = "packages" | "transfers";

interface PricingApiResponse {
  pricing: Pricing[];
  routePricing: RoutePricing[];
  seasons: Season[];
}

function formatShortDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// The two price columns are always "Off-Season" / "Season" (see SEASON_NAMES);
// the `seasons` table only supplies helper text — the actual date range(s)
// currently mapped to each name — since it can hold several rows per name
// (long weekends, festival periods, etc.).
function buildSeasonHints(seasons: Season[]): Partial<Record<SeasonName, string>> {
  const rangesByName: Partial<Record<SeasonName, string[]>> = {};
  for (const season of seasons) {
    if (season.name !== "Off-Season" && season.name !== "Season") continue;
    const name = season.name as SeasonName;
    const range = `${formatShortDate(season.start_date)}–${formatShortDate(season.end_date)}`;
    rangesByName[name] = [...(rangesByName[name] || []), range];
  }

  const hints: Partial<Record<SeasonName, string>> = {};
  for (const [name, ranges] of Object.entries(rangesByName) as [SeasonName, string[]][]) {
    const shown = ranges.slice(0, 3);
    hints[name] = shown.join(", ") + (ranges.length > shown.length ? ` +${ranges.length - shown.length} more` : "");
  }
  return hints;
}

export default function PricingPage() {
  const [tab, setTab] = useState<Tab>("packages");
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pricing, setPricing] = useState<Pricing[]>([]);
  const [routePricing, setRoutePricing] = useState<RoutePricing[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Each of these three fetches is independent — one failing (as the old
  // "pricing" query did, on a bad relationship name) must not blank the
  // whole page, which is exactly what happened before.
  const fetchAll = useCallback(async () => {
    setLoading(true);

    const [packagesResult, routesResult, pricingResult] = await Promise.allSettled([
      fetch("/api/admin/packages").then((r) => {
        if (!r.ok) throw new Error("Failed to load packages");
        return r.json();
      }),
      fetch("/api/admin/routes").then((r) => {
        if (!r.ok) throw new Error("Failed to load routes");
        return r.json();
      }),
      fetch("/api/admin/pricing").then((r) => {
        if (!r.ok) throw new Error("Failed to load pricing");
        return r.json() as Promise<PricingApiResponse>;
      }),
    ]);

    const failures: string[] = [];

    if (packagesResult.status === "fulfilled") {
      setPackages(packagesResult.value.data || []);
    } else {
      failures.push("packages");
      console.error("Error fetching packages:", packagesResult.reason);
    }

    if (routesResult.status === "fulfilled") {
      setRoutes(routesResult.value.data || []);
    } else {
      failures.push("routes");
      console.error("Error fetching routes:", routesResult.reason);
    }

    if (pricingResult.status === "fulfilled") {
      setPricing(pricingResult.value.pricing || []);
      setRoutePricing(pricingResult.value.routePricing || []);
      setSeasons(pricingResult.value.seasons || []);
    } else {
      failures.push("pricing");
      console.error("Error fetching pricing:", pricingResult.reason);
    }

    setLoadError(
      failures.length > 0
        ? `Couldn't load ${failures.join(", ")}. Try refreshing the page.`
        : ""
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 3000);
    return () => clearTimeout(timer);
  }, [banner]);

  const seasonHints = useMemo(() => buildSeasonHints(seasons), [seasons]);

  const filteredPackages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? packages.filter((p) => p.title.toLowerCase().includes(q)) : packages;
  }, [packages, search]);

  const filteredRoutes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? routes.filter((r) => `${r.pickup_location} ${r.drop_location}`.toLowerCase().includes(q))
      : routes;
  }, [routes, search]);

  const postPricing = async (updates: Record<string, unknown>[]) => {
    const response = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to save prices");
    }
    const { data } = await response.json();
    return data as { pricing: Pricing[]; routePricing: RoutePricing[] };
  };

  const savePackagePrices = async (packageId: string, edits: PendingPriceEdit[]) => {
    try {
      const data = await postPricing(edits.map((e) => ({ package_id: packageId, ...e })));
      setPricing((prev) => {
        const touched = (p: Pricing) =>
          p.package_id === packageId &&
          edits.some((e) => e.vehicle_type === p.vehicle_type && e.season_name === p.season_name);
        return [...prev.filter((p) => !touched(p)), ...(data.pricing || [])];
      });
      setBanner({ type: "success", text: "Prices saved." });
    } catch (err) {
      setBanner({ type: "error", text: err instanceof Error ? err.message : "Failed to save prices." });
      throw err;
    }
  };

  const saveRoutePrices = async (routeId: string, edits: PendingPriceEdit[]) => {
    try {
      const data = await postPricing(edits.map((e) => ({ route_id: routeId, ...e })));
      setRoutePricing((prev) => {
        const touched = (p: RoutePricing) =>
          p.route_id === routeId &&
          edits.some((e) => e.vehicle_type === p.vehicle_type && e.season_name === p.season_name);
        return [...prev.filter((p) => !touched(p)), ...(data.routePricing || [])];
      });
      setBanner({ type: "success", text: "Prices saved." });
    } catch (err) {
      setBanner({ type: "error", text: err instanceof Error ? err.message : "Failed to save prices." });
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-xl font-display text-ink animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading pricing...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-display text-ink">Pricing Manager</h1>
        <p className="text-ink/60 font-body mt-1">
          Set prices for each package or route, by vehicle type and season
        </p>
      </div>

      {loadError && (
        <div className="bg-coral/10 border-3 border-coral rounded-xl p-4 text-coral font-body flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {loadError}
        </div>
      )}
      {banner && (
        <div
          className={cn(
            "border-3 rounded-xl p-4 font-body",
            banner.type === "success" ? "bg-teal/10 border-teal text-teal" : "bg-coral/10 border-coral text-coral"
          )}
        >
          {banner.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTab("packages")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm border-2 transition-all",
            tab === "packages" ? "bg-sunshine border-ink shadow-retro-sm" : "bg-white border-ink/20 hover:border-ink/40"
          )}
        >
          <PackageIcon className="w-4 h-4" />
          Package Pricing
          <span className="text-xs text-ink/50">({packages.length})</span>
        </button>
        <button
          onClick={() => setTab("transfers")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm border-2 transition-all",
            tab === "transfers" ? "bg-sunshine border-ink shadow-retro-sm" : "bg-white border-ink/20 hover:border-ink/40"
          )}
        >
          <RouteIcon className="w-4 h-4" />
          Transfer Pricing
          <span className="text-xs text-ink/50">({routes.length})</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tab === "packages" ? "Search packages..." : "Search routes..."}
          className="w-full pl-9 pr-3 py-2 border-2 border-ink/20 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
        />
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {tab === "packages" &&
          (filteredPackages.length === 0 ? (
            <p className="text-ink/50 font-body text-sm p-4">No packages found.</p>
          ) : (
            filteredPackages.map((pkg) => (
              <PricingCard
                key={pkg.id}
                subject={{
                  id: pkg.id,
                  name: pkg.title,
                  sublabel: [pkg.type === "tour" ? "Tour Package" : "Transfer", pkg.duration]
                    .filter(Boolean)
                    .join(" • "),
                  isActive: pkg.is_active,
                }}
                prices={pricing
                  .filter((p) => p.package_id === pkg.id)
                  .map((p) => ({ vehicle_type: p.vehicle_type, season_name: p.season_name, price: p.price }))}
                seasonHints={seasonHints}
                onSave={savePackagePrices}
              />
            ))
          ))}

        {tab === "transfers" &&
          (filteredRoutes.length === 0 ? (
            <p className="text-ink/50 font-body text-sm p-4">No routes found.</p>
          ) : (
            filteredRoutes.map((route) => (
              <PricingCard
                key={route.id}
                subject={{
                  id: route.id,
                  name: `${route.pickup_location} → ${route.drop_location}`,
                  sublabel: [route.distance ? `${route.distance} km` : null, route.duration]
                    .filter(Boolean)
                    .join(" • "),
                  isActive: route.is_active,
                }}
                prices={routePricing
                  .filter((p) => p.route_id === route.id)
                  .map((p) => ({ vehicle_type: p.vehicle_type, season_name: p.season_name, price: p.price }))}
                seasonHints={seasonHints}
                onSave={saveRoutePrices}
              />
            ))
          ))}
      </div>

      {/* Info Box */}
      <div className="bg-lake/20 rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-teal mt-0.5" />
          <div className="font-body text-sm text-ink">
            <strong>Pricing Tips:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-ink/70">
              <li>Prices are in INR (Indian Rupees)</li>
              <li>Season prices apply automatically based on the booking date</li>
              <li>
                Leave a price blank to mark that vehicle unavailable for this package/route —
                it will be hidden from customers instead of showing ₹0
              </li>
              <li>Changes are highlighted in yellow until saved</li>
              <li>Expand a card and use its own &quot;Save Prices&quot; button</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
          <div className="text-3xl font-display text-ink">{packages.length}</div>
          <div className="text-sm font-body text-ink/60">Packages</div>
        </div>
        <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
          <div className="text-3xl font-display text-ink">{routes.length}</div>
          <div className="text-sm font-body text-ink/60">Transfer Routes</div>
        </div>
        <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
          <div className="text-3xl font-display text-ink">{seasons.length}</div>
          <div className="text-sm font-body text-ink/60">Seasons Configured</div>
        </div>
        <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
          <div className="text-3xl font-display text-ink">{pricing.length + routePricing.length}</div>
          <div className="text-sm font-body text-ink/60">Price Entries</div>
        </div>
      </div>
    </div>
  );
}
