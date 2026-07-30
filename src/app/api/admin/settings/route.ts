import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';

// GET: Fetch a setting by key
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'key parameter is required' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      // Not found is OK, just return null
      if (error.code === 'PGRST116') {
        return NextResponse.json({ key, value: null });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in settings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Upsert settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'settings array is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabaseClient();

    // Upsert each setting
    for (const setting of settings) {
      const { error } = await supabase
        .from('admin_settings')
        .upsert(setting, { onConflict: 'key' });

      if (error) {
        console.error('Error upserting setting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in settings POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
