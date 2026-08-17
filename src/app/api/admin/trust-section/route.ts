import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';
import { DEFAULT_TRUST_SECTION, TrustSection } from '@/lib/supabase/types';
import { revalidateContent } from '@/lib/revalidateContent';
import { CACHE_TAGS } from '@/lib/cacheTags';

const FIXED_ID = '00000000-0000-0000-0000-000000000002';

// GET - Fetch the trust section singleton (auto-creates with defaults if missing)
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('trust_section') as any)
      .select('*')
      .eq('id', FIXED_ID)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          ...DEFAULT_TRUST_SECTION,
          id: FIXED_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      console.error('Error fetching trust section:', error);
      return NextResponse.json({ error: 'Failed to fetch trust section' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/trust-section:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upsert the trust section singleton (heading, description, trust_pillars, is_published)
export async function POST(request: NextRequest) {
  try {
    const adminSupabase = getAdminSupabaseClient();
    const body = await request.json();

    const updateData: Partial<TrustSection> & { id: string } = {
      id: FIXED_ID,
      heading: body.heading,
      description: body.description,
      image_url: body.image_url ?? null,
      trust_pillars: body.trust_pillars,
      is_published: body.is_published ?? true,
      updated_at: new Date().toISOString(),
    } as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase.from('trust_section') as any)
      .upsert(updateData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving trust section:', error);
      return NextResponse.json(
        { error: 'Failed to save trust section', details: error.message },
        { status: 500 }
      );
    }

    revalidatePath('/');
    revalidateContent(CACHE_TAGS.trustSection);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/trust-section:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
