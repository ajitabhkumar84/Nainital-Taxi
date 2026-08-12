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

  // Fetch dynamic tour packages
  const { data: packages } = await supabase
    .from('packages')
    .select('slug, updated_at')
    .eq('is_active', true);

  const packageRoutes: MetadataRoute.Sitemap = (packages || []).map((pkg) => ({
    url: `${baseUrl}/packages/${pkg.slug}`,
    lastModified: pkg.updated_at ? new Date(pkg.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Fetch dynamic tour routes by name
  const { data: routes } = await supabase
    .from('routes')
    .select('name, updated_at')
    .eq('is_active', true);

  const tourRoutes: MetadataRoute.Sitemap = (routes || []).map((route) => ({
    url: `${baseUrl}/tour/${encodeURIComponent(route.name)}`,
    lastModified: route.updated_at ? new Date(route.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

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

  return [...staticRoutes, ...destinationRoutes, ...packageRoutes, ...tourRoutes, ...multiDayRentalRoutes];
}
