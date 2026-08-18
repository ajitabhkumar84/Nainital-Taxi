/**
 * ENHANCED SUPABASE QUERIES
 *
 * Features:
 * - Multiple season periods support
 * - Booking blackout dates
 * - Priority-based season selection
 *
 * ---------------------------------------------------------------------------
 * CACHING POLICY — read this before adding a query to this file
 * ---------------------------------------------------------------------------
 * Every route in this app renders dynamically (src/app/layout.tsx reads
 * headers() for the CSP nonce), so there is no Full Route Cache to fall back
 * on. Without a data cache, every page view re-runs every query below against
 * Supabase — roughly a dozen round-trips for one homepage load. See
 * src/lib/cacheTags.ts for the full reasoning.
 *
 * There are therefore two classes of query in this file, and which one you are
 * writing determines whether it gets cached:
 *
 *   CONTENT reads — destinations, packages, vehicles, reviews, CMS rows.
 *   Changes only when an admin saves. WRAP in unstable_cache with a tag from
 *   CACHE_TAGS, and make sure the corresponding admin write route calls
 *   revalidateContent() with that tag.
 *
 *   BOOKING-PATH reads — availability, blackout dates, live pricing for a
 *   specific date. Correctness beats cache hits: quoting a stale price or
 *   taking a booking on a blocked date costs real money and real trust.
 *   These stay UNCACHED. They are also low-volume, since they only run
 *   when someone is actively in the booking flow.
 *
 * SINGLETON PAGE-COPY EXCEPTION
 * -----------------------------
 * getPageContent, getTrustSection and getTourTrustSection are content reads but
 * are deliberately NOT in unstable_cache. Each is a single fixed row that an
 * admin edits and then immediately reloads the page to verify, so a staleness
 * window between saving and seeing reads as a broken save rather than a cache.
 * That is not hypothetical: on 2026-08-17 a homepage hero image edit stayed
 * stale on the live Vercel deployment for over 90 minutes even though the admin
 * route called revalidateContent() on save, and the HTML itself was not
 * edge-cached. Until that is root-caused, these three are read live.
 *
 * The cost is 3 queries per homepage view instead of 0 — against roughly 12
 * before any of this work — and it buys back instant admin feedback on the rows
 * that get edited most. The equivalent singletons in src/lib/multiDayRental.ts
 * and src/lib/contactPage.ts were already React cache() only, so this keeps all
 * the page-copy reads consistent with each other.
 *
 * Bulk list reads (destinations, packages, pricing, routes, reviews, vehicles,
 * temples) stay cached: they are the bulk of the query count, and they are
 * edited through list UIs where the 60s TTL ceiling is acceptable.
 *
 * Cached functions MUST use the `supabase` singleton imported below (plain
 * @supabase/supabase-js, no cookies). unstable_cache throws at runtime if the
 * wrapped function touches cookies() or headers(), which rules out the
 * @supabase/ssr client in ./server.ts.
 */

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { supabase } from './client';
import type { VehicleType, Package, Vehicle, Destination, Review, Booking, TrustSection, TourTrustSection, PageContent, RouteCategory, RouteWithCategory, Route, RoutePricing, PickupLocationRow } from './types';
import { DEFAULT_TRUST_SECTION, DEFAULT_TOUR_TRUST_SECTION, DEFAULT_PAGE_CONTENT } from './types';
import { DEFAULT_BLOCKED_MESSAGE } from '@/lib/availabilityMessages';
import { CACHE_TAGS, CONTENT_CACHE_TTL } from '@/lib/cacheTags';

// ============================================================================
// SEASON & PRICING HELPERS
//
// Everything in this section is BOOKING-PATH and deliberately uncached — see
// the caching policy at the top of this file. getSeasonForDate/getPrice feed
// the quote a customer is about to pay, and isBookingAllowed is the last gate
// before a blocked date is accepted. A stale entry here is a wrong price or an
// unfulfillable booking, so these always go to the database.
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

// Cached content read. `type` is part of the cache key, so 'tour' and
// 'transfer' get independent entries rather than clobbering each other.
export const getPackages = unstable_cache(
  async (type?: 'tour' | 'transfer'): Promise<Package[]> => {
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
  },
  ['packages'],
  { tags: [CACHE_TAGS.packages], revalidate: CONTENT_CACHE_TTL }
);

export const getPopularPackages = unstable_cache(
  async (limit: number = 6): Promise<Package[]> => {
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
  },
  ['popular-packages'],
  { tags: [CACHE_TAGS.packages], revalidate: CONTENT_CACHE_TTL }
);

/**
 * Fetches specific packages by id, preserving the order of `ids`.
 *
 * Postgres does not honour the order of an IN list, so the result is re-sorted
 * client-side — `ids` is an admin-curated display order (e.g. the multi-day
 * rental page's featured_package_ids), not an arbitrary set. Ids that no
 * longer resolve to an active package are simply dropped.
 */
export const getPackagesByIds = unstable_cache(
  async (ids: string[]): Promise<Package[]> => {
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
  },
  ['packages-by-ids'],
  { tags: [CACHE_TAGS.packages], revalidate: CONTENT_CACHE_TTL }
);

export const getPackageById = unstable_cache(
  async (id: string): Promise<Package | null> => {
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
  },
  ['package-by-id'],
  { tags: [CACHE_TAGS.packages], revalidate: CONTENT_CACHE_TTL }
);

export const getPackageBySlug = unstable_cache(
  async (slug: string): Promise<Package | null> => {
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
  },
  ['package-by-slug'],
  { tags: [CACHE_TAGS.packages], revalidate: CONTENT_CACHE_TTL }
);

// ============================================================================
// VEHICLE QUERIES
// ============================================================================

export const getVehicles = unstable_cache(
  async (vehicleType?: VehicleType): Promise<Vehicle[]> => {
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
  },
  ['vehicles'],
  { tags: [CACHE_TAGS.vehicles], revalidate: CONTENT_CACHE_TTL }
);

export const getFeaturedVehicles = unstable_cache(
  async (limit: number = 3): Promise<Vehicle[]> => {
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
  },
  ['featured-vehicles'],
  { tags: [CACHE_TAGS.vehicles], revalidate: CONTENT_CACHE_TTL }
);

// ============================================================================
// DESTINATION QUERIES
// ============================================================================

export const getDestinations = unstable_cache(
  async (): Promise<Destination[]> => {
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
  },
  ['destinations'],
  { tags: [CACHE_TAGS.destinations], revalidate: CONTENT_CACHE_TTL }
);

export const getPopularDestinations = unstable_cache(
  async (limit: number = 4): Promise<Destination[]> => {
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
  },
  ['popular-destinations'],
  { tags: [CACHE_TAGS.destinations], revalidate: CONTENT_CACHE_TTL }
);

// ============================================================================
// AVAILABILITY QUERIES
// ============================================================================

/**
 * Availability for a date range, with each date's booking_allowed resolved.
 *
 * Two queries total, regardless of range length. This previously called
 * isBookingAllowed() inside a .map() over the result rows — an N+1 that cost
 * two round-trips *per date*, so getUpcomingAvailability()'s 30-day window
 * alone fired ~60 queries in a single request. Both underlying tables are
 * range-queryable, so the whole window is fetched up front and each date is
 * resolved in memory instead.
 *
 * Uncached by design (booking path) — but now cheap enough that it doesn't
 * need to be. The per-date isBookingAllowed() is still the right call for the
 * single-date checks in the booking flow; it is only fanning it out over a
 * range that was wrong.
 */
export async function getAvailabilityRange(
  startDate: string,
  endDate: string
): Promise<Array<{
  date: string;
  cars_available: number;
  status: string;
  booking_allowed: boolean;
}>> {
  type AvailabilityItem = {
    date: string;
    cars_available: number;
    status: string;
    is_blocked: boolean | null;
  };

  // `is_blocked` is selected here so the per-date availability gate resolves
  // from this same row rather than a follow-up query per date.
  const { data: availabilityData, error } = await supabase
    .from('availability')
    .select('date, cars_available, status, is_blocked')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date') as { data: AvailabilityItem[] | null; error: unknown };

  if (error) {
    console.error('Error fetching availability range:', error);
    return [];
  }

  const rows = availabilityData || [];
  if (rows.length === 0) return [];

  // Every blackout period that overlaps the window, in one query. An overlap
  // is "starts on or before the window ends AND ends on or after it starts" —
  // not the same as either endpoint falling inside the window, which would
  // miss a blackout that spans the entire range.
  type BlackoutRow = { start_date: string; end_date: string };
  let blackouts: BlackoutRow[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: blackoutData, error: blackoutError } = await (supabase.from as any)(
      'booking_blackout'
    )
      .select('start_date, end_date')
      .eq('is_active', true)
      .lte('start_date', endDate)
      .gte('end_date', startDate) as { data: BlackoutRow[] | null; error: unknown };

    // Matches isBookingAllowed(): a missing table or RLS error means "allow",
    // never "block everything".
    if (!blackoutError) blackouts = blackoutData || [];
  } catch {
    blackouts = [];
  }

  const isBlackedOut = (date: string) =>
    blackouts.some((b) => b.start_date <= date && b.end_date >= date);

  return rows.map((item) => ({
    date: item.date,
    cars_available: item.cars_available,
    status: item.status,
    booking_allowed: !item.is_blocked && !isBlackedOut(item.date),
  }));
}

// ============================================================================
// REVIEW QUERIES
// ============================================================================

export const getFeaturedReviews = unstable_cache(
  async (limit: number = 6): Promise<Review[]> => {
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
  },
  ['featured-reviews'],
  { tags: [CACHE_TAGS.reviews], revalidate: CONTENT_CACHE_TTL }
);

// ============================================================================
// TRUST & SAFETY SECTION
// ============================================================================

/**
 * Deliberately NOT in unstable_cache — see the SINGLETON PAGE-COPY exception in
 * the caching policy at the top of this file. React cache() only, so it is one
 * query per render and always reflects the last admin save.
 */
export const getTrustSection = cache(async (): Promise<TrustSection> => {
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
});

// ============================================================================
// TOUR PAGE TRUST SECTION
// ============================================================================
// Separate singleton from trust_section above — see the comment on
// TourTrustSection in types.ts for why this isn't shared with the homepage.

// Same singleton page-copy exception as getTrustSection above.
export const getTourTrustSection = cache(async (): Promise<TourTrustSection> => {
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
});

// ============================================================================
// PAGE CONTENT (CMS)
// ============================================================================

/**
 * Deliberately NOT in unstable_cache — this is the read that motivated the
 * SINGLETON PAGE-COPY exception described in the caching policy at the top of
 * this file.
 *
 * It holds the homepage hero image, title, subtitle and section copy: the
 * single most frequently edited row in the product, and the one an admin saves
 * and then immediately reloads the homepage to check. Caching it across
 * requests put a staleness window between "I saved it" and "I can see it",
 * which on 2026-08-17 manifested as a hero image that stayed wrong on the live
 * site for over 90 minutes.
 *
 * React cache() is kept so the calls from generateMetadata and the page
 * component collapse into one query per render (the Supabase client, unlike
 * fetch, has no automatic request memoization). That makes this one query per
 * homepage view — a cost worth paying for edits that appear instantly.
 */
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
export const getApprovedReviews = unstable_cache(
  async (): Promise<Review[]> => {
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
  },
  ['approved-reviews'],
  { tags: [CACHE_TAGS.reviews], revalidate: CONTENT_CACHE_TTL }
);

/**
 * Get a single destination by slug
 */
/**
 * Same two-layer treatment as getPageContent — see the comment there.
 *
 * unstable_cache keyed by slug caches across visitors (busted by the
 * 'destinations' tag on admin save); the React cache() wrapper collapses the
 * generateMetadata + page-component pair into one lookup per render, since
 * Next's fetch-level dedupe doesn't apply to supabase-js calls.
 */
export const getDestinationBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<Destination | null> => {
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
    },
    ['destination-by-slug'],
    { tags: [CACHE_TAGS.destinations], revalidate: CONTENT_CACHE_TTL }
  )
);

/**
 * Backs the /routes/[slug] SEO landing pages (WordPress migration:
 * /haridwar/, /delhi-taxi/, etc. -> /routes/haridwar, /routes/delhi, ...).
 *
 * Deliberately gated on `show_as_route_page` in addition to `is_active`: a
 * route can be real and bookable (is_active) without being meant to have its
 * own public page — auto-generated reverse routes and ordinary pricing-table
 * rows must not silently become indexable just because they exist. Both flags
 * true is required for the page to render; see revalidateRoutePages() for the
 * companion revalidatePath("/routes/[slug]", "page") call.
 *
 * Same cache() + unstable_cache() pairing as getDestinationBySlug — the outer
 * cache() collapses generateMetadata + the page component into one lookup per
 * render, the inner unstable_cache() caches across requests, tagged so
 * revalidateRoutePages() (already called from every admin routes write) busts
 * it with no new plumbing.
 */
export const getRouteBySlug = cache(
  unstable_cache(
    async (slug: string): Promise<(Route & { pricing: RoutePricing[] }) | null> => {
      const { data: route, error } = await supabase
        .from('routes')
        .select('*, pricing:route_pricing(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .eq('show_as_route_page', true)
        .single();

      if (error || !route) {
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching route by slug:', error);
        }
        return null;
      }

      const typedRoute = route as Route & { pricing: RoutePricing[] };
      return {
        ...typedRoute,
        pricing: (typedRoute.pricing || []).filter((p) => p.is_active),
      };
    },
    ['route-by-slug'],
    { tags: [CACHE_TAGS.routes, CACHE_TAGS.pricing], revalidate: CONTENT_CACHE_TTL }
  )
);

/**
 * Get all pricing for a package (both Season and Off-Season, all vehicle types)
 * Used for destination pages to display pricing tables
 */
// Cached: this is the *display* pricing table on destination/tour pages, which
// changes only when an admin edits pricing. It is not the booking-time quote —
// that comes from getPrice(), which stays uncached.
export const getAllPricingForPackage = unstable_cache(
  async (packageId: string): Promise<Array<{
    vehicle_type: VehicleType;
    season_name: 'Season' | 'Off-Season';
    price: number;
  }>> => {
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
  },
  ['all-pricing-for-package'],
  { tags: [CACHE_TAGS.pricing], revalidate: CONTENT_CACHE_TTL }
);

/**
 * Lowest active price for every package, keyed by package id.
 *
 * Deliberately one query for all packages rather than a per-package call —
 * the homepage renders several cards at once and an N+1 here would be a
 * round trip per card. Callers use this for "From ₹X" display only; the
 * authoritative, season- and blackout-aware figure still comes from
 * getPrice() at booking time.
 */
export const getMinPricePerPackage = unstable_cache(
  async (): Promise<Record<string, number>> => {
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
  },
  ['min-price-per-package'],
  { tags: [CACHE_TAGS.pricing], revalidate: CONTENT_CACHE_TTL }
);

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
export const getTransferRoutes = unstable_cache(
  async (): Promise<TransferRoute[]> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: routes, error: routesError } = await (supabase.from as any)('routes')
    .select('id, slug, pickup_location, drop_location, distance, duration')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true }) as {
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
  },
  ['transfer-routes'],
  // Tagged with both: the shape depends on `routes` rows and on
  // `route_pricing`, so an edit to either must bust this entry.
  { tags: [CACHE_TAGS.routes, CACHE_TAGS.pricing], revalidate: CONTENT_CACHE_TTL }
);

export interface CategoryWithRoutes extends RouteCategory {
  routes: (RouteWithCategory & { pricing?: RoutePricing[] })[];
}

/**
 * All active routes grouped by their route_category, with pricing attached —
 * backs /rates. Same shape /api/routes-with-categories has always returned
 * ({ categories, allRoutes }), now computed here so /rates can call it
 * directly as a server component instead of round-tripping through its own
 * API route. The route handler now delegates to this function too, so
 * /quote (its other caller) sees no change.
 *
 * Ties on display_order are broken by created_at so the grouping is stable
 * across renders. Any failure (e.g. route_categories not yet migrated —
 * see the schema-drift note on getTransferRoutes above) degrades to an
 * empty result rather than throwing, so /rates renders its empty state
 * instead of a 500.
 */
export const getRoutesWithCategories = cache(
  unstable_cache(
    async (): Promise<{
  categories: CategoryWithRoutes[];
  allRoutes: (RouteWithCategory & { pricing?: RoutePricing[] })[];
}> => {
  const empty = { categories: [], allRoutes: [] };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: categories, error: categoriesError } = await (supabase.from as any)('route_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true }) as { data: RouteCategory[] | null; error: unknown };

    if (categoriesError || !categories) {
      if (categoriesError) console.error('Error fetching route categories:', categoriesError);
      return empty;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: routes, error: routesError } = await (supabase.from as any)('routes')
      .select('*, category:route_categories(*)')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true }) as { data: RouteWithCategory[] | null; error: unknown };

    if (routesError || !routes) {
      if (routesError) console.error('Error fetching routes:', routesError);
      return empty;
    }

    const routeIds = routes.map((r) => r.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pricing, error: pricingError } = await (supabase.from as any)('route_pricing')
      .select('*')
      .in('route_id', routeIds)
      .eq('is_active', true) as { data: RoutePricing[] | null; error: unknown };

    if (pricingError) console.error('Error fetching route pricing:', pricingError);

    const routesWithPricing = routes.map((route) => ({
      ...route,
      pricing: (pricing || []).filter((p) => p.route_id === route.id),
    }));

    const categorizedRoutes: CategoryWithRoutes[] = categories.map((category) => ({
      ...category,
      routes: routesWithPricing.filter((r) => r.category_id === category.id),
    }));

    const uncategorizedRoutes = routesWithPricing.filter((r) => !r.category_id);
    if (uncategorizedRoutes.length > 0) {
      categorizedRoutes.push({
        id: 'uncategorized',
        category_name: 'Other Routes',
        category_slug: 'other-routes',
        category_description: null,
        icon: 'road',
        display_order: 999,
        is_active: true,
        created_at: '',
        updated_at: '',
        routes: uncategorizedRoutes,
      });
    }

    return {
      categories: categorizedRoutes.filter((c) => c.routes.length > 0),
      allRoutes: routesWithPricing,
    };
  } catch (error) {
    console.error('Error fetching routes with categories:', error);
    return empty;
  }
    },
    ['routes-with-categories'],
    // Three tables feed this (routes, route_categories, route_pricing), so all
    // three tags must bust it — a category rename goes stale here just as
    // surely as a fare change does.
    {
      tags: [CACHE_TAGS.routes, CACHE_TAGS.routeCategories, CACHE_TAGS.pricing],
      revalidate: CONTENT_CACHE_TTL,
    }
  )
);

/**
 * All active, destination-page-visible routes linked to a given destination
 * via `destination_slug`, with their active pricing embedded — backs the
 * "Taxi Fares to [Destination]" table on /destinations/[slug]. Deliberately
 * a single embedded-relation query (route_pricing as a nested `pricing`
 * resource) rather than the two-round-trip pattern getRoutesWithCategories
 * uses above, since here we already know the (small) route set up front.
 *
 * route_pricing(*) embeds ALL pricing rows for the route regardless of
 * is_active — PostgREST only filters embedded rows when the join is hinted
 * `!inner`, which would instead drop the whole *route* if none of its
 * pricing rows are active. That's too blunt here: a route with no active
 * pricing yet should still be excludable by the caller (DestinationPricingTable
 * drops it before rendering), not silently vanish from this function's
 * result. So pricing is filtered to is_active in memory instead.
 */
export const getRoutesForDestinationSlug = unstable_cache(
  async (
    destinationSlug: string
  ): Promise<(Route & { pricing: RoutePricing[] })[]> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: routes, error } = await (supabase.from as any)('routes')
        .select('*, pricing:route_pricing(*)')
        .eq('destination_slug', destinationSlug)
        .eq('is_active', true)
        .eq('show_on_destination_page', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true }) as {
          data: (Route & { pricing: RoutePricing[] })[] | null;
          error: unknown;
        };

      if (error || !routes) {
        if (error) console.error('Error fetching routes for destination:', error);
        return [];
      }

      return routes.map((route) => ({
        ...route,
        pricing: (route.pricing || []).filter((p) => p.is_active),
      }));
    } catch (error) {
      console.error('Error fetching routes for destination:', error);
      return [];
    }
  },
  ['routes-for-destination-slug'],
  { tags: [CACHE_TAGS.routes, CACHE_TAGS.pricing], revalidate: CONTENT_CACHE_TTL }
);

/**
 * Get season date ranges
 * Returns all active season periods
 */
// Cached: this is the "Season runs Apr–Jun" copy shown alongside pricing
// tables, not the booking-time season lookup. getSeasonForDate() resolves the
// season that a specific booking is actually priced against and stays uncached.
export const getSeasonDateRanges = unstable_cache(
  async (): Promise<Array<{
    name: 'Season' | 'Off-Season';
    start_date: string;
    end_date: string;
    description: string | null;
  }>> => {
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
  },
  ['season-date-ranges'],
  { tags: [CACHE_TAGS.seasons], revalidate: CONTENT_CACHE_TTL }
);

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
export const getAdminSetting = unstable_cache(
  async (key: string) => {
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
  },
  ['admin-setting'],
  { tags: [CACHE_TAGS.adminSettings], revalidate: CONTENT_CACHE_TTL }
);

/**
 * Get all admin settings
 */
export const getAllAdminSettings = unstable_cache(
  async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)('admin_settings')
      .select('*');

    if (error) {
      console.error('Error fetching admin settings:', error);
      return [];
    }

    return data || [];
  },
  ['all-admin-settings'],
  { tags: [CACHE_TAGS.adminSettings], revalidate: CONTENT_CACHE_TTL }
);

/**
 * Admin-configured vehicle category photos, keyed by category name.
 *
 * Lived as a byte-identical private copy in both /tour/[name]/page.tsx and
 * /destinations/[slug]/page.tsx, each with its own throwaway Supabase client.
 * Shared here so both pages hit one cache entry instead of two uncached
 * queries, and so a change to the storage format only has one place to be made.
 *
 * The value column is jsonb but has historically been written as a JSON
 * *string* by some admin paths, so both shapes are accepted.
 */
export const getVehicleCategoryImages = unstable_cache(
  async (): Promise<Record<string, string> | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from as any)('admin_settings')
      .select('value')
      .eq('key', 'vehicle_category_images')
      .single();

    if (error || !data?.value) return null;
    try {
      return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    } catch {
      return null;
    }
  },
  ['vehicle-category-images'],
  { tags: [CACHE_TAGS.adminSettings], revalidate: CONTENT_CACHE_TTL }
);

// ============================================================================
// TEMPLE QUERIES
// ============================================================================

/**
 * Get all active temples
 */
export const getTemples = unstable_cache(
  async () => {
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
  },
  ['temples'],
  { tags: [CACHE_TAGS.temples], revalidate: CONTENT_CACHE_TTL }
);

/**
 * All active temple categories with their temples nested.
 *
 * Two queries regardless of category count. This previously issued one temples
 * query *per category* inside a Promise.all over the category list — six
 * categories meant seven round-trips to build one page. Both tables are small
 * and fully filterable, so everything is fetched up front and grouped in
 * memory.
 */
export const getTempleCategoriesWithTemples = unstable_cache(
  async () => {
    // Rows stay loosely typed here, matching the rest of the temple queries in
    // this file — the generated Database type doesn't model these tables.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const { data: categories, error: categoriesError } = await (supabase.from as any)('temple_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order') as { data: any[] | null; error: unknown };

    if (categoriesError) {
      console.error('Error fetching temple categories:', categoriesError);
      return [];
    }

    if (!categories || categories.length === 0) {
      return [];
    }

    // Every temple in any of these categories, in one query.
    const { data: temples, error: templesError } = await (supabase.from as any)('temples')
      .select('*')
      .in('category_id', categories.map((c: any) => c.id))
      .eq('is_active', true)
      .order('display_order')
      .order('popularity', { ascending: false }) as { data: any[] | null; error: unknown };

    if (templesError) {
      console.error('Error fetching temples for categories:', templesError);
      return [];
    }

    // The .order() above already sorted the whole set and grouping preserves
    // insertion order, so each category's slice keeps display_order then
    // popularity order — same ordering the per-category queries produced.
    const byCategory = new Map<string, any[]>();
    for (const temple of temples || []) {
      const bucket = byCategory.get(temple.category_id);
      if (bucket) bucket.push(temple);
      else byCategory.set(temple.category_id, [temple]);
    }

    return categories
      .map((category: any) => ({
        ...category,
        temples: byCategory.get(category.id) || [],
      }))
      .filter((cat: any) => cat.temples.length > 0);
    /* eslint-enable @typescript-eslint/no-explicit-any */
  },
  ['temple-categories-with-temples'],
  { tags: [CACHE_TAGS.temples], revalidate: CONTENT_CACHE_TTL }
);

/**
 * Get a single temple by slug
 */
export const getTempleBySlug = unstable_cache(
  async (slug: string) => {
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
  },
  ['temple-by-slug'],
  { tags: [CACHE_TAGS.temples], revalidate: CONTENT_CACHE_TTL }
);

/**
 * Get temple pricing (taxi services from Nainital)
 */
export const getTemplePricing = unstable_cache(
  async (templeId: string) => {
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
  },
  ['temple-pricing'],
  { tags: [CACHE_TAGS.temples, CACHE_TAGS.pricing], revalidate: CONTENT_CACHE_TTL }
);

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
export const getFeaturedTemples = unstable_cache(
  async (limit: number = 6) => {
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
  },
  ['featured-temples'],
  { tags: [CACHE_TAGS.temples], revalidate: CONTENT_CACHE_TTL }
);

/**
 * Get temples page configuration
 */
export const getTemplesPageConfig = unstable_cache(
  async () => {
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
  },
  ['temples-page-config'],
  { tags: [CACHE_TAGS.temples], revalidate: CONTENT_CACHE_TTL }
);

/**
 * Active pickup locations for the Transfers booking widget, server-fetched
 * so the correct list (including anything the admin just added) is present
 * in the very first HTML response — no client-side fetch-then-flicker.
 *
 * This was the first query in the file to use unstable_cache, back when the
 * rest relied on React cache() (per-request dedupe only). Every content read
 * above now follows the same pattern — see the caching policy at the top of
 * this file. The tag string and TTL are pulled from the shared registry so
 * this and its admin invalidation can't drift apart.
 */
export const getPickupLocations = unstable_cache(
  async (): Promise<PickupLocationRow[]> => {
    const { data, error } = await supabase
      .from('pickup_locations')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching pickup locations:', error);
      return [];
    }
    return data || [];
  },
  ['pickup-locations'],
  { tags: [CACHE_TAGS.pickupLocations], revalidate: CONTENT_CACHE_TTL }
);
