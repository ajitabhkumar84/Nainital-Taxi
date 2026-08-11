import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  calculateAdvanceAmount,
  validatePhone,
  normalizePhone,
  validateEmail,
} from '@/lib/booking';
import {
  sendBookingConfirmation,
  sendAdminNotification,
} from '@/lib/notifications';
import { SelectedAddon } from '@/lib/supabase/types';
import { isBookingAllowed } from '@/lib/supabase';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key =
    serviceRoleKey && serviceRoleKey !== 'your-service-role-key-here'
      ? serviceRoleKey
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

interface CreateBookingRequest {
  customerName: string;
  customerPhone: string;
  // Defaults to '91' (India) when omitted — see validatePhone/normalizePhone.
  customerCountryCode?: string;
  customerEmail?: string;
  packageId?: string;
  // Set for route-based transfers instead of packageId — mutually exclusive
  // with it (see bookingLink.ts's parseBookingEntry).
  routeId?: string;
  packageName: string;
  vehicleType: string;
  tripDate: string;
  tripTime: string;
  pickupLocation: string;
  dropoffLocation?: string;
  passengers: number;
  // Client-side estimate only, shown in the UI before submission.
  // Never trusted: the server always recomputes the real price below.
  totalAmount?: number;
  addonsTotal?: number;
  selectedAddons?: SelectedAddon[];
  seasonName?: string;
  specialRequests?: string;
}

interface ResolvedPricing {
  price: number;
  packageName: string;
  seasonName: 'Off-Season' | 'Season';
}

async function resolveSeasonName(
  supabase: SupabaseClient,
  date: string
): Promise<'Off-Season' | 'Season'> {
  const { data } = await supabase
    .from('seasons')
    .select('name')
    .eq('is_active', true)
    .lte('start_date', date)
    .gte('end_date', date)
    .order('name', { ascending: false })
    .limit(1)
    .single();

  return (data?.name as 'Off-Season' | 'Season') || 'Off-Season';
}

// Tour packages are priced via the `pricing` table.
async function resolvePackagePrice(
  supabase: SupabaseClient,
  packageId: string,
  vehicleType: string,
  seasonName: string
): Promise<ResolvedPricing | null> {
  const { data } = await supabase
    .from('pricing')
    .select('price, packages ( title )')
    .eq('package_id', packageId)
    .eq('vehicle_type', vehicleType)
    .eq('season_name', seasonName)
    .eq('is_active', true)
    .single();

  if (!data) return null;

  const row = data as unknown as { price: number; packages: { title: string } | null };

  return {
    price: row.price,
    packageName: row.packages?.title || 'Package',
    seasonName: seasonName as 'Off-Season' | 'Season',
  };
}

// Transfers pass a `routes` row id in the packageId field (see BookingWidget's
// transfer handler) — the `pricing` table lookup above won't match, so fall
// back to `route_pricing`. packageName is still derived purely from the DB,
// never from client input.
async function resolveRoutePrice(
  supabase: SupabaseClient,
  routeId: string,
  vehicleType: string,
  seasonName: string
): Promise<ResolvedPricing | null> {
  const { data } = await supabase
    .from('route_pricing')
    .select('price')
    .eq('route_id', routeId)
    .eq('vehicle_type', vehicleType)
    .eq('season_name', seasonName)
    .eq('is_active', true)
    .single();

  if (!data) return null;

  const { data: route } = await supabase
    .from('routes')
    .select('pickup_location, drop_location')
    .eq('id', routeId)
    .single();

  const packageName = route
    ? `${route.pickup_location} to ${route.drop_location}`
    : 'Transfer';

  return {
    price: (data as { price: number }).price,
    packageName,
    seasonName: seasonName as 'Off-Season' | 'Season',
  };
}

interface ResolvedAddon {
  addon_id: string;
  addon_name: string;
  addon_price: number;
}

// Re-prices addons from the `addons` table by id — client-supplied
// addon.price/addon.name values are never used.
async function resolveAddons(
  supabase: SupabaseClient,
  selectedAddons: SelectedAddon[] | undefined,
  seasonName: string
): Promise<{ total: number; records: ResolvedAddon[] }> {
  const ids = (selectedAddons || []).map((a) => a.id).filter(Boolean);
  if (ids.length === 0) return { total: 0, records: [] };

  const { data: addons } = await supabase
    .from('addons')
    .select('id, name, off_season_price, season_price')
    .in('id', ids)
    .eq('is_active', true);

  const records: ResolvedAddon[] = (addons || []).map((addon) => ({
    addon_id: addon.id,
    addon_name: addon.name,
    addon_price: seasonName === 'Season' ? addon.season_price : addon.off_season_price,
  }));

  const total = records.reduce((sum, r) => sum + r.addon_price, 0);
  return { total, records };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateBookingRequest = await request.json();

    // Validate required fields. totalAmount is deliberately not required here —
    // it is a client display estimate only and is never used below.
    const requiredFields = [
      'customerName',
      'customerPhone',
      'packageName',
      'vehicleType',
      'tripDate',
      'tripTime',
      'pickupLocation',
    ];

    for (const field of requiredFields) {
      if (!body[field as keyof CreateBookingRequest]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    if (!body.packageId && !body.routeId) {
      return NextResponse.json(
        { error: 'A package or vehicle selection is required' },
        { status: 400 }
      );
    }

    // Validate phone number
    const customerCountryCode = body.customerCountryCode || '91';
    if (!validatePhone(body.customerPhone, customerCountryCode)) {
      return NextResponse.json(
        { error: 'Please enter a valid phone number' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (body.customerEmail && !validateEmail(body.customerEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Reject bookings for a date blocked via /admin/availability
    // (availability.is_blocked) or an active booking_blackout range — the
    // last line of defense if a client bypasses the wizard's own (now also
    // fixed) availability checks, e.g. by calling this endpoint directly.
    const bookingStatus = await isBookingAllowed(body.tripDate);
    if (!bookingStatus.allowed) {
      return NextResponse.json(
        { error: bookingStatus.message || 'Bookings are currently paused for this date.' },
        { status: 409 }
      );
    }

    const supabase = getSupabaseClient();

    // Server-side price authority: body.totalAmount is never read from here on.
    // We resolve the season, then look up the real price against whichever
    // ID the client sent — routeId and packageId are mutually exclusive
    // (see bookingLink.ts), so this is an explicit dispatch, not a guess.
    const seasonName = await resolveSeasonName(supabase, body.tripDate);

    const pricing = body.routeId
      ? await resolveRoutePrice(supabase, body.routeId, body.vehicleType, seasonName)
      : await resolvePackagePrice(supabase, body.packageId!, body.vehicleType, seasonName);

    if (!pricing) {
      return NextResponse.json(
        { error: 'Unable to determine pricing for this booking. Please contact us to complete your booking.' },
        { status: 400 }
      );
    }

    const { total: addonsTotal, records: addonRecords } = await resolveAddons(
      supabase,
      body.selectedAddons,
      seasonName
    );

    const totalAmount = pricing.price + addonsTotal;
    const advanceAmount = calculateAdvanceAmount(totalAmount);

    const normalizedPhone = normalizePhone(body.customerPhone, customerCountryCode);

    const bookingData = {
      customer_name: body.customerName.trim(),
      customer_phone: normalizedPhone,
      customer_country_code: customerCountryCode,
      customer_email: body.customerEmail?.trim() || null,
      customer_whatsapp: normalizedPhone,
      // route_id-based bookings must never also carry a packageId — package_id
      // has a real FK to packages(id), and a routes.id would violate it.
      package_id: body.routeId ? null : body.packageId || null,
      route_id: body.routeId || null,
      package_name: pricing.packageName,
      vehicle_type: body.vehicleType,
      booking_date: body.tripDate,
      pickup_time: body.tripTime,
      pickup_location: body.pickupLocation.trim(),
      dropoff_location: body.dropoffLocation?.trim() || null,
      passengers: body.passengers || 2,
      final_price: totalAmount,
      addons_total: addonsTotal,
      season_name: pricing.seasonName,
      currency: 'INR',
      special_requests: body.specialRequests?.trim() || null,
      requires_child_seat: false,
      status: 'pending',
      payment_status: 'pending',
      booking_source: 'website',
      whatsapp_message_sent: false,
      confirmation_sent: false,
      reminder_sent: false,
    };

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      return NextResponse.json(
        { error: 'Failed to create booking. Please try again.' },
        { status: 500 }
      );
    }

    // Insert addon records if any (already re-priced server-side above)
    if (booking && addonRecords.length > 0) {
      const { error: addonError } = await supabase
        .from('booking_addons')
        .insert(
          addonRecords.map((addon) => ({
            booking_id: booking.id,
            addon_id: addon.addon_id,
            addon_name: addon.addon_name,
            addon_price: addon.addon_price,
            season_name: pricing.seasonName,
            selected_at_stage: 'before_booking',
          }))
        );

      if (addonError) {
        console.error('Error inserting booking addons:', addonError);
        // Continue even if addon insert fails - booking is already created
      }
    }

    // Generate a readable booking reference from UUID
    const bookingRef = `NT-${booking.id.slice(0, 8).toUpperCase()}`;

    // Send confirmation email to customer (non-blocking)
    if (body.customerEmail) {
      sendBookingConfirmation({ ...booking, booking_id: bookingRef }).catch((err) => {
        console.error('Failed to send confirmation email:', err);
      });
    }

    // Send notification to admin (non-blocking)
    sendAdminNotification({ ...booking, booking_id: bookingRef }).catch((err) => {
      console.error('Failed to send admin notification:', err);
    });

    // Return success response — the authoritative amounts, never body.totalAmount
    return NextResponse.json({
      success: true,
      bookingId: bookingRef,
      totalAmount: totalAmount,
      advanceAmount: advanceAmount,
      remainingAmount: totalAmount - advanceAmount,
      booking: {
        id: booking.id,
        booking_id: bookingRef,
        customer_name: booking.customer_name,
        total_amount: booking.final_price,
        advance_amount: advanceAmount,
        status: booking.status,
        payment_status: booking.payment_status,
      },
    });
  } catch (error) {
    console.error('Error in booking creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
