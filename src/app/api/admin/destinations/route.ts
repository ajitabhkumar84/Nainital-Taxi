import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Destination } from '@/lib/supabase/types';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'nainital2024';

function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-admin-auth');
  return authHeader === ADMIN_PASSWORD;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET - Fetch destinations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');

    if (id) {
      // Fetch single destination by ID
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    if (slug) {
      // Fetch single destination by slug
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Destination not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    // Fetch all destinations
    const { data, error } = await supabase
      .from('destinations')
      .select('*')
      .order('display_order');

    if (error) {
      console.error('Error fetching destinations:', error);
      return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/admin/destinations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create destination
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Generate slug if not provided
    const slug = body.slug || generateSlug(body.name);

    // Get max display order
    const { data: maxOrderData } = await supabase
      .from('destinations')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const maxOrder = (maxOrderData as { display_order: number } | null)?.display_order ?? 0;
    const displayOrder = body.display_order ?? (maxOrder + 1);

    const newDestination: Partial<Destination> = {
      slug,
      name: body.name,
      tagline: body.tagline || null,
      description: body.description || null,
      highlights: body.highlights || [],
      best_time_to_visit: body.best_time_to_visit || null,
      duration: body.duration || null,
      distance_from_nainital: body.distance_from_nainital || null,
      hero_image_url: body.hero_image_url || null,
      gallery_urls: body.gallery_urls || [],
      emoji: body.emoji || null,
      meta_title: body.meta_title || null,
      meta_description: body.meta_description || null,
      display_order: displayOrder,
      is_popular: body.is_popular ?? false,
      is_active: body.is_active ?? true,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('destinations') as any)
      .insert(newDestination)
      .select()
      .single();

    if (error) {
      console.error('Error creating destination:', error);
      return NextResponse.json({ error: 'Failed to create destination' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/destinations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update destination
export async function PATCH(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Destination ID required' }, { status: 400 });
    }

    // Generate slug if name changed and slug not provided
    if (updates.name && !updates.slug) {
      updates.slug = generateSlug(updates.name);
    }

    updates.updated_at = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('destinations') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating destination:', error);
      return NextResponse.json({ error: 'Failed to update destination' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/admin/destinations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete destination
export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hard = searchParams.get('hard') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'Destination ID required' }, { status: 400 });
    }

    if (hard) {
      // Hard delete
      const { error } = await supabase
        .from('destinations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting destination:', error);
        return NextResponse.json({ error: 'Failed to delete destination' }, { status: 500 });
      }
    } else {
      // Soft delete (set is_active to false)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('destinations') as any)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deactivating destination:', error);
        return NextResponse.json({ error: 'Failed to deactivate destination' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/destinations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
