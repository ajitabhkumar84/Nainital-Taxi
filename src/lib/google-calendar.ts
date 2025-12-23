/**
 * GOOGLE CALENDAR INTEGRATION
 *
 * Syncs Google Calendar events with availability system
 * Uses Google Calendar API v3 with Service Account authentication
 */

// Types for Google Calendar events
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    date?: string; // For all-day events
    dateTime?: string; // For timed events
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  status: "confirmed" | "tentative" | "cancelled";
}

export interface CalendarSyncResult {
  success: boolean;
  eventsProcessed: number;
  datesUpdated: string[];
  errors: string[];
}

/**
 * Parse a Google Calendar event to extract the booking date
 */
export function parseEventDate(event: CalendarEvent): string | null {
  // For all-day events, use the date directly
  if (event.start.date) {
    return event.start.date;
  }

  // For timed events, extract the date from dateTime
  if (event.start.dateTime) {
    return event.start.dateTime.split("T")[0];
  }

  return null;
}

/**
 * Parse event summary to extract number of cars booked
 * Expected formats:
 * - "Booking: 2 cars" -> 2
 * - "2 cars booked" -> 2
 * - "Car booking" -> 1
 * - Any event without number -> 1
 */
export function parseCarCount(summary: string): number {
  // Try to find a number followed by "car" or "cars"
  const match = summary.match(/(\d+)\s*cars?/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  // Default to 1 car if no number specified
  return 1;
}

/**
 * Check if an event represents a booking (not a general event)
 * Events with "booking", "booked", "taxi", or "car" in the title are considered bookings
 */
export function isBookingEvent(event: CalendarEvent): boolean {
  const summary = event.summary.toLowerCase();
  const bookingKeywords = ["booking", "booked", "taxi", "car", "trip", "pickup", "transfer"];

  // Check if event is confirmed (not cancelled)
  if (event.status === "cancelled") {
    return false;
  }

  // Check for booking keywords
  return bookingKeywords.some((keyword) => summary.includes(keyword));
}

/**
 * Group events by date and calculate total cars booked per day
 */
export function aggregateEventsByDate(
  events: CalendarEvent[]
): Map<string, { count: number; notes: string[] }> {
  const dateMap = new Map<string, { count: number; notes: string[] }>();

  for (const event of events) {
    // Skip non-booking events
    if (!isBookingEvent(event)) continue;

    const date = parseEventDate(event);
    if (!date) continue;

    const carCount = parseCarCount(event.summary);
    const existing = dateMap.get(date) || { count: 0, notes: [] };

    dateMap.set(date, {
      count: existing.count + carCount,
      notes: [...existing.notes, event.summary],
    });
  }

  return dateMap;
}

/**
 * Build Google Calendar API URL for fetching events
 * Note: In production, this would be called server-side with proper auth
 */
export function buildCalendarUrl(
  calendarId: string,
  apiKey: string,
  timeMin: string,
  timeMax: string
): string {
  const baseUrl = "https://www.googleapis.com/calendar/v3/calendars";
  const params = new URLSearchParams({
    key: apiKey,
    timeMin: `${timeMin}T00:00:00Z`,
    timeMax: `${timeMax}T23:59:59Z`,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  return `${baseUrl}/${encodeURIComponent(calendarId)}/events?${params.toString()}`;
}

/**
 * Format sync results for display
 */
export function formatSyncResults(result: CalendarSyncResult): string {
  if (!result.success) {
    return `Sync failed: ${result.errors.join(", ")}`;
  }

  const parts = [];
  parts.push(`Processed ${result.eventsProcessed} events`);

  if (result.datesUpdated.length > 0) {
    parts.push(`Updated ${result.datesUpdated.length} dates`);
  }

  if (result.errors.length > 0) {
    parts.push(`${result.errors.length} warnings`);
  }

  return parts.join(" • ");
}

/**
 * Get date range for sync (next 90 days by default)
 */
export function getSyncDateRange(daysAhead: number = 90): { start: string; end: string } {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + daysAhead);

  return {
    start: today.toISOString().split("T")[0],
    end: endDate.toISOString().split("T")[0],
  };
}
