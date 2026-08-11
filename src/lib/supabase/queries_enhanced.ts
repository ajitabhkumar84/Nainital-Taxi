/**
 * ENHANCED SUPABASE QUERIES
 *
 * Features:
 * - Multiple season periods support
 * - Booking blackout dates
 * - Priority-based season selection
 */

import { cache } from 'react';
import { supabase } from './client';
import type { VehicleType, Package, Vehicle, Destination, Review, Booking, TrustSection, TourTrustSection, PageContent } from './types';
import { DEFAULT_TRUST_SECTION, DEFAULT_TOUR_TRUST_SECTION, DEFAULT_PAGE_CONTENT } from './types';
import { DEFAULT_BLOCKED_MESSAGE } from '@/lib/availabilityMessages';

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
 * Check if online booking is allowed for a date.
 * Blocks on EITHER of two independent admin mechanisms:
 *  - the single-date `availability.is_blocked` flag, set via
 *    /admin/availability (POST /api/availability)
 *  - an active date-range row in the separate `booking_blackout` table
 */
export async function isBookingAllowed(date: string): Promise<{
  allowed: boolean;
  message?: string;
}> {
  try {
    // Check the single-date availability.is_blocked flag first.
    type AvailabilityBlockRow = { is_blocked: boolean; public_message: string | null };
    const { data: availabilityRow, error: availabilityError } = await supabase
      .from('availability')
      .select('is_blocked, public_message')
      .eq('date', date)
      .maybeSingle() as { data: AvailabilityBlockRow | null; error: unknown };

    if (!availabilityError && availabilityRow?.is_blocked) {
      return {
        allowed: false,
        message: availabilityRow.public_message || DEFAULT_BLOCKED_MESSAGE,
      };
    }

    // Query blackout table directly - handle if table doesn't exist
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)('booking_blackout')
      .select('show_message')
      .eq('is_active', true)
      .lte('start_date', date)
      .gte('end_date', date)
      .limit(1)
      .maybeSingle();

    // If table doesn't exist or any error, just allow booking
    if (error) {
      // Table might not exist or RLS issue - allow booking
      console.log('Blackout check skipped:', error.message);
      return { allowed: true };
    }

    if (!data) {
      // No blackout found - allow booking
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

  // Get price from pricing table using season_name
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pricing, error } = await (supabase.from as any)('pricing')
    .select('price, notes')
    .eq('package_id', packageId)
    .eq('vehicle_type', vehicleType)
    .eq('season_name', season.name)
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
    .select('vehicle_type, price, season_name')
    .eq('package_id', packageId)
    .eq('season_name', season.name)
    .eq('is_active', true) as {
      data: Array<{
        vehicle_type: VehicleType;
        price: number;
        season_name: string;
      }> | null;
      error: unknown
    };

  if (error) {
    console.error('Error fetching package prices:', error);
    return [];
  }

  if (!data) return [];

  return data.map(item => ({
    vehicle_type: item.vehicle_type,
    price: item.price,
    season_name: item.season_name
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

/**
 * Fetches specific packages by id, preserving the order of `ids`.
 *
 * Postgres does not honour the order of an IN list, so the result is re-sorted
 * client-side — `ids` is an admin-curated display order (e.g. the multi-day
 * rental page's featured_package_ids), not an arbitrary set. Ids that no
 * longer resolve to an active package are simply dropped.
 */
export async function getPackagesByIds(ids: string[]): Promise<Package[]> {
  if (!ids || ids.length === 0) return [];

  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .in('id', ids)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching packages by id:', error);
    return [];
  }

  const rows = (data || []) as Package[];
  const byId = new Map(rows.map((pkg) => [pkg.id, pkg]));
  return ids.map((id) => byId.get(id)).filter((pkg): pkg is Package => Boolean(pkg));
}

export async function getPackageById(id: string): Promise<Package | null> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching package:', error);
    return null;
  }

  return data;
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
// TRUST & SAFETY SECTION
// ============================================================================

export async function getTrustSection(): Promise<TrustSection> {
  const FIXED_ID = '00000000-0000-0000-0000-000000000002';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('trust_section') as any)
    .select('*')
    .eq('id', FIXED_ID)
    .single();

  if (error || !data) {
    return {
      ...DEFAULT_TRUST_SECTION,
      id: FIXED_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data;
}

// ============================================================================
// TOUR PAGE TRUST SECTION
// ============================================================================
// Separate singleton from trust_section above — see the comment on
// TourTrustSection in types.ts for why this isn't shared with the homepage.

export async function getTourTrustSection(): Promise<TourTrustSection> {
  const FIXED_ID = '00000000-0000-0000-0000-000000000003';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tour_trust_section') as any)
    .select('*')
    .eq('id', FIXED_ID)
    .single();

  if (error || !data) {
    return {
      ...DEFAULT_TOUR_TRUST_SECTION,
      id: FIXED_ID,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data;
}

// ============================================================================
// PAGE CONTENT (CMS)
// ============================================================================

// Wrapped in React.cache so that calling this once from generateMetadata and
// once from the page component in the same server render dedupes to a
// single Supabase round-trip (the Supabase client, unlike fetch, has no
// automatic request memoization). This cache is per-request only.
export const getPageContent = cache(async (slug: string): Promise<PageContent> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('page_content') as any)
    .select('*')
    .eq('page_slug', slug)
    .single();

  if (error || !data) {
    return {
      ...DEFAULT_PAGE_CONTENT,
      page_slug: slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data as PageContent;
});

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
/**
 * Wrapped in React cache() because destination pages call this twice per
 * request — once in generateMetadata and once in the page component. Next's
 * fetch-level dedupe doesn't apply to supabase-js calls, so without this it
 * is two identical round-trips.
 */
export const getDestinationBySlug = cache(async (slug: string): Promise<Destination | null> => {
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
});

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
    .select('vehicle_type, price, season_name')
    .eq('package_id', packageId)
    .eq('is_active', true)
    .order('vehicle_type') as {
      data: Array<{
        vehicle_type: VehicleType;
        price: number;
        season_name: 'Season' | 'Off-Season';
      }> | null;
      error: unknown
    };

  if (error) {
    console.error('Error fetching all pricing:', error);
    return [];
  }

  if (!data) return [];

  return data.map(item => ({
    vehicle_type: item.vehicle_type,
    season_name: item.season_name,
    price: item.price
  }));
}

/**
 * Lowest active price for every package, keyed by package id.
 *
 * Deliberately one query for all packages rather than a per-package call —
 * the homepage renders several cards at once and an N+1 here would be a
 * round trip per card. Callers use this for "From ₹X" display only; the
 * authoritative, season- and blackout-aware figure still comes from
 * getPrice() at booking time.
 */
export async function getMinPricePerPackage(): Promise<Record<string, number>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('pricing')
    .select('package_id, price')
    .eq('is_active', true) as {
      data: Array<{ package_id: string; price: number }> | null;
      error: unknown;
    };

  if (error) {
    console.error('Error fetching minimum package prices:', error);
    return {};
  }

  const minima: Record<string, number> = {};
  for (const row of data || []) {
    if (row.price == null) continue;
    const current = minima[row.package_id];
    if (current === undefined || row.price < current) {
      minima[row.package_id] = row.price;
    }
  }
  return minima;
}

export interface TransferRoute {
  id: string;
  slug: string;
  pickup_location: string;
  drop_location: string;
  distance: number | null;
  duration: string | null;
  sedanPrice: number | null;
  suvPrice: number | null;
}

/**
 * Active point-to-point transfer routes for the homepage fare table, with
 * the lowest active sedan/SUV price per route. Two separate queries (routes,
 * then route_pricing for those route ids) rather than a join — the schema
 * has diverged between `routes.category_id` (referenced by
 * /api/routes-with-categories) and the actual table, so this goes straight
 * at `routes` + `route_pricing`, the same tables BookingWidget's working
 * /api/routes endpoint uses.
 */
export async function getTransferRoutes(): Promise<TransferRoute[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: routes, error: routesError } = await (supabase.from as any)('routes')
    .select('id, slug, pickup_location, drop_location, distance, duration')
    .eq('is_active', true)
    .order('display_order', { ascending: true }) as {
      data: Array<{
        id: string;
        slug: string;
        pickup_location: string;
        drop_location: string;
        distance: number | null;
        duration: string | null;
      }> | null;
      error: unknown;
    };

  if (routesError || !routes || routes.length === 0) {
    if (routesError) console.error('Error fetching transfer routes:', routesError);
    return [];
  }

  const routeIds = routes.map((r) => r.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pricing, error: pricingError } = await (supabase.from as any)('route_pricing')
    .select('route_id, vehicle_type, price')
    .in('route_id', routeIds)
    .eq('is_active', true)
    .in('vehicle_type', ['sedan', 'suv_normal']) as {
      data: Array<{ route_id: string; vehicle_type: string; price: number }> | null;
      error: unknown;
    };

  if (pricingError) {
    console.error('Error fetching transfer route pricing:', pricingError);
  }

  return routes.map((route) => {
    const routePricing = (pricing || []).filter((p) => p.route_id === route.id);
    const minFor = (vehicleType: string) => {
      const prices = routePricing.filter((p) => p.vehicle_type === vehicleType).map((p) => p.price);
      return prices.length > 0 ? Math.min(...prices) : null;
    };
    return {
      id: route.id,
      slug: route.slug,
      pickup_location: route.pickup_location,
      drop_location: route.drop_location,
      distance: route.distance,
      duration: route.duration,
      sedanPrice: minFor('sedan'),
      suvPrice: minFor('suv_normal'),
    };
  });
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

// ============================================================================
// TEMPLE QUERIES
// ============================================================================

/**
 * Get all active temples
 */
export async function getTemples() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('temples')
    .select('*')
    .eq('is_active', true)
    .order('display_order')
    .order('popularity', { ascending: false });

  if (error) {
    console.error('Error fetching temples:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all temple categories with their temples
 */
export async function getTempleCategoriesWithTemples() {
  // First get all active categories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: categories, error: categoriesError } = await (supabase.from as any)('temple_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (categoriesError) {
    console.error('Error fetching temple categories:', categoriesError);
    return [];
  }

  if (!categories || categories.length === 0) {
    return [];
  }

  // Get all temples for each category
  const categoriesWithTemples = await Promise.all(
    categories.map(async (category: { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: temples } = await (supabase.from as any)('temples')
        .select('*')
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('display_order')
        .order('popularity', { ascending: false });

      return {
        ...category,
        temples: temples || []
      };
    })
  );

  // Filter out categories with no temples
  return categoriesWithTemples.filter(cat => cat.temples.length > 0);
}

/**
 * Get a single temple by slug
 */
export async function getTempleBySlug(slug: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: temple, error } = await (supabase.from as any)('temples')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching temple:', error);
    return null;
  }

  return temple;
}

/**
 * Get temple pricing (taxi services from Nainital)
 */
export async function getTemplePricing(templeId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('temple_pricing')
    .select('*')
    .eq('temple_id', templeId)
    .order('vehicle_type')
    .order('season_name');

  if (error) {
    console.error('Error fetching temple pricing:', error);
    return [];
  }

  return data || [];
}

/**
 * Get temple FAQs
 */
export async function getTempleFaqs(templeId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('temple_faqs')
    .select('*')
    .eq('temple_id', templeId)
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching temple FAQs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get featured temples
 */
export async function getFeaturedTemples(limit: number = 6) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('temples')
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('popularity', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured temples:', error);
    return [];
  }

  return data || [];
}

/**
 * Get temples page configuration
 */
export async function getTemplesPageConfig() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)('temples_page_config')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching temples page config:', error);
    return null;
  }

  return data;
}
