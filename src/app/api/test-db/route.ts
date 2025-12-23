/**
 * API ROUTE: Database Connection Test
 *
 * Visit: http://localhost:3000/api/test-db
 */

import { NextResponse } from 'next/server';

// Force this route to be dynamic (not statically generated)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Lazy import to avoid build-time issues
    const {
      getPackages,
      getVehicles,
      getDestinations,
      getFeaturedReviews,
    } = await import('@/lib/supabase');

    // Test 1: Fetch Packages
    const packages = await getPackages();

    // Test 2: Fetch Vehicles
    const vehicles = await getVehicles();

    // Test 3: Fetch Destinations
    const destinations = await getDestinations();

    // Test 4: Fetch Reviews
    const reviews = await getFeaturedReviews(3);

    // Return success response with all data
    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      timestamp: new Date().toISOString(),
      data: {
        packages: {
          count: packages.length,
          sample: packages.slice(0, 3).map(p => ({
            title: p.title,
            type: p.type,
            slug: p.slug,
          })),
        },
        vehicles: {
          count: vehicles.length,
          sample: vehicles.slice(0, 3).map(v => ({
            name: v.name,
            type: v.vehicle_type,
            capacity: v.capacity,
          })),
        },
        destinations: {
          count: destinations.length,
          sample: destinations.slice(0, 3).map(d => ({
            name: d.name,
            slug: d.slug,
          })),
        },
        reviews: {
          count: reviews.length,
        },
      },
      tests_passed: {
        packages: packages.length > 0,
        vehicles: vehicles.length > 0,
        destinations: destinations.length > 0,
        reviews: reviews.length > 0,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: errorMessage,
        timestamp: new Date().toISOString(),
        troubleshooting: {
          check_env: 'Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
          check_schema: 'Run the schema_enhanced.sql in Supabase SQL Editor',
          check_seed: 'Run the seed_enhanced.sql in Supabase SQL Editor',
        },
      },
      { status: 500 }
    );
  }
}
