'use client';

import { MapPin } from 'lucide-react';
import type { Route, RoutePricing, PickupLocationRow } from '@/lib/supabase/types';
import { resolvePickupAliases, toCanonicalPickupLocation } from '@/lib/pickupLocations';
import { findRouteForPair } from '@/lib/routeReverse';

export type TransferRoute = Route & { pricing?: RoutePricing[] };

interface TransferRouteSelectorProps {
  // Both arrive as server-fetched props from /booking's page component, so
  // the dropdowns are populated on first paint — no fetch, no spinner, no
  // layout shift on this conversion-critical step.
  pickupLocations: PickupLocationRow[];
  routes: TransferRoute[];
  pickup: string;
  dropoff: string;
  // Called on EVERY change, with the freshly resolved route or null when the
  // pair is incomplete or unmatched. This component holds no route of its own
  // — the parent is the single source of truth, which is what stops a stale
  // routeId surviving an edit to the pickup dropdown.
  onChange: (pickup: string, dropoff: string, route: TransferRoute | null) => void;
}

export default function TransferRouteSelector({
  pickupLocations,
  routes,
  pickup,
  dropoff,
  onChange,
}: TransferRouteSelectorProps) {
  // Which drops are reachable from the chosen pickup. Unions both directions
  // deliberately: a pair may still exist as a single row in either
  // orientation, and this is a de-duplicated set of names, so including both
  // can only widen the legitimate choices. (Picking WHICH row serves a chosen
  // pair is a different question — see findRouteForPair.)
  const getDropLocations = (): string[] => {
    if (!pickup) return [];

    const fromAliases = resolvePickupAliases(pickupLocations, pickup);
    const validDrops = new Set<string>();

    routes.forEach((route) => {
      if (fromAliases.includes(route.pickup_location)) {
        validDrops.add(toCanonicalPickupLocation(pickupLocations, route.drop_location));
      }
      if (fromAliases.includes(route.drop_location)) {
        validDrops.add(toCanonicalPickupLocation(pickupLocations, route.pickup_location));
      }
    });

    return Array.from(validDrops).sort();
  };

  const resolveRoute = (from: string, to: string): TransferRoute | null => {
    if (!from || !to) return null;
    return findRouteForPair(
      routes,
      resolvePickupAliases(pickupLocations, from),
      resolvePickupAliases(pickupLocations, to)
    );
  };

  const handlePickupChange = (value: string) => {
    // Changing the pickup invalidates the current drop — it may not be
    // reachable from the new origin. Reset it and report a null route, which
    // clears routeId upstream.
    onChange(value, '', null);
  };

  const handleDropChange = (value: string) => {
    onChange(pickup, value, resolveRoute(pickup, value));
  };

  const dropLocations = getDropLocations();
  const selectedRoute = resolveRoute(pickup, dropoff);
  const pairChosen = Boolean(pickup && dropoff);

  const selectClass =
    'w-full px-4 py-3 rounded-xl border-4 border-[#2D3436] font-semibold text-[#2D3436] bg-white focus:outline-none focus:ring-4 focus:ring-[#FFD93D]/40 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed';

  return (
    <div className="space-y-4">
      {/* Matches the "Select Package" label this replaces — the step's own
          <h2> already sits above it, so a second heading would double up. */}
      <label className="block text-sm font-bold text-[#2D3436]">Select Your Route</label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="transfer-pickup"
            className="block text-sm font-bold text-[#2D3436] mb-2"
          >
            <MapPin className="w-4 h-4 inline mr-1" />
            Pick-up Location <span className="text-red-500">*</span>
          </label>
          <select
            id="transfer-pickup"
            value={pickup}
            onChange={(e) => handlePickupChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Choose pick-up point</option>
            {pickupLocations.map((location) => (
              <option key={location.id} value={location.name}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="transfer-drop" className="block text-sm font-bold text-[#2D3436] mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />
            Drop-off Location <span className="text-red-500">*</span>
          </label>
          <select
            id="transfer-drop"
            value={dropoff}
            onChange={(e) => handleDropChange(e.target.value)}
            disabled={!pickup || dropLocations.length === 0}
            className={selectClass}
          >
            <option value="">
              {!pickup
                ? 'Select pick-up first'
                : dropLocations.length === 0
                ? 'No routes available'
                : 'Choose drop-off point'}
            </option>
            {dropLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedRoute && (
        <div className="rounded-2xl border-4 border-[#2D3436] bg-[#F8F9FA] p-4">
          <div className="font-bold text-[#2D3436]">
            {toCanonicalPickupLocation(pickupLocations, selectedRoute.pickup_location)} →{' '}
            {toCanonicalPickupLocation(pickupLocations, selectedRoute.drop_location)}
          </div>
          {(selectedRoute.distance || selectedRoute.duration) && (
            <div className="text-sm text-gray-600 mt-1">
              {selectedRoute.distance && `${selectedRoute.distance} km`}
              {selectedRoute.distance && selectedRoute.duration && ' • '}
              {selectedRoute.duration}
            </div>
          )}
        </div>
      )}

      {pairChosen && !selectedRoute && (
        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            We don&apos;t have a fixed fare for this route yet. Pick a different pair, or message us
            for a quote.
          </p>
        </div>
      )}

      {selectedRoute && !selectedRoute.enable_online_booking && (
        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            Online booking is currently disabled for this route. Please contact us directly.
          </p>
        </div>
      )}
    </div>
  );
}
