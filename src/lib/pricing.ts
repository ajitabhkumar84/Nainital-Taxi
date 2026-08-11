import { supabase } from '@/lib/supabase';
import { VehicleType } from '@/store/bookingStore';
import { DEFAULT_BLOCKED_MESSAGE } from '@/lib/availabilityMessages';

export interface PriceResult {
  price: number;
  seasonId: string;
  seasonName: string;
  vehicleType: VehicleType;
  packageTitle: string;
}

interface SeasonResult {
  id: string;
  name: string;
}

interface PricingRow {
  price: number;
  packages: { title: string } | null;
}

/**
 * Resolve the pricing season for a given date, defaulting to Off-Season when
 * no season row covers it. Shared by every pricing lookup below so the
 * season-detection rule only lives in one place.
 */
async function resolveSeason(date: string): Promise<SeasonResult> {
  const { data: seasonData, error: seasonError } = await supabase
    .from('seasons')
    .select('id, name')
    .eq('is_active', true)
    .lte('start_date', date)
    .gte('end_date', date)
    .order('name', { ascending: false }) // 'Season' comes before 'Off-Season'
    .limit(1)
    .single();

  if (!seasonError && seasonData) {
    return seasonData as SeasonResult;
  }

  // Default to Off-Season if no season found for date
  const { data: offSeasonData } = await supabase
    .from('seasons')
    .select('id, name')
    .eq('is_active', true)
    .eq('name', 'Off-Season')
    .limit(1)
    .single();

  return offSeasonData ? (offSeasonData as SeasonResult) : { id: '', name: 'Off-Season' };
}

/**
 * Get the price for a specific package, vehicle type, and date
 * Automatically detects the season based on the date
 */
export async function getPackagePrice(
  packageId: string,
  vehicleType: VehicleType,
  date: string // ISO date string
): Promise<PriceResult | null> {
  try {
    const season = await resolveSeason(date);

    // Get the price for the package, vehicle type, and season_name
    const { data, error: pricingError } = await supabase
      .from('pricing')
      .select(`
        price,
        packages (
          title
        )
      `)
      .eq('package_id', packageId)
      .eq('vehicle_type', vehicleType)
      .eq('season_name', season.name)
      .eq('is_active', true)
      .single();

    if (pricingError) {
      console.error('Error fetching pricing:', pricingError);
      return null;
    }

    if (!data) {
      console.error('No pricing found for:', { packageId, vehicleType, seasonName: season.name });
      return null;
    }

    const pricing = data as unknown as PricingRow;

    return {
      price: pricing.price,
      seasonId: season.id,
      seasonName: season.name,
      vehicleType,
      packageTitle: pricing.packages?.title || 'Package'
    };
  } catch (error) {
    console.error('Error in getPackagePrice:', error);
    return null;
  }
}

interface RoutePricingRow {
  price: number;
}

/**
 * Get the price for a specific transfer route, vehicle type, and date.
 * Mirrors getPackagePrice() but resolves against route_pricing/routes
 * instead of pricing/packages — routes are a separate concept from
 * packages (see BookingWidget's pickup/drop picker), priced independently.
 */
export async function getRoutePrice(
  routeId: string,
  vehicleType: VehicleType,
  date: string // ISO date string
): Promise<PriceResult | null> {
  try {
    const season = await resolveSeason(date);

    const { data, error: pricingError } = await supabase
      .from('route_pricing')
      .select('price')
      .eq('route_id', routeId)
      .eq('vehicle_type', vehicleType)
      .eq('season_name', season.name)
      .eq('is_active', true)
      .single();

    if (pricingError || !data) {
      console.error('Error fetching route pricing:', pricingError);
      return null;
    }

    // `routes` isn't part of the generated Database type (see supabase/types.ts),
    // so the typed client infers `never` for this row — cast like the
    // `packages` join above.
    const { data: route } = await supabase
      .from('routes')
      .select('pickup_location, drop_location')
      .eq('id', routeId)
      .single();
    const routeRow = route as unknown as { pickup_location: string; drop_location: string } | null;

    const packageTitle = routeRow
      ? `Transfer: ${routeRow.pickup_location} to ${routeRow.drop_location}`
      : 'Transfer';

    return {
      price: (data as RoutePricingRow).price,
      seasonId: season.id,
      seasonName: season.name,
      vehicleType,
      packageTitle,
    };
  } catch (error) {
    console.error('Error in getRoutePrice:', error);
    return null;
  }
}

interface PricingRowWithVehicle {
  price: number;
  vehicle_type: VehicleType;
  packages: { title: string } | null;
}

/**
 * Get the price for every vehicle type on a package/date in one query —
 * used by the vehicle-selection step so each vehicle card can show its own
 * price up front instead of only revealing it after a vehicle is chosen.
 */
export async function getAllPackagePrices(
  packageId: string,
  date: string
): Promise<Partial<Record<VehicleType, PriceResult>>> {
  try {
    const season = await resolveSeason(date);

    const { data, error } = await supabase
      .from('pricing')
      .select(`
        price,
        vehicle_type,
        packages (
          title
        )
      `)
      .eq('package_id', packageId)
      .eq('season_name', season.name)
      .eq('is_active', true);

    if (error || !data) {
      console.error('Error fetching all package prices:', error);
      return {};
    }

    const result: Partial<Record<VehicleType, PriceResult>> = {};
    for (const row of data as unknown as PricingRowWithVehicle[]) {
      result[row.vehicle_type] = {
        price: row.price,
        seasonId: season.id,
        seasonName: season.name,
        vehicleType: row.vehicle_type,
        packageTitle: row.packages?.title || 'Package',
      };
    }
    return result;
  } catch (error) {
    console.error('Error in getAllPackagePrices:', error);
    return {};
  }
}

interface RoutePricingRowWithVehicle {
  price: number;
  vehicle_type: VehicleType;
}

/**
 * Mirrors getAllPackagePrices() for transfer routes.
 */
export async function getAllRoutePrices(
  routeId: string,
  date: string
): Promise<Partial<Record<VehicleType, PriceResult>>> {
  try {
    const season = await resolveSeason(date);

    const { data, error } = await supabase
      .from('route_pricing')
      .select('price, vehicle_type')
      .eq('route_id', routeId)
      .eq('season_name', season.name)
      .eq('is_active', true);

    if (error || !data) {
      console.error('Error fetching all route prices:', error);
      return {};
    }

    const result: Partial<Record<VehicleType, PriceResult>> = {};
    for (const row of data as unknown as RoutePricingRowWithVehicle[]) {
      result[row.vehicle_type] = {
        price: row.price,
        seasonId: season.id,
        seasonName: season.name,
        vehicleType: row.vehicle_type,
        packageTitle: 'Transfer',
      };
    }
    return result;
  } catch (error) {
    console.error('Error in getAllRoutePrices:', error);
    return {};
  }
}

interface AvailabilityRow {
  total_fleet_size: number;
  cars_booked: number;
  is_blocked: boolean;
  public_message: string | null;
}

/**
 * Get availability status for a specific date
 */
export async function getAvailabilityForDate(date: string): Promise<{
  status: 'available' | 'limited' | 'sold_out' | 'blocked';
  carsAvailable: number;
  totalFleetSize: number;
  carsBooked: number;
  message?: string;
} | null> {
  try {
    // Check if booking is allowed for this date via the *separate* date-range
    // booking_blackout mechanism — distinct admin concept from the
    // single-date availability.is_blocked flag checked below. Either blocks.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: blackoutCheck } = await (supabase.rpc as any)('is_booking_allowed', {
      check_date: date
    });

    if (blackoutCheck === false) {
      return {
        status: 'blocked',
        carsAvailable: 0,
        totalFleetSize: 0,
        carsBooked: 0,
        message: DEFAULT_BLOCKED_MESSAGE
      };
    }

    // Get availability record for the date
    const { data: availabilityData, error: fetchError } = await supabase
      .from('availability')
      .select('total_fleet_size, cars_booked, is_blocked, public_message')
      .eq('date', date)
      .single();

    // If no availability record exists, return default availability (7 cars, all available)
    if (fetchError && fetchError.code === 'PGRST116') {
      // No record exists - assume all 7 cars are available
      return {
        status: 'available' as const,
        carsAvailable: 7,
        totalFleetSize: 7,
        carsBooked: 0
      };
    } else if (fetchError) {
      console.error('Error fetching availability:', fetchError);
      return null;
    }

    if (!availabilityData) {
      return {
        status: 'available' as const,
        carsAvailable: 7,
        totalFleetSize: 7,
        carsBooked: 0
      };
    }

    const availability = availabilityData as AvailabilityRow;

    // Admin has explicitly blocked this single date via /admin/availability —
    // short-circuit regardless of remaining fleet capacity.
    if (availability.is_blocked) {
      return {
        status: 'blocked',
        carsAvailable: 0,
        totalFleetSize: availability.total_fleet_size,
        carsBooked: availability.cars_booked,
        message: availability.public_message || DEFAULT_BLOCKED_MESSAGE
      };
    }

    const carsAvailable = availability.total_fleet_size - availability.cars_booked;
    let status: 'available' | 'limited' | 'sold_out' | 'blocked';

    if (carsAvailable >= 5) {
      status = 'available';
    } else if (carsAvailable >= 1) {
      status = 'limited';
    } else {
      status = 'sold_out';
    }

    return {
      status,
      carsAvailable,
      totalFleetSize: availability.total_fleet_size,
      carsBooked: availability.cars_booked
    };
  } catch (error) {
    console.error('Error in getAvailabilityForDate:', error);
    return null;
  }
}

/**
 * Format price in Indian Rupees
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Get vehicle type display name
 */
export function getVehicleTypeName(vehicleType: VehicleType): string {
  const names: Record<VehicleType, string> = {
    sedan: 'Sedan (4 Seater)',
    suv_normal: 'SUV Normal (6-7 Seater)',
    suv_deluxe: 'SUV Deluxe (7 Seater)',
    suv_luxury: 'SUV Luxury (7 Seater)'
  };
  return names[vehicleType];
}

/**
 * Get vehicle capacity
 */
export function getVehicleCapacity(vehicleType: VehicleType): number {
  const capacities: Record<VehicleType, number> = {
    sedan: 4,
    suv_normal: 7,
    suv_deluxe: 7,
    suv_luxury: 7
  };
  return capacities[vehicleType];
}

/**
 * Example car models for a vehicle category, shown as a subtitle on the
 * vehicle-selection cards so customers know what they're actually getting.
 * Deliberately separate from the admin-configurable category label
 * (see useVehicleLabels) rather than folded into it.
 */
export function getVehicleModelExamples(vehicleType: VehicleType): string {
  const models: Record<VehicleType, string> = {
    sedan: 'Dzire, Etios',
    suv_normal: 'Ertiga, Marazzo',
    suv_deluxe: 'Innova',
    suv_luxury: 'Innova Crysta',
  };
  return models[vehicleType];
}
