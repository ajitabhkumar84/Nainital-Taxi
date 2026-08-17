import { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { SITE_URL } from '@/lib/siteUrl';
import { CACHE_TAGS, CONTENT_CACHE_TTL } from '@/lib/cacheTags';

/**
 * The three sitemap queries, cached together as one entry.
 *
 * Two things changed here from the original:
 *
 *  1. This used the cookie-based @supabase/ssr client from
 *     '@/lib/supabase/server'. unstable_cache throws if the wrapped function
 *     calls cookies(), so caching it required moving to the plain
 *     supabase-js singleton first. The sitemap has no session to read anyway —
 *     it is public, anonymous output.
 *
 *  2. Without caching, every crawler request ran three live queries. Search
 *     engines re-fetch sitemaps frequently and bots are not rate-limited, so
 *     this was one of the easier ways for the free tier to be drained by
 *     traffic that generates no revenue.
 *
 * Tagged with destinations/packages/multi-day-rental so publishing new content
 * puts it in the sitemap immediately rather than waiting out the TTL.
 */
type SlugRow = { slug: string; updated_at: string | null };
type MultiDayRow = { page_slug: string; updated_at: string | null } | null;

const getSitemapContent = unstable_cache(
  async (): Promise<{
    destinations: SlugRow[];
    packages: SlugRow[];
    multiDayRentalPage: MultiDayRow;
  }> => {
    // Cast through `any`: the generated Database type models only a subset of
    // tables (multi_day_rental_page is not in it), which collapses the result
    // rows to `never`. Same escape hatch the query layer uses — the row shapes
    // are pinned by the explicit return type above instead.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const [destinationsResult, packagesResult, multiDayResult] = await Promise.all([
      (supabase.from as any)('destinations')
        .select('slug, updated_at')
        .eq('is_active', true) as Promise<{ data: SlugRow[] | null }>,
      (supabase.from as any)('packages')
        .select('slug, updated_at')
        .eq('is_active', true)
        .eq('type', 'tour') as Promise<{ data: SlugRow[] | null }>,
      (supabase.from as any)('multi_day_rental_page')
        .select('page_slug, updated_at')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .eq('is_published', true)
        .maybeSingle() as Promise<{ data: MultiDayRow }>,
    ]);
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return {
      destinations: destinationsResult.data || [],
      packages: packagesResult.data || [],
      multiDayRentalPage: multiDayResult.data,
    };
  },
  ['sitemap-content'],
  {
    tags: [CACHE_TAGS.destinations, CACHE_TAGS.packages, CACHE_TAGS.multiDayRental],
    revalidate: CONTENT_CACHE_TTL,
  }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const { destinations, packages, multiDayRentalPage } = await getSitemapContent();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/booking`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/fleet`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/rates`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tour`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/destinations`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/temples`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  const destinationRoutes: MetadataRoute.Sitemap = destinations.map((dest) => ({
    url: `${baseUrl}/destinations/${dest.slug}`,
    lastModified: dest.updated_at ? new Date(dest.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Tour packages are fetched with type='tour' above, matching what
  // /tour/[name] actually serves — it queries packages with that filter, so a
  // transfer-type package 404s there. Without it the sitemap advertised dead
  // ends (the legacy kathgodam/pantnagar "drop" packages, now superseded by
  // the A-to-B route picker in Step 1).
  //
  // Emit /tour/{slug}, the canonical URL. /packages/{slug} is only a
  // redirect shim to it, and listing redirects in a sitemap burns crawl
  // budget on URLs that are never the destination.
  const packageRoutes: MetadataRoute.Sitemap = packages.map((pkg) => ({
    url: `${baseUrl}/tour/${pkg.slug}`,
    lastModified: pkg.updated_at ? new Date(pkg.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Transfer routes are deliberately NOT listed here.
  //
  // There was a block that emitted `/tour/{route.name}` for every active
  // route. It never produced a single URL: `routes` has no `name` column (the
  // pair lives in pickup_location/drop_location), so the query errored, the
  // result came back null, and the .map() ran over an empty array — silently,
  // because the error was never checked.
  //
  // Fixing the column would not have helped, because there is no per-route
  // page to point at:
  //   - /tour/[name] resolves a PACKAGE slug (packages, type='tour'), not a
  //     route — a route slug 404s there.
  //   - /[slug] only serves the multi-day-rental page and notFound()s the rest.
  //   - Routes surface on /rates (already listed above as a static route), and
  //     a route's "View Details" link goes to its linked destination page,
  //     whose URL destinationRoutes already emits.
  // So routes contribute no URLs of their own, and adding one would list a
  // 404. If per-route landing pages are built later (there is an unused
  // RouteLandingPage.tsx waiting for a page to host it), emit
  // `${baseUrl}/{route.slug}` here off routes.slug.

  // Multi-day rental page's URL is admin-configurable (page_slug) — the live
  // value is pulled above rather than hardcoding "/multi-day-rental".
  const multiDayRentalRoutes: MetadataRoute.Sitemap = multiDayRentalPage
    ? [
        {
          url: `${baseUrl}/${multiDayRentalPage.page_slug}`,
          lastModified: multiDayRentalPage.updated_at ? new Date(multiDayRentalPage.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        },
      ]
    : [];

  return [...staticRoutes, ...destinationRoutes, ...packageRoutes, ...multiDayRentalRoutes];
}
