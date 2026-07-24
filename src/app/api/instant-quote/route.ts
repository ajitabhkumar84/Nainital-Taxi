import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { routeId, vehicleType, date } = body;

    if (!routeId || !vehicleType || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: routeId, vehicleType, date' },
        { status: 400 }
      );
    }

    // 1. Get the season for the given date
    const { data: seasonData } = await supabase
      .from('seasons')
      .select('id, name')
      .eq('is_active', true)
      .lte('start_date', date)
      .gte('end_date', date)
      .order('name', { ascending: false })
      .limit(1)
      .single();

    let seasonName = 'Off-Season';
    if (seasonData) {
      seasonName = seasonData.name;
    }

    // 2. Get route details
    const { data: routeData, error: routeError } = await supabase
      .from('routes')
      .select('name, from_location, to_location, distance_km, estimated_duration')
      .eq('id', routeId)
      .single();

    if (routeError || !routeData) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    // 3. Get pricing for route-vehicle-season combination
    const { data: pricingData, error: pricingError } = await supabase
      .from('route_pricing')
      .select('price')
      .eq('route_id', routeId)
      .eq('vehicle_type', vehicleType)
      .eq('season_name', seasonName)
      .single();

    if (pricingError || !pricingData) {
      return NextResponse.json(
        { error: 'Pricing not found for this combination' },
        { status: 404 }
      );
    }

    // 4. Get availability for the date
    const { data: availabilityData } = await supabase
      .from('availability')
      .select('total_fleet_size, cars_booked')
      .eq('date', date)
      .single();

    let carsAvailable = 7; // Default fleet size
    if (availabilityData) {
      carsAvailable = availabilityData.total_fleet_size - availabilityData.cars_booked;
    }

    return NextResponse.json({
      success: true,
      data: {
        route: {
          name: routeData.name,
          from: routeData.from_location,
          to: routeData.to_location,
          distance: routeData.distance_km,
          duration: routeData.estimated_duration,
        },
        pricing: {
          price: pricingData.price,
          vehicleType,
          seasonName,
          date,
        },
        availability: {
          carsAvailable,
          status: carsAvailable >= 5 ? 'available' : carsAvailable >= 1 ? 'limited' : 'sold_out',
        },
      },
    });
  } catch (error) {
    console.error('Error in instant-quote API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
