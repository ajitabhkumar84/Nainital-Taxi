/**
 * SHARED EVENT PROPERTIES
 *
 * Two jobs:
 *   1. bookingProperties() — derive one consistent property bundle from the
 *      booking store, so every funnel event carries the same shape and a
 *      PostHog breakdown works across all of them rather than only the events
 *      that happened to include a given field.
 *   2. CTA_PLACEMENTS — the controlled vocabulary for *where* a Call/WhatsApp
 *      CTA lives, so "which surface generates leads" is a single breakdown
 *      instead of pattern-matching free-text URLs.
 *
 * NO PII, EVER
 * ------------
 * customerName / customerPhone / customerEmail must never leave the browser as
 * event properties. They are personal data belonging to the customer, they are
 * not needed to answer any funnel question, and once sent they are extremely
 * awkward to purge from a third-party analytics store. Booleans derived from
 * them (has_email, is_international) answer the same analytical questions
 * without carrying the data. bookingProperties() deliberately reads only
 * non-PII fields off the store — do not "just add" a name field here.
 *
 * CARDINALITY
 * -----------
 * packageTitle is deliberately excluded. For transfers it is a synthesized
 * display string built from free-text pickup/drop names
 * ("Transfer: Kathgodam to Nainital", see Step1PackageSelection), so it
 * fragments into hundreds of near-duplicate values and makes every breakdown
 * useless. Send the stable package_id / route_id and join to names in PostHog.
 */

import type { BookingState } from '@/store/bookingStore';

/**
 * Where a contact CTA lives. Closed vocabulary on purpose: a free-text
 * placement would drift ("header" / "Header" / "top-nav") and quietly split
 * one number into three.
 */
export const CTA_PLACEMENTS = {
  header: 'header',
  footer: 'footer',
  footerSocial: 'footer_social',
  floatingWidget: 'floating_widget',
  mobileBar: 'mobile_bar',
  mobileEnquiryModal: 'mobile_enquiry_modal',
  contactPage: 'contact_page',
  contactFaq: 'contact_faq',
  contactForm: 'contact_form',
  landingHero: 'landing_hero',
  landingStickyBar: 'landing_sticky_bar',
  blockedDateNotice: 'blocked_date_notice',
  bookingStep1: 'booking_step_1',
  bookingStep2: 'booking_step_2',
  bookingWidget: 'booking_widget',
  bookingConfirmation: 'booking_confirmation',
  quoteResult: 'quote_result',
  /**
   * Emitted by the delegated listener in GlobalContactWidgets for any anchor
   * that has not been migrated to <CallCTA>/<WhatsAppCTA> yet. Seeing this
   * value in PostHog is the to-do list for the next migration pass — that is
   * the whole point of having it rather than dropping those clicks.
   */
  unmigrated: 'unmigrated',
} as const;

export type CtaPlacement = (typeof CTA_PLACEMENTS)[keyof typeof CTA_PLACEMENTS];

/** Human-readable step names so funnels read as words, not integers. */
export const BOOKING_STEP_NAMES: Record<number, string> = {
  1: 'package_and_vehicle',
  2: 'trip_details',
  3: 'contact_info',
  4: 'payment',
};

export interface BookingEventProperties {
  booking_type: string | null;
  package_id: string | null;
  route_id: string | null;
  vehicle_type: string | null;
  trip_date: string | null;
  days_until_trip: number | null;
  trip_time: string | null;
  passenger_count: number;
  pickup_location: string | null;
  dropoff_location: string | null;
  price_total: number | null;
  price_addons: number;
  season_name: string | null;
  addons_count: number;
  availability_status: string | null;
  has_email: boolean;
  is_international: boolean;
  requires_child_seat: boolean;
  from_destination: string | null;
}

/**
 * Whole days between today and the trip date. More useful than the raw date
 * for the question people actually ask ("do last-minute bookings convert
 * worse?"), and it does not go stale the way a literal date does.
 */
function daysUntil(tripDate: string | null): number | null {
  if (!tripDate) return null;
  const parsed = Date.parse(`${tripDate}T00:00:00`);
  if (Number.isNaN(parsed)) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parsed - today.getTime()) / 86_400_000);
}

/**
 * Build the standard booking property bundle.
 *
 * Takes the state as an argument rather than calling useBookingStore.getState()
 * internally so it stays a pure function — callable from a React event handler,
 * an effect, or a test, without depending on module-level store singletons.
 */
export function bookingProperties(
  state: BookingState
): BookingEventProperties {
  return {
    booking_type: state.bookingType,
    package_id: state.packageId,
    route_id: state.routeId,
    vehicle_type: state.vehicleType,
    trip_date: state.tripDate,
    days_until_trip: daysUntil(state.tripDate),
    trip_time: state.tripTime,
    passenger_count: state.passengerCount,
    pickup_location: state.pickupLocation || null,
    dropoff_location: state.dropoffLocation || null,
    price_total: state.calculatedPrice,
    price_addons: state.addonsTotal,
    season_name: state.seasonName,
    addons_count: state.selectedAddons.length,
    availability_status: state.availabilityStatus,
    // Derived booleans, never the values themselves — see the PII note above.
    has_email: Boolean(state.customerEmail),
    is_international: state.customerCountryCode === 'INTL',
    requires_child_seat: state.requiresChildSeat,
    // Attribution for "did they arrive from a destination page?"
    from_destination: state.routeContext?.destinationSlug ?? null,
  };
}
