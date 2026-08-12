import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { revalidateRoutePages } from "@/lib/revalidateRoutePages";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/routes
 * Fetch all routes (admin only)
 * Query params:
 *   - id: Get specific route by ID
 *   - withPricing: Include pricing data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const withPricing = searchParams.get("withPricing") === "true";

    if (id) {
      // Fetch single route
      const { data: route, error } = await supabase
        .from("routes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (withPricing) {
        const { data: pricing } = await supabase
          .from("route_pricing")
          .select("*")
          .eq("route_id", id);

        return NextResponse.json({
          success: true,
          data: { ...route, pricing: pricing || [] },
        });
      }

      return NextResponse.json({ success: true, data: route });
    }

    // Fetch all routes. `withPricing` used to be honoured only on the
    // single-route branch above, so the admin list — which requests it — got
    // routes with no `pricing` key at all and flagged every route as having no
    // pricing configured. Embed the relation off the existing
    // route_pricing.route_id -> routes.id FK instead.
    //
    // Ordered by display_order to match the public read in
    // getRoutesWithCategories(), so the admin list shows routes in the same
    // order the site does (and the drag-to-reorder UI has a stable baseline).
    const { data: routes, error } = await supabase
      .from("routes")
      .select(
        withPricing
          ? "*, pricing:route_pricing(vehicle_type, season_name, price, is_active)"
          : "*"
      )
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: routes });
  } catch (error: any) {
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch routes",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/routes
 * Create a new route
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pricing, ...routeData } = body;

    // Create route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .insert([routeData])
      .select()
      .single();

    if (routeError) throw routeError;

    // Create pricing if provided
    if (pricing && pricing.length > 0) {
      const pricingData = pricing.map((p: any) => {
        // Remove id, created_at, updated_at fields to let database generate new ones
        const { id: _id, created_at, updated_at, ...pricingFields } = p;
        return {
          ...pricingFields,
          route_id: route.id,
        };
      });

      const { error: pricingError } = await supabase
        .from("route_pricing")
        .insert(pricingData);

      if (pricingError) throw pricingError;
    }

    revalidateRoutePages();

    return NextResponse.json({
      success: true,
      data: route,
    });
  } catch (error: any) {
    console.error("Error creating route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create route",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/routes
 * Update a route
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates, pricing } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Route ID is required" },
        { status: 400 }
      );
    }

    // Update route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (routeError) throw routeError;

    // Update pricing if provided
    if (pricing) {
      // Delete existing pricing
      await supabase.from("route_pricing").delete().eq("route_id", id);

      // Insert new pricing
      if (pricing.length > 0) {
        const pricingData = pricing.map((p: any) => {
          // Remove id, created_at, updated_at fields to let database generate new ones
          const { id: _id, created_at, updated_at, ...pricingFields } = p;
          return {
            ...pricingFields,
            route_id: id,
          };
        });

        const { error: pricingError } = await supabase
          .from("route_pricing")
          .insert(pricingData);

        if (pricingError) throw pricingError;
      }
    }

    revalidateRoutePages();

    return NextResponse.json({
      success: true,
      data: route,
    });
  } catch (error: any) {
    console.error("Error updating route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update route",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/routes
 * Delete a route
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Route ID is required" },
        { status: 400 }
      );
    }

    // Delete route (pricing will be cascade deleted)
    const { error } = await supabase.from("routes").delete().eq("id", id);

    if (error) throw error;

    revalidateRoutePages();

    return NextResponse.json({
      success: true,
      message: "Route deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete route",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
