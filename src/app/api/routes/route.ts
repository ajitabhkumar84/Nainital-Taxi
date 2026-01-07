import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/routes
 * Fetch all active routes with optional filtering
 * Query params:
 *   - pickup: Filter by pickup location
 *   - drop: Filter by drop location
 *   - withPricing: Include pricing data (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pickup = searchParams.get("pickup");
    const drop = searchParams.get("drop");
    const withPricing = searchParams.get("withPricing") === "true";

    let query = supabase
      .from("routes")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (pickup) {
      query = query.eq("pickup_location", pickup);
    }

    if (drop) {
      query = query.eq("drop_location", drop);
    }

    const { data: routes, error } = await query;

    if (error) throw error;

    // Get bidirectional routes (reverse pickup and drop)
    let bidirectionalRoutes: any[] = [];
    if (routes && routes.length > 0) {
      const reverseQuery = supabase
        .from("routes")
        .select("*")
        .eq("is_active", true);

      if (pickup) {
        reverseQuery.eq("drop_location", pickup);
      }
      if (drop) {
        reverseQuery.eq("pickup_location", drop);
      }

      const { data: reverseRoutes } = await reverseQuery;
      bidirectionalRoutes = reverseRoutes || [];
    }

    // Combine and deduplicate
    const allRoutes = [...(routes || []), ...bidirectionalRoutes];
    const uniqueRoutes = Array.from(
      new Map(allRoutes.map((route) => [route.id, route])).values()
    );

    // Fetch pricing if requested
    if (withPricing && uniqueRoutes.length > 0) {
      const routeIds = uniqueRoutes.map((r) => r.id);
      const { data: pricing } = await supabase
        .from("route_pricing")
        .select("*")
        .in("route_id", routeIds)
        .eq("is_active", true);

      // Attach pricing to routes
      const routesWithPricing = uniqueRoutes.map((route) => ({
        ...route,
        pricing: pricing?.filter((p) => p.route_id === route.id) || [],
      }));

      return NextResponse.json({
        success: true,
        data: routesWithPricing,
      });
    }

    return NextResponse.json({
      success: true,
      data: uniqueRoutes,
    });
  } catch (error) {
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch routes",
      },
      { status: 500 }
    );
  }
}
