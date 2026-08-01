import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, anonKey);
}

/**
 * GET /api/addons
 *
 * Fetch active addons with optional filtering
 *
 * Query params:
 * - package_id: Filter by package
 * - route_id: Filter by transfer route
 * - destination_id: Filter by destination
 * - stage: Filter by 'before_booking' or 'after_booking'
 * - season: Return price for 'Season' or 'Off-Season'
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get('package_id');
    const routeId = searchParams.get('route_id');
    const destinationId = searchParams.get('destination_id');
    const stage = searchParams.get('stage'); // 'before_booking' or 'after_booking'
    const season = searchParams.get('season') || 'Season'; // Default to 'Season'

    const supabase = getPublicClient();

    // Start with base query for active addons
    let query = supabase
      .from('addons')
      .select('*')
      .eq('is_active', true);

    // Filter by stage (before/after booking)
    if (stage === 'before_booking') {
      query = query.eq('show_before_booking', true);
    } else if (stage === 'after_booking') {
      query = query.eq('show_after_booking', true);
    }

    // Order by display_order and featured status
    query = query.order('is_featured', { ascending: false })
                 .order('display_order', { ascending: true });

    const { data: addons, error: addonsError } = await query;

    if (addonsError) {
      console.error('Error fetching addons:', addonsError);
      return NextResponse.json({ error: addonsError.message }, { status: 500 });
    }

    if (!addons || addons.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Filter by package or destination if provided
    let filteredAddons = addons;

    if (packageId) {
      // Get addon IDs that are linked to this package
      const { data: packageRelations } = await supabase
        .from('addon_packages')
        .select('addon_id')
        .eq('package_id', packageId);

      if (packageRelations && packageRelations.length > 0) {
        const linkedAddonIds = new Set(packageRelations.map(r => r.addon_id));
        filteredAddons = addons.filter(addon => linkedAddonIds.has(addon.id));
      } else {
        filteredAddons = [];
      }
    }

    if (routeId) {
      // Get addon IDs that are linked to this transfer route
      const { data: routeRelations } = await supabase
        .from('addon_routes')
        .select('addon_id')
        .eq('route_id', routeId);

      if (routeRelations && routeRelations.length > 0) {
        const linkedAddonIds = new Set(routeRelations.map(r => r.addon_id));
        filteredAddons = filteredAddons.filter(addon => linkedAddonIds.has(addon.id));
      } else {
        filteredAddons = [];
      }
    }

    if (destinationId && filteredAddons.length > 0) {
      // Get addon IDs that are linked to this destination
      const { data: destinationRelations } = await supabase
        .from('addon_destinations')
        .select('addon_id')
        .eq('destination_id', destinationId);

      if (destinationRelations && destinationRelations.length > 0) {
        const linkedAddonIds = new Set(destinationRelations.map(r => r.addon_id));

        // If we already filtered by package/route, intersect the sets
        if (packageId || routeId) {
          filteredAddons = filteredAddons.filter(addon => linkedAddonIds.has(addon.id));
        } else {
          filteredAddons = addons.filter(addon => linkedAddonIds.has(addon.id));
        }
      } else if (!packageId && !routeId) {
        // Only destination filter and no results
        filteredAddons = [];
      }
    }

    // Map addons to include computed price based on season
    const result = filteredAddons.map(addon => ({
      id: addon.id,
      name: addon.name,
      slug: addon.slug,
      short_description: addon.short_description,
      description: addon.description,
      image_url: addon.image_url,
      icon_emoji: addon.icon_emoji,
      price: season === 'Season' ? addon.season_price : addon.off_season_price,
      season_name: season,
      is_featured: addon.is_featured,
      display_order: addon.display_order,
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in addons GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
