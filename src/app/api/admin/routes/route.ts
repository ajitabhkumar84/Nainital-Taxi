import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

function checkAuth(request: NextRequest) {
  const authHeader = request.headers.get("x-admin-auth");
  return authHeader === ADMIN_PASSWORD;
}

/**
 * GET /api/admin/routes
 * Fetch all routes (admin only)
 * Query params:
 *   - id: Get specific route by ID
 *   - withPricing: Include pricing data
 */
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    // Fetch all routes
    const { data: routes, error } = await supabase
      .from("routes")
      .select("*")
      .order("created_at", { ascending: false });

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
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
