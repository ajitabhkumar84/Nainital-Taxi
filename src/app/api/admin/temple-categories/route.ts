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
 * GET /api/admin/temple-categories
 * Fetch all temple categories (admin only)
 * Query params:
 *   - id: Get specific category by ID
 *   - slug: Get specific category by slug
 *   - withTemples: Include temples in this category
 */
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const withTemples = searchParams.get("withTemples") === "true";

    if (id || slug) {
      // Fetch single category
      let query = supabase.from("temple_categories").select("*");

      if (id) {
        query = query.eq("id", id);
      } else if (slug) {
        query = query.eq("category_slug", slug);
      }

      const { data: category, error } = await query.single();

      if (error) throw error;

      if (withTemples) {
        // Fetch temples in this category
        const { data: temples } = await supabase
          .from("temples")
          .select("*")
          .eq("category_id", category.id)
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        return NextResponse.json({
          success: true,
          data: { ...category, temples: temples || [] },
        });
      }

      return NextResponse.json({ success: true, data: category });
    }

    // Fetch all categories
    const { data: categories, error } = await supabase
      .from("temple_categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error("Error fetching temple categories:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch temple categories",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/temple-categories
 * Create a new temple category
 */
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Auto-generate slug if not provided
    if (!body.category_slug && body.category_name) {
      body.category_slug = body.category_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    // Create category
    const { data: category, error: categoryError } = await supabase
      .from("temple_categories")
      .insert([body])
      .select()
      .single();

    if (categoryError) throw categoryError;

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error("Error creating temple category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create temple category",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/temple-categories
 * Update a temple category
 */
export async function PATCH(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Update category
    const { data: category, error: categoryError } = await supabase
      .from("temple_categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (categoryError) throw categoryError;

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error("Error updating temple category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update temple category",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/temple-categories
 * Delete a temple category
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
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Check if any temples are using this category
    const { data: temples } = await supabase
      .from("temples")
      .select("id")
      .eq("category_id", id);

    if (temples && temples.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category. ${temples.length} temple(s) are using this category.`,
          details: "Please reassign or delete the temples first.",
        },
        { status: 400 }
      );
    }

    // Delete category
    const { error } = await supabase
      .from("temple_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Temple category deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting temple category:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete temple category",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
