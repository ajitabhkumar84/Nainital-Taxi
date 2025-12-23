/**
 * SUPABASE LIBRARY - MAIN EXPORTS
 *
 * Central export point for all Supabase functionality
 * Import everything you need from this single file
 */

// Client exports
export { supabase, getCurrentUser, signOut } from './client';

// NOTE: Server client is NOT exported here to avoid breaking client components
// For server components, import directly: import { createClient } from '@/lib/supabase/server'

// All type definitions
export type {
  // Enums
  BookingStatus,
  PackageType,
  VehicleType,
  VehicleStatus,
  AvailabilityStatus,
  WaitlistStatus,
  LoyaltyTier,
  PaymentStatus,
  PaymentMethod,
  BookingSource,

  // Table types
  Profile,
  Vehicle,
  Destination,
  Package,
  Season,
  Availability,
  Booking,
  BookingStatusHistory,
  Waitlist,
  Review,
  AdminSetting,

  // View types
  ActiveVehiclesSummary,
  UpcomingBooking,
  AvailabilityCalendar,

  // Database type
  Database,

  // Helper types
  CreateBookingInput,
  UpdateBookingStatus,
  PriceResult,
  AvailabilityCheckResult,
} from './types';

// All query functions (using enhanced queries with season & blackout support)
export {
  // Packages
  getPackages,
  getPackageBySlug,
  getPopularPackages,

  // Vehicles
  getVehicles,
  getFeaturedVehicles,

  // Price calculation (enhanced with dynamic seasons)
  calculatePrice,
  getPrice,
  getPackagePrices,
  getPackagePriceRange,
  getAllPricingForPackage,

  // Season & Blackout helpers
  getSeasonForDate,
  isBookingAllowed,
  getSeasonPeriods,
  getBlackoutPeriods,
  getSeasonDateRanges,

  // Availability
  checkAvailability,
  getAvailabilityRange,
  getUpcomingAvailability,

  // Bookings
  createBooking,
  getUserBookings,
  getBooking,
  updateBookingStatus,

  // Reviews
  getFeaturedReviews,
  getApprovedReviews,

  // Destinations
  getDestinations,
  getPopularDestinations,
  getDestinationBySlug,

  // Waitlist
  addToWaitlist,
  getWaitlistForDate,

  // Admin settings
  getAdminSetting,
  getAllAdminSettings,
} from './queries_enhanced';
