'use client';

import React, { useEffect, useState } from 'react';
import { AddonWithPrice, SelectedAddon } from '@/lib/supabase/types';
import { useBookingStore } from '@/store/bookingStore';
import AddonCard from './AddonCard';
import { Gift, Sparkles } from 'lucide-react';
import { capture } from '@/lib/analytics/capture';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

interface AddonSelectorProps {
  packageId?: string;
  routeId?: string;
  destinationId?: string;
  seasonName: 'Off-Season' | 'Season';
  stage: 'before_booking' | 'after_booking';
  // Fires once the fetch resolves, so a parent wrapping this in its own
  // border/background/header can hold off rendering that chrome until it
  // knows there's actually something to show.
  onAvailabilityChange?: (hasAddons: boolean) => void;
  /**
   * Drop the internal header and the "N addons selected" footer bar.
   *
   * Step 2 now renders this inside a collapsed <details> whose summary row
   * already says how many extras are selected and what they cost, so both
   * would be duplicated one line apart. Step 4's post-booking upsell still
   * wants them, which is why this is a prop and not a removal.
   */
  compact?: boolean;
}

export default function AddonSelector({
  packageId,
  routeId,
  destinationId,
  seasonName,
  stage,
  onAvailabilityChange,
  compact = false,
}: AddonSelectorProps) {
  const [addons, setAddons] = useState<AddonWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { selectedAddons, addonsTotal, addAddon, removeAddon } = useBookingStore();

  useEffect(() => {
    fetchAddons();
  }, [packageId, routeId, destinationId, seasonName, stage]);

  const fetchAddons = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (packageId) params.append('package_id', packageId);
      if (routeId) params.append('route_id', routeId);
      if (destinationId) params.append('destination_id', destinationId);
      params.append('stage', stage);
      params.append('season', seasonName);

      const response = await fetch(`/api/addons?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch addons');
      }

      const fetchedAddons = result.data || [];
      setAddons(fetchedAddons);
      onAvailabilityChange?.(fetchedAddons.length > 0);
    } catch (err) {
      console.error('Error fetching addons:', err);
      setError(err instanceof Error ? err.message : 'Failed to load addons');
      onAvailabilityChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAddon = (addon: AddonWithPrice) => {
    const isSelected = selectedAddons.some(a => a.id === addon.id);

    if (isSelected) {
      removeAddon(addon.id);
    } else {
      const selectedAddon: SelectedAddon = {
        id: addon.id,
        name: addon.name,
        price: addon.price,
        season_name: seasonName,
        icon_emoji: addon.icon_emoji,
      };
      addAddon(selectedAddon);
    }

    // `stage` separates the in-flow upsell on step 2 from the post-booking one
    // on the confirmation screen — they convert very differently and lumping
    // them together hides that.
    capture(ANALYTICS_EVENTS.bookingAddonToggled, {
      addon_id: addon.id,
      addon_name: addon.name,
      addon_price: addon.price,
      action: isSelected ? 'removed' : 'added',
      stage,
      season_name: seasonName,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600">Loading available addons...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (addons.length === 0) {
    return null; // Don't show anything if no addons available
  }

  return (
    <div>
      {/* Header */}
      <div className={`flex items-center gap-3 mb-4${compact ? ' hidden' : ''}`}>
        {stage === 'before_booking' ? (
          <>
            <Gift className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-bold text-lg text-gray-900">Enhance Your Trip</h3>
              <p className="text-sm text-gray-600">Add optional extras to make your journey more comfortable</p>
            </div>
          </>
        ) : (
          <>
            <Sparkles className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="font-bold text-lg text-gray-900">Upgrade Your Experience</h3>
              <p className="text-sm text-gray-600">Make your trip even better with these optional extras</p>
            </div>
          </>
        )}
      </div>

      {/* Addons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {addons.map((addon) => (
          <AddonCard
            key={addon.id}
            addon={addon}
            isSelected={selectedAddons.some(a => a.id === addon.id)}
            onToggle={() => handleToggleAddon(addon)}
          />
        ))}
      </div>

      {/* Summary Bar (shown only when addons are selected) */}
      {!compact && selectedAddons.length > 0 && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">
                {selectedAddons.length} {selectedAddons.length === 1 ? 'addon' : 'addons'} selected
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedAddons.map((addon) => (
                  <span
                    key={addon.id}
                    className="text-xs bg-white text-green-700 px-2 py-1 rounded-full border border-green-200"
                  >
                    {addon.icon_emoji} {addon.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-green-600 font-medium">Total Addons</p>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(addonsTotal)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
