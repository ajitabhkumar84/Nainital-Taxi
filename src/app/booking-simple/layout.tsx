import type { Metadata } from 'next';

/**
 * Metadata holder for the client-component page at ./page.tsx — same reasoning
 * as src/app/quote/layout.tsx.
 *
 * noindex, follow: /booking-simple is a stripped-down variant of /booking. Two
 * indexable URLs for one booking flow is textbook duplicate content, and
 * /booking is the one that should rank.
 */
export const metadata: Metadata = {
  title: 'Quick Booking',
  description: 'Simplified booking form for Nainital taxi services.',
  robots: { index: false, follow: true },
};

export default function BookingSimpleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
