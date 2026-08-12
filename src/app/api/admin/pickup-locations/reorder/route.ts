import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

// POST - Reorder pickup locations
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

    // Update each pickup location's display_order
    const promises = updates.map((update: { id: string; display_order: number }) =>
      supabase
        .from("pickup_locations")
        .update({ display_order: update.display_order })
        .eq("id", update.id)
    );

    const results = await Promise.all(promises);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      throw new Error("Failed to reorder some pickup locations");
    }

    try {
      revalidateTag("pickup-locations");
    } catch (error) {
      console.error("Revalidation failed (DB write succeeded):", error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error reordering pickup locations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reorder pickup locations" },
      { status: 500 }
    );
  }
}
