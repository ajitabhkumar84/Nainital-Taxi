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
 * GET /api/admin/temples
 * Fetch all temples (admin only)
 * Query params:
 *   - id: Get specific temple by ID
 *   - slug: Get specific temple by slug
 *   - withPricing: Include pricing data
 *   - withRelations: Include all related data (FAQs, relations, category)
 */
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const withPricing = searchParams.get("withPricing") === "true";
    const withRelations = searchParams.get("withRelations") === "true";

    if (id || slug) {
      // Fetch single temple
      let query = supabase.from("temples").select("*");

      if (id) {
        query = query.eq("id", id);
      } else if (slug) {
        query = query.eq("slug", slug);
      }

      const { data: temple, error } = await query.single();

      if (error) throw error;

      // Fetch additional data if requested
      if (withPricing || withRelations) {
        const templeData: any = { ...temple };

        // Fetch pricing
        if (withPricing || withRelations) {
          const { data: pricing } = await supabase
            .from("temple_pricing")
            .select("*")
            .eq("temple_id", temple.id)
            .order("vehicle_type", { ascending: true });
          templeData.pricing = pricing || [];
        }

        // Fetch all relations
        if (withRelations) {
          // Category
          if (temple.category_id) {
            const { data: category } = await supabase
              .from("temple_categories")
              .select("*")
              .eq("id", temple.category_id)
              .single();
            templeData.category = category;
          }

          // FAQs
          const { data: faqs } = await supabase
            .from("temple_faqs")
            .select("*")
            .eq("temple_id", temple.id)
            .eq("is_active", true)
            .order("display_order", { ascending: true });
          templeData.faqs = faqs || [];

          // Related routes
          const { data: routeRels } = await supabase
            .from("temple_related_routes")
            .select("route_id, display_order")
            .eq("temple_id", temple.id)
            .order("display_order", { ascending: true });

          if (routeRels && routeRels.length > 0) {
            const routeIds = routeRels.map((r) => r.route_id);
            const { data: routes } = await supabase
              .from("routes")
              .select("*")
              .in("id", routeIds);
            templeData.related_routes = routes || [];
          }

          // Related packages
          const { data: packageRels } = await supabase
            .from("temple_related_packages")
            .select("package_id, display_order")
            .eq("temple_id", temple.id)
            .order("display_order", { ascending: true });

          if (packageRels && packageRels.length > 0) {
            const packageIds = packageRels.map((p) => p.package_id);
            const { data: packages } = await supabase
              .from("packages")
              .select("*")
              .in("id", packageIds);
            templeData.related_packages = packages || [];
          }

          // Nearby temples
          const { data: templeRels } = await supabase
            .from("temple_nearby_temples")
            .select("nearby_temple_id, distance_km, display_order")
            .eq("temple_id", temple.id)
            .order("display_order", { ascending: true });

          if (templeRels && templeRels.length > 0) {
            const templeIds = templeRels.map((t) => t.nearby_temple_id);
            const { data: nearbyTemples } = await supabase
              .from("temples")
              .select("*")
              .in("id", templeIds);
            templeData.nearby_temples = nearbyTemples || [];
          }

          // Nearby attractions
          const { data: attractionRels } = await supabase
            .from("temple_nearby_attractions")
            .select("destination_id, distance_km, display_order")
            .eq("temple_id", temple.id)
            .order("display_order", { ascending: true });

          if (attractionRels && attractionRels.length > 0) {
            const attractionIds = attractionRels.map((a) => a.destination_id);
            const { data: attractions } = await supabase
              .from("destinations")
              .select("*")
              .in("id", attractionIds);
            templeData.nearby_attractions = attractions || [];
          }
        }

        return NextResponse.json({
          success: true,
          data: templeData,
        });
      }

      return NextResponse.json({ success: true, data: temple });
    }

    // Fetch all temples
    const { data: temples, error } = await supabase
      .from("temples")
      .select("*")
      .order("display_order", { ascending: true })
      .order("popularity", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: temples });
  } catch (error: any) {
    console.error("Error fetching temples:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch temples",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/temples
 * Create a new temple
 */
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { pricing, faqs, ...templeData } = body;

    // Auto-generate slug if not provided
    if (!templeData.slug && templeData.name) {
      templeData.slug = templeData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    // Create temple
    const { data: temple, error: templeError } = await supabase
      .from("temples")
      .insert([templeData])
      .select()
      .single();

    if (templeError) throw templeError;

    // Create pricing if provided
    if (pricing && pricing.length > 0) {
      const pricingData = pricing.map((p: any) => {
        const { id: _id, created_at, updated_at, ...pricingFields } = p;
        return {
          ...pricingFields,
          temple_id: temple.id,
        };
      });

      const { error: pricingError } = await supabase
        .from("temple_pricing")
        .insert(pricingData);

      if (pricingError) throw pricingError;
    }

    // Create FAQs if provided
    if (faqs && faqs.length > 0) {
      const faqData = faqs.map((faq: any, index: number) => {
        const { id: _id, created_at, updated_at, ...faqFields } = faq;
        return {
          ...faqFields,
          temple_id: temple.id,
          display_order: faq.display_order ?? index,
        };
      });

      const { error: faqError } = await supabase
        .from("temple_faqs")
        .insert(faqData);

      if (faqError) throw faqError;
    }

    return NextResponse.json({
      success: true,
      data: temple,
    });
  } catch (error: any) {
    console.error("Error creating temple:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create temple",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/temples
 * Update a temple
 */
export async function PATCH(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, updates, pricing, faqs } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Temple ID is required" },
        { status: 400 }
      );
    }

    // Update temple
    const { data: temple, error: templeError } = await supabase
      .from("temples")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (templeError) throw templeError;

    // Update pricing if provided
    if (pricing) {
      // Delete existing pricing
      await supabase.from("temple_pricing").delete().eq("temple_id", id);

      // Insert new pricing
      if (pricing.length > 0) {
        const pricingData = pricing.map((p: any) => {
          const { id: _id, created_at, updated_at, ...pricingFields } = p;
          return {
            ...pricingFields,
            temple_id: id,
          };
        });

        const { error: pricingError } = await supabase
          .from("temple_pricing")
          .insert(pricingData);

        if (pricingError) throw pricingError;
      }
    }

    // Update FAQs if provided
    if (faqs) {
      // Delete existing FAQs
      await supabase.from("temple_faqs").delete().eq("temple_id", id);

      // Insert new FAQs
      if (faqs.length > 0) {
        const faqData = faqs.map((faq: any, index: number) => {
          const { id: _id, created_at, updated_at, ...faqFields } = faq;
          return {
            ...faqFields,
            temple_id: id,
            display_order: faq.display_order ?? index,
          };
        });

        const { error: faqError } = await supabase
          .from("temple_faqs")
          .insert(faqData);

        if (faqError) throw faqError;
      }
    }

    return NextResponse.json({
      success: true,
      data: temple,
    });
  } catch (error: any) {
    console.error("Error updating temple:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update temple",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/temples
 * Delete a temple
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
        { error: "Temple ID is required" },
        { status: 400 }
      );
    }

    // Delete temple (related data will be cascade deleted)
    const { error } = await supabase.from("temples").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Temple deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting temple:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete temple",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
