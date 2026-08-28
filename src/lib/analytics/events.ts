/**
 * EVENT NAME REGISTRY
 *
 * Every PostHog event name in the app lives here. Call sites import a constant
 * rather than passing a string literal, for the same reason CACHE_TAGS exists
 * in src/lib/cacheTags.ts: a typo in one place and the event silently lands
 * under a new name, which nobody notices until a funnel reads zero and someone
 * spends an afternoon working out why.
 *
 * NAMING
 * ------
 * snake_case, `object_action`. PostHog's own reserved events keep their `$`
 * prefix ($pageview, $identify) and are not listed here.
 *
 * This module must stay dependency-free — it is imported by client components,
 * server-adjacent helpers and the analytics wrapper alike, and an import here
 * is how you accidentally pull the Supabase client into a bundle that had no
 * business containing it.
 */
export const ANALYTICS_EVENTS = {
  // --- Booking funnel -------------------------------------------------------
  /** A /booking deep link was parsed and applied (the entry contract). */
  bookingEntry: 'booking_entry',
  /** Wizard step became visible. Fires on forward nav AND browser Back. */
  bookingStepViewed: 'booking_step_viewed',
  /** A tour package was chosen on step 1. */
  bookingPackageSelected: 'booking_package_selected',
  /** A transfer pickup+drop pair resolved to a real route on step 1. */
  bookingRouteSelected: 'booking_route_selected',
  /** A vehicle card was chosen on step 1. */
  bookingVehicleSelected: 'booking_vehicle_selected',
  /** A step's validation passed and the wizard advanced. */
  bookingStepCompleted: 'booking_step_completed',
  /** A step's validation failed and the wizard did not advance. */
  bookingValidationFailed: 'booking_validation_failed',
  /** The first authoritative price+season for the chosen date landed. */
  bookingPriceResolved: 'booking_price_resolved',
  /** Sold out, admin-blocked date, or vehicle capacity exceeded. */
  bookingUnavailable: 'booking_unavailable',

  // --- Payment milestones ---------------------------------------------------
  /**
   * Step 4 reached: the payment screen with the UPI QR is on screen. This is
   * the "completed the wizard" milestone — it is NOT observable from the URL,
   * because step 4 pre-submit and the success screen share one ?step=4 URL.
   */
  bookingPaymentViewed: 'booking_payment_viewed',
  /** Submit pressed; POST /api/bookings/create in flight. */
  bookingSubmitted: 'booking_submitted',
  /** THE CONVERSION. The API returned a booking id. */
  bookingCreated: 'booking_created',
  /** The API refused the booking (409 = blocked date). */
  bookingFailed: 'booking_failed',
  /**
   * The post-booking confirmation screen rendered — the one prompting the
   * customer to share their payment screenshot on WhatsApp.
   */
  bookingConfirmationViewed: 'booking_confirmation_viewed',
  /** The UPI ID was copied. The strongest available payment-intent proxy. */
  paymentUpiCopied: 'payment_upi_copied',
  /** "Share on WhatsApp" pressed on the confirmation screen. */
  paymentScreenshotShared: 'payment_screenshot_shared',
  /** "Share via Email" pressed on the confirmation screen. */
  paymentDetailsEmailed: 'payment_details_emailed',
  /** An addon was toggled. `stage` distinguishes pre- from post-booking. */
  bookingAddonToggled: 'booking_addon_toggled',

  // --- Direct leads ---------------------------------------------------------
  /** A tel: CTA was activated. Deliberately separate from WhatsApp. */
  contactCallClicked: 'contact_call_clicked',
  /** A WhatsApp CTA was activated. Deliberately separate from Call. */
  contactWhatsappClicked: 'contact_whatsapp_clicked',

  // --- Top of funnel --------------------------------------------------------
  /** A "Book Now" style link into /booking was followed. */
  bookingCtaClicked: 'booking_cta_clicked',
  /** The /quote instant-quote form was submitted. */
  quoteRequested: 'quote_requested',
  /** The contact form was submitted. */
  contactFormSubmitted: 'contact_form_submitted',
} as const;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
