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

// POST: Create new season
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, start_date, end_date, is_recurring } = body;

    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'name, start_date, and end_date are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('seasons')
      .insert({
        name,
        description: description || null,
        start_date,
        end_date,
        is_active: true,
        is_recurring: is_recurring ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating season:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in seasons POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update season
export async function PATCH(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json(
        { error: 'id and updates are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('seasons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating season:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in seasons PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete season
export async function DELETE(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { error } = await supabase
      .from('seasons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting season:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in seasons DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
