import { NextResponse } from 'next/server';
import { getPackageById } from '@/lib/supabase';

/**
 * GET /api/packages/[id]
 *
 * Backs Step2TripDetails' packageSlug-fallback lookup (used when a booking
 * URL arrives with a packageId but no packageSlug — e.g. a hand-built URL).
 * getPackageById is unstable_cache-wrapped, which is only safe to invoke
 * server-side — calling it directly from that Client Component throws
 * "Invariant: incrementalCache missing in unstable_cache". This route is
 * the server-side home for that call.
 *
 * Not sourced from src/app/booking/page.tsx's Server Component instead:
 * that page deliberately does not read searchParams, so it stays in Next's
 * full route cache regardless of query string — see the comment on
 * BookingPage in that file.
 *
 * revalidate=300 caches the response for 5 minutes per id — a second cache
 * layer on top of getPackageById's own 60s tag-based revalidation, not
 * reachable by revalidateTag(). Same deliberate tradeoff as
 * /api/vehicle-labels; matters less here since this only backs a rarely-hit
 * fallback, not a primary read path.
 */
export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const pkg = await getPackageById(id);
    return NextResponse.json({ data: pkg });
  } catch (error) {
    console.error('Error in packages/[id] GET:', error);
    return NextResponse.json({ data: null }, { status: 500 });
  }
}
