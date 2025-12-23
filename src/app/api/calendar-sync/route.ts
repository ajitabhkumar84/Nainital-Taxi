/**
 * GOOGLE CALENDAR SYNC API ROUTE
 *
 * Syncs events from Google Calendar to the availability system
 * This endpoint can be called manually or via a cron job
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  CalendarEvent,
  CalendarSyncResult,
  aggregateEventsByDate,
  getSyncDateRange,
} from "@/lib/google-calendar";

// Initialize Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Google Calendar configuration
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Check if Google Calendar is configured
    if (!GOOGLE_CALENDAR_ID || !GOOGLE_API_KEY) {
      return NextResponse.json({
        success: false,
        message: "Google Calendar not configured. Please add GOOGLE_CALENDAR_ID and GOOGLE_API_KEY to your environment variables.",
        eventsProcessed: 0,
        datesUpdated: [],
        errors: ["Missing configuration"],
      } as CalendarSyncResult);
    }

    // Get date range for sync
    const { start, end } = getSyncDateRange(90);

    // Fetch events from Google Calendar
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      GOOGLE_CALENDAR_ID
    )}/events?key=${GOOGLE_API_KEY}&timeMin=${start}T00:00:00Z&timeMax=${end}T23:59:59Z&singleEvents=true&orderBy=startTime&maxResults=250`;

    const response = await fetch(calendarUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Calendar API error:", errorText);

      return NextResponse.json({
        success: false,
        message: "Failed to fetch events from Google Calendar",
        eventsProcessed: 0,
        datesUpdated: [],
        errors: [`API Error: ${response.status}`],
      } as CalendarSyncResult);
    }

    const data = await response.json();
    const events: CalendarEvent[] = data.items || [];

    // Aggregate events by date
    const dateAggregates = aggregateEventsByDate(events);

    // Get fleet size from admin settings
    const { data: fleetSizeSetting } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "fleet_size")
      .single();

    const fleetSize = fleetSizeSetting?.value || 10;

    // Update availability for each date
    const updatedDates: string[] = [];
    const errors: string[] = [];

    for (const [date, { count, notes }] of Array.from(dateAggregates.entries())) {
      try {
        const carsBooked = Math.min(count, fleetSize);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("availability") as any).upsert(
          {
            date,
            total_fleet_size: fleetSize,
            cars_booked: carsBooked,
            // cars_available and status are computed by database
            synced_from_gcal: true,
            last_synced_at: new Date().toISOString(),
            internal_notes: `Synced from Google Calendar: ${notes.join(", ")}`,
          },
          { onConflict: "date" }
        );

        if (error) {
          errors.push(`Failed to update ${date}: ${error.message}`);
        } else {
          updatedDates.push(date);
        }
      } catch (err) {
        errors.push(`Error processing ${date}: ${err}`);
      }
    }

    // Update last sync timestamp in admin settings
    await supabase.from("admin_settings").upsert(
      {
        key: "last_calendar_sync",
        value: new Date().toISOString(),
        description: "Last Google Calendar sync timestamp",
      },
      { onConflict: "key" }
    );

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${events.length} events`,
      eventsProcessed: events.length,
      datesUpdated: updatedDates,
      errors,
    } as CalendarSyncResult);
  } catch (error) {
    console.error("Calendar sync error:", error);

    return NextResponse.json({
      success: false,
      message: "Internal server error during sync",
      eventsProcessed: 0,
      datesUpdated: [],
      errors: [String(error)],
    } as CalendarSyncResult);
  }
}

// GET request returns sync status
export async function GET() {
  try {
    // Get last sync timestamp
    const { data: lastSyncSetting } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "last_calendar_sync")
      .single();

    const isConfigured = !!(GOOGLE_CALENDAR_ID && GOOGLE_API_KEY);

    return NextResponse.json({
      configured: isConfigured,
      calendarId: GOOGLE_CALENDAR_ID ? `${GOOGLE_CALENDAR_ID.slice(0, 10)}...` : null,
      lastSync: lastSyncSetting?.value || null,
      message: isConfigured
        ? "Google Calendar is configured and ready to sync"
        : "Google Calendar is not configured. Add GOOGLE_CALENDAR_ID and GOOGLE_API_KEY to your environment.",
    });
  } catch (error) {
    return NextResponse.json({
      configured: false,
      error: String(error),
    });
  }
}
