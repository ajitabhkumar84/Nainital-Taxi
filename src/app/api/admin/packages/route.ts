import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PackageType } from '@/lib/supabase/types';

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

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET: Fetch all packages or single package by ID/slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const type = searchParams.get('type') as PackageType | null;

    const supabase = getAdminClient();

    if (id) {
      // Fetch single package by ID
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching package:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    if (slug) {
      // Fetch single package by slug
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching package:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data });
    }

    // Fetch all packages with optional type filter
    let query = supabase
      .from('packages')
      .select('*')
      .order('display_order', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching packages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in packages GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new package
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      type,
      slug: customSlug,
      duration,
      distance,
      places_covered,
      description,
      includes,
      excludes,
      itinerary,
      destination_ids,
      image_url,
      gallery_urls,
      is_popular,
      is_seasonal,
      availability_status,
      min_passengers,
      max_passengers,
      suitable_for,
      meta_title,
      meta_description,
      display_order,
    } = body;

    if (!title || !type) {
      return NextResponse.json(
        { error: 'title and type are required' },
        { status: 400 }
      );
    }

    // Generate slug from title if not provided
    const slug = customSlug || generateSlug(title);

    const supabase = getAdminClient();

    // Get max display_order if not provided
    let orderValue = display_order;
    if (orderValue === undefined) {
      const { data: maxOrder } = await supabase
        .from('packages')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      orderValue = (maxOrder?.display_order || 0) + 1;
    }

    const { data, error } = await supabase
      .from('packages')
      .insert({
        title,
        slug,
        type,
        duration: duration || null,
        distance: distance || null,
        places_covered: places_covered || null,
        description: description || null,
        includes: includes || null,
        excludes: excludes || null,
        itinerary: itinerary || null,
        destination_ids: destination_ids || null,
        image_url: image_url || null,
        gallery_urls: gallery_urls || null,
        is_popular: is_popular ?? false,
        is_seasonal: is_seasonal ?? false,
        availability_status: availability_status || 'available',
        min_passengers: min_passengers ?? 1,
        max_passengers: max_passengers || null,
        suitable_for: suitable_for || null,
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        display_order: orderValue,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating package:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in packages POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update existing package
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

    // If title is updated and slug is not provided, generate new slug
    if (updates.title && !updates.slug) {
      updates.slug = generateSlug(updates.title);
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('packages')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating package:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in packages PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete package (hard delete or soft delete via is_active)
export async function DELETE(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hard = searchParams.get('hard') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    if (hard) {
      // Hard delete
      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting package:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Soft delete (set is_active = false)
      const { error } = await supabase
        .from('packages')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deactivating package:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in packages DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
