import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';
import { ONE_WAY_TAXI_SETTINGS_ID } from '@/lib/oneWayTaxi';
import {
  DEFAULT_ONE_WAY_TAXI_SETTINGS,
  type OneWayTaxiSettings,
} from '@/lib/supabase/types';

// PostgREST's code for "table not in the schema cache" — i.e. the migration
// in supabase/add_one_way_taxi_settings_and_route_destination_link.sql
// hasn't been applied to this project yet. Worth its own message: the
// generic 500 sends you hunting through logs for what is really a
// one-command setup step (see the same pattern in /api/admin/contact-page).
const TABLE_MISSING = 'PGRST205';
const MIGRATION_HINT =
  'The one_way_taxi_settings table does not exist yet. Run ' +
  'supabase/add_one_way_taxi_settings_and_route_destination_link.sql in the Supabase SQL editor, then reload this page.';

/** /rates reads this singleton for its hero + stats; the homepage links to /rates. */
function revalidateRatesPages() {
  try {
    revalidatePath('/rates', 'page');
    revalidatePath('/', 'page');
  } catch (error) {
    console.error('Revalidation failed (DB write succeeded):', error);
  }
}

// GET - Fetch the one-way taxi settings singleton (returns defaults if the row is missing)
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('one_way_taxi_settings') as any)
      .select('*')
      .eq('id', ONE_WAY_TAXI_SETTINGS_ID)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          ...DEFAULT_ONE_WAY_TAXI_SETTINGS,
          id: ONE_WAY_TAXI_SETTINGS_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (error.code === TABLE_MISSING) {
        return NextResponse.json({ error: MIGRATION_HINT }, { status: 503 });
      }

      console.error('Error fetching one-way taxi settings:', error);
      return NextResponse.json({ error: 'Failed to fetch one-way taxi settings' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/admin/one-way-taxi:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upsert the one-way taxi settings singleton
export async function POST(request: NextRequest) {
  try {
    const adminSupabase = getAdminSupabaseClient();
    const body = (await request.json()) as Partial<OneWayTaxiSettings>;

    // Whitelist the accepted keys rather than spreading the raw body, so a
    // stray client field can never write an arbitrary column.
    const updateData = {
      id: ONE_WAY_TAXI_SETTINGS_ID,

      hero_heading: body.hero_heading ?? '',
      hero_subheading: body.hero_subheading ?? '',

      stat_1_value: body.stat_1_value ?? '',
      stat_1_label: body.stat_1_label ?? '',
      stat_2_value: body.stat_2_value ?? '',
      stat_2_label: body.stat_2_label ?? '',
      stat_3_value: body.stat_3_value ?? '',
      stat_3_label: body.stat_3_label ?? '',

      seo_title: body.seo_title ?? '',
      seo_description: body.seo_description ?? '',

      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminSupabase.from('one_way_taxi_settings') as any)
      .upsert(updateData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      if (error.code === TABLE_MISSING) {
        return NextResponse.json({ error: MIGRATION_HINT }, { status: 503 });
      }

      console.error('Error saving one-way taxi settings:', error);
      return NextResponse.json(
        { error: 'Failed to save one-way taxi settings', details: error.message },
        { status: 500 }
      );
    }

    revalidateRatesPages();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/one-way-taxi:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
