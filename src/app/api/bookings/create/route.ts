import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  generateBookingId,
  calculateAdvanceAmount,
  validatePhone,
  normalizePhone,
  validateEmail,
} from '@/lib/booking';
import {
  sendBookingConfirmation,
  sendAdminNotification,
} from '@/lib/notifications';

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
  customerEmail?: string;
  packageId?: string;
  packageName: string;
  vehicleType: string;
  tripDate: string;
  tripTime: string;
  pickupLocation: string;
  dropoffLocation?: string;
  passengers: number;
  totalAmount: number;
  seasonName?: string;
  specialRequests?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateBookingRequest = await request.json();

    // Validate required fields
    const requiredFields = [
      'customerName',
      'customerPhone',
      'packageName',
      'vehicleType',
      'tripDate',
      'tripTime',
      'pickupLocation',
      'totalAmount',
    ];

    for (const field of requiredFields) {
      if (!body[field as keyof CreateBookingRequest]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate phone number
    if (!validatePhone(body.customerPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit phone number' },
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

    // Validate total amount
    if (body.totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid total amount' },
        { status: 400 }
      );
    }

    // Generate booking ID and calculate advance
    const bookingId = generateBookingId();
    const advanceAmount = calculateAdvanceAmount(body.totalAmount);
    const normalizedPhone = normalizePhone(body.customerPhone);

    // Create booking in database
    const supabase = getSupabaseClient();

    const bookingData = {
      customer_name: body.customerName.trim(),
      customer_phone: normalizedPhone,
      customer_email: body.customerEmail?.trim() || null,
      customer_whatsapp: normalizedPhone,
      package_id: body.packageId || null,
      package_name: body.packageName,
      vehicle_type: body.vehicleType,
      booking_date: body.tripDate,
      pickup_time: body.tripTime,
      pickup_location: body.pickupLocation.trim(),
      dropoff_location: body.dropoffLocation?.trim() || null,
      passengers: body.passengers || 2,
      final_price: body.totalAmount,
      season_name: body.seasonName || 'Off-Season',
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

    // Return success response
    return NextResponse.json({
      success: true,
      bookingId: bookingRef,
      advanceAmount: advanceAmount,
      remainingAmount: body.totalAmount - advanceAmount,
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
