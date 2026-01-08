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

// ============================================================================
// ITINERARY & PACKAGE CONTENT TYPES
// ============================================================================

/**
 * Day-wise itinerary for tour packages
 */
export interface DayPlan {
  day_number: number;
  title: string;
  description: string;
  time_start?: string; // e.g., "06:00 AM"
  time_end?: string; // e.g., "10:00 AM"
  highlights: string[];
  meals_included?: string[];
  overnight_stay?: string;
}

/**
 * Hotel pricing tiers for tour packages
 */
export interface HotelOption {
  id: string;
  name: string;           // "Budget", "Standard", "Deluxe"
  description: string;
  hotels_included: string[];
  price_modifier: Record<VehicleType, number>; // Additional price per vehicle type
}

/**
 * FAQ item for packages
 */
export interface PackageFAQ {
  question: string;
  answer: string;
}

/**
 * Detailed attraction/stop for tour packages
 */
export interface DetailedAttraction {
  id: string;
  order: number;
  name: string;
  description: string;
  image_url?: string;
  route_info?: string; // e.g., "Kathgodam → Jeolikote → Getia"
  time_estimate?: string; // e.g., "1 Hour from Kathgodam"
  is_highlighted?: boolean; // For special badges like "MOST POPULAR"
  badge_text?: string; // e.g., "MOST POPULAR", "BEST VALUE"
}

/**
 * Detailed inclusion/exclusion item with description
 */
export interface DetailedInclusionExclusion {
  item: string;
  description?: string; // Additional details
  icon?: string; // Icon name or emoji
  category?: string; // e.g., "Transportation", "Accommodation"
}

/**
 * Booking instructions for package
 */
export interface BookingInstructions {
  steps: Array<{
    step_number: number;
    title: string;
    description: string;
  }>;
  contact_phone?: string;
  whatsapp_number?: string;
  whatsapp_message?: string; // Pre-filled message
  additional_notes?: string;
}

/**
 * Complete tour itinerary stored in Package.itinerary JSONB
 */
export interface TourItinerary {
  days: DayPlan[];
  hotel_options: HotelOption[];
  faqs: PackageFAQ[];
  detailed_attractions?: DetailedAttraction[]; // NEW
  itinerary_flexibility_note?: string; // NEW
  detailed_includes?: DetailedInclusionExclusion[]; // NEW
  detailed_excludes?: DetailedInclusionExclusion[]; // NEW
  booking_instructions?: BookingInstructions; // NEW
}

/**
 * Transfer destination paragraph
 */
export interface TransferParagraph {
  title: string;
  content: string;
}

/**
 * Transfer content stored in Package.itinerary JSONB for transfer type
 */
export interface TransferContent {
  paragraphs: TransferParagraph[];
  faqs: PackageFAQ[];
  detailed_attractions?: DetailedAttraction[]; // NEW
  itinerary_flexibility_note?: string; // NEW
  detailed_includes?: DetailedInclusionExclusion[]; // NEW
  detailed_excludes?: DetailedInclusionExclusion[]; // NEW
  booking_instructions?: BookingInstructions; // NEW
}

/**
 * Gallery image with name and URL
 */
export interface GalleryImage {
  url: string;
  name: string;
}

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
  gallery_urls?: string[] | null; // Legacy format
  gallery_images?: GalleryImage[] | null; // New format with names

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

/**
 * Route category for organizing routes on rates page
 */
export interface RouteCategory {
  id: string;                  // UUID
  category_name: string;       // e.g., "Popular Destinations"
  category_slug: string;       // e.g., "popular-destinations"
  category_description?: string | null;
  icon: string;                // car, mountain, temple, city, lake, nature, road, custom
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string; // UUID

  // Route Information
  slug: string;
  pickup_location: string;
  drop_location: string;

  // Details
  distance?: number | null; // in kilometers
  duration?: string | null; // e.g., "2 hours", "3.5 hours"
  description?: string | null;

  // Category (for organizing on rates page)
  category_id?: string | null; // UUID reference to route_categories

  // Optional Features
  featured_package_id?: string | null;
  has_hotel_option: boolean;

  // Destination Page Display
  show_on_destination_page: boolean;

  // Status
  is_active: boolean;
  enable_online_booking: boolean;

  // SEO
  meta_title?: string | null;
  meta_description?: string | null;

  // Metadata
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Route with category information (for display)
 */
export interface RouteWithCategory extends Route {
  category?: RouteCategory | null;
  category_name?: string | null;
  category_slug_name?: string | null;
  category_icon?: string | null;
  category_display_order?: number | null;
}

export interface RoutePricing {
  id: string; // UUID

  // Route and vehicle combination
  route_id: string;
  vehicle_type: VehicleType;

  // Season name for pricing (Off-Season or Season)
  season_name: 'Off-Season' | 'Season';

  // The actual price
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
  booking_id?: string; // Human-readable ID: NT-YYYYMMDD-XXXX

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

  // Advance Payment (25% or min Rs 500)
  advance_amount?: number;
  advance_received?: boolean;
  advance_received_at?: string | null;

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
// TEMPLE TYPES
// ============================================================================

/**
 * Temple timings configuration
 */
export interface TempleTimings {
  openTime?: string;           // e.g., "05:00 AM"
  closeTime?: string;          // e.g., "09:00 PM"
  poojaTimings?: string[];     // e.g., ["Morning Aarti: 06:00 AM", "Evening Aarti: 07:00 PM"]
  closedDays?: string[];       // e.g., ["None"] or ["Monday"]
  specialNote?: string;        // e.g., "Temple closes during heavy snowfall"
}

/**
 * How to reach temple from different locations
 */
export interface HowToReach {
  fromNainital?: string;       // Detailed directions from Nainital
  fromKathgodam?: string;      // Detailed directions from Kathgodam
  fromPantnagar?: string;      // Detailed directions from Pantnagar
  fromDelhi?: string;          // Detailed directions from Delhi
  nearestRailway?: string;     // e.g., "Kathgodam Railway Station (35 km)"
  nearestAirport?: string;     // e.g., "Pantnagar Airport (70 km)"
}

/**
 * Seasonal event or festival at temple
 */
export interface SeasonalEvent {
  eventName: string;           // e.g., "Maha Shivaratri"
  timing: string;              // e.g., "February/March"
  description?: string;        // Details about the event
}

/**
 * Custom content section for flexibility
 */
export interface CustomSection {
  title: string;               // Section heading
  content: string;             // Section content (HTML/Markdown)
  imageUrl?: string;           // Optional image for the section
}

/**
 * Taxi CTA configuration for temple page
 */
export interface TaxiCta {
  heading?: string;            // e.g., "Book Your Temple Visit"
  subheading?: string;         // e.g., "Comfortable taxi service from Nainital"
  primaryRouteId?: string;     // UUID of featured route
}

/**
 * Temple category for grouping temples
 */
export interface TempleCategory {
  id: string;                  // UUID
  category_name: string;       // e.g., "Shiva Temples"
  category_slug: string;       // e.g., "shiva-temples"
  category_description?: string | null;
  icon: string;                // temple, om, shiva, shakti, lotus, mountain, star, heritage, custom
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Main temple document
 */
export interface Temple {
  id: string;                  // UUID

  // Basic Information
  name: string;
  slug: string;
  subtitle?: string | null;

  // Location & Geography
  district: string;            // Nainital, Almora, Champawat, Bageshwar, Pithoragarh, Udham Singh Nagar
  location_address?: string | null;
  nearest_city?: string | null;
  altitude?: number | null;    // in meters
  latitude?: number | null;
  longitude?: number | null;
  google_maps_embed_url?: string | null;
  distance_from_nainital?: number | null;  // in km
  distance_from_kathgodam?: number | null; // in km

  // Temple Classification
  temple_type: string;         // Shiva, Shakti, Ashram, Heritage, Local, Pilgrimage
  category_id?: string | null; // UUID reference to temple_categories

  // SEO
  page_title?: string | null;
  meta_description?: string | null;
  keywords?: string[] | null;

  // Media
  featured_image_url?: string | null;
  hero_images?: string[] | null;
  video_embed_url?: string | null;
  gallery_images?: string[] | null;

  // Content
  intro_text?: string | null;
  history?: string | null;
  significance?: string | null;
  highlights?: string[] | null;

  // Temple Details (JSONB)
  timings?: TempleTimings | null;
  how_to_reach?: HowToReach | null;

  // Visiting Information
  best_time_to_visit?: string | null;
  seasonal_events?: SeasonalEvent[] | null;
  pilgrimage_tips?: string[] | null;
  accommodation_info?: string | null;
  entry_fee?: string | null;

  // Custom Sections (JSONB)
  custom_sections?: CustomSection[] | null;

  // Taxi Integration (JSONB)
  taxi_cta?: TaxiCta | null;

  // Status & Display
  is_active: boolean;
  is_featured: boolean;
  show_on_homepage: boolean;
  popularity: number;          // 1-100
  display_order: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Temple pricing for taxi services from Nainital
 */
export interface TemplePricing {
  id: string;                  // UUID
  temple_id: string;           // UUID reference to temples
  vehicle_type: VehicleType;   // sedan, suv_normal, suv_deluxe, suv_luxury
  season_name: 'Off-Season' | 'Season';
  price: number;
  round_trip_price?: number | null;
  waiting_charges?: string | null;  // e.g., "Rs 100/hour after 2 hours"
  created_at: string;
  updated_at: string;
}

/**
 * Temple FAQ
 */
export interface TempleFAQ {
  id: string;                  // UUID
  temple_id: string;           // UUID reference to temples
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Temple with related data (for detail pages)
 */
export interface TempleWithRelations extends Temple {
  category?: TempleCategory | null;
  pricing?: TemplePricing[];
  faqs?: TempleFAQ[];
  related_routes?: Route[];
  related_packages?: Package[];
  nearby_temples?: Temple[];
  nearby_attractions?: Destination[];
}

/**
 * Simplified temple for listing cards
 */
export interface TempleListItem {
  id: string;
  name: string;
  slug: string;
  subtitle?: string | null;
  district: string;
  temple_type: string;
  featured_image_url?: string | null;
  highlights?: string[] | null;
  distance_from_nainital?: number | null;
  is_featured: boolean;
  category_name?: string | null;
  category_icon?: string | null;
}

/**
 * Temples page configuration (singleton)
 */
export interface TemplesPageConfig {
  id: string;                  // UUID

  // SEO
  page_title: string;
  meta_description?: string | null;
  keywords?: string[] | null;

  // Hero Section
  hero_title: string;
  hero_subtitle?: string | null;
  hero_badge?: string | null;
  hero_image_url?: string | null;

  // Introduction
  intro_text?: string | null;

  // Filter Settings
  enable_district_filter: boolean;
  enable_type_filter: boolean;
  enable_search: boolean;

  // Category Navigation
  show_category_navigation: boolean;

  // Content Sections (JSONB)
  additional_info?: Array<{
    icon: string;
    title: string;
    description: string;
  }> | null;

  bottom_cta?: {
    heading?: string;
    subheading?: string;
    primaryButtonText?: string;
    primaryButtonLink?: string;
    secondaryButtonText?: string;
  } | null;

  // Page FAQs (JSONB)
  page_faqs?: Array<{
    question: string;
    answer: string;
  }> | null;

  // Status
  is_active: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Default temples page configuration
 */
export const DEFAULT_TEMPLES_PAGE_CONFIG: Partial<TemplesPageConfig> = {
  page_title: 'Sacred Temples of Kumaon Region | Nainital Taxi Services',
  meta_description: 'Explore 30+ sacred temples across Kumaon region including Nainital, Almora, Champawat. Book comfortable taxi services for your spiritual journey.',
  hero_title: 'Sacred Temples of Kumaon',
  hero_subtitle: 'Discover divine destinations across 6 districts with comfortable taxi services',
  hero_badge: '30+ Sacred Sites',
  intro_text: 'The Kumaon region is blessed with numerous ancient temples, ashrams, and spiritual centers. From the globally renowned Kainchi Dham to hidden gems in remote valleys, each temple has its unique story and spiritual significance.',
  enable_district_filter: true,
  enable_type_filter: true,
  enable_search: true,
  show_category_navigation: true,
  is_active: true,
};

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
  'whatsapp_message_sent' | 'confirmation_sent' | 'reminder_sent' | 'booking_source' |
  'advance_received' | 'advance_received_at'
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

// ============================================================================
// SITE CONFIGURATION TYPES
// ============================================================================

/**
 * Navigation link for header/footer
 */
export interface NavLink {
  id: string;
  href: string;
  label: string;
  isActive: boolean;
  displayOrder: number;
  openInNewTab?: boolean;
}

/**
 * Social media link
 */
export interface SocialLink {
  id: string;
  platform: 'whatsapp' | 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'linkedin';
  url: string;
  isActive: boolean;
  displayOrder: number;
}

/**
 * Call-to-action button configuration
 */
export interface CTAButton {
  id: string;
  text: string;
  href: string;
  variant: 'primary' | 'secondary' | 'outline' | 'whatsapp';
  icon?: 'phone' | 'whatsapp' | 'arrow' | 'none';
  isActive: boolean;
}

/**
 * Header configuration
 */
export interface HeaderConfig {
  logoText: string;
  logoEmoji: string;
  navLinks: NavLink[];
  ctaPrimary: CTAButton;
  ctaSecondary: CTAButton;
  showPhone: boolean;
  phoneNumber: string;
}

/**
 * Footer link section (e.g., Quick Links, Services)
 */
export interface FooterLinkSection {
  id: string;
  title: string;
  links: NavLink[];
  displayOrder: number;
  isActive: boolean;
}

/**
 * Footer configuration
 */
export interface FooterConfig {
  tagline: string;
  taglineIcon: string;
  copyright: string;
  description: string;
  linkSections: FooterLinkSection[];
  socialLinks: SocialLink[];
  ctaButtons: CTAButton[];
  showNewsletter: boolean;
}

/**
 * Contact information
 */
export interface ContactConfig {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
}

/**
 * Tracking and analytics configuration
 */
export interface TrackingConfig {
  googleTagManagerId?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  customHeadScripts?: string; // Custom scripts to inject in <head>
  customBodyScripts?: string; // Custom scripts to inject in <body>
  isEnabled: boolean;
}

/**
 * Complete site configuration
 */
export interface SiteConfig {
  header: HeaderConfig;
  footer: FooterConfig;
  contact: ContactConfig;
  tracking: TrackingConfig;
  updatedAt?: string;
}

/**
 * Default site configuration
 */
export const DEFAULT_SITE_CONFIG: SiteConfig = {
  header: {
    logoText: 'Nainital Taxi',
    logoEmoji: '🚕',
    navLinks: [
      { id: '1', href: '/', label: 'Home', isActive: true, displayOrder: 0 },
      { id: '2', href: '/destinations', label: 'Destinations', isActive: true, displayOrder: 1 },
      { id: '3', href: '/tour', label: 'Tour Packages', isActive: true, displayOrder: 2 },
      { id: '4', href: '/temples', label: 'Temples', isActive: true, displayOrder: 3 },
      { id: '5', href: '/fleet', label: 'Fleet', isActive: true, displayOrder: 4 },
      { id: '6', href: '/about', label: 'About', isActive: true, displayOrder: 5 },
    ],
    ctaPrimary: {
      id: 'cta-primary',
      text: 'Book Now',
      href: '/booking',
      variant: 'primary',
      icon: 'none',
      isActive: true,
    },
    ctaSecondary: {
      id: 'cta-secondary',
      text: 'Call Now',
      href: 'tel:+918445206116',
      variant: 'outline',
      icon: 'phone',
      isActive: true,
    },
    showPhone: true,
    phoneNumber: '+918445206116',
  },
  footer: {
    tagline: 'Your Safety. Our Promise.',
    taglineIcon: 'shield',
    copyright: '© 2024 Nainital Taxi. Trusted by families across India.',
    description: 'Premium taxi services in Nainital and Uttarakhand. Safe, reliable, and family-friendly travel.',
    linkSections: [
      {
        id: 'quick-links',
        title: 'Quick Links',
        links: [
          { id: 'ql-1', href: '/', label: 'Home', isActive: true, displayOrder: 0 },
          { id: 'ql-2', href: '/destinations', label: 'Destinations', isActive: true, displayOrder: 1 },
          { id: 'ql-3', href: '/tour', label: 'Tour Packages', isActive: true, displayOrder: 2 },
          { id: 'ql-4', href: '/temples', label: 'Temples', isActive: true, displayOrder: 3 },
          { id: 'ql-5', href: '/fleet', label: 'Our Fleet', isActive: true, displayOrder: 4 },
        ],
        displayOrder: 0,
        isActive: true,
      },
      {
        id: 'support',
        title: 'Support',
        links: [
          { id: 'sp-1', href: '/about', label: 'About Us', isActive: true, displayOrder: 0 },
          { id: 'sp-2', href: '/contact', label: 'Contact', isActive: true, displayOrder: 1 },
          { id: 'sp-3', href: '/faq', label: 'FAQ', isActive: true, displayOrder: 2 },
        ],
        displayOrder: 1,
        isActive: true,
      },
    ],
    socialLinks: [
      { id: 'social-wa', platform: 'whatsapp', url: 'https://wa.me/918445206116', isActive: true, displayOrder: 0 },
      { id: 'social-ig', platform: 'instagram', url: 'https://instagram.com/nanitaltaxi', isActive: true, displayOrder: 1 },
      { id: 'social-fb', platform: 'facebook', url: 'https://facebook.com/nanitaltaxi', isActive: true, displayOrder: 2 },
    ],
    ctaButtons: [
      { id: 'footer-cta-1', text: 'WhatsApp Us', href: 'https://wa.me/918445206116', variant: 'whatsapp', icon: 'whatsapp', isActive: true },
      { id: 'footer-cta-2', text: 'Call Now', href: 'tel:+918445206116', variant: 'outline', icon: 'phone', isActive: true },
    ],
    showNewsletter: false,
  },
  contact: {
    phone: '+918445206116',
    whatsapp: '+918445206116',
    email: 'info@nanitaltaxi.com',
    address: 'Nainital, Uttarakhand, India',
  },
  tracking: {
    googleTagManagerId: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
    customHeadScripts: '',
    customBodyScripts: '',
    isEnabled: false,
  },
}

// ============================================================================
// MULTI-DAY RENTAL PAGE TYPES
// ============================================================================

/**
 * Trust indicator shown in hero section
 */
export interface TrustIndicator {
  number: string;  // e.g., "500+", "15+", "24/7"
  label: string;   // e.g., "Happy Travelers", "Years Experience"
}

/**
 * Car category with seasonal pricing for multi-day rentals
 */
export interface MultiDayCarCategory {
  name: string;              // e.g., "Hatchback Cars", "Sedan Cars", "SUV Deluxe"
  vehicles: string;          // e.g., "Alto, Alto K10" or "Innova (7 pax)"
  image_url?: string;        // Image URL for the car category
  season_price: number;      // Peak season price per day in ₹
  mid_season_price: number;  // Mid season price per day in ₹
  off_season_price: number;  // Off season price per day in ₹
  is_popular: boolean;       // Show "POPULAR" badge
  order: number;             // Display order (lower numbers first)
}

/**
 * Inclusion or exclusion item
 */
export interface InclusionExclusionItem {
  title: string;        // e.g., "Car Rental", "Toll Charges"
  description: string;  // Brief description
}

/**
 * Feature in a tour duration package
 */
export interface PackageFeature {
  text: string;      // Feature text
  is_bold: boolean;  // Highlight this feature
}

/**
 * Tour duration package (3-4 days, 5-7 days, etc.)
 */
export interface TourDurationPackage {
  badge: string;                    // e.g., "SHORT GETAWAY", "CLASSIC TOUR"
  duration: string;                 // e.g., "3-4 Days", "5-7 Days", "Custom"
  subtitle: string;                 // e.g., "Perfect for weekends"
  features: PackageFeature[];       // List of features
  whatsapp_message: string;         // Pre-filled WhatsApp message
  is_popular: boolean;              // Show "POPULAR" badge
  is_custom_package: boolean;       // Use dark/premium styling
}

/**
 * FAQ item for multi-day rental page
 */
export interface MultiDayRentalFAQ {
  question: string;
  answer: string;
}

/**
 * CTA feature item
 */
export interface CTAFeature {
  text: string;
}

/**
 * Complete multi-day rental page configuration
 * Single row table - only one configuration
 */
export interface MultiDayRentalPage {
  id: string;

  // SEO & Meta Data
  seo_title: string;
  seo_description: string;
  seo_keywords: string;

  // Hero Section
  hero_badge: string;
  hero_headline_line1: string;
  hero_headline_line2: string;
  hero_headline_line3: string;
  hero_subheadline: string;
  hero_image_url?: string | null;
  hero_trust_indicators: TrustIndicator[];

  // Pricing Section
  pricing_heading: string;
  pricing_subheading: string;
  pricing_season_label: string;
  pricing_season_date_ranges: string[];
  pricing_season_description: string;
  pricing_mid_season_label: string;
  pricing_mid_season_date_ranges: string[];
  pricing_mid_season_description: string;
  pricing_off_season_label: string;
  pricing_off_season_date_ranges: string[];
  pricing_off_season_description: string;
  pricing_note_text: string;
  car_categories: MultiDayCarCategory[];

  // Inclusion/Exclusion Section
  inclusion_exclusion_heading: string;
  inclusion_exclusion_subheading: string;
  items_included: InclusionExclusionItem[];
  items_excluded: InclusionExclusionItem[];

  // Tour Duration Packages Section
  packages_heading: string;
  packages_subheading: string;
  package_1: TourDurationPackage;
  package_2: TourDurationPackage;
  package_3: TourDurationPackage;
  package_4: TourDurationPackage;

  // Popular Itineraries Section
  popular_itineraries_heading: string;
  popular_itineraries_subheading: string;
  featured_package_ids: string[];  // Array of package UUIDs

  // Safety Section Reference
  safety_section_reference?: string | null;

  // FAQs Section
  faq_heading: string;
  faq_subheading: string;
  faqs: MultiDayRentalFAQ[];

  // CTA Section
  cta_heading: string;
  cta_description: string;
  cta_features: CTAFeature[];

  // Metadata
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Default multi-day rental page configuration
 */
export const DEFAULT_MULTI_DAY_RENTAL_PAGE: Partial<MultiDayRentalPage> = {
  // SEO
  seo_title: 'Multi-Day Car Rental in Uttarakhand | Nainital Taxi',
  seo_description: 'Book multi-day car rentals for complete Uttarakhand tours. Transparent seasonal pricing, flexible packages, and professional drivers.',
  seo_keywords: 'multi-day car rental, Uttarakhand tour, taxi booking, seasonal pricing',

  // Hero
  hero_badge: 'Trusted by 500+ Happy Travelers',
  hero_headline_line1: 'Your Complete',
  hero_headline_line2: 'Uttarakhand Journey',
  hero_headline_line3: 'Awaits',
  hero_subheadline: 'Experience the Himalayas with our multi-day car rental service. Professional drivers, well-maintained vehicles, and flexible itineraries.',
  hero_trust_indicators: [
    { number: '500+', label: 'Happy Travelers' },
    { number: '15+', label: 'Years Experience' },
    { number: '24/7', label: 'Support' },
  ],

  // Pricing
  pricing_heading: 'Choose Your Ride',
  pricing_subheading: 'Per day rates for various car categories - transparent pricing for every season',
  pricing_season_label: 'Season Rates',
  pricing_season_date_ranges: ['15 Apr - 10 Jul', '20 Dec - 15 Jan'],
  pricing_season_description: 'Peak tourist season',
  pricing_mid_season_label: 'Mid Season',
  pricing_mid_season_date_ranges: ['11 Jul - 30 Sep', '16 Jan - 14 Apr'],
  pricing_mid_season_description: 'Moderate season',
  pricing_off_season_label: 'Off-Season Rates',
  pricing_off_season_date_ranges: ['1 Oct - 19 Dec'],
  pricing_off_season_description: 'Off-peak season',
  pricing_note_text: 'Above charges are general rates. Exact charges depend on itinerary and number of days.',
  car_categories: [],

  // Inclusion/Exclusion
  inclusion_exclusion_heading: "What's Included & Excluded",
  inclusion_exclusion_subheading: "Complete transparency - know exactly what you're paying for",
  items_included: [
    { title: 'Car Rental', description: 'Well-maintained vehicle for entire duration' },
    { title: 'Professional Driver', description: 'Experienced local driver with hill driving expertise' },
    { title: 'Fuel Charges', description: 'All fuel costs included in package' },
    { title: 'Driver Allowance', description: 'Driver food and accommodation covered' },
    { title: 'State Taxes', description: 'All applicable state taxes included' },
  ],
  items_excluded: [
    { title: 'Accommodation', description: 'Hotel/stay arrangements not included' },
    { title: 'Meals', description: 'Guest food and beverages not covered' },
    { title: 'Entry Tickets', description: 'Monument, park, and attraction entry fees' },
    { title: 'Toll Charges', description: 'Highway toll taxes (if applicable)' },
    { title: 'Parking Fees', description: 'Parking charges at destinations' },
  ],

  // Packages
  packages_heading: 'Choose Your Duration',
  packages_subheading: 'Flexible packages tailored to your journey. The longer you travel, the more you save!',
  package_1: {
    badge: 'SHORT GETAWAY',
    duration: '3-4 Days',
    subtitle: 'Perfect for weekends',
    features: [
      { text: 'Ideal for weekend trips', is_bold: false },
      { text: 'Cover 2-3 major destinations', is_bold: true },
      { text: 'Flexible timings', is_bold: false },
      { text: 'Quick booking process', is_bold: false },
    ],
    whatsapp_message: 'Hi, I want to book a car for 3-4 days complete tour',
    is_popular: false,
    is_custom_package: false,
  },
  package_2: {
    badge: 'CLASSIC TOUR',
    duration: '5-7 Days',
    subtitle: 'Most preferred choice',
    features: [
      { text: 'Perfect for family vacations', is_bold: true },
      { text: 'Explore 4-5 destinations', is_bold: false },
      { text: 'Relaxed pace of travel', is_bold: false },
      { text: 'Best value for money', is_bold: true },
    ],
    whatsapp_message: 'Hi, I want to book a car for 5-7 days complete tour',
    is_popular: true,
    is_custom_package: false,
  },
  package_3: {
    badge: 'EXTENDED TOUR',
    duration: '8-10 Days',
    subtitle: 'Complete experience',
    features: [
      { text: 'Cover entire Uttarakhand', is_bold: true },
      { text: 'Visit 6-8 destinations', is_bold: false },
      { text: 'Unhurried exploration', is_bold: false },
      { text: 'Maximum value package', is_bold: false },
    ],
    whatsapp_message: 'Hi, I want to book a car for 8-10 days complete tour',
    is_popular: false,
    is_custom_package: false,
  },
  package_4: {
    badge: 'CUSTOM TOUR',
    duration: 'Custom',
    subtitle: 'Design your journey',
    features: [
      { text: 'Fully customizable itinerary', is_bold: true },
      { text: 'Choose your own destinations', is_bold: false },
      { text: 'Flexible number of days', is_bold: false },
      { text: 'Personalized experience', is_bold: true },
    ],
    whatsapp_message: 'Hi, I want to discuss a custom multi-day tour package',
    is_popular: false,
    is_custom_package: true,
  },

  // Popular Itineraries
  popular_itineraries_heading: 'Popular Tour Itineraries',
  popular_itineraries_subheading: 'Handpicked routes designed by local experts. Pick one or customize your own adventure.',
  featured_package_ids: [],

  // FAQs
  faq_heading: 'Frequently Asked Questions',
  faq_subheading: 'Everything you need to know about multi-day car rentals',
  faqs: [
    {
      question: 'What is included in multi-day car rental?',
      answer: 'The package includes the car rental, professional driver, fuel charges, driver allowance, and state taxes. Accommodation, meals, entry tickets, and toll charges are not included.',
    },
    {
      question: 'How are prices calculated for multi-day rentals?',
      answer: 'Prices are calculated on a per-day basis and vary by season (peak, mid, off-season) and vehicle type. The exact cost depends on your itinerary and number of days.',
    },
    {
      question: 'Can I customize my itinerary?',
      answer: 'Yes! We offer fully customizable itineraries. You can choose your destinations, duration, and pace of travel. Contact us to discuss your preferences.',
    },
    {
      question: 'Are drivers experienced with hill routes?',
      answer: 'Absolutely! All our drivers are locals with extensive experience driving in Uttarakhand\'s hill terrain. Your safety is our priority.',
    },
    {
      question: 'What is your cancellation policy?',
      answer: 'Cancellation policies vary based on booking terms. Please contact us for specific details when making your booking.',
    },
  ],

  // CTA
  cta_heading: 'Ready to Explore Uttarakhand?',
  cta_description: 'Book your multi-day car rental today and experience Uttarakhand like never before. Flexible plans, transparent pricing, and unforgettable memories await.',
  cta_features: [
    { text: 'Transparent Pricing' },
    { text: 'Professional Drivers' },
    { text: 'Flexible Itineraries' },
  ],

  // Metadata
  is_published: false,
}
