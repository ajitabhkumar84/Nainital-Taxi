import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui";
import HeaderServer from "@/components/ui/HeaderServer";
import FooterServer from "@/components/ui/FooterServer";
import { Clock, MapPin, Star, ArrowRight, Users, IndianRupee } from "lucide-react";
import { getPackages, getAllPricingForPackage } from "@/lib/supabase/queries_enhanced";
import { TourItinerary, hasHotelOption } from "@/lib/supabase/types";
import PackageTypeBadge from "@/components/packages/PackageTypeBadge";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Tour Packages | Nainital Taxi - Taxi-Only & Taxi+Hotel Tours",
  description: "Explore our curated tour packages across Nainital and the Kumaon hills. Choose taxi-only service or taxi + hotel packages with accommodation included. Multi-day tours to Nainital, Ranikhet, Mukteshwar, Jim Corbett and more.",
  keywords: "Nainital tour packages, taxi tour package, hotel taxi package, Uttarakhand tours, Nainital holiday packages, hill station tours",
  // Self-canonical. These listing pages are reachable with tracking query
  // strings from our own ads (?utm_source=...), and without this Google treats
  // each variant as a separate near-duplicate URL and splits the ranking
  // signal. Relative — resolved against metadataBase in src/app/layout.tsx.
  alternates: { canonical: "/tour" },
};

const CARD_GRADIENTS = [
  "from-teal/10 to-lake",
  "from-coral/10 to-sunrise",
  "from-sunshine/20 to-sunrise",
  "from-teal/5 via-lake to-coral/5",
  "from-coral/5 to-sunshine/20",
  "from-lake to-teal/10",
];

const CARD_BORDERS = [
  "border-l-teal",
  "border-l-coral",
  "border-l-sunshine-500",
  "border-l-teal-500",
  "border-l-coral-400",
  "border-l-teal-400",
];

export default async function TourPackagesPage() {
  const packages = await getPackages("tour");

  // Fetch pricing for all packages
  const packagesWithPricing = await Promise.all(
    packages.map(async (pkg) => {
      const pricing = await getAllPricingForPackage(pkg.id);
      const offSeasonPrices = pricing
        .filter(p => p.season_name === 'Off-Season' && p.price > 0)
        .map(p => p.price);
      const minPrice = offSeasonPrices.length > 0 ? Math.min(...offSeasonPrices) : null;
      return { ...pkg, minPrice };
    })
  );

  return (
    <>
      <HeaderServer />

      {/* Hero Section — Colorful Gradient with Floating Shapes */}
      <section className="relative pt-20 pb-10 md:pt-32 md:pb-20 px-4 bg-gradient-to-br from-teal via-teal-400 to-coral overflow-hidden">
        {/* Animated floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-16 left-[10%] w-16 h-16 md:w-24 md:h-24 bg-sunshine/20 md:bg-sunshine/30 rounded-full blur-sm animate-bounce" style={{ animationDuration: "4s" }} />
          <div className="hidden md:block absolute top-32 right-[15%] w-16 h-16 bg-white/20 rounded-2xl rotate-45 animate-pulse" style={{ animationDuration: "3s" }} />
          <div className="absolute bottom-12 left-[20%] w-12 h-12 md:w-20 md:h-20 bg-coral/15 md:bg-coral/20 rounded-full blur-sm animate-bounce" style={{ animationDuration: "5s" }} />
          <div className="hidden md:block absolute bottom-24 right-[10%] w-12 h-12 bg-sunshine/40 rounded-lg rotate-12 animate-pulse" style={{ animationDuration: "3.5s" }} />
          <div className="hidden md:block absolute top-1/2 left-[50%] w-32 h-32 bg-white/10 rounded-full blur-md animate-pulse" style={{ animationDuration: "6s" }} />
        </div>

        <div className="relative container mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full mb-3 md:mb-6 border border-white/30">
            <Star className="w-4 h-4 md:w-5 md:h-5 text-sunshine" />
            <span className="font-body text-xs md:text-sm text-white font-semibold">Tour Packages</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-display text-white mb-3 md:mb-6 drop-shadow-lg">
            Popular Tour Packages
          </h1>
          <p className="text-base md:text-xl font-body text-white/90 max-w-2xl mx-auto">
            Handpicked adventures across Nainital and the Kumaon hills — choose taxi-only or taxi with hotel stays included.
          </p>
        </div>
      </section>

      {/* Tour Packages — Mobile Carousel / Desktop Grid */}
      <section className="py-12 px-4 bg-gradient-to-b from-lake via-white to-sunrise">
        <div className="container mx-auto">
          {packagesWithPricing.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl font-body text-ink/60">
                No tour packages available at the moment.
              </p>
              <p className="text-ink/50 mt-2">Please check back later or contact us for custom tours.</p>
            </div>
          ) : (
            <>
              {/* Mobile: Vertical stacked list */}
              <div className="md:hidden">
                <div className="flex flex-col gap-4">
                  {packagesWithPricing.map((pkg, idx) => (
                    <Link
                      key={pkg.id}
                      href={`/tour/${pkg.slug}`}
                      prefetch={false}
                      className="block"
                    >
                      <div className={`bg-gradient-to-br ${CARD_GRADIENTS[idx % CARD_GRADIENTS.length]} rounded-2xl border-3 border-ink border-l-[6px] ${CARD_BORDERS[idx % CARD_BORDERS.length]} shadow-retro-sm overflow-hidden flex flex-col group`}>
                        {/* Image */}
                        <div className="h-56 relative overflow-hidden">
                          {pkg.image_url ? (
                            <Image
                              src={pkg.image_url}
                              alt={pkg.title}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-teal/30 to-coral/20 flex items-center justify-center">
                              <MapPin className="w-16 h-16 text-teal/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />

                          {/* Price Badge */}
                          {pkg.minPrice && (
                            <div className="absolute bottom-3 right-3 bg-whatsapp text-white px-3 py-1.5 rounded-lg text-sm font-body font-bold flex items-center gap-1 border-2 border-ink shadow-lg">
                              <IndianRupee className="w-4 h-4" />
                              {pkg.minPrice.toLocaleString('en-IN')}
                            </div>
                          )}

                          {/* Duration Badge */}
                          {pkg.duration && (
                            <div className="absolute top-3 right-3 bg-sunshine text-ink px-3 py-1 rounded-full text-xs font-body font-bold flex items-center gap-1 border-2 border-ink shadow-sm">
                              <Clock className="w-3 h-3" />
                              {pkg.duration}
                            </div>
                          )}

                          {/* Popular + Taxi/Hotel Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                            {pkg.is_popular && (
                              <div className="bg-coral text-white px-3 py-1 rounded-full text-xs font-body font-bold flex items-center gap-1 border-2 border-ink">
                                <Star className="w-3 h-3" />
                                Popular
                              </div>
                            )}
                            <PackageTypeBadge hasHotel={hasHotelOption(pkg.itinerary as TourItinerary | undefined)} size="sm" />
                          </div>
                        </div>

                        <div className="p-4 flex flex-col flex-grow">
                          <h3 className="font-display text-xl text-ink mb-2 line-clamp-2">
                            {pkg.title}
                          </h3>

                          {/* Places Chips */}
                          {pkg.places_covered && pkg.places_covered.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {pkg.places_covered.slice(0, 3).map((place, i) => (
                                <span key={i} className="px-2 py-0.5 bg-teal/15 text-teal-600 rounded-full text-xs font-body border border-teal/30">
                                  {place}
                                </span>
                              ))}
                              {pkg.places_covered.length > 3 && (
                                <span className="px-2 py-0.5 bg-ink/10 text-ink/60 rounded-full text-xs font-body">
                                  +{pkg.places_covered.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="mt-auto pt-3 border-t border-ink/10 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-ink/60 text-xs font-body">
                              <Users className="w-3 h-3" />
                              {pkg.min_passengers}-{pkg.max_passengers || 6} pax
                            </div>
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-whatsapp text-white text-sm font-body font-semibold rounded-lg border-2 border-ink shadow-sm">
                              Book Now <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Desktop: 3-column grid */}
              <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packagesWithPricing.map((pkg, idx) => (
                  <Link key={pkg.id} href={`/tour/${pkg.slug}`} prefetch={false}>
                    <div className={`bg-gradient-to-br ${CARD_GRADIENTS[idx % CARD_GRADIENTS.length]} rounded-2xl border-3 border-ink border-l-[6px] ${CARD_BORDERS[idx % CARD_BORDERS.length]} shadow-retro-sm overflow-hidden h-full flex flex-col group cursor-pointer hover:shadow-retro-lg hover:-translate-y-1 transition-all duration-300`}>
                      {/* Image */}
                      <div className="h-56 relative overflow-hidden">
                        {pkg.image_url ? (
                          <Image
                            src={pkg.image_url}
                            alt={pkg.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-teal/30 to-coral/20 flex items-center justify-center">
                            <MapPin className="w-16 h-16 text-teal/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />

                        {/* Price Badge */}
                        {pkg.minPrice && (
                          <div className="absolute bottom-3 right-3 bg-whatsapp text-white px-4 py-2 rounded-lg text-base font-body font-bold flex items-center gap-1 border-2 border-ink shadow-lg">
                            <IndianRupee className="w-5 h-5" />
                            {pkg.minPrice.toLocaleString('en-IN')}
                          </div>
                        )}

                        {/* Duration Badge */}
                        {pkg.duration && (
                          <div className="absolute top-3 right-3 bg-sunshine text-ink px-3 py-1 rounded-full text-sm font-body font-bold flex items-center gap-1 border-2 border-ink shadow-sm">
                            <Clock className="w-4 h-4" />
                            {pkg.duration}
                          </div>
                        )}

                        {/* Popular / Seasonal / Taxi-Hotel Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                          {pkg.is_popular && (
                            <span className="bg-coral text-white px-3 py-1 rounded-full text-xs font-body font-bold flex items-center gap-1 border-2 border-ink">
                              <Star className="w-3 h-3" />
                              Popular
                            </span>
                          )}
                          {pkg.is_seasonal && (
                            <span className="bg-teal text-white px-2 py-1 rounded-full text-xs font-body font-bold border-2 border-ink">
                              Seasonal
                            </span>
                          )}
                          <PackageTypeBadge hasHotel={hasHotelOption(pkg.itinerary as TourItinerary | undefined)} size="sm" />
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="font-display text-2xl text-ink mb-2">
                          {pkg.title}
                        </h3>

                        <p className="font-body text-ink/70 mb-3 line-clamp-2 text-sm flex-grow">
                          {pkg.description}
                        </p>

                        {/* Places Chips */}
                        {pkg.places_covered && pkg.places_covered.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {pkg.places_covered.slice(0, 4).map((place, i) => (
                              <span key={i} className="px-2 py-0.5 bg-teal/15 text-teal-600 rounded-full text-xs font-body border border-teal/30">
                                {place}
                              </span>
                            ))}
                            {pkg.places_covered.length > 4 && (
                              <span className="px-2 py-0.5 bg-ink/10 text-ink/60 rounded-full text-xs font-body">
                                +{pkg.places_covered.length - 4}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 text-sm text-ink/60 mb-4">
                          {pkg.distance && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span className="font-body">{pkg.distance} km</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span className="font-body">{pkg.min_passengers}-{pkg.max_passengers || 6} pax</span>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-ink/10">
                          <span className="text-sm text-ink/50 font-body">View Details</span>
                          <Button variant="primary" size="sm" className="group-hover:bg-teal group-hover:border-teal transition-colors">
                            Explore <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Why Choose Our Packages Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-teal/10 via-coral/5 to-sunshine/20">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-display text-ink text-center mb-12">
            Why Book Our Tour Packages?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-teal/20">
              <div className="w-16 h-16 bg-gradient-to-br from-sunshine to-sunshine-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-ink shadow-sm">
                <span className="text-3xl">🏨</span>
              </div>
              <h3 className="font-display text-xl text-ink mb-2">Quality Hotels</h3>
              <p className="font-body text-ink/70 text-sm">
                Carefully selected accommodations from budget to luxury options
              </p>
            </div>
            <div className="text-center bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-teal/20">
              <div className="w-16 h-16 bg-gradient-to-br from-teal to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-ink shadow-sm">
                <span className="text-3xl">🚕</span>
              </div>
              <h3 className="font-display text-xl text-ink mb-2">Verified Drivers</h3>
              <p className="font-body text-ink/70 text-sm">
                Professional, background-checked drivers for your safety
              </p>
            </div>
            <div className="text-center bg-white/70 backdrop-blur-sm rounded-2xl p-6 border-2 border-coral/20">
              <div className="w-16 h-16 bg-gradient-to-br from-coral to-coral-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border-2 border-ink shadow-sm">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="font-display text-xl text-ink mb-2">Transparent Pricing</h3>
              <p className="font-body text-ink/70 text-sm">
                No hidden charges. What you see is what you pay
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-ink to-ink/95 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display text-white mb-4">
            Need a Custom Tour Package?
          </h2>
          <p className="font-body text-white/70 mb-8 max-w-xl mx-auto">
            We can create personalized itineraries based on your preferences, budget, and travel dates.
            Contact us for a custom quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://wa.me/918445206116" target="_blank" rel="noopener noreferrer">
              <Button variant="whatsapp" size="lg">
                WhatsApp Us
              </Button>
            </a>
            <a href="tel:+918445206116">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-ink">
                Call Now
              </Button>
            </a>
          </div>
        </div>
      </section>

      <FooterServer />
    </>
  );
}
