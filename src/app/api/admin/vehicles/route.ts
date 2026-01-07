import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/supabase/types';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'nainital2024';

function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-admin-auth');
  return authHeader === ADMIN_PASSWORD;
}

// GET - Fetch vehicles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    if (id) {
      // Fetch single vehicle by ID
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    // Build query for fetching all vehicles
    let query = supabase
      .from('vehicles')
      .select('*')
      .order('display_order');

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('vehicle_type', type);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching vehicles:', error);
      return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/admin/vehicles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create vehicle
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.registration_number || !body.vehicle_type) {
      return NextResponse.json(
        { error: 'Name, registration number, and vehicle type are required' },
        { status: 400 }
      );
    }

    // Get max display order
    const { data: maxOrderData } = await supabase
      .from('vehicles')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const maxOrder = (maxOrderData as { display_order: number } | null)?.display_order ?? 0;
    const displayOrder = body.display_order ?? (maxOrder + 1);

    const newVehicle: Partial<Vehicle> = {
      // Identity
      name: body.name,
      nickname: body.nickname || null,
      registration_number: body.registration_number,
      vehicle_type: body.vehicle_type,
      status: body.status || 'available',

      // Specifications
      model_name: body.model_name || null,
      capacity: body.capacity || 4,
      luggage_capacity: body.luggage_capacity || null,
      has_ac: body.has_ac ?? true,
      has_music_system: body.has_music_system ?? true,
      has_child_seat: body.has_child_seat ?? false,

      // Aesthetic
      primary_color: body.primary_color || null,
      color_hex: body.color_hex || null,
      emoji: body.emoji || null,
      personality_trait: body.personality_trait || null,
      tagline: body.tagline || null,

      // Media
      image_urls: body.image_urls || [],
      featured_image_url: body.featured_image_url || null,

      // Maintenance
      last_service_date: body.last_service_date || null,
      next_service_date: body.next_service_date || null,
      total_trips: body.total_trips || 0,
      total_kilometers: body.total_kilometers || 0,

      // Metadata
      is_featured: body.is_featured ?? false,
      display_order: displayOrder,
      is_active: body.is_active ?? true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('vehicles') as any)
      .insert(newVehicle)
      .select()
      .single();

    if (error) {
      console.error('Error creating vehicle:', error);
      return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/vehicles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update vehicle
export async function PATCH(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('vehicles') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating vehicle:', error);
      return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/admin/vehicles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete vehicle
export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hard = searchParams.get('hard') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 });
    }

    if (hard) {
      // Hard delete
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('vehicles') as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting vehicle:', error);
        return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
      }
    } else {
      // Soft delete (set is_active to false and status to retired)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('vehicles') as any)
        .update({
          is_active: false,
          status: 'retired',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error deactivating vehicle:', error);
        return NextResponse.json({ error: 'Failed to deactivate vehicle' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/vehicles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
