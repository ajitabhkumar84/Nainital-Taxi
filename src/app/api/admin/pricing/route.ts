import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = serviceRoleKey && serviceRoleKey !== 'your-service-role-key-here'
    ? serviceRoleKey
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

function isAuthorized(request: NextRequest): boolean {
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'nainital2024';
  const authHeader = request.headers.get('x-admin-auth');
  return authHeader === adminPassword;
}

// PATCH: Update existing pricing entry
export async function PATCH(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, price } = body;

    if (!id || price === undefined) {
      return NextResponse.json(
        { error: 'id and price are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('pricing')
      .update({ price })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in pricing PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new pricing entry
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { package_id, vehicle_type, season_id, price } = body;

    if (!package_id || !vehicle_type || !season_id || price === undefined) {
      return NextResponse.json(
        { error: 'package_id, vehicle_type, season_id, and price are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('pricing')
      .insert({
        package_id,
        vehicle_type,
        season_id,
        price,
        is_active: true,
      })
      .select('*, seasons(name)')
      .single();

    if (error) {
      console.error('Error creating pricing:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in pricing POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
