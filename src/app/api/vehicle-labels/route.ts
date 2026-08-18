import { NextResponse } from 'next/server';
import { getAdminSetting } from '@/lib/supabase';

// getAdminSetting is unstable_cache-wrapped, which is only safe to invoke
// from server-side code — calling it directly from a Client Component
// throws "Invariant: incrementalCache missing in unstable_cache". This route
// is the server-side home for that call; src/hooks/useVehicleLabels.ts
// fetches it instead of importing getAdminSetting itself, the same pattern
// src/hooks/useSiteConfig.ts already uses for /api/admin/site-config.
//
// No request params are read here (the key is fixed), so this GET stays
// eligible for Next's Data Cache.
//
// revalidate=300 caches the HTTP response itself for 5 minutes — a second
// cache layer on top of getAdminSetting's own 60s tag-based revalidation.
// revalidateTag() (fired on admin writes) busts the inner unstable_cache
// entry but does NOT bust this route's cached response, so an admin edit to
// vehicle_category_labels can take up to 5 minutes to reach the browser,
// not 60s. Deliberate compute-vs-freshness tradeoff for a rarely-changed,
// non-critical display setting.
export const revalidate = 300;

export async function GET() {
  try {
    const value = await getAdminSetting('vehicle_category_labels');
    return NextResponse.json({ value });
  } catch (error) {
    console.error('Error in vehicle-labels GET:', error);
    return NextResponse.json({ value: null }, { status: 500 });
  }
}
