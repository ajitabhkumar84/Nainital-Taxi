import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

// GET - Fetch all categories or a specific category
export async function GET(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      // Fetch single category
      const { data, error } = await supabase
        .from("route_categories")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return NextResponse.json({ data });
    } else {
      // Fetch all categories
      const { data, error } = await supabase
        .from("route_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;

      return NextResponse.json({ data });
    }
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  const supabase = getAdminSupabaseClient();

  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from("route_categories")
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create category" },
      { status: 500 }
    );
  }
}

// PATCH - Update a category
export async function PATCH(request: NextRequest) {
  const supabase = getAdminSupabaseClient();

  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("route_categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a category
export async function DELETE(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Category ID is required" },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from("route_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete category" },
      { status: 500 }
    );
  }
}
