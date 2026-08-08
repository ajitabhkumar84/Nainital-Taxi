import { cache } from 'react';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { getPackagesByIds, getMinPricePerPackage } from '@/lib/supabase/queries_enhanced';
import { DEFAULT_MULTI_DAY_RENTAL_PAGE, type MultiDayRentalPage, type Package } from '@/lib/supabase/types';

export const MULTI_DAY_RENTAL_FIXED_ID = '00000000-0000-0000-0000-000000000001';

function defaultPage(): MultiDayRentalPage {
  const now = new Date().toISOString();
  return {
    ...DEFAULT_MULTI_DAY_RENTAL_PAGE,
    id: MULTI_DAY_RENTAL_FIXED_ID,
    created_at: now,
    updated_at: now,
  } as MultiDayRentalPage;
}

// Queries Supabase directly rather than fetching this app's own /api route over
// HTTP. The old self-fetch depended on NEXT_PUBLIC_SITE_URL matching the live
// origin — when it didn't (localhost fallback, or a domain change), the request
// failed and the page silently rendered as unconfigured.
//
// Uses the cookie-free anon client on purpose: the cookie-based server client
// calls cookies(), which would opt the public page out of static rendering.
export const getPublishedMultiDayRentalPage = cache(
  async (): Promise<MultiDayRentalPage | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('multi_day_rental_page') as any)
      .select('*')
      .eq('id', MULTI_DAY_RENTAL_FIXED_ID)
      .eq('is_published', true)
      .single();

    if (error) {
      // No row yet, or unpublished — serve defaults so the page still renders.
      if (error.code === 'PGRST116') return defaultPage();
      console.error('Error fetching multi-day rental page:', error);
      return null;
    }

    return data as MultiDayRentalPage;
  }
);

export async function getMultiDayRentalPageData(): Promise<MultiDayRentalPage | null> {
  return getPublishedMultiDayRentalPage();
}

export interface FeaturedPackagesData {
  packages: Package[];
  minPrices: Record<string, number>;
}

const NO_FEATURED_PACKAGES: FeaturedPackagesData = { packages: [], minPrices: {} };

// Lives here rather than in each route so the two entry points that render
// this page (/multi-day-rental and the custom-slug /[slug]) can't drift.
export async function getMultiDayRentalFeaturedPackages(
  pageData: MultiDayRentalPage | null
): Promise<FeaturedPackagesData> {
  const ids = pageData?.featured_package_ids;
  if (!ids || ids.length === 0) return NO_FEATURED_PACKAGES;

  const packages = await getPackagesByIds(ids);
  if (packages.length === 0) return NO_FEATURED_PACKAGES;

  return { packages, minPrices: await getMinPricePerPackage() };
}

export function multiDayRentalMetadata(pageData: MultiDayRentalPage | null): Metadata {
  return {
    title: pageData?.seo_title || 'Multi-Day Car Rental | Nainital Taxi',
    description: pageData?.seo_description || 'Book multi-day car rentals for Uttarakhand tours',
    keywords: pageData?.seo_keywords || 'multi-day rental, Uttarakhand tour, taxi booking',
  };
}
