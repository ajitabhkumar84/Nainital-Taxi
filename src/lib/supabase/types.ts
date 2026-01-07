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
      { id: '4', href: '/fleet', label: 'Fleet', isActive: true, displayOrder: 3 },
      { id: '5', href: '/about', label: 'About', isActive: true, displayOrder: 4 },
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
          { id: 'ql-4', href: '/fleet', label: 'Our Fleet', isActive: true, displayOrder: 3 },
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
