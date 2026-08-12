import type { Metadata } from 'next';
import BookingWidget from '@/components/BookingWidget';
import LandingHero from '@/components/landing/LandingHero';
import TrustBar from '@/components/landing/TrustBar';
import PricingServices from '@/components/landing/PricingServices';
import FeaturedPackages from '@/components/landing/FeaturedPackages';
import StickyContactBar from '@/components/landing/StickyContactBar';
import { LANDING_THEMES, resolveTheme } from '@/components/landing/themes';
import {
  getAdminSetting,
  getPackages,
  getMinPricePerPackage,
  getPickupLocations,
} from '@/lib/supabase';
import {
  DEFAULT_LANDING_PAGE_CONFIG,
  DEFAULT_SITE_CONFIG,
  type LandingPageConfig,
  type SiteConfig,
} from '@/lib/supabase/types';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Book Nainital Taxi — Call or WhatsApp for Instant Quote',
  description: 'Reliable Nainital taxis at honest off-season rates. Call now or book on WhatsApp for an instant quote.',
  robots: { index: false, follow: false },
};

function mergeConfig(saved: unknown): LandingPageConfig {
  if (!saved || typeof saved !== 'object') return DEFAULT_LANDING_PAGE_CONFIG;
  const s = saved as Partial<LandingPageConfig>;
  return {
    ...DEFAULT_LANDING_PAGE_CONFIG,
    ...s,
    hero: { ...DEFAULT_LANDING_PAGE_CONFIG.hero, ...s.hero },
    pricingLines: s.pricingLines?.length ? s.pricingLines : DEFAULT_LANDING_PAGE_CONFIG.pricingLines,
    featuredPackageSlugs: s.featuredPackageSlugs?.length
      ? s.featuredPackageSlugs
      : DEFAULT_LANDING_PAGE_CONFIG.featuredPackageSlugs,
  };
}

export default async function TaxiLandingPage() {
  const [savedConfig, savedContact, tourPackages, minPrices, pickupLocations] = await Promise.all([
    getAdminSetting('landing_page_config'),
    getAdminSetting('site_config_contact'),
    getPackages('tour'),
    getMinPricePerPackage(),
    getPickupLocations(),
  ]);

  const config = mergeConfig(savedConfig);
  const contact = { ...DEFAULT_SITE_CONFIG.contact, ...((savedContact as Partial<SiteConfig['contact']>) || {}) };

  const theme = LANDING_THEMES[resolveTheme(config.themeMode)];

  const telHref = `tel:${contact.phone}`;
  const whatsappDigits = contact.whatsapp.replace(/[^\d]/g, '');
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(config.whatsappMessageTemplate)}`;

  const featuredPackages = config.featuredPackageSlugs
    .map((slug) => tourPackages.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <main className="pb-24">
      <header className="flex items-center justify-between px-4 py-3">
        <span className="font-display text-lg text-ink">Nainital Taxi</span>
        <a href={telHref} className="text-sm font-semibold text-ink underline">
          {contact.phone}
        </a>
      </header>

      <LandingHero theme={theme} hero={config.hero} telHref={telHref} whatsappHref={whatsappHref} />

      <TrustBar theme={theme} />

      <PricingServices theme={theme} lines={config.pricingLines} />

      {config.showBookingWidget && (
        <section id="book" className="px-4 py-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-2xl sm:text-3xl text-ink">
              Get Your Exact Fare in 30 Seconds
            </h2>
            <div className="mt-6">
              <BookingWidget pickupLocations={pickupLocations} />
            </div>
          </div>
        </section>
      )}

      <FeaturedPackages theme={theme} packages={featuredPackages} minPrices={minPrices} />

      <StickyContactBar theme={theme} telHref={telHref} whatsappHref={whatsappHref} />
    </main>
  );
}
