import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';

// GET: Fetch availability for a date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabaseClient();
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error('Error fetching availability:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in availability GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Update or create availability
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, total_fleet_size, cars_booked, is_blocked, internal_notes } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'date is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabaseClient();

    const { data, error } = await supabase
      .from('availability')
      .upsert({
        date,
        total_fleet_size: total_fleet_size ?? 10,
        cars_booked: cars_booked ?? 0,
        is_blocked: is_blocked ?? false,
        internal_notes: internal_notes ?? null,
      }, { onConflict: 'date' })
      .select()
      .single();

    if (error) {
      console.error('Error updating availability:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in availability POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
