import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { revalidateRoutePages } from "@/lib/revalidateRoutePages";

// POST - Reorder routes
//
// Takes the full renumbered list rather than a pair of swapped rows, so a
// dropped or out-of-order request can never leave a partial ordering behind —
// each request fully describes the intended order. display_order has no unique
// constraint, so the values can be written directly with no two-phase swap.
export async function POST(request: NextRequest) {
  const supabase = getAdminSupabaseClient();

  try {
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    // Update each route's display_order
    const promises = updates.map((update: { id: string; display_order: number }) =>
      supabase
        .from("routes")
        .update({ display_order: update.display_order })
        .eq("id", update.id)
    );

    const results = await Promise.all(promises);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      throw new Error("Failed to reorder some routes");
    }

    // Route order drives the homepage transfers table, /rates and /quote.
    revalidateRoutePages();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error reordering routes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reorder routes" },
      { status: 500 }
    );
  }
}
