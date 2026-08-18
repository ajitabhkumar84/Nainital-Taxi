'use client';

import { useState, useEffect, useCallback } from 'react';
import { VehicleType } from '@/store/bookingStore';
import { getVehicleTypeName } from '@/lib/pricing';

const DEFAULT_VEHICLE_LABELS: Record<VehicleType, string> = {
  sedan: getVehicleTypeName('sedan'),
  suv_normal: getVehicleTypeName('suv_normal'),
  suv_deluxe: getVehicleTypeName('suv_deluxe'),
  suv_luxury: getVehicleTypeName('suv_luxury'),
};

interface UseVehicleLabelsReturn {
  labels: Record<VehicleType, string>;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

// Cache the labels to avoid refetching on every component mount — same
// pattern as useSiteConfig.ts.
let cachedLabels: Record<VehicleType, string> | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useVehicleLabels(): UseVehicleLabelsReturn {
  const [labels, setLabels] = useState<Record<VehicleType, string>>(
    cachedLabels || DEFAULT_VEHICLE_LABELS
  );
  const [isLoading, setIsLoading] = useState(!cachedLabels);

  const fetchLabels = useCallback(async () => {
    const now = Date.now();
    if (cachedLabels && now - cacheTimestamp < CACHE_DURATION) {
      setLabels(cachedLabels);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Fetched via a route handler rather than importing getAdminSetting
      // directly — getAdminSetting is unstable_cache-wrapped, which throws
      // "incrementalCache missing" when invoked from a Client Component.
      const response = await fetch('/api/vehicle-labels');
      if (!response.ok) throw new Error('Failed to fetch vehicle labels');
      const { value } = await response.json();
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;

      // Merge over defaults so an admin overriding one category doesn't
      // blank out the others.
      const merged: Record<VehicleType, string> = {
        ...DEFAULT_VEHICLE_LABELS,
        ...(parsed || {}),
      };

      cachedLabels = merged;
      cacheTimestamp = now;
      setLabels(merged);
    } catch (error) {
      console.error('Error fetching vehicle category labels:', error);
      setLabels(DEFAULT_VEHICLE_LABELS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  return { labels, isLoading, refetch: fetchLabels };
}
