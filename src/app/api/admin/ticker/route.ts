import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';
import { revalidateContent } from '@/lib/revalidateContent';
import { CACHE_TAGS } from '@/lib/cacheTags';

// GET: Fetch all ticker bookings or a single one by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const supabase = getAdminSupabaseClient();

    if (id) {
      const { data, error } = await supabase
        .from('ticker_bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching ticker booking:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    const { data, error } = await supabase
      .from('ticker_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ticker bookings:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in ticker GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

type TickerRow = {
  guest_first_name: string;
  guest_city: string;
  service_label: string;
  service_type?: string | null;
  real_booking_date?: string | null;
};

function isValidRow(row: Partial<TickerRow>): row is TickerRow {
  return Boolean(row.guest_first_name && row.guest_city && row.service_label);
}

// POST: Create a single ticker booking, or bulk-import many at once via
// { rows: TickerRow[] } (used by the admin form's TSV paste importer).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getAdminSupabaseClient();

    if (Array.isArray(body.rows)) {
      const rows: TickerRow[] = body.rows.filter(isValidRow).map((r: TickerRow) => ({
        guest_first_name: r.guest_first_name,
        guest_city: r.guest_city,
        service_label: r.service_label,
        service_type: r.service_type || null,
        real_booking_date: r.real_booking_date || null,
        is_active: true,
      }));

      if (rows.length === 0) {
        return NextResponse.json({ error: 'No valid rows to import' }, { status: 400 });
      }

      const { data, error } = await supabase.from('ticker_bookings').insert(rows).select();

      if (error) {
        console.error('Error bulk-importing ticker bookings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      revalidatePath('/');
      revalidateContent(CACHE_TAGS.ticker);
    revalidateContent(CACHE_TAGS.ticker);
      return NextResponse.json({ data, imported: data?.length ?? 0 });
    }

    const { guest_first_name, guest_city, service_label, service_type, real_booking_date, is_active } = body;

    if (!guest_first_name || !guest_city || !service_label) {
      return NextResponse.json(
        { error: 'guest_first_name, guest_city and service_label are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('ticker_bookings')
      .insert({
        guest_first_name,
        guest_city,
        service_label,
        service_type: service_type || null,
        real_booking_date: real_booking_date || null,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ticker booking:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath('/');
    revalidateContent(CACHE_TAGS.ticker);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in ticker POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update an existing ticker booking
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();

    const { data, error } = await supabase
      .from('ticker_bookings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ticker booking:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath('/');
    revalidateContent(CACHE_TAGS.ticker);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in ticker PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Permanently remove a ticker booking
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();

    const { error } = await supabase.from('ticker_bookings').delete().eq('id', id);

    if (error) {
      console.error('Error deleting ticker booking:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath('/');
    revalidateContent(CACHE_TAGS.ticker);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in ticker DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
