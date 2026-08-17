import type { Metadata } from 'next';
import { getPickupLocations, getRoutesWithCategories } from '@/lib/supabase';
import BookingPageClient from '@/components/booking/BookingPageClient';
import type { TransferRoute } from '@/components/booking/TransferRouteSelector';

/**
 * /booking is listed in the sitemap at priority 0.9 — the second-highest URL on
 * the site — but had no metadata at all, so Google indexed it under the root
 * layout's generic default title with no canonical. For the page the whole
 * funnel points at, that is the worst place to leave the defaults.
 */
export const metadata: Metadata = {
  title: 'Book a Taxi in Nainital — Instant Fare & Confirmation',
  description:
    'Book your Nainital taxi online in under a minute. Airport and railway transfers from Kathgodam, Delhi and Pantnagar, plus sightseeing tours. See the fare before you confirm.',
  alternates: { canonical: '/booking' },
  openGraph: {
    title: 'Book a Taxi in Nainital',
    description:
      'Book your Nainital taxi online in under a minute. Transparent fares, professional drivers, instant confirmation.',
    url: '/booking',
    type: 'website',
  },
};

/**
 * Server shell for the booking flow.
 *
 * Its only job is to fetch the two lists Step 1's transfer picker needs and
 * hand them to the client component as props. Doing it here rather than
 * fetching on mount is what keeps the pick-up/drop-off dropdowns populated on
 * first paint — a client fetch would leave them empty for a beat and shift the
 * layout underneath the user on the most conversion-critical screen we have.
 *
 * Both queries already exist and are cached, so this adds no new DB access
 * pattern: getPickupLocations() is unstable_cache'd, and
 * getRoutesWithCategories().allRoutes is exactly "active routes with their
 * pricing attached".
 *
 * searchParams is deliberately NOT read or forwarded here — see the comment on
 * BookingPageClient's default export.
 *
 * Note: because this page is server-rendered, it lives in Next's full route
 * cache, so revalidateRoutePages() explicitly revalidates /booking after any
 * admin route/price write.
 */
export default async function BookingPage() {
  const [pickupLocations, routesData] = await Promise.all([
    getPickupLocations(),
    getRoutesWithCategories(),
  ]);

  return (
    <BookingPageClient
      pickupLocations={pickupLocations}
      transferRoutes={routesData.allRoutes as TransferRoute[]}
    />
  );
}
