import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all routes with categories and pricing
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Fetch all active categories
    const { data: categories, error: categoriesError } = await supabase
      .from("route_categories")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (categoriesError) throw categoriesError;

    // Fetch all active routes
    const { data: routes, error: routesError } = await supabase
      .from("routes")
      .select(`
        *,
        category:route_categories(*)
      `)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (routesError) throw routesError;

    // Fetch pricing for all routes
    const routeIds = routes.map((r: any) => r.id);
    const { data: pricing, error: pricingError } = await supabase
      .from("route_pricing")
      .select("*")
      .in("route_id", routeIds)
      .eq("is_active", true);

    if (pricingError) throw pricingError;

    // Attach pricing to routes
    const routesWithPricing = routes.map((route: any) => ({
      ...route,
      pricing: pricing.filter((p: any) => p.route_id === route.id),
    }));

    // Organize routes by category
    const categorizedRoutes = categories.map((category: any) => ({
      ...category,
      routes: routesWithPricing.filter((r: any) => r.category_id === category.id),
    }));

    // Add uncategorized routes
    const uncategorizedRoutes = routesWithPricing.filter((r: any) => !r.category_id);

    if (uncategorizedRoutes.length > 0) {
      categorizedRoutes.push({
        id: "uncategorized",
        category_name: "Other Routes",
        category_slug: "other-routes",
        icon: "road",
        display_order: 999,
        routes: uncategorizedRoutes,
      });
    }

    return NextResponse.json({
      data: {
        categories: categorizedRoutes.filter((c: any) => c.routes.length > 0),
        allRoutes: routesWithPricing,
      },
    });
  } catch (error: any) {
    console.error("Error fetching routes with categories:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch routes" },
      { status: 500 }
    );
  }
}
