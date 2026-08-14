import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/siteUrl';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const supabase = await createClient();

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

  // Fetch dynamic destinations
  const { data: destinations } = await supabase
    .from('destinations')
    .select('slug, updated_at')
    .eq('is_active', true);

  const destinationRoutes: MetadataRoute.Sitemap = (destinations || []).map((dest) => ({
    url: `${baseUrl}/destinations/${dest.slug}`,
    lastModified: dest.updated_at ? new Date(dest.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Fetch dynamic tour packages.
  //
  // type='tour' matches what /tour/[name] actually serves — it queries
  // packages with that filter, so a transfer-type package 404s there. Without
  // this the sitemap advertised dead ends (the legacy kathgodam/pantnagar
  // "drop" packages, now superseded by the A-to-B route picker in Step 1).
  const { data: packages } = await supabase
    .from('packages')
    .select('slug, updated_at')
    .eq('is_active', true)
    .eq('type', 'tour');

  // Emit /tour/{slug}, the canonical URL. /packages/{slug} is only a
  // redirect() shim to it, and listing redirects in a sitemap burns crawl
  // budget on URLs that are never the destination.
  const packageRoutes: MetadataRoute.Sitemap = (packages || []).map((pkg) => ({
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

  // Multi-day rental page's URL is admin-configurable (page_slug) —
  // pull the live value instead of hardcoding "/multi-day-rental".
  const { data: multiDayRentalPage } = await supabase
    .from('multi_day_rental_page')
    .select('page_slug, updated_at')
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .eq('is_published', true)
    .maybeSingle();

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
