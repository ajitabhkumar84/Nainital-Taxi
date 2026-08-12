import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

// Bust the cached getPickupLocations() (src/lib/supabase/queries_enhanced.ts)
// so the homepage/lp-taxi Transfers widget reflects admin changes right
// away, instead of waiting for its 5-minute fallback revalidation. Wrapped
// in try/catch so a revalidation hiccup never masks a successful DB write —
// same pattern as revalidateRoutePages() in /api/admin/routes.
function revalidatePickupLocationsCache() {
  try {
    revalidateTag("pickup-locations");
  } catch (error) {
    console.error("Revalidation failed (DB write succeeded):", error);
  }
}

// GET - Fetch all pickup locations or a specific one
export async function GET(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    if (id) {
      // Fetch single pickup location
      const { data, error } = await supabase
        .from("pickup_locations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return NextResponse.json({ data });
    } else {
      // Fetch all pickup locations (unfiltered — admin sees inactive ones too)
      const { data, error } = await supabase
        .from("pickup_locations")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;

      return NextResponse.json({ data });
    }
  } catch (error: any) {
    console.error("Error fetching pickup locations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pickup locations" },
      { status: 500 }
    );
  }
}

// POST - Create a new pickup location
export async function POST(request: NextRequest) {
  const supabase = getAdminSupabaseClient();

  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from("pickup_locations")
      .insert([body])
      .select()
      .single();

    if (error) throw error;

    revalidatePickupLocationsCache();

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating pickup location:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create pickup location" },
      { status: 500 }
    );
  }
}

// PATCH - Update a pickup location
export async function PATCH(request: NextRequest) {
  const supabase = getAdminSupabaseClient();

  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Pickup location ID is required" },
        { status: 400 }
      );
    }

    // Renaming ("Delhi" -> "New Delhi"): routes.pickup_location/drop_location
    // are plain strings with no FK to this table, so an existing route that
    // still says "Delhi" would stop resolving the instant the name changes.
    // Fold the old name into `aliases` so it keeps matching.
    if (updates.name) {
      const { data: existing, error: fetchError } = await supabase
        .from("pickup_locations")
        .select("name, aliases")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      if (existing && existing.name !== updates.name) {
        const incomingAliases: string[] = updates.aliases ?? existing.aliases ?? [];
        updates.aliases = Array.from(new Set([...incomingAliases, existing.name]));
      }
    }

    const { data, error } = await supabase
      .from("pickup_locations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    revalidatePickupLocationsCache();

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error updating pickup location:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update pickup location" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a pickup location
export async function DELETE(request: NextRequest) {
  const supabase = getAdminSupabaseClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Pickup location ID is required" },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase.from("pickup_locations").delete().eq("id", id);

    if (error) throw error;

    revalidatePickupLocationsCache();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting pickup location:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete pickup location" },
      { status: 500 }
    );
  }
}
