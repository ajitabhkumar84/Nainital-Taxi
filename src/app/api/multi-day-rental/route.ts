import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEFAULT_MULTI_DAY_RENTAL_PAGE } from '@/lib/supabase/types';

const FIXED_ID = '00000000-0000-0000-0000-000000000001';

// GET - Fetch published multi-day rental page configuration (public)
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('multi_day_rental_page') as any)
      .select('*')
      .eq('id', FIXED_ID)
      .eq('is_published', true)
      .single();

    if (error) {
      // If no row exists or not published, return default config
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          ...DEFAULT_MULTI_DAY_RENTAL_PAGE,
          id: FIXED_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      console.error('Error fetching multi-day rental page:', error);
      return NextResponse.json(
        { error: 'Failed to fetch page configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/multi-day-rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
