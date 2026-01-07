import { supabase } from '@/lib/supabase';
import { VehicleType } from '@/store/bookingStore';

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
 * Get the price for a specific package, vehicle type, and date
 * Automatically detects the season based on the date
 */
export async function getPackagePrice(
  packageId: string,
  vehicleType: VehicleType,
  date: string // ISO date string
): Promise<PriceResult | null> {
  try {
    // 1. Get the season for the given date by querying seasons table directly
    const { data: seasonData, error: seasonError } = await supabase
      .from('seasons')
      .select('id, name')
      .eq('is_active', true)
      .lte('start_date', date)
      .gte('end_date', date)
      .order('name', { ascending: false }) // 'Season' comes before 'Off-Season'
      .limit(1)
      .single();

    let season: SeasonResult;

    if (seasonError || !seasonData) {
      // Default to Off-Season if no season found for date
      const { data: offSeasonData } = await supabase
        .from('seasons')
        .select('id, name')
        .eq('is_active', true)
        .eq('name', 'Off-Season')
        .limit(1)
        .single();

      if (offSeasonData) {
        season = offSeasonData as SeasonResult;
      } else {
        // Fallback - use 'Off-Season' as default name
        season = { id: '', name: 'Off-Season' };
      }
    } else {
      season = seasonData as SeasonResult;
    }

    // 2. Get the price for the package, vehicle type, and season_name
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

interface AvailabilityRow {
  total_fleet_size: number;
  cars_booked: number;
}

/**
 * Get availability status for a specific date
 */
export async function getAvailabilityForDate(date: string): Promise<{
  status: 'available' | 'limited' | 'sold_out' | 'blocked';
  carsAvailable: number;
  totalFleetSize: number;
  carsBooked: number;
} | null> {
  try {
    // Check if booking is allowed for this date (not in blackout)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: blackoutCheck } = await (supabase.rpc as any)('is_booking_allowed', {
      check_date: date
    });

    if (blackoutCheck === false) {
      return {
        status: 'blocked',
        carsAvailable: 0,
        totalFleetSize: 0,
        carsBooked: 0
      };
    }

    // Get availability record for the date
    const { data: availabilityData, error: fetchError } = await supabase
      .from('availability')
      .select('total_fleet_size, cars_booked')
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
