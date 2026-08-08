import React from "react";
import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import type { MultiDayRentalPage, Package } from "@/lib/supabase/types";

interface FeaturedPackagesSectionProps {
  pageData: MultiDayRentalPage;
  packages: Package[];
  minPrices: Record<string, number>;
}

/**
 * Cross-sell block below the enquiry CTA. Renders the real `packages` rows the
 * admin picked for this page (multi_day_rental_page.featured_package_ids), in
 * the stored order — not a hardcoded list.
 */
export default function FeaturedPackagesSection({
  pageData,
  packages,
  minPrices,
}: FeaturedPackagesSectionProps) {
  if (packages.length === 0) return null;

  return (
    <section id="featured-packages" className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-4">
            {pageData.popular_itineraries_heading}
          </h2>
          {pageData.popular_itineraries_subheading && (
            <p className="text-lg md:text-xl text-ink/70 max-w-3xl mx-auto font-body">
              {pageData.popular_itineraries_subheading}
            </p>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => {
            const places = (pkg.places_covered || []).join(" · ");
            const minPrice = minPrices[pkg.id];

            return (
              <Link
                key={pkg.id}
                href={`/tour/${pkg.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white border-3 border-ink shadow-retro-sm hover:shadow-retro transition-all"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-lake">
                  {pkg.image_url ? (
                    // Plain <img>, not next/image: package images are remote
                    // URLs and next.config.mjs has no remotePatterns configured
                    // (matches src/components/home/PackageCard.tsx).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pkg.image_url}
                      alt={pkg.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-4 text-center">
                      <span className="font-body text-sm text-ink/50">{pkg.title}</span>
                    </div>
                  )}
                  {pkg.duration && (
                    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      <Clock className="w-3 h-3" />
                      {pkg.duration}
                    </span>
                  )}
                  {pkg.is_popular && (
                    <span className="absolute top-3 right-3 rounded-full bg-coral px-3 py-1 text-xs font-bold text-white border-2 border-ink">
                      POPULAR
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg text-ink">{pkg.title}</h3>

                  {places && (
                    <p
                      className="mt-1 flex items-start gap-1 font-body text-sm text-ink/60 line-clamp-2"
                      title={places}
                    >
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-teal" />
                      <span>{places}</span>
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t-2 border-ink/10 pt-4">
                    {minPrice != null ? (
                      <span className="font-body text-sm text-ink/60">
                        From{" "}
                        <span className="font-display text-lg font-bold text-teal">
                          ₹{minPrice.toLocaleString("en-IN")}
                        </span>
                      </span>
                    ) : (
                      <span className="font-body text-sm text-ink/60">Price on request</span>
                    )}
                    <span className="inline-flex items-center gap-1 font-body text-sm font-bold text-teal">
                      View
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
