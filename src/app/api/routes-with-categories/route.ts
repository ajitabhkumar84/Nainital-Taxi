import { NextResponse } from "next/server";
import { getRoutesWithCategories } from "@/lib/supabase";

// GET - Fetch all routes with categories and pricing
//
// Delegates to the shared getRoutesWithCategories() query (see
// src/lib/supabase/queries_enhanced.ts) so /rates can call the same logic
// directly as a server component without an HTTP round trip. This endpoint
// stays in place — and its response shape is unchanged — for /quote
// (src/app/quote/page.tsx), which still fetches it client-side.
export async function GET() {
  const { categories, allRoutes } = await getRoutesWithCategories();

  return NextResponse.json({
    data: { categories, allRoutes },
  });
}
