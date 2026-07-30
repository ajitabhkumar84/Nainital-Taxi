import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET: Fetch all addons or single addon by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const supabase = getAdminSupabaseClient();

    if (id) {
      // Fetch single addon by ID with relationships
      const { data: addon, error: addonError } = await supabase
        .from('addons')
        .select('*')
        .eq('id', id)
        .single();

      if (addonError) {
        console.error('Error fetching addon:', addonError);
        return NextResponse.json({ error: addonError.message }, { status: 500 });
      }

      // Fetch package relationships
      const { data: packageRelations } = await supabase
        .from('addon_packages')
        .select('package_id')
        .eq('addon_id', id);

      // Fetch destination relationships
      const { data: destinationRelations } = await supabase
        .from('addon_destinations')
        .select('destination_id')
        .eq('addon_id', id);

      const result = {
        ...addon,
        package_ids: packageRelations?.map(r => r.package_id) || [],
        destination_ids: destinationRelations?.map(r => r.destination_id) || []
      };

      return NextResponse.json({ data: result });
    }

    // Fetch all addons
    const { data, error } = await supabase
      .from('addons')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching addons:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in addons GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create new addon with relationships
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      slug: customSlug,
      description,
      short_description,
      image_url,
      icon_emoji,
      show_before_booking,
      show_after_booking,
      off_season_price,
      season_price,
      display_order,
      is_featured,
      is_active,
      package_ids,
      destination_ids,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name if not provided
    const slug = customSlug || generateSlug(name);

    const supabase = getAdminSupabaseClient();

    // Get max display_order if not provided
    let orderValue = display_order;
    if (orderValue === undefined) {
      const { data: maxOrder } = await supabase
        .from('addons')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      orderValue = (maxOrder?.display_order || 0) + 1;
    }

    // Create addon
    const { data: addon, error: addonError } = await supabase
      .from('addons')
      .insert({
        name,
        slug,
        description: description || null,
        short_description: short_description || null,
        image_url: image_url || null,
        icon_emoji: icon_emoji || null,
        show_before_booking: show_before_booking ?? true,
        show_after_booking: show_after_booking ?? false,
        off_season_price: off_season_price || 0,
        season_price: season_price || 0,
        display_order: orderValue,
        is_featured: is_featured ?? false,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (addonError) {
      console.error('Error creating addon:', addonError);
      return NextResponse.json({ error: addonError.message }, { status: 500 });
    }

    // Create package relationships
    if (package_ids && package_ids.length > 0) {
      const packageRecords = package_ids.map((pkg_id: string) => ({
        addon_id: addon.id,
        package_id: pkg_id
      }));

      const { error: packageError } = await supabase
        .from('addon_packages')
        .insert(packageRecords);

      if (packageError) {
        console.error('Error creating package relationships:', packageError);
        // Continue even if relationships fail
      }
    }

    // Create destination relationships
    if (destination_ids && destination_ids.length > 0) {
      const destinationRecords = destination_ids.map((dest_id: string) => ({
        addon_id: addon.id,
        destination_id: dest_id
      }));

      const { error: destinationError } = await supabase
        .from('addon_destinations')
        .insert(destinationRecords);

      if (destinationError) {
        console.error('Error creating destination relationships:', destinationError);
        // Continue even if relationships fail
      }
    }

    return NextResponse.json({ data: addon });
  } catch (error) {
    console.error('Error in addons POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH: Update existing addon
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates, package_ids, destination_ids } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabaseClient();

    // If name is updated and slug is not provided, generate new slug
    if (updates?.name && !updates.slug) {
      updates.slug = generateSlug(updates.name);
    }

    // Update addon
    const { data: addon, error: addonError } = await supabase
      .from('addons')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (addonError) {
      console.error('Error updating addon:', addonError);
      return NextResponse.json({ error: addonError.message }, { status: 500 });
    }

    // Update package relationships if provided
    if (package_ids !== undefined) {
      // Delete existing relationships
      await supabase
        .from('addon_packages')
        .delete()
        .eq('addon_id', id);

      // Create new relationships
      if (package_ids.length > 0) {
        const packageRecords = package_ids.map((pkg_id: string) => ({
          addon_id: id,
          package_id: pkg_id
        }));

        await supabase
          .from('addon_packages')
          .insert(packageRecords);
      }
    }

    // Update destination relationships if provided
    if (destination_ids !== undefined) {
      // Delete existing relationships
      await supabase
        .from('addon_destinations')
        .delete()
        .eq('addon_id', id);

      // Create new relationships
      if (destination_ids.length > 0) {
        const destinationRecords = destination_ids.map((dest_id: string) => ({
          addon_id: id,
          destination_id: dest_id
        }));

        await supabase
          .from('addon_destinations')
          .insert(destinationRecords);
      }
    }

    return NextResponse.json({ data: addon });
  } catch (error) {
    console.error('Error in addons PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Delete addon (hard delete or soft delete via is_active)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const hard = searchParams.get('hard') === 'true';

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = getAdminSupabaseClient();

    if (hard) {
      // Hard delete (CASCADE will delete relationships automatically)
      const { error } = await supabase
        .from('addons')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting addon:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Soft delete (set is_active = false)
      const { error } = await supabase
        .from('addons')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error deactivating addon:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in addons DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
