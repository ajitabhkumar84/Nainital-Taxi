import type { Metadata } from 'next';

/**
 * /quote is a client component, so it cannot export metadata itself — this
 * layout carries it instead.
 *
 * noindex, follow: this page is a funnel-internal duplicate of /booking, built
 * around the same route/vehicle/date pricing. Left indexable it competes with
 * /booking for the same queries and splits the ranking signal between two URLs
 * that do the same job. `follow` is kept so the links out of it (to /rates and
 * the destination pages) still pass value.
 *
 * It is deliberately absent from src/app/sitemap.ts for the same reason.
 */
export const metadata: Metadata = {
  title: 'Instant Taxi Quote',
  description: 'Get an instant fare estimate for your Nainital taxi journey.',
  robots: { index: false, follow: true },
};

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
