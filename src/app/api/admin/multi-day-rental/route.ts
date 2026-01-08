import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MultiDayRentalPage, DEFAULT_MULTI_DAY_RENTAL_PAGE } from '@/lib/supabase/types';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'nainital2024';
const FIXED_ID = '00000000-0000-0000-0000-000000000001';

function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-admin-auth');
  return authHeader === ADMIN_PASSWORD;
}

// GET - Fetch multi-day rental page configuration
export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('multi_day_rental_page') as any)
      .select('*')
      .eq('id', FIXED_ID)
      .single();

    if (error) {
      // If no row exists, return default config
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
    console.error('Error in GET /api/admin/multi-day-rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update multi-day rental page configuration (requires auth)
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Prepare update data
    const updateData: Partial<MultiDayRentalPage> = {
      id: FIXED_ID,
      ...body,
      updated_at: new Date().toISOString(),
    };

    // Remove created_at if it exists in the update
    delete (updateData as any).created_at;

    // Upsert the configuration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('multi_day_rental_page') as any)
      .upsert(updateData, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error updating multi-day rental page:', error);
      return NextResponse.json(
        { error: 'Failed to update page configuration', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/admin/multi-day-rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Initialize with default configuration (requires auth)
export async function PUT(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Check if config already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase
      .from('multi_day_rental_page') as any)
      .select('id')
      .eq('id', FIXED_ID)
      .single();

    if (existing) {
      return NextResponse.json({
        message: 'Configuration already initialized',
        data: existing
      });
    }

    // Initialize with defaults
    const defaultConfig = {
      id: FIXED_ID,
      ...DEFAULT_MULTI_DAY_RENTAL_PAGE,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('multi_day_rental_page') as any)
      .insert(defaultConfig)
      .select()
      .single();

    if (error) {
      console.error('Error initializing multi-day rental page:', error);
      return NextResponse.json(
        { error: 'Failed to initialize configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Configuration initialized successfully',
      data,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/multi-day-rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle published status (requires auth)
export async function PATCH(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { is_published } = await request.json();

    if (typeof is_published !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid is_published value' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('multi_day_rental_page') as any)
      .update({
        is_published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', FIXED_ID)
      .select()
      .single();

    if (error) {
      console.error('Error toggling published status:', error);
      return NextResponse.json(
        { error: 'Failed to update published status' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/admin/multi-day-rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
