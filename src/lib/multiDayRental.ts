import type { Metadata } from 'next';
import type { MultiDayRentalPage } from '@/lib/supabase/types';

// Deliberately no `cache: 'no-store'` — the public route is meant to be
// cached and refreshed on demand via `revalidatePath` from the admin API
// (see src/app/api/admin/multi-day-rental/route.ts), not re-fetched on
// every request.
export async function getMultiDayRentalPageData(): Promise<MultiDayRentalPage | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/multi-day-rental`
    );
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error fetching multi-day rental page:', error);
    return null;
  }
}

export function multiDayRentalMetadata(pageData: MultiDayRentalPage | null): Metadata {
  return {
    title: pageData?.seo_title || 'Multi-Day Car Rental | Nainital Taxi',
    description: pageData?.seo_description || 'Book multi-day car rentals for Uttarakhand tours',
    keywords: pageData?.seo_keywords || 'multi-day rental, Uttarakhand tour, taxi booking',
  };
}
