/**
 * Shared default copy for a date that online booking is unavailable for —
 * via the `availability.is_blocked` flag (single date, set through
 * /admin/availability) or the `booking_blackout` table (date range).
 *
 * Deliberately a standalone leaf module with no imports: lib/pricing.ts and
 * lib/supabase/queries_enhanced.ts each transitively import the other via
 * lib/supabase/index.ts, so importing across them directly here would create
 * a circular dependency.
 */
export const DEFAULT_BLOCKED_MESSAGE =
  'Due to high demand, online bookings are currently paused for this date. Please contact us directly via phone or WhatsApp to check real-time availability and pricing.';
