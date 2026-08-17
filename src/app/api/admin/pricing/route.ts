import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSupabaseClient } from '@/lib/supabase/admin';
import { revalidateContent } from '@/lib/revalidateContent';
import { CACHE_TAGS } from '@/lib/cacheTags';
import { VehicleType, VEHICLE_TYPES, SEASON_NAMES, SeasonName } from '@/lib/supabase/types';

// GET: Fetch everything the admin pricing page needs in one call — package
// pricing, route pricing, and season definitions (used only for the
// date-range hint shown under each season column; the two season *names*
// are fixed by SEASON_NAMES, not derived from this list).
export async function GET() {
  try {
    const supabase = getAdminSupabaseClient();

    const [pricingRes, routePricingRes, seasonsRes] = await Promise.all([
      supabase.from('pricing').select('*').eq('is_active', true),
      supabase.from('route_pricing').select('*').eq('is_active', true),
      supabase
        .from('seasons')
        .select('id, name, description, start_date, end_date')
        .eq('is_active', true),
    ]);

    if (pricingRes.error) throw pricingRes.error;
    if (routePricingRes.error) throw routePricingRes.error;
    if (seasonsRes.error) throw seasonsRes.error;

    return NextResponse.json({
      pricing: pricingRes.data || [],
      routePricing: routePricingRes.data || [],
      seasons: seasonsRes.data || [],
    });
  } catch (error) {
    console.error('Error in pricing GET:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

interface PricingUpdate {
  package_id?: string;
  route_id?: string;
  vehicle_type: VehicleType;
  season_name: SeasonName;
  // null => delete the row. The public site already treats a missing
  // pricing row as "this vehicle isn't offered for this package/route"
  // (see getAllPackagePrices/getAllRoutePrices in src/lib/pricing.ts), so
  // this is how an admin marks a vehicle unavailable instead of writing a
  // misleading ₹0.
  price: number | null;
}

function validateUpdate(entry: unknown, index: number): string | null {
  if (!entry || typeof entry !== 'object') {
    return `Row ${index}: invalid entry`;
  }
  const row = entry as Record<string, unknown>;

  const hasPackage = typeof row.package_id === 'string' && row.package_id.length > 0;
  const hasRoute = typeof row.route_id === 'string' && row.route_id.length > 0;
  if (hasPackage === hasRoute) {
    return `Row ${index}: exactly one of package_id or route_id is required`;
  }

  if (!VEHICLE_TYPES.includes(row.vehicle_type as VehicleType)) {
    return `Row ${index}: invalid vehicle_type "${String(row.vehicle_type)}"`;
  }

  if (!SEASON_NAMES.includes(row.season_name as SeasonName)) {
    return `Row ${index}: invalid season_name "${String(row.season_name)}"`;
  }

  if (row.price !== null && (typeof row.price !== 'number' || !Number.isInteger(row.price) || row.price < 0)) {
    return `Row ${index}: price must be null or a non-negative integer`;
  }

  return null;
}

// POST: Batch upsert/delete pricing rows for packages and/or routes in a
// single call. Replaces the old client-side "find existing -> PATCH else
// POST" dance (which relied on a non-existent `season_id` column) with a
// server-side upsert keyed on the tables' real unique constraints.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updates: PricingUpdate[] = Array.isArray(body?.updates) ? body.updates : [];

    if (updates.length === 0) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 });
    }

    for (let i = 0; i < updates.length; i++) {
      const validationError = validateUpdate(updates[i], i);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    const supabase = getAdminSupabaseClient();

    const packageUpdates = updates.filter((u) => u.package_id);
    const routeUpdates = updates.filter((u) => u.route_id);

    const result: { pricing: unknown[]; routePricing: unknown[] } = {
      pricing: [],
      routePricing: [],
    };

    if (packageUpdates.length > 0) {
      const toDelete = packageUpdates.filter((u) => u.price === null);
      const toUpsert = packageUpdates.filter((u) => u.price !== null);

      for (const u of toDelete) {
        const { error } = await supabase
          .from('pricing')
          .delete()
          .eq('package_id', u.package_id!)
          .eq('vehicle_type', u.vehicle_type)
          .eq('season_name', u.season_name);
        if (error) throw error;
      }

      if (toUpsert.length > 0) {
        const { data, error } = await supabase
          .from('pricing')
          .upsert(
            toUpsert.map((u) => ({
              package_id: u.package_id,
              vehicle_type: u.vehicle_type,
              season_name: u.season_name,
              price: u.price,
              is_active: true,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: 'package_id,vehicle_type,season_name' }
          )
          .select();
        if (error) throw error;
        result.pricing = data || [];
      }
    }

    if (routeUpdates.length > 0) {
      const toDelete = routeUpdates.filter((u) => u.price === null);
      const toUpsert = routeUpdates.filter((u) => u.price !== null);

      for (const u of toDelete) {
        const { error } = await supabase
          .from('route_pricing')
          .delete()
          .eq('route_id', u.route_id!)
          .eq('vehicle_type', u.vehicle_type)
          .eq('season_name', u.season_name);
        if (error) throw error;
      }

      if (toUpsert.length > 0) {
        const { data, error } = await supabase
          .from('route_pricing')
          .upsert(
            toUpsert.map((u) => ({
              route_id: u.route_id,
              vehicle_type: u.vehicle_type,
              season_name: u.season_name,
              price: u.price,
              is_active: true,
              updated_at: new Date().toISOString(),
            })),
            { onConflict: 'route_id,vehicle_type,season_name' }
          )
          .select();
        if (error) throw error;
        result.routePricing = data || [];
      }
    }

    // A revalidation failure must not turn a successful DB write into a
    // reported error, so it gets its own try/catch.
    try {
      if (packageUpdates.length > 0) {
        revalidatePath('/'); // homepage — getMinPricePerPackage()
        revalidatePath('/tour', 'layout'); // listing + every /tour/[name] detail page
        revalidatePath('/destinations', 'layout'); // destination transfer pricing
        revalidatePath('/lp/taxi');
      }
      if (routeUpdates.length > 0) {
        revalidatePath('/rates');
        revalidatePath('/');
        revalidatePath('/destinations', 'layout');
      }
      // Both branches read through the same cached pricing helpers
      // (getMinPricePerPackage, getAllPricingForPackage, getTransferRoutes,
      // getRoutesWithCategories), so the tag is fired for either kind of
      // update. Without it the paths above would re-render against the
      // pre-edit prices — the most damaging thing on this site to get wrong,
      // since a stale fare is one a customer will hold us to.
      if (packageUpdates.length > 0 || routeUpdates.length > 0) {
        revalidateContent(CACHE_TAGS.pricing);
      }
    } catch (revalidateError) {
      console.error('Error revalidating paths after pricing update:', revalidateError);
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error in pricing POST:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
