import { NextResponse } from 'next/server';
import { getPublishedMultiDayRentalPage } from '@/lib/multiDayRental';

// GET - Fetch published multi-day rental page configuration (public)
export async function GET() {
  try {
    const data = await getPublishedMultiDayRentalPage();

    if (!data) {
      return NextResponse.json(
        { error: 'Failed to fetch page configuration' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/multi-day-rental:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
