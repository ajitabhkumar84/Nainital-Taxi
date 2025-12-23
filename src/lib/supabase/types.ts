/**
 * SUPABASE DATABASE TYPES
 *
 * TypeScript interfaces generated from database schema
 * Auto-complete and type-safety for all database operations
 */

// ============================================================================
// ENUMS
// ============================================================================

export type BookingStatus =
  | 'pending'
  | 'payment_pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type PackageType = 'tour' | 'transfer' | 'custom';

export type VehicleType = 'sedan' | 'suv_normal' | 'suv_deluxe' | 'suv_luxury';

export type VehicleStatus = 'available' | 'booked' | 'maintenance' | 'retired';

export type AvailabilityStatus = 'available' | 'limited' | 'sold_out' | 'blocked';

export type WaitlistStatus =
  | 'pending'
  | 'notified'
  | 'converted'
  | 'expired'
  | 'cancelled';

export type LoyaltyTier = 'standard' | 'silver' | 'gold' | 'platinum';

export type PaymentStatus = 'pending' | 'received' | 'verified' | 'refunded';

export type PaymentMethod = 'upi' | 'cash' | 'card';

export type BookingSource = 'website' | 'whatsapp' | 'phone' | 'admin';

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface Profile {
  id: string; // UUID from auth.users
  full_name: string;
  phone: string;
  email?: string | null;
  whatsapp_number?: string | null;
  total_bookings: number;
  total_spent: number;
  loyalty_tier: LoyaltyTier;
  is_vip: boolean;
  preferred_vehicle_type?: VehicleType | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface Vehicle {
  id: string; // UUID
  // Identity
  name: string;
  nickname?: string | null;
  registration_number: string;
  vehicle_type: VehicleType;
  status: VehicleStatus;

  // Specifications
  model_name?: string | null;  // NEW: e.g., "Dzire", "Innova Crysta"
  capacity: number;
  luggage_capacity?: number | null;
  has_ac: boolean;
  has_music_system: boolean;
  has_child_seat: boolean;

  // Retro Pop Aesthetic Attributes
  primary_color?: string | null;
  color_hex?: string | null;
  emoji?: string | null;
  personality_trait?: string | null;
  tagline?: string | null;

  // Media
  image_urls?: string[] | null;
  featured_image_url?: string | null;

  // Maintenance
  last_service_date?: string | null;
  next_service_date?: string | null;
  total_trips: number;
  total_kilometers: number;

  // Metadata
  is_featured: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  id: string; // UUID
  // Identity
  slug: string;
  name: string;
  tagline?: string | null;

  // Content
  description?: string | null;
  highlights?: string[] | null;
  best_time_to_visit?: string | null;
  duration?: string | null;

  // Location
  distance_from_nainital?: number | null;
  latitude?: number | null;
  longitude?: number | null;

  // Media
  hero_image_url?: string | null;
  gallery_urls?: string[] | null;
  emoji?: string | null;

  // SEO
  meta_title?: string | null;
  meta_description?: string | null;

  // Metadata
  display_order: number;
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Package {
  id: string; // UUID
  // Identity
  slug: string;
  title: string;
  type: PackageType;

  // Details
  duration?: string | null;
  distance?: number | null;
  places_covered?: string[] | null;
  description?: string | null;
  includes?: string[] | null;
  excludes?: string[] | null;
  itinerary?: Record<string, any> | null; // JSONB

  // Destinations
  destination_ids?: string[] | null;

  // Media
  image_url?: string | null;
  gallery_urls?: string[] | null;

  // Badges & Status
  is_popular: boolean;
  is_seasonal: boolean;
  availability_status: AvailabilityStatus;

  // Restrictions
  min_passengers: number;
  max_passengers?: number | null;
  suitable_for?: string[] | null;

  // SEO
  meta_title?: string | null;
  meta_description?: string | null;

  // Metadata
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Season {
  id: string; // UUID
  name: string;
  description?: string | null;

  // Date Range
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD

  // Recurrence
  is_recurring: boolean;
  recurrence_pattern?: string | null;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pricing {
  id: string; // UUID

  // Package and vehicle combination
  package_id: string;
  vehicle_type: VehicleType;

  // Season name for pricing (Off-Season or Season)
  season_name: 'Off-Season' | 'Season';

  // The actual price (manually entered)
  price: number;

  // Notes
  notes?: string | null;

  // Metadata
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: string; // UUID
  date: string; // YYYY-MM-DD

  // Fleet Status
  total_fleet_size: number;
  cars_booked: number;
  cars_available: number; // Computed

  // Status
  status: AvailabilityStatus;

  // Notes
  internal_notes?: string | null;
  public_message?: string | null;

  // Google Calendar Sync
  synced_from_gcal: boolean;
  gcal_event_id?: string | null;
  last_synced_at?: string | null;

  // Metadata
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string; // UUID

  // Customer
  user_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_whatsapp?: string | null;

  // Package & Vehicle
  package_id?: string | null;
  package_name: string;
  vehicle_type: VehicleType;
  vehicle_id?: string | null;

  // Trip Details
  booking_date: string; // YYYY-MM-DD
  pickup_time: string; // HH:MM:SS
  pickup_location: string;
  dropoff_location?: string | null;
  passengers: number;

  // Special Requests
  special_requests?: string | null;
  requires_child_seat: boolean;
  extra_stops?: string[] | null;

  // Pricing (UPDATED - Manual pricing only)
  final_price: number;
  season_id?: string | null;
  currency: string;

  // Payment
  payment_status: PaymentStatus;
  payment_method?: string | null;
  payment_screenshot_url?: string | null;
  upi_transaction_id?: string | null;
  payment_received_at?: string | null;
  payment_verified_at?: string | null;

  // Status Management
  status: BookingStatus;

  // Communication
  whatsapp_message_sent: boolean;
  confirmation_sent: boolean;
  reminder_sent: boolean;

  // Driver Assignment
  assigned_driver_name?: string | null;
  assigned_driver_phone?: string | null;
  driver_assigned_at?: string | null;

  // Trip Tracking
  trip_started_at?: string | null;
  trip_completed_at?: string | null;
  actual_distance?: number | null;

  // Cancellation
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  refund_amount?: number | null;
  refunded_at?: string | null;

  // Metadata
  booking_source: BookingSource;
  admin_notes?: string | null;
  internal_tags?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface BookingStatusHistory {
  id: string; // UUID
  booking_id: string;

  // Status Change
  from_status?: BookingStatus | null;
  to_status: BookingStatus;

  // Context
  changed_by?: string | null;
  changed_by_name?: string | null;
  reason?: string | null;
  notes?: string | null;

  // Metadata
  created_at: string;
}

export interface Waitlist {
  id: string; // UUID

  // Customer
  user_id?: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_whatsapp?: string | null;

  // Desired Booking
  desired_date: string; // YYYY-MM-DD
  package_id?: string | null;
  package_name: string;
  vehicle_type: VehicleType;
  passengers: number;

  // Pricing
  estimated_price: number;

  // Priority
  priority: number;
  is_vip: boolean;

  // Status
  status: WaitlistStatus;

  // Notification
  notified_at?: string | null;
  notification_method?: string | null;
  expires_at?: string | null;

  // Conversion
  converted_to_booking_id?: string | null;
  converted_at?: string | null;

  // Cancellation
  cancelled_at?: string | null;
  cancellation_reason?: string | null;

  // Metadata
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string; // UUID

  // Customer
  user_id?: string | null;
  booking_id?: string | null;
  customer_name: string;
  customer_location?: string | null;

  // Review
  rating: number; // 1-5
  title?: string | null;
  review_text: string;

  // Media
  photos?: string[] | null;

  // Response
  admin_response?: string | null;
  admin_response_at?: string | null;

  // Status
  is_verified: boolean;
  is_featured: boolean;
  is_approved: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface AdminSetting {
  key: string;
  value: any; // JSONB - can be any JSON value
  description?: string | null;
  updated_at: string;
}

// ============================================================================
// VIEW TYPES
// ============================================================================

export interface ActiveVehiclesSummary {
  vehicle_type: VehicleType;
  total_count: number;
  available_count: number;
  booked_count: number;
  maintenance_count: number;
}

export interface UpcomingBooking {
  id: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  pickup_time: string;
  pickup_location: string;
  package_name: string;
  vehicle_type: VehicleType;
  vehicle_name?: string | null;
  passengers: number;
  final_price: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
}

export interface AvailabilityCalendar {
  date: string;
  total_fleet_size: number;
  cars_booked: number;
  cars_available: number;
  status: AvailabilityStatus;
  is_blocked: boolean;
  confirmed_bookings_count: number;
}

// ============================================================================
// DATABASE TYPE (For Supabase Client)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'total_bookings' | 'total_spent'> & {
          id: string;
          total_bookings?: number;
          total_spent?: number;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      vehicles: {
        Row: Vehicle;
        Insert: Omit<Vehicle, 'id' | 'created_at' | 'updated_at' | 'total_trips' | 'total_kilometers'> & {
          id?: string;
        };
        Update: Partial<Omit<Vehicle, 'id' | 'created_at'>>;
      };
      destinations: {
        Row: Destination;
        Insert: Omit<Destination, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Destination, 'id' | 'created_at'>>;
      };
      packages: {
        Row: Package;
        Insert: Omit<Package, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Package, 'id' | 'created_at'>>;
      };
      seasons: {
        Row: Season;
        Insert: Omit<Season, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Season, 'id' | 'created_at'>>;
      };
      pricing: {
        Row: Pricing;
        Insert: Omit<Pricing, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Pricing, 'id' | 'created_at'>>;
      };
      availability: {
        Row: Availability;
        Insert: Omit<Availability, 'id' | 'created_at' | 'updated_at' | 'cars_available' | 'status'> & {
          id?: string;
        };
        Update: Partial<Omit<Availability, 'id' | 'created_at' | 'cars_available' | 'status'>>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Booking, 'id' | 'created_at'>>;
      };
      booking_status_history: {
        Row: BookingStatusHistory;
        Insert: Omit<BookingStatusHistory, 'id' | 'created_at'> & {
          id?: string;
        };
        Update: Partial<Omit<BookingStatusHistory, 'id' | 'created_at'>>;
      };
      waitlist: {
        Row: Waitlist;
        Insert: Omit<Waitlist, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Waitlist, 'id' | 'created_at'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
        };
        Update: Partial<Omit<Review, 'id' | 'created_at'>>;
      };
      admin_settings: {
        Row: AdminSetting;
        Insert: AdminSetting;
        Update: Partial<Omit<AdminSetting, 'key'>>;
      };
    };
    Views: {
      active_vehicles_summary: {
        Row: ActiveVehiclesSummary;
      };
      upcoming_bookings: {
        Row: UpcomingBooking;
      };
      availability_calendar: {
        Row: AvailabilityCalendar;
      };
    };
    Functions: {};
    Enums: {
      booking_status: BookingStatus;
      package_type: PackageType;
      vehicle_type: VehicleType;
      vehicle_status: VehicleStatus;
      availability_status: AvailabilityStatus;
      waitlist_status: WaitlistStatus;
    };
  };
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Type for creating a new booking
 */
export type CreateBookingInput = Omit<
  Booking,
  'id' | 'created_at' | 'updated_at' | 'status' | 'payment_status' |
  'whatsapp_message_sent' | 'confirmation_sent' | 'reminder_sent' | 'booking_source'
> & {
  booking_source?: BookingSource;
};

/**
 * Type for vehicle type display names
 */
export const VehicleTypeDisplayNames: Record<VehicleType, string> = {
  sedan: 'Sedan (Dzire/Amaze/Xcent)',
  suv_normal: 'SUV Normal (Ertiga/Triber/Xylo/Tavera)',
  suv_deluxe: 'SUV Deluxe (Innova/Marazzo)',
  suv_luxury: 'SUV Luxury (Innova Crysta)',
};

/**
 * Type for updating booking status
 */
export type UpdateBookingStatus = {
  status: BookingStatus;
  notes?: string;
};

/**
 * Type for price lookup result (manual pricing)
 */
export interface PriceResult {
  price: number;
  package_id: string;
  vehicle_type: VehicleType;
  season_id?: string | null;
  season_name?: string | null;
}

/**
 * Type for availability check response
 */
export interface AvailabilityCheckResult {
  date: string;
  is_available: boolean;
  status: AvailabilityStatus;
  cars_available: number;
  message?: string;
}
