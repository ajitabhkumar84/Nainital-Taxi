import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';

/**
 * POST /api/bookings/add-addons
 *
 * Add addons to an existing booking (after-booking flow)
 *
 * Body:
 * {
 *   bookingId: string;
 *   addons: Array<{
 *     addon_id: string;
 *     addon_name: string;
 *     addon_price: number;
 *     season_name: 'Off-Season' | 'Season';
 *     selected_at_stage: 'after_booking';
 *   }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, addons } = body;

    if (!bookingId || !addons || !Array.isArray(addons) || addons.length === 0) {
      return NextResponse.json(
        { error: 'bookingId and addons array are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabaseClient();

    // Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, addons_total')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Calculate total price of addons
    const addonsTotal = addons.reduce((sum, addon) => sum + (addon.addon_price || 0), 0);

    // Prepare addon records for insertion
    const addonRecords = addons.map(addon => ({
      booking_id: bookingId,
      addon_id: addon.addon_id,
      addon_name: addon.addon_name,
      addon_price: addon.addon_price,
      season_name: addon.season_name,
      selected_at_stage: addon.selected_at_stage || 'after_booking'
    }));

    // Insert addon records
    const { error: insertError } = await supabase
      .from('booking_addons')
      .insert(addonRecords);

    if (insertError) {
      console.error('Error inserting booking addons:', insertError);
      return NextResponse.json(
        { error: 'Failed to add addons to booking' },
        { status: 500 }
      );
    }

    // Update booking's addons_total
    const newAddonsTotal = (booking.addons_total || 0) + addonsTotal;

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        addons_total: newAddonsTotal,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking addons_total:', updateError);
      // Don't fail the request - addons were inserted successfully
    }

    return NextResponse.json({
      success: true,
      addons_added: addons.length,
      new_addons_total: newAddonsTotal
    });
  } catch (error) {
    console.error('Error in add-addons POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
