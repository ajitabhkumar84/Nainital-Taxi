import { cache } from 'react';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_ONE_WAY_TAXI_SETTINGS,
  type OneWayTaxiSettings,
} from '@/lib/supabase/types';

export const ONE_WAY_TAXI_SETTINGS_ID = '00000000-0000-0000-0000-000000000005';

/**
 * Server-side read of the /rates page's editable hero + stats content
 * (singleton row, see
 * supabase/add_one_way_taxi_settings_and_route_destination_link.sql). Falls
 * back to DEFAULT_ONE_WAY_TAXI_SETTINGS — which mirrors the migration's seed
 * — so /rates renders identically if the migration hasn't been applied yet.
 *
 * Uses the cookie-free anon client so /rates stays statically renderable.
 */
export const getOneWayTaxiSettings = cache(async (): Promise<OneWayTaxiSettings> => {
  const fallback: OneWayTaxiSettings = {
    ...DEFAULT_ONE_WAY_TAXI_SETTINGS,
    id: ONE_WAY_TAXI_SETTINGS_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('one_way_taxi_settings') as any)
      .select('*')
      .eq('id', ONE_WAY_TAXI_SETTINGS_ID)
      .single();

    if (error || !data) return fallback;

    // Merge over the defaults so a column added after the row was last saved
    // (or a NULL) never renders as blank/undefined.
    return { ...fallback, ...(data as Partial<OneWayTaxiSettings>) };
  } catch (error) {
    console.error('Error fetching one-way taxi settings:', error);
    return fallback;
  }
});
