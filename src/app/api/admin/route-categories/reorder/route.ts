import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("x-admin-auth");
  if (authHeader !== ADMIN_PASSWORD) {
    return false;
  }
  return true;
}

// POST - Reorder categories
export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  try {
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    // Update each category's display_order
    const promises = updates.map((update: { id: string; display_order: number }) =>
      supabase
        .from("route_categories")
        .update({ display_order: update.display_order })
        .eq("id", update.id)
    );

    const results = await Promise.all(promises);

    // Check for errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      throw new Error("Failed to reorder some categories");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error reordering categories:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reorder categories" },
      { status: 500 }
    );
  }
}
