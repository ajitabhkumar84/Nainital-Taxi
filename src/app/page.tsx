import Link from "next/link";
import { Metadata } from "next";
import { buildBookingUrl } from "@/lib/bookingLink";
import { Header, Footer, Button } from "@/components/ui";
import { Car, Star, Shield, UserCheck, Phone, Heart, Award, MapPin, ArrowRight } from "lucide-react";
import DestinationCard from "@/components/home/DestinationCard";
import PackageCard from "@/components/home/PackageCard";
import SeasonalHero from "@/components/home/SeasonalHero";
import TrustFiguresBar from "@/components/home/TrustFiguresBar";
import BookingTicker from "@/components/home/BookingTicker";
import {
  getDestinations,
  getPackages,
  getMinPricePerPackage,
  getTransferRoutes,
  getFeaturedReviews,
  getTrustSection,
  getPageContent,
  PageSection,
} from "@/lib/supabase";
import { getMultiDayRentalPageData } from "@/lib/multiDayRental";

const TRUST_PILLAR_ICONS: Record<string, typeof UserCheck> = {
  "user-check": UserCheck,
  shield: Shield,
  award: Award,
  heart: Heart,
  car: Car,
  phone: Phone,
  star: Star,
  "map-pin": MapPin,
};

// Matches the root layout's default title/description (src/app/layout.tsx) —
// used whenever the admin hasn't set a custom SEO title/description for 'home'.
const DEFAULT_SEO_TITLE = "Nainital Taxi - Premium Taxi & Tour Services in Nainital";
const DEFAULT_SEO_DESCRIPTION =
  "Book premium taxi services in Nainital. Reliable transfers from Kathgodam, Delhi, Pantnagar. Tour packages to Bhimtal, Naukuchiatal, Kainchi Dham & more. Best rates guaranteed.";

export async function generateMetadata(): Promise<Metadata> {
  // Deduped with the getPageContent('home') call in Home() below via React.cache.
  const content = await getPageContent("home");
  const title = content.seo_title?.trim() || DEFAULT_SEO_TITLE;
  const description = content.seo_description?.trim() || DEFAULT_SEO_DESCRIPTION;

  return {
    // `absolute` bypasses the root layout's "%s | Nainital Taxi" template —
    // seo_title is already the complete, brand-inclusive title for '/'.
    title: { absolute: title },
    description,
    // Declared here rather than inherited from the root layout — a root canonical
    // would apply to every page, not just '/'. Relative, so it resolves against
    // metadataBase.
    alternates: { canonical: "/" },
  };
}

export default async function Home() {
  // Fetch homepage content from Supabase in parallel
  const [destinations, tourPackages, minPrices, transferRoutes, testimonials, trustSection, pageContent, multiDayRentalPage] = await Promise.all([
    getDestinations(),
    getPackages("tour"),
    getMinPricePerPackage(),
    getTransferRoutes(),
    getFeaturedReviews(3),
    getTrustSection(),
    getPageContent("home"),
    getMultiDayRentalPageData(),
  ]);

  const trustPillars = (trustSection.trust_pillars || [])
    .filter((p) => p.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  const sectionsMap: Record<string, PageSection> = Object.fromEntries(
    (pageContent.sections || []).map((s) => [s.key, s])
  );

  return (
    <>
      <Header />

      {/* Seasonal Hero Section */}
      <SeasonalHero
        overrideImage={pageContent.hero_image_url}
        overrideTitle={pageContent.hero_title}
        overrideSubtitle={pageContent.hero_subtitle}
      />

      {/* Trust Figures Bar */}
      <TrustFiguresBar />

      {/* Tour Packages */}
      <section className="py-16 md:py-24 px-4 bg-lake">
        <div className="container mx-auto max-w-[1200px]">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-[26px] md:text-3xl font-display font-semibold text-ink mb-2">
                {sectionsMap.tours?.heading || "Day tours and packages"}
              </h2>
              <p className="text-base text-slate-500">
                {sectionsMap.tours?.subheading || "Great Itineraries & Best Prices"}
              </p>
            </div>
            <Link
              href="/packages"
              className="hidden md:block text-sm font-medium text-sunshine hover:text-sunshine-500 whitespace-nowrap"
            >
              View all packages →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tourPackages.length > 0 ? (
              tourPackages.slice(0, 6).map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  slug={pkg.slug}
                  title={pkg.title}
                  imageUrl={pkg.image_url}
                  duration={pkg.duration}
                  placesCovered={pkg.places_covered}
                  minPrice={minPrices[pkg.id]}
                  availabilityStatus={pkg.availability_status}
                />
              ))
            ) : (
              <p className="col-span-full text-center text-slate-500">
                Loading packages...
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Multi-Day Rentals */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-[1200px]">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            {/* Photo set via /admin/multi-day-rental → "Homepage Card Image".
                Falls back to a neutral placeholder until one is uploaded. */}
            {multiDayRentalPage?.homepage_card_image_url ? (
              <div className="aspect-video rounded-lg overflow-hidden border border-slate-200">
                <img
                  src={multiDayRentalPage.homepage_card_image_url}
                  alt="Multi-day car rental in Kumaon"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                <span className="text-sm text-slate-500">Multi-day rentals</span>
              </div>
            )}

            <div>
              <h2 className="text-[26px] md:text-3xl font-display font-semibold text-ink mb-3">
                {sectionsMap.rentals?.heading || "Multi-day rentals"}
              </h2>
              <p className="text-base text-slate-600 mb-4">
                Keep the same car and driver for your whole trip. Ideal for
                circuits across Kumaon — Nainital, Ranikhet, Mukteshwar,
                Corbett — at your own pace.
              </p>
              <p className="text-sm text-slate-500 mb-6">
                Rates depend on your itinerary and number of days. Includes
                driver, fuel and state taxes.
              </p>
              <Button variant="primary" size="sm" asChild className="min-h-[44px]">
                <Link href="/multi-day-rental">
                  See rental options
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Point-to-Point Transfers */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-[1200px]">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-[26px] md:text-3xl font-display font-semibold text-ink mb-2">
                {sectionsMap.transfers?.heading || "Fixed-fare transfers"}
              </h2>
              <p className="text-base text-slate-500">
                {sectionsMap.transfers?.subheading || "Transparent pricing for our most-booked routes. No surge, no haggling."}
              </p>
            </div>
            <Link
              href="/rates"
              className="hidden md:block text-sm font-medium text-sunshine hover:text-sunshine-500 whitespace-nowrap"
            >
              See all routes and rates →
            </Link>
          </div>

          {transferRoutes.length > 0 ? (
            <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
              {/* Table header - desktop only */}
              <div className="hidden md:grid grid-cols-[2fr_0.8fr_0.8fr_1fr_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
                <span>Route</span>
                <span>Distance</span>
                <span>Time</span>
                <span>Starts from</span>
                <span></span>
              </div>

              {transferRoutes.map((route) => {
                const vehicleOptions = [
                  route.sedanPrice != null ? { price: route.sedanPrice, vehicle: "sedan" as const } : null,
                  route.suvPrice != null ? { price: route.suvPrice, vehicle: "suv_normal" as const } : null,
                ].filter((o): o is { price: number; vehicle: "sedan" | "suv_normal" } => o !== null);
                const cheapest = vehicleOptions.length > 0
                  ? vehicleOptions.reduce((a, b) => (b.price < a.price ? b : a))
                  : null;

                return (
                  <div
                    key={route.id}
                    className="flex flex-col gap-3 px-6 py-5 border-b border-slate-200 last:border-b-0 hover:bg-slate-50 transition-colors md:grid md:grid-cols-[2fr_0.8fr_0.8fr_1fr_auto] md:items-center md:gap-4"
                  >
                    <div className="text-[15px] font-semibold text-ink">
                      {route.pickup_location} → {route.drop_location}
                    </div>
                    <div className="text-sm text-slate-500 tabular-nums">
                      {route.distance ? `${route.distance} km` : "—"}
                    </div>
                    <div className="text-sm text-slate-500 tabular-nums">
                      {route.duration || "—"}
                    </div>
                    <div className="text-sm text-ink tabular-nums">
                      {cheapest ? (
                        <>
                          <span className="text-slate-500">Starts from </span>
                          ₹{cheapest.price.toLocaleString("en-IN")}
                        </>
                      ) : (
                        <span className="text-slate-400">On request</span>
                      )}
                    </div>
                    <Button variant="primary" size="sm" asChild className="min-h-[44px] md:w-auto w-full">
                      <Link
                        href={buildBookingUrl({
                          routeId: route.id,
                          packageType: "transfer",
                          packageTitle: `${route.pickup_location} to ${route.drop_location}`,
                          ...(cheapest ? { vehicle: cheapest.vehicle } : {}),
                          pickup: route.pickup_location,
                          dropoff: route.drop_location,
                        })}
                      >
                        Book
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-slate-500">Loading routes...</p>
          )}

          <p className="mt-4 text-sm text-slate-500">
            Fares include driver, fuel and parking. No night charges.
          </p>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-[1200px]">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-[26px] md:text-3xl font-display font-semibold text-ink mb-2">
                {sectionsMap.destinations?.heading || "Where we go"}
              </h2>
              <p className="text-base text-slate-500">
                {sectionsMap.destinations?.subheading || "Popular destinations across Nainital and Kumaon."}
              </p>
            </div>
            <Link
              href="/destinations"
              className="hidden md:block text-sm font-medium text-sunshine hover:text-sunshine-500 whitespace-nowrap"
            >
              View all destinations →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.length > 0 ? (
              destinations.slice(0, 6).map((destination) => (
                <DestinationCard
                  key={destination.id}
                  slug={destination.slug}
                  name={destination.name}
                  hero_image_url={destination.hero_image_url}
                  distance_from_nainital={destination.distance_from_nainital}
                  duration={destination.duration}
                />
              ))
            ) : (
              /* Fallback if no destinations loaded */
              <p className="col-span-full text-center text-slate-500">
                Loading destinations...
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Guest Testimonials */}
      <section className="py-16 md:py-24 px-4 bg-lake">
        <div className="container mx-auto max-w-[1200px]">
          <div className="text-center mb-10">
            <h2 className="text-[26px] md:text-3xl font-display font-semibold text-ink mb-2">
              {sectionsMap.testimonials?.heading || "What guests say"}
            </h2>
            <p className="text-base text-slate-500">
              {sectionsMap.testimonials?.subheading || "Real experiences from travelers like you."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < t.rating
                          ? "w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]"
                          : "w-3.5 h-3.5 text-slate-200"
                      }
                    />
                  ))}
                </div>
                <p className="text-[15px] leading-relaxed text-slate-600 mb-6">
                  {`"${t.review_text}"`}
                </p>
                <div className="flex items-center gap-3">
                  {t.photos?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.photos[0]}
                      alt={t.customer_name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.customer_name}</p>
                    {t.customer_location && (
                      <p className="text-[13px] text-slate-500">{t.customer_location}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-[13px] text-slate-500">
            4.8 out of 5 from 500 Google reviews
          </p>
        </div>
      </section>

      {/* Why families trust us (safety + trust, merged) */}
      <section className="py-16 md:py-24 px-4 border-t border-slate-200">
        <div className="container mx-auto max-w-[1200px]">
          <div className="grid gap-10 md:grid-cols-[0.85fr_1fr] md:items-start">
            {trustSection.image_url ? (
              <div className="aspect-[4/5] rounded-lg overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={trustSection.image_url}
                  alt={trustSection.heading}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[4/5] rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                <span className="text-sm text-slate-500 px-6 text-center">Our drivers</span>
              </div>
            )}

            <div>
              <h2 className="text-[26px] md:text-3xl font-display font-semibold text-ink mb-4">
                {trustSection.heading}
              </h2>
              <p className="text-base text-slate-600 mb-8">
                {trustSection.description}
              </p>

              <div className="border-t border-slate-200 divide-y divide-slate-200 mb-8">
                {trustPillars.map((pillar) => {
                  const Icon = TRUST_PILLAR_ICONS[pillar.icon_name] || Shield;
                  return (
                    <div key={pillar.title} className="flex items-start gap-4 py-4">
                      <Icon className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[15px] font-semibold text-ink">{pillar.title}</p>
                        <p className="text-sm text-slate-500">{pillar.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link
                href="#booking"
                className="inline-flex items-center justify-center rounded-md bg-sunshine px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sunshine-500"
              >
                Check availability
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      <BookingTicker />
    </>
  );
}
