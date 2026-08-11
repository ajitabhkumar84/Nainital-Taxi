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
  // Dial code without '+' (e.g. '91'). Defaults to '91' for older rows/callers
  // that predate this column.
  customer_country_code?: string | null;
  customer_email?: string | null;
  customer_whatsapp?: string | null;

  // Package & Vehicle
  package_id?: string | null;
  // Set for route-based transfer bookings instead of package_id — mutually
  // exclusive with it (see bookingLink.ts).
  route_id?: string | null;
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
  addons_total?: number; // Total cost of selected addons
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

export interface TickerBooking {
  id: string; // UUID
  guest_first_name: string;
  guest_city: string;
  service_label: string;
  service_type?: string | null; // 'transfer' | 'day_tour' | 'multi_day_rental' | 'temple_trip'
  real_booking_date?: string | null;
  is_active: boolean;
  last_shown_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrustPillar {
  icon_name: string; // e.g. 'user-check' | 'shield' | 'award' | 'heart' | 'car' | 'phone'
  title: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

export interface TrustSection {
  id: string; // UUID, fixed singleton
  heading: string;
  description: string;
  image_url: string | null; // photo shown beside the section; null = show placeholder
  trust_pillars: TrustPillar[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_TRUST_SECTION: Omit<TrustSection, "id" | "created_at" | "updated_at"> = {
  heading: "Why families trust us",
  description:
    "Every driver is background-verified and professionally trained. Your safety is not an afterthought — it is the foundation of how we operate.",
  image_url: null,
  trust_pillars: [
    { icon_name: "heart", title: "Family values", description: "Drivers are trained to treat every passenger with the care and respect they would give their own family.", display_order: 1, is_active: true },
    { icon_name: "car", title: "Well-maintained vehicles", description: "Our cars are regularly checked and serviced to ensure a comfortable, reliable, and safe journey.", display_order: 2, is_active: true },
    { icon_name: "user-check", title: "Verified drivers", description: "Comprehensive background verification, license validation, and character reference checks are mandatory before anyone joins our team.", display_order: 3, is_active: true },
    { icon_name: "award", title: "Professional training", description: "Our team undergoes strict defensive driving and customer service training to provide the best possible experience.", display_order: 4, is_active: true },
    { icon_name: "phone", title: "Reliable on-road assistance", description: "A dedicated support team is always just a call away to help you out during your trip.", display_order: 5, is_active: true },
  ],
  is_published: true,
};

// Singleton config for the "Why Families Trust Us" section shown on individual
// tour package pages (/tour/[name]). Deliberately a separate table from
// trust_section (the homepage's version) rather than a shared one — same
// isolation rationale as src/lib/pillarIcons.ts's SAFETY_ICON_MAP. No image_url:
// the tour-page card grid design doesn't use one.
export interface TourTrustSection {
  id: string; // UUID, fixed singleton
  heading: string;
  description: string;
  trust_pillars: TrustPillar[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_TOUR_TRUST_SECTION: Omit<TourTrustSection, "id" | "created_at" | "updated_at"> = {
  heading: "Why Families Trust Us",
  description: "Your safety matters more than the lowest fare",
  trust_pillars: [
    { icon_name: "shield", title: "Zero Alcohol Policy", description: "Strict sobriety standards with no exceptions", display_order: 1, is_active: true },
    { icon_name: "user-check", title: "Verified Drivers", description: "Background-checked, trained professionals", display_order: 2, is_active: true },
    { icon_name: "heart", title: "Family-First Care", description: "Drivers who treat you like their own family", display_order: 3, is_active: true },
    { icon_name: "award", title: "10,000+ Safe Trips", description: "Trusted by families across India", display_order: 4, is_active: true },
  ],
  is_published: true,
};

export interface PageSection {
  key: string; // matches a section key rendered in the page component, e.g. 'tours'
  heading: string;
  subheading: string;
}

export interface PageContent {
  page_slug: string; // 'home', 'about', 'contact', ...
  seo_title: string;
  seo_description: string;
  hero_image_url: string | null; // null = keep existing seasonal rotation
  hero_title: string | null; // null = keep existing seasonal rotation
  hero_subtitle: string | null; // null = keep existing seasonal rotation
  sections: PageSection[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_PAGE_CONTENT: Omit<PageContent, "page_slug" | "created_at" | "updated_at"> = {
  seo_title: "",
  seo_description: "",
  hero_image_url: null,
  hero_title: null,
  hero_subtitle: null,
  sections: [],
  is_published: true,
};

// ============================================================================
// CONTACT PAGE CONTENT (singleton, backs /contact — see
// supabase/create_contact_page_schema.sql)
// ============================================================================

export interface ContactBadge {
  label: string;
}

/** One of the four cards in the Contact Information block. Labels only — the
 *  phone/email/address values themselves come from SiteConfig['contact']. */
export interface ContactCardLabels {
  title: string;
  description: string;
  footnote: string;
}

export type ContactCardKey = "whatsapp" | "phone" | "email" | "address";

export interface ContactHourItem {
  icon_name: string;
  strong: string; // emphasised part, e.g. "24/7"
  rest: string; // remainder, e.g. "Available"
}

export interface ContactFaqItem {
  question: string;
  answer: string;
}

export interface ContactTrustBadge {
  icon_name: string;
  label: string;
}

export interface ContactPageContent {
  id: string;

  seo_title: string;
  seo_description: string;

  hero_title: string;
  hero_subtitle: string;
  hero_badges: ContactBadge[];

  form_title: string;
  form_description: string;
  /** Where enquiries are emailed. Blank falls back to the ADMIN_EMAIL env var. */
  enquiry_recipient_email: string | null;

  info_heading: string;
  info_subheading: string;
  contact_cards: Record<ContactCardKey, ContactCardLabels>;

  map_heading: string;
  /** Google Business Profile listing name — drives the embed and the map link. */
  google_business_name: string;
  /** Optional exact-pin override (Google Maps → Share → Embed a map). */
  map_embed_url: string | null;
  map_button_label: string;

  hours_heading: string;
  hours_items: ContactHourItem[];

  faq_heading: string;
  faq_subheading: string;
  faqs: ContactFaqItem[];
  faq_cta_heading: string;
  faq_cta_description: string;

  cta_heading: string;
  cta_subheading: string;
  trust_badges: ContactTrustBadge[];

  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/** Mirrors the seed row in supabase/create_contact_page_schema.sql, so a
 *  missing/unreachable row renders the same page the migration seeds. */
export const DEFAULT_CONTACT_PAGE_CONTENT: Omit<
  ContactPageContent,
  "id" | "created_at" | "updated_at"
> = {
  seo_title: "Contact Us - Nainital Taxi Services",
  seo_description:
    "Get in touch with Nainital Taxi for bookings, inquiries, and quotes. Available 24/7 via phone, WhatsApp, or email. Book your reliable taxi service in Nainital today.",

  hero_title: "Get in Touch",
  hero_subtitle:
    "Book your reliable ride across the region. Request a quote below for our best rates.",
  hero_badges: [
    { label: "Experienced Drivers" },
    { label: "Transparent Pricing" },
    { label: "Free Quote" },
  ],

  form_title: "Request a Free Quote",
  form_description:
    "Fill out the form below and our team will get back to you shortly to confirm your booking.",
  enquiry_recipient_email: "taxinainital@gmail.com",

  info_heading: "Contact Information",
  info_subheading: "Reach out to us anytime - we're always here to assist you",
  contact_cards: {
    whatsapp: { title: "WhatsApp", description: "Chat with us instantly", footnote: "Click to start chat" },
    phone: { title: "Call Us", description: "Available 24/7 for bookings", footnote: "Tap to call now" },
    email: { title: "Email", description: "Send us a message", footnote: "Click to compose email" },
    address: { title: "Office Address", description: "Visit us for in-person bookings", footnote: "" },
  },

  map_heading: "Find Us on Map",
  google_business_name: "Nainital Taxi",
  map_embed_url: null,
  map_button_label: "Open in Google Maps",

  hours_heading: "Operating Hours",
  hours_items: [
    { icon_name: "clock", strong: "24/7", rest: "Available" },
    { icon_name: "calendar", strong: "365 Days", rest: "a Year" },
    { icon_name: "award", strong: "Instant", rest: "Booking" },
  ],

  faq_heading: "Frequently Asked Questions",
  faq_subheading: "Everything you need to know about booking with Nainital Taxi",
  faqs: [
    {
      question: "How can I book a taxi with Nainital Taxi?",
      answer:
        "You can book a taxi by filling out our online form above, calling us directly, or sending us a message on WhatsApp. We respond instantly to all booking requests.",
    },
    {
      question: "What are your operating hours?",
      answer:
        "We operate 24/7, 365 days a year. You can book a taxi or contact us anytime, day or night, including weekends and holidays.",
    },
    {
      question: "Do you charge for cancellations?",
      answer:
        "We understand that plans change. Free cancellation is available up to 2 hours before your scheduled pickup time. Cancellations within 2 hours may incur a minimal charge.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept multiple payment methods including cash, UPI (Google Pay, PhonePe, Paytm), credit/debit cards, and bank transfers. Payment can be made before or after your journey.",
    },
    {
      question: "Are your drivers experienced and verified?",
      answer:
        "Yes, all our drivers are highly experienced, licensed, and background-verified. They have extensive knowledge of the Nainital region and prioritize your safety and comfort. We maintain a strict zero-alcohol policy.",
    },
    {
      question: "Do you provide airport and railway station pickup services?",
      answer:
        "Absolutely! We provide reliable pickup and drop services from Pantnagar Airport, Kathgodam Railway Station, and all major locations in Uttarakhand.",
    },
    {
      question: "Can I request a specific vehicle type?",
      answer:
        "Yes, we have a diverse fleet including Sedans, SUVs, Innova Crysta, and Tempo Travellers. You can specify your preferred vehicle type when booking, and we'll do our best to accommodate your request.",
    },
    {
      question: "What if I have extra luggage or special requirements?",
      answer:
        "Please inform us about extra luggage, child seats, wheelchair accessibility, or any special requirements when booking. We'll ensure your vehicle is equipped accordingly at no extra charge.",
    },
    {
      question: "How do you calculate the taxi fare?",
      answer:
        "Our fares are transparent and competitive, based on distance, vehicle type, and route. You'll receive a clear quote before booking with no hidden charges. Check our rates page for detailed pricing.",
    },
    {
      question: "Do you offer multi-day tour packages?",
      answer:
        "Yes, we offer customized multi-day tour packages covering popular destinations like Nainital, Kainchi Dham, Ranikhet, Almora, Jim Corbett, and more. Contact us to plan your perfect Kumaon Hills tour.",
    },
  ],
  faq_cta_heading: "Still Have Questions?",
  faq_cta_description:
    "Our team is here to help! Contact us anytime for personalized assistance.",

  cta_heading: "Ready to Book Your Journey?",
  cta_subheading: "Experience safe, comfortable, and reliable taxi services in Nainital",
  trust_badges: [
    { icon_name: "shield", label: "Verified Drivers" },
    { icon_name: "heart", label: "Zero Alcohol Policy" },
    { icon_name: "award", label: "10,000+ Safe Trips" },
  ],

  is_published: true,
};

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
// ADDON TYPES (Revenue-Generating Addons)
// ============================================================================

/**
 * Main addon entity
 */
export interface Addon {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  icon_emoji?: string | null;
  show_before_booking: boolean;
  show_after_booking: boolean;
  off_season_price: number;
  season_price: number;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Addon-Package relationship
 */
export interface AddonPackage {
  id: string;
  addon_id: string;
  package_id: string;
  created_at: string;
}

/**
 * Addon-Destination relationship
 */
export interface AddonDestination {
  id: string;
  addon_id: string;
  destination_id: string;
  created_at: string;
}

/**
 * Booking addon junction (historical snapshot)
 */
export interface BookingAddon {
  id: string;
  booking_id: string;
  addon_id: string;
  addon_name: string;
  addon_price: number;
  season_name: 'Off-Season' | 'Season';
  selected_at_stage: 'before_booking' | 'after_booking';
  created_at: string;
}

/**
 * Selected addon in booking store (runtime state)
 */
export interface SelectedAddon {
  id: string;
  name: string;
  price: number;
  season_name: 'Off-Season' | 'Season';
  icon_emoji?: string | null;
}

/**
 * Addon with computed price (for display)
 */
export interface AddonWithPrice extends Addon {
  price: number; // Season-selected price (either season_price or off_season_price)
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
 * A package is "Taxi + Hotel" only if it has non-empty hotel_options; otherwise it's taxi-only.
 */
export function hasHotelOption(itinerary: Pick<TourItinerary, 'hotel_options'> | null | undefined): boolean {
  return Boolean(itinerary?.hotel_options && itinerary.hotel_options.length > 0);
}

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
 * All vehicle types, in display order. Shared by every admin pricing UI
 * (RouteForm, the /admin/pricing tabs) so the row order can't drift between them.
 */
export const VEHICLE_TYPES: VehicleType[] = ['sedan', 'suv_normal', 'suv_deluxe', 'suv_luxury'];

/**
 * The only two season names the `pricing` / `route_pricing` tables accept
 * (see the CHECK constraints in supabase/schema_enhanced.sql and
 * supabase/create_routes_table.sql). Not the same thing as rows in the
 * `seasons` table, which can have several date ranges per name.
 */
export const SEASON_NAMES = ['Off-Season', 'Season'] as const;
export type SeasonName = (typeof SEASON_NAMES)[number];

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
// PPC LANDING PAGE CONFIGURATION TYPES
// ============================================================================

export type LandingTheme = 'rainy' | 'autumn' | 'winter';
export type LandingThemeMode = 'auto' | LandingTheme;

export interface LandingPricingLine {
  id: string;
  label: string;
  priceText: string;
  note?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface LandingPageConfig {
  themeMode: LandingThemeMode;
  hero: {
    badgeText: string;
    headline: string;
    subheadline: string;
  };
  whatsappMessageTemplate: string;
  pricingLines: LandingPricingLine[];
  featuredPackageSlugs: string[];
  showBookingWidget: boolean;
  updatedAt?: string;
}

export const DEFAULT_LANDING_PAGE_CONFIG: LandingPageConfig = {
  themeMode: 'auto',
  hero: {
    badgeText: '🟢 Off-Season Rates Live — Save up to 30%',
    headline: 'Reliable Nainital Taxis at Honest Off-Season Rates',
    subheadline: 'Local drivers who know every bend of these hills. Fixed prices, clean cabs, on-time pickup from Kathgodam, Delhi & beyond — no haggling, no surprises.',
  },
  whatsappMessageTemplate: 'Hi! 👋 I need a taxi quote for Nainital 🚕 Looking for the off-season rate ✨',
  pricingLines: [
    { id: 'pl-1', label: 'Sedan (Dzire / Aura)', priceText: '₹2,500/day', note: 'Seats 4 · AC', isActive: true, displayOrder: 0 },
    { id: 'pl-2', label: 'SUV (Ertiga)', priceText: '₹3,500/day', note: 'Seats 6 · AC', isActive: true, displayOrder: 1 },
    { id: 'pl-3', label: 'Innova', priceText: '₹4,500/day', note: 'Seats 7 · AC', isActive: true, displayOrder: 2 },
    { id: 'pl-4', label: 'Innova Crysta', priceText: '₹5,500/day', note: 'Seats 7 · Premium', isActive: true, displayOrder: 3 },
  ],
  featuredPackageSlugs: ['lake-tour-kainchi-dham', 'nainital-darshan', 'neem-karoli-4-dham'],
  showBookingWidget: true,
};

// ============================================================================
// B2B PAGE CONFIGURATION TYPES
// ============================================================================

export interface B2BPricingTier {
  name: string;           // e.g., "Bronze", "Silver", "Gold"
  monthly_volume: string; // e.g., "5-15 trips", "15-40 trips"
  discount: string;       // e.g., "8% off retail", "12% off retail"
  payment_terms: string;  // e.g., "Advance per trip", "Weekly settlement"
  is_featured: boolean;   // Highlight this tier
  order: number;         // Display order
}

export interface B2BBenefit {
  title: string;
  description: string;
  icon: string;  // emoji or icon name
  order: number;
}

export interface B2BTestimonial {
  company_name: string;
  person_name: string;
  designation: string;
  testimonial: string;
  rating: number;
  order: number;
}

export interface B2BFleetShowcase {
  vehicle_name: string;
  capacity: string;
  model_year: string;
  ac_status: string;
  image_url?: string;
  order: number;
}

export interface B2BPageConfig {
  // Hero Section
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_cta_text: string;
  hero_cta_secondary_text: string;

  // Company Info
  gst_number: string;
  company_address: string;
  service_area_description: string;

  // Fleet Showcase
  total_vehicles: number;
  fleet_items: B2BFleetShowcase[];

  // Pricing Tiers
  pricing_section_title: string;
  pricing_section_description: string;
  pricing_tiers: B2BPricingTier[];

  // Benefits
  benefits_section_title: string;
  benefits: B2BBenefit[];

  // Testimonials
  testimonials_section_title: string;
  testimonials: B2BTestimonial[];

  // Rate Card
  rate_card_pdf_url?: string;
  rate_card_download_text: string;

  // Partnership Form
  form_title: string;
  form_description: string;

  // Trust Indicators
  years_experience: string;
  satisfied_operators: string;
  monthly_trips: string;

  // Contact
  contact_person_name: string;
  contact_person_designation: string;
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;

  // SEO
  meta_title?: string;
  meta_description?: string;

  // Status
  is_active: boolean;
  updated_at?: string;
}

export const DEFAULT_B2B_CONFIG: B2BPageConfig = {
  hero_title: "Partner with Nainital's Most Reliable Local Taxi Service",
  hero_subtitle: "B2B Partnership Program for Tour Operators",
  hero_description: "Join hands with us for reliable, professional taxi services for your clients. Competitive rates, verified drivers, and 24/7 support.",
  hero_cta_text: "Request Partnership",
  hero_cta_secondary_text: "Download Rate Card",

  gst_number: "07XXXXX1234X1ZX",
  company_address: "Nainital, Uttarakhand 263001",
  service_area_description: "Complete Uttarakhand coverage including Nainital, Kathgodam, Haldwani, Bhimtal, Mukteshwar, and surrounding areas.",

  total_vehicles: 7,
  fleet_items: [
    { vehicle_name: "Sedan", capacity: "4 Seater", model_year: "2020-2023", ac_status: "AC", order: 1 },
    { vehicle_name: "SUV Standard", capacity: "6-7 Seater", model_year: "2019-2023", ac_status: "AC", order: 2 },
    { vehicle_name: "SUV Deluxe", capacity: "7 Seater", model_year: "2020-2024", ac_status: "AC", order: 3 },
  ],

  pricing_section_title: "Flexible Pricing Tiers",
  pricing_section_description: "Choose the plan that matches your business volume",
  pricing_tiers: [
    { name: "Bronze", monthly_volume: "5-15 trips", discount: "8% off retail", payment_terms: "Advance per trip", is_featured: false, order: 1 },
    { name: "Silver", monthly_volume: "15-40 trips", discount: "12% off retail", payment_terms: "Weekly settlement", is_featured: true, order: 2 },
    { name: "Gold", monthly_volume: "40+ trips", discount: "15-18% off retail", payment_terms: "Monthly, 15-day credit", is_featured: false, order: 3 },
  ],

  benefits_section_title: "Why Tour Operators Choose Us",
  benefits: [
    { title: "100% Reliability", description: "Cars show up every time, even during peak season", icon: "✓", order: 1 },
    { title: "Fleet Capacity", description: "Handle 5+ simultaneous bookings with ease", icon: "🚗", order: 2 },
    { title: "Transparent Pricing", description: "Fixed base rates with clear margin structure", icon: "💰", order: 3 },
    { title: "GST Invoices", description: "Proper documentation and monthly statements", icon: "📄", order: 4 },
    { title: "Dedicated Support", description: "Single WhatsApp contact, fast response", icon: "💬", order: 5 },
    { title: "Local Expertise", description: "15+ years in Nainital tourism", icon: "🏔️", order: 6 },
  ],

  testimonials_section_title: "What Our Partners Say",
  testimonials: [],

  rate_card_pdf_url: "",
  rate_card_download_text: "Download Complete Rate Card (PDF)",

  form_title: "Request Partnership",
  form_description: "Fill in your details and we'll get back to you within 24 hours",

  years_experience: "15+",
  satisfied_operators: "50+",
  monthly_trips: "200+",

  contact_person_name: "Partnership Manager",
  contact_person_designation: "B2B Relations",
  contact_email: "b2b@nainialtaxi.com",
  contact_phone: "+918445206116",
  contact_whatsapp: "+918445206116",

  meta_title: "B2B Partnership | Tour Operator Taxi Services | Nainital Taxi",
  meta_description: "Partner with Nainital's most reliable taxi service. Competitive rates, verified drivers, GST invoices, 24/7 support for tour operators.",

  is_active: true,
};

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
  capacity?: string;         // e.g., "4+1 Seater"
  tagline?: string;          // e.g., "Comfortable & Reliable"
  whatsapp_message?: string; // Per-category pre-filled WhatsApp template; "{category}" is replaced with `name` at render time
}

/**
 * A single safety-pillar entry in the Multi-Day Rental "Safety Promise" section
 */
export interface SafetyPillar {
  icon: string;        // lucide icon name, see src/lib/pillarIcons.ts
  title: string;
  description: string;
}

/**
 * A recurring annual month/day window, e.g. { start: "04-15", end: "07-10" }.
 * May wrap the year boundary (start > end, e.g. "12-20" -> "01-15").
 */
export interface MonthDayRange {
  start: string; // "MM-DD"
  end: string;   // "MM-DD"
}

export type SeasonOverride = 'auto' | 'force_season' | 'force_mid_season' | 'force_off_season';

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
 *
 * @deprecated Backed the "Choose Your Duration" section, which was removed
 * from the public page in favour of the admin-picked Featured Packages block.
 * Kept so existing copy in package_1..package_4 is preserved; nothing renders it.
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

  // Routing
  page_slug: string; // public URL path segment, e.g. "multi-day-rental"

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
  hero_trust_badges: string[]; // qualitative chips, e.g. "Verified Drivers"

  // Photo used in the "Multi-Day Rentals" card on the site homepage (/) —
  // distinct from hero_image_url above, which is this page's own hero.
  homepage_card_image_url?: string | null;

  // Safety Promise Section (inlined content — see SafetyPillar)
  safety_heading: string;
  safety_subheading: string;
  safety_pillars: SafetyPillar[]; // up to 4

  // Pricing Section
  pricing_heading: string;
  pricing_subheading: string;
  pricing_season_label: string;
  // Deprecated free-text ranges, preserved only so the admin can see what
  // was previously entered while migrating to pricing_season_ranges.
  legacy_pricing_season_date_ranges?: string[];
  pricing_season_description: string;
  pricing_mid_season_label: string;
  legacy_pricing_mid_season_date_ranges?: string[];
  pricing_mid_season_description: string;
  pricing_off_season_label: string;
  legacy_pricing_off_season_date_ranges?: string[];
  pricing_off_season_description: string;
  pricing_note_text: string;
  car_categories: MultiDayCarCategory[];

  // Structured, machine-comparable seasonality (recurring annual month/day
  // windows) plus an admin override for which tier is treated as "active".
  pricing_season_ranges: MonthDayRange[];
  pricing_mid_season_ranges: MonthDayRange[];
  pricing_off_season_ranges: MonthDayRange[];
  season_override: SeasonOverride;

  // SEO Content Block (2-column: rich-text body + bullet highlights)
  seo_content_heading?: string;
  seo_content_body?: string; // admin-authored HTML from the rich text editor
  seo_content_highlights: string[];

  // Inclusion/Exclusion Section
  inclusion_exclusion_heading: string;
  inclusion_exclusion_subheading: string;
  items_included: InclusionExclusionItem[];
  items_excluded: InclusionExclusionItem[];

  // Enquiry CTA Section — sits directly under the inclusions/exclusions block,
  // which is where visitors previously hit a dead end with nothing to act on.
  enquiry_cta_enabled: boolean;
  enquiry_cta_heading: string;
  enquiry_cta_description: string;
  enquiry_cta_whatsapp_label: string;
  enquiry_cta_whatsapp_message: string;
  enquiry_cta_secondary_label: string;
  enquiry_cta_secondary_href: string; // internal path (e.g. "/contact") or full URL
  enquiry_cta_reassurance: string;    // small print under the buttons

  // Tour Duration Packages Section
  // @deprecated — the "Choose Your Duration" section was removed from the
  // public page and from the admin form. These columns are retained so the
  // copy already entered is not destroyed; nothing reads them.
  packages_heading: string;
  packages_subheading: string;
  package_1: TourDurationPackage;
  package_2: TourDurationPackage;
  package_3: TourDurationPackage;
  package_4: TourDurationPackage;

  // Featured Packages Section — real `packages` rows, hand-picked by the admin
  popular_itineraries_heading: string;
  popular_itineraries_subheading: string;
  featured_package_ids: string[];  // packages.id values, stored in display order

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
  page_slug: 'multi-day-rental',

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
  hero_trust_badges: ['Verified Drivers', 'Zero Alcohol Policy', '24/7 Support'],

  // Safety Promise
  safety_heading: 'Your Safety, Our Promise',
  safety_subheading: 'Every trip is backed by these commitments to you',
  safety_pillars: [
    { icon: 'user-check', title: 'Verified Drivers', description: 'Background-checked, experienced hill drivers' },
    { icon: 'shield', title: 'Zero Alcohol Policy', description: 'Strictly enforced for every trip, every driver' },
    { icon: 'car', title: 'Well-Maintained Fleet', description: 'Regularly serviced and safety-inspected vehicles' },
    { icon: 'phone', title: '24/7 Support', description: 'A number to call any time, day or night' },
  ],

  // Pricing
  pricing_heading: 'Choose Your Ride',
  pricing_subheading: 'Per day rates for various car categories - transparent pricing for every season',
  pricing_season_label: 'Season Rates',
  pricing_season_description: 'Peak tourist season',
  pricing_mid_season_label: 'Mid Season',
  pricing_mid_season_description: 'Moderate season',
  pricing_off_season_label: 'Off-Season Rates',
  pricing_off_season_description: 'Off-peak season',
  pricing_note_text: 'Above charges are general rates. Exact charges depend on itinerary and number of days.',
  car_categories: [],

  // Structured seasonality (mirrors the copy above, in comparable MM-DD form)
  pricing_season_ranges: [{ start: '04-15', end: '07-10' }, { start: '12-20', end: '01-15' }],
  pricing_mid_season_ranges: [{ start: '07-11', end: '09-30' }, { start: '01-16', end: '04-14' }],
  pricing_off_season_ranges: [{ start: '10-01', end: '12-19' }],
  season_override: 'auto',

  // SEO Content Block
  seo_content_heading: 'Why Choose Our Multi-Day Rentals',
  seo_content_body: '',
  seo_content_highlights: [],

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

  // Enquiry CTA
  enquiry_cta_enabled: true,
  enquiry_cta_heading: 'Not sure which plan fits your trip?',
  enquiry_cta_description: 'Send us your dates and the places you want to cover. We reply with an exact, all-inclusive quote — no obligation.',
  enquiry_cta_whatsapp_label: 'Send Your Enquiry on WhatsApp',
  enquiry_cta_whatsapp_message: 'Hi! I would like a quote for a multi-day taxi rental. My travel dates are ______ and I want to cover ______.',
  enquiry_cta_secondary_label: 'Use the Enquiry Form',
  enquiry_cta_secondary_href: '/contact',
  enquiry_cta_reassurance: 'Usually replies within 10 minutes · 8 AM – 10 PM',

  // Packages (deprecated — no longer rendered, retained to preserve copy)
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

  // Featured Packages
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
