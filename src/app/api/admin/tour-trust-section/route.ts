import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';
import { DEFAULT_TOUR_TRUST_SECTION, TourTrustSection } from '@/lib/supabase/types';

const FIXED_ID = '00000000-0000-0000-0000-000000000003';

// GET - Fetch the tour page trust section singleton (auto-creates with defaults if missing)
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('tour_trust_section') as any)
      .select('*')
      .eq('id', FIXED_ID)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          ...DEFAULT_TOUR_TRUST_SECTION,
          id: FIXED_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      console.error('Error fetching tour trust section:', error);
      return NextResponse.json({ error: 'Failed to fetch tour trust section' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/tour-trust-section:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upsert the tour page trust section singleton (heading, description, trust_pillars, is_published)
export async function POST(request: NextRequest) {
  try {
    const adminSupabase = getAdminSupabaseClient();
    const body = await request.json();

    const updateData: Partial<TourTrustSection> & { id: string } = {
      id: FIXED_ID,
      heading: body.heading,
      description: body.description,
      trust_pillars: body.trust_pillars,
      is_published: body.is_published ?? true,
      updated_at: new Date().toISOString(),
    } as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase.from('tour_trust_section') as any)
      .upsert(updateData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving tour trust section:', error);
      return NextResponse.json(
        { error: 'Failed to save tour trust section', details: error.message },
        { status: 500 }
      );
    }

    // Every /tour/* page reads this singleton, so revalidate the whole segment.
    revalidatePath('/tour', 'layout');
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/tour-trust-section:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
