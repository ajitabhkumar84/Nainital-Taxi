/**
 * ENHANCED SUPABASE QUERIES
 *
 * Features:
 * - Multiple season periods support
 * - Booking blackout dates
 * - Priority-based season selection
 */

import { supabase } from './client';
import type { VehicleType, Package, Vehicle, Destination, Review, Booking } from './types';

// ============================================================================
// SEASON & PRICING HELPERS
// ============================================================================

/**
 * Get the active season for a specific date
 * Handles multiple season periods with priority
 */
export async function getSeasonForDate(date: string): Promise<{
  id: string;
  name: 'Off-Season' | 'Season';
  description: string | null;
}> {
  // Query seasons table directly instead of using RPC
  const { data: seasonData, error } = await supabase
    .from('seasons')
    .select('id, name, description')
    .eq('is_active', true)
    .lte('start_date', date)
    .gte('end_date', date)
    .order('name', { ascending: false }) // 'Season' comes before 'Off-Season' alphabetically (descending)
    .limit(1)
    .single();

  if (error || !seasonData) {
    // Default to Off-Season - try to find any Off-Season record
    const { data: offSeasonData } = await supabase
      .from('seasons')
      .select('id, name, description')
      .eq('is_active', true)
      .eq('name', 'Off-Season')
      .limit(1)
      .single();

    if (offSeasonData) {
      return offSeasonData as { id: string; name: 'Off-Season' | 'Season'; description: string | null };
    }

    // If no season found at all, return a placeholder (this shouldn't happen in production)
    return { id: '', name: 'Off-Season', description: 'Regular pricing' };
  }

  return seasonData as { id: string; name: 'Off-Season' | 'Season'; description: string | null };
}

/**
 * Check if online booking is allowed for a date
 * Returns false if date falls within an active blackout period
 */
export async function isBookingAllowed(date: string): Promise<{
  allowed: boolean;
  message?: string;
}> {
  try {
    // Query blackout table directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)('booking_blackout')
      .select('show_message')
      .eq('is_active', true)
      .lte('start_date', date)
      .gte('end_date', date)
      .limit(1)
      .single();

    if (error || !data) {
      // No blackout found or error - allow booking
      return { allowed: true };
    }

    return {
      allowed: false,
      message: data.show_message || 'Online booking unavailable. Please call or WhatsApp us.'
    };
  } catch {
    // Any error - allow booking
    return { allowed: true };
  }
}

/**
 * Get price for a package-vehicle-date combination
 * Automatically determines season based on date
 */
export async function getPrice(
  packageId: string,
  vehicleType: VehicleType,
  date: string
): Promise<{
  price: number;
  season_name: 'Off-Season' | 'Season';
  season_description: string | null;
  booking_allowed: boolean;
  blackout_message?: string;
}> {
  // Get season for date
  const season = await getSeasonForDate(date);

  // Check if booking is allowed
  const bookingStatus = await isBookingAllowed(date);

  // Get price from pricing table using season_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pricing, error } = await (supabase.from as any)('pricing')
    .select('price, notes')
    .eq('package_id', packageId)
    .eq('vehicle_type', vehicleType)
    .eq('season_id', season.id)
    .eq('is_active', true)
    .single() as { data: { price: number; notes: string | null } | null; error: unknown };

  if (error || !pricing) {
    console.error('Error fetching price:', error);
    throw new Error(`Price not found for package ${packageId}, vehicle ${vehicleType}, season ${season.name}`);
  }

  return {
    price: pricing.price,
    season_name: season.name,
    season_description: season.description,
    booking_allowed: bookingStatus.allowed,
    blackout_message: bookingStatus.message
  };
}

/**
 * Get all prices for a package on a specific date (all vehicle types)
 */
export async function getPackagePrices(
  packageId: string,
  date: string
): Promise<Array<{
  vehicle_type: VehicleType;
  price: number;
  season_name: string;
}>> {
  const season = await getSeasonForDate(date);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('pricing')
    .select('vehicle_type, price, season_id, seasons(name)')
    .eq('package_id', packageId)
    .eq('season_id', season.id)
    .eq('is_active', true) as {
      data: Array<{
        vehicle_type: VehicleType;
        price: number;
        season_id: string;
        seasons: { name: string } | null;
      }> | null;
      error: unknown
    };

  if (error) {
    console.error('Error fetching package prices:', error);
    return [];
  }

  if (!data) return [];

  // Transform the data to include season_name from the joined seasons table
  return data.map(item => ({
    vehicle_type: item.vehicle_type,
    price: item.price,
    season_name: item.seasons?.name || 'Off-Season'
  }));
}

/**
 * Get price range for a package (min and max across all vehicle types)
 */
export async function getPackagePriceRange(
  packageId: string,
  date: string
): Promise<{ min: number; max: number; season_name: string }> {
  const prices = await getPackagePrices(packageId, date);

  if (prices.length === 0) {
    return { min: 0, max: 0, season_name: 'Off-Season' };
  }

  const priceValues = prices.map(p => p.price);
  return {
    min: Math.min(...priceValues),
    max: Math.max(...priceValues),
    season_name: prices[0].season_name
  };
}

// ============================================================================
// PACKAGE QUERIES
// ============================================================================

export async function getPackages(type?: 'tour' | 'transfer'): Promise<Package[]> {
  let query = supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching packages:', error);
    return [];
  }

  return data || [];
}

export async function getPopularPackages(limit: number = 6): Promise<Package[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('is_active', true)
    .eq('is_popular', true)
    .order('display_order')
    .limit(limit);

  if (error) {
    console.error('Error fetching popular packages:', error);
    return [];
  }

  return data || [];
}

export async function getPackageBySlug(slug: string): Promise<Package | null> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching package:', error);
    return null;
  }

  return data;
}

// ============================================================================
// VEHICLE QUERIES
// ============================================================================

export async function getVehicles(vehicleType?: VehicleType): Promise<Vehicle[]> {
  let query = supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (vehicleType) {
    query = query.eq('vehicle_type', vehicleType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }

  return data || [];
}

export async function getFeaturedVehicles(limit: number = 3): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('display_order')
    .limit(limit);

  if (error) {
    console.error('Error fetching featured vehicles:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// DESTINATION QUERIES
// ============================================================================

export async function getDestinations(): Promise<Destination[]> {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching destinations:', error);
    return [];
  }

  return data || [];
}

export async function getPopularDestinations(limit: number = 4): Promise<Destination[]> {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('is_active', true)
    .eq('is_popular', true)
    .order('display_order')
    .limit(limit);

  if (error) {
    console.error('Error fetching popular destinations:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// AVAILABILITY QUERIES
// ============================================================================

export async function checkAvailability(date: string): Promise<{
  available: boolean;
  cars_available: number;
  status: 'available' | 'limited' | 'sold_out' | 'blocked';
  message?: string;
  booking_allowed: boolean;
  blackout_message?: string;
}> {
  // First check if booking is allowed (blackout dates)
  const bookingStatus = await isBookingAllowed(date);

  // Then check vehicle availability
  type AvailabilityData = {
    cars_available: number;
    status: 'available' | 'limited' | 'sold_out' | 'blocked';
    public_message: string | null;
    is_blocked: boolean;
  };

  const { data, error } = await supabase
    .from('availability')
    .select('cars_available, status, public_message, is_blocked')
    .eq('date', date)
    .single() as { data: AvailabilityData | null; error: unknown };

  if (error || !data) {
    // No availability record - create default response
    return {
      available: bookingStatus.allowed,
      cars_available: 10,
      status: 'available',
      booking_allowed: bookingStatus.allowed,
      blackout_message: bookingStatus.message
    };
  }

  return {
    available: data.cars_available > 0 && !data.is_blocked && bookingStatus.allowed,
    cars_available: data.cars_available,
    status: data.status,
    message: data.public_message || undefined,
    booking_allowed: bookingStatus.allowed,
    blackout_message: bookingStatus.message
  };
}

export async function getAvailabilityRange(
  startDate: string,
  endDate: string
): Promise<Array<{
  date: string;
  cars_available: number;
  status: string;
  booking_allowed: boolean;
}>> {
  type AvailabilityItem = { date: string; cars_available: number; status: string };

  const { data: availabilityData, error } = await supabase
    .from('availability')
    .select('date, cars_available, status')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date') as { data: AvailabilityItem[] | null; error: unknown };

  if (error) {
    console.error('Error fetching availability range:', error);
    return [];
  }

  // Check booking blackout for each date
  const results = await Promise.all(
    (availabilityData || []).map(async (item) => {
      const bookingStatus = await isBookingAllowed(item.date);
      return {
        ...item,
        booking_allowed: bookingStatus.allowed
      };
    })
  );

  return results;
}

// ============================================================================
// BOOKING CREATION
// ============================================================================

export async function createBooking(bookingData: {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_whatsapp?: string;
  package_id: string;
  package_name: string;
  vehicle_type: VehicleType;
  booking_date: string;
  pickup_time: string;
  pickup_location: string;
  dropoff_location?: string;
  passengers: number;
  final_price: number;
  season_name: string;
  special_requests?: string;
  requires_child_seat?: boolean;
}) {
  // First check if booking is allowed
  const bookingStatus = await isBookingAllowed(bookingData.booking_date);

  if (!bookingStatus.allowed) {
    throw new Error(bookingStatus.message || 'Online booking not allowed for this date');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('bookings')
    .insert({
      ...bookingData,
      status: 'pending',
      payment_status: 'pending',
      booking_source: 'website'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating booking:', error);
    throw error;
  }

  return data;
}

// ============================================================================
// REVIEW QUERIES
// ============================================================================

export async function getFeaturedReviews(limit: number = 6): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_approved', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// ADMIN HELPERS (for managing seasons and blackouts)
// ============================================================================

/**
 * Get all active season periods
 */
export async function getSeasonPeriods(): Promise<Array<{
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  priority: number;
}>> {
  const { data, error } = await supabase
    .from('seasons')
    .select('id, name, description, start_date, end_date, priority')
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error) {
    console.error('Error fetching season periods:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all active blackout periods
 */
export async function getBlackoutPeriods(): Promise<Array<{
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  show_message: string | null;
}>> {
  const { data, error } = await supabase
    .from('booking_blackout')
    .select('id, start_date, end_date, reason, show_message')
    .eq('is_active', true)
    .order('start_date');

  if (error) {
    console.error('Error fetching blackout periods:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// ADDITIONAL QUERY FUNCTIONS (Compatibility with old queries)
// ============================================================================

/**
 * Alias for getPrice - for backward compatibility
 */
export async function calculatePrice(
  packageId: string,
  vehicleType: VehicleType,
  date: string
) {
  return getPrice(packageId, vehicleType, date);
}

/**
 * Get availability for the next 30 days
 */
export async function getUpcomingAvailability() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return getAvailabilityRange(today, thirtyDaysLater);
}

/**
 * Get user's bookings
 */
export async function getUserBookings(userId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single booking by ID
 */
export async function getBooking(bookingId: string): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error) {
    console.error('Error fetching booking:', error);
    return null;
  }

  return data;
}

/**
 * Update booking status
 */
export async function updateBookingStatus(
  bookingId: string,
  status: string,
  _notes?: string
): Promise<Booking | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) {
    console.error('Error updating booking status:', error);
    return null;
  }

  return data as Booking;
}

/**
 * Get all approved reviews
 */
export async function getApprovedReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching approved reviews:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a single destination by slug
 */
export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  const { data, error } = await supabase
    .from('destinations')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching destination:', error);
    return null;
  }

  return data;
}

/**
 * Get all pricing for a package (both Season and Off-Season, all vehicle types)
 * Used for destination pages to display pricing tables
 */
export async function getAllPricingForPackage(packageId: string): Promise<Array<{
  vehicle_type: VehicleType;
  season_name: 'Season' | 'Off-Season';
  price: number;
}>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('pricing')
    .select('vehicle_type, price, season_id, seasons(name)')
    .eq('package_id', packageId)
    .eq('is_active', true)
    .order('vehicle_type') as {
      data: Array<{
        vehicle_type: VehicleType;
        price: number;
        season_id: string;
        seasons: { name: 'Season' | 'Off-Season' } | null;
      }> | null;
      error: unknown
    };

  if (error) {
    console.error('Error fetching all pricing:', error);
    return [];
  }

  if (!data) return [];

  // Transform the data to include season_name
  return data.map(item => ({
    vehicle_type: item.vehicle_type,
    season_name: item.seasons?.name || 'Off-Season',
    price: item.price
  }));
}

/**
 * Get season date ranges
 * Returns all active season periods
 */
export async function getSeasonDateRanges(): Promise<Array<{
  name: 'Season' | 'Off-Season';
  start_date: string;
  end_date: string;
  description: string | null;
}>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('seasons')
    .select('name, start_date, end_date, description')
    .eq('is_active', true)
    .order('priority', { ascending: false }) as {
      data: Array<{ name: 'Season' | 'Off-Season'; start_date: string; end_date: string; description: string | null }> | null;
      error: unknown
    };

  if (error) {
    console.error('Error fetching season ranges:', error);
    return [];
  }

  return data || [];
}

/**
 * Add customer to waitlist for sold-out date
 */
export async function addToWaitlist(waitlistData: {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_whatsapp?: string;
  desired_date: string;
  package_id: string;
  package_name: string;
  vehicle_type: VehicleType;
  passengers: number;
  estimated_price: number;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('waitlist')
    .insert({
      ...waitlistData,
      status: 'pending',
      priority: 100,
      is_vip: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding to waitlist:', error);
    throw error;
  }

  return data;
}

/**
 * Get pending waitlist entries for a date
 */
export async function getWaitlistForDate(date: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('waitlist')
    .select('*')
    .eq('desired_date', date)
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching waitlist:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a specific admin setting
 */
export async function getAdminSetting(key: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('admin_settings')
    .select('value')
    .eq('key', key)
    .single() as { data: { value: unknown } | null; error: unknown };

  if (error || !data) {
    console.error('Error fetching admin setting:', error);
    return null;
  }

  return data.value;
}

/**
 * Get all admin settings
 */
export async function getAllAdminSettings() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('admin_settings')
    .select('*');

  if (error) {
    console.error('Error fetching admin settings:', error);
    return [];
  }

  return data || [];
}
