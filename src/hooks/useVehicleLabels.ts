'use client';

import { useState, useEffect, useCallback } from 'react';
import { VehicleType } from '@/store/bookingStore';
import { getVehicleTypeName } from '@/lib/pricing';
import { getAdminSetting } from '@/lib/supabase';

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
      const value = await getAdminSetting('vehicle_category_labels');
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
