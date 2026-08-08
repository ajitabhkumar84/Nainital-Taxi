import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Metadata } from "next";
import {
  Clock,
  MapPin,
  Users,
  Phone,
  MessageCircle,
  Check,
  X,
  ArrowRight,
  Star,
  Shield,
  Award,
  UserCheck,
  Heart,
  Car,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { buildBookingUrl } from "@/lib/bookingLink";
import { Package, Pricing, TourItinerary, GalleryImage, hasHotelOption } from "@/lib/supabase/types";
import { getTourTrustSection } from "@/lib/supabase";
import { getSiteWhatsappNumber } from "@/lib/siteContact";
import { Header, Footer } from "@/components/ui";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { generateTouristTripSchema } from "@/lib/structuredData";
import ItineraryTimeline from "@/components/packages/ItineraryTimeline";
import HotelOptionsCard from "@/components/packages/HotelOptionsCard";
import PackageTypeBadge from "@/components/packages/PackageTypeBadge";
import PricingGridWithHotel from "@/components/packages/PricingGridWithHotel";
import PackageGallery from "@/components/packages/PackageGallery";
import PackageFAQ from "@/components/packages/PackageFAQ";
import DetailedAttractions from "@/components/packages/DetailedAttractions";
import DetailedInclusionsExclusions from "@/components/packages/DetailedInclusionsExclusions";
import BookingInstructions from "@/components/packages/BookingInstructions";

// Icon and accent color are both keyed by icon_name so reordering/adding/removing
// pillars in the admin never shifts a card's color out of sync with its icon.
const TRUST_PILLAR_ICONS: Record<string, LucideIcon> = {
  shield: Shield,
  "user-check": UserCheck,
  heart: Heart,
  award: Award,
  car: Car,
  phone: Phone,
  star: Star,
  "map-pin": MapPin,
};

const TRUST_PILLAR_COLORS: Record<string, string> = {
  shield: "text-teal",
  "user-check": "text-coral",
  heart: "text-whatsapp",
  award: "text-sunshine",
  car: "text-teal",
  phone: "text-coral",
  star: "text-sunshine",
  "map-pin": "text-whatsapp",
};

// Create Supabase client for server-side
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getTourPackage(slug: string): Promise<Package | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .eq("slug", slug)
    .eq("type", "tour")
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data as Package;
}

async function getPackagePricing(packageId: string): Promise<Pricing[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("pricing")
    .select("*")
    .eq("package_id", packageId)
    .eq("is_active", true)
    .order("vehicle_type");

  if (error) return [];
  return data as Pricing[];
}

async function getVehicleCategoryImages(): Promise<Record<string, string> | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "vehicle_category_images")
    .single();

  if (error || !data?.value) return null;
  try {
    return typeof data.value === "string" ? JSON.parse(data.value) : data.value;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  const pkg = await getTourPackage(name);

  if (!pkg) {
    return {
      title: "Tour Package Not Found",
    };
  }

  const pricing = await getPackagePricing(pkg.id);
  const minPrice = pricing.length > 0 ? Math.min(...pricing.map((p) => p.price)) : 0;
  const url = `https://nainialtaxi.com/tour/${pkg.slug}`;

  return {
    title: pkg.meta_title || `${pkg.title} | Nainital Taxi Tour Packages`,
    description: pkg.meta_description || pkg.description || `Book ${pkg.title} tour package with Nainital Taxi. Starting from ₹${minPrice}. Reliable service with professional drivers.`,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: pkg.title,
      description: pkg.description || `Book ${pkg.title} tour package`,
      url: url,
      type: 'website',
      images: pkg.image_url ? [{ url: pkg.image_url, alt: pkg.title }] : [],
    },
  };
}

export default async function TourPackagePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const pkg = await getTourPackage(name);

  if (!pkg) {
    notFound();
  }

  const [pricing, vehicleCategoryImages, tourTrustSection, whatsappNumber] = await Promise.all([
    getPackagePricing(pkg.id),
    getVehicleCategoryImages(),
    getTourTrustSection(),
    getSiteWhatsappNumber(),
  ]);

  const trustPillars = (tourTrustSection.trust_pillars || [])
    .filter((p) => p.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  const whatsappMessage = `Hi! I'm interested in the ${pkg.title} tour package. Can you help me?`;
  const whatsappHref = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappMessage)}`;
  const itinerary = pkg.itinerary as TourItinerary | undefined;
  const isTaxiHotel = hasHotelOption(itinerary);

  // Get minimum price for display
  const minPrice = pricing.length > 0 ? Math.min(...pricing.map((p) => p.price)) : 0;

  // Generate TouristTrip structured data
  const touristTripSchema = generateTouristTripSchema({
    name: pkg.title,
    description: pkg.description || `Book ${pkg.title} tour package with Nainital Taxi`,
    url: `https://nainialtaxi.com/tour/${pkg.slug}`,
    image: pkg.image_url ?? undefined,
    itinerary: itinerary?.days?.map(day => ({
      name: day.title,
      description: day.description,
    })),
    price: minPrice,
  });

  return (
    <>
      <Script
        id="tourist-trip-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(touristTripSchema) }}
      />
      <Header />
      <FloatingWhatsApp packageName={pkg.title} />

      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative min-h-[38vh] md:min-h-[70vh] flex items-end">
          {/* Background Image */}
          <div className="absolute inset-0">
            {pkg.image_url ? (
              <img
                src={pkg.image_url}
                alt={pkg.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal to-lake" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
          </div>

          {/* Hero Content */}
          <div className="relative container mx-auto px-4 pb-8 md:pb-16 pt-20 md:pt-32">
            <div className="max-w-4xl">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
                <PackageTypeBadge hasHotel={isTaxiHotel} size="md" />
                {pkg.is_popular && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-sunshine text-ink font-body font-semibold text-sm rounded-full border-2 border-ink">
                    <Star className="w-4 h-4" />
                    Popular
                  </span>
                )}
                {pkg.duration && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/90 text-ink font-body text-sm rounded-full">
                    <Clock className="w-4 h-4" />
                    {pkg.duration}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-display text-white mb-3 md:mb-4">
                {pkg.title}
              </h1>

              {/* Places Covered */}
              {pkg.places_covered && pkg.places_covered.length > 0 && (
                <div className="flex items-center gap-2 text-white/80 font-body mb-6">
                  <MapPin className="w-5 h-5" />
                  <span>{pkg.places_covered.join(" → ")}</span>
                </div>
              )}

              {/* Price & CTA */}
              <div className="flex flex-wrap items-center gap-4">
                {minPrice > 0 && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                    <div className="text-sm text-white/70 font-body">Starting from</div>
                    <div className="text-3xl font-display text-white">
                      ₹{minPrice.toLocaleString()}
                    </div>
                  </div>
                )}
                <Link
                  href={buildBookingUrl({ packageId: pkg.id, packageTitle: pkg.title, packageType: 'tour' })}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-whatsapp text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Book Now
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="py-8 bg-gradient-to-b from-ink to-ink/95">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {pkg.duration && (
                <div className="text-center p-4 rounded-xl bg-white/10">
                  <Clock className="w-6 h-6 text-sunshine mx-auto mb-2" />
                  <div className="font-display text-white">{pkg.duration}</div>
                  <div className="text-xs text-white/60 font-body">Duration</div>
                </div>
              )}
              {pkg.distance && (
                <div className="text-center p-4 rounded-xl bg-white/10">
                  <MapPin className="w-6 h-6 text-coral mx-auto mb-2" />
                  <div className="font-display text-white">{pkg.distance} km</div>
                  <div className="text-xs text-white/60 font-body">Distance</div>
                </div>
              )}
              {pkg.places_covered && (
                <div className="text-center p-4 rounded-xl bg-white/10">
                  <Star className="w-6 h-6 text-teal mx-auto mb-2" />
                  <div className="font-display text-white">{pkg.places_covered.length}</div>
                  <div className="text-xs text-white/60 font-body">Places</div>
                </div>
              )}
              <div className="text-center p-4 rounded-xl bg-white/10">
                <Users className="w-6 h-6 text-lake mx-auto mb-2" />
                <div className="font-display text-white">
                  {pkg.min_passengers}-{pkg.max_passengers || "6"}
                </div>
                <div className="text-xs text-white/60 font-body">Passengers</div>
              </div>
            </div>
          </div>
        </section>

        {/* Description */}
        {pkg.description && (
          <section className="py-12 bg-white">
            <div className="container mx-auto px-4 max-w-3xl">
              <p className="text-lg text-ink/80 font-body leading-relaxed text-center">
                {pkg.description}
              </p>
            </div>
          </section>
        )}

        {/* Detailed Attractions */}
        {itinerary?.detailed_attractions && itinerary.detailed_attractions.length > 0 && (
          <DetailedAttractions
            attractions={itinerary.detailed_attractions}
            flexibilityNote={itinerary.itinerary_flexibility_note}
          />
        )}

        {/* Day-wise Itinerary */}
        {itinerary?.days && itinerary.days.length > 0 && (
          <ItineraryTimeline days={itinerary.days} />
        )}

        {/* Hotel Options */}
        {itinerary?.hotel_options && itinerary.hotel_options.length > 0 && (
          <HotelOptionsCard
            options={itinerary.hotel_options}
            basePrice={minPrice}
          />
        )}

        {/* Pricing Grid */}
        {pricing.length > 0 && (
          <PricingGridWithHotel
            pricing={pricing}
            hotelOptions={itinerary?.hotel_options}
            showHotelPricing={itinerary?.hotel_options && itinerary.hotel_options.length > 0}
            vehicleCategoryImages={vehicleCategoryImages || undefined}
          />
        )}

        {/* Detailed Inclusions / Exclusions */}
        {itinerary?.detailed_includes || itinerary?.detailed_excludes ? (
          <DetailedInclusionsExclusions
            includes={itinerary?.detailed_includes}
            excludes={itinerary?.detailed_excludes}
          />
        ) : (
          /* Fallback to simple includes/excludes if detailed not available */
          ((pkg.includes && pkg.includes.length > 0) ||
            (pkg.excludes && pkg.excludes.length > 0)) && (
            <section className="py-12 md:py-16 bg-white">
              <div className="container mx-auto px-4 max-w-4xl">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Includes */}
                  {pkg.includes && pkg.includes.length > 0 && (
                    <div className="bg-whatsapp/10 rounded-2xl border-3 border-whatsapp/30 p-6">
                      <h3 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
                        <Check className="w-6 h-6 text-whatsapp" />
                        What&apos;s Included
                      </h3>
                      <ul className="space-y-2">
                        {pkg.includes.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 font-body text-ink/80"
                          >
                            <Check className="w-4 h-4 text-whatsapp flex-shrink-0 mt-1" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Excludes */}
                  {pkg.excludes && pkg.excludes.length > 0 && (
                    <div className="bg-coral/10 rounded-2xl border-3 border-coral/30 p-6">
                      <h3 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
                        <X className="w-6 h-6 text-coral" />
                        What&apos;s Not Included
                      </h3>
                      <ul className="space-y-2">
                        {pkg.excludes.map((item, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 font-body text-ink/80"
                          >
                            <X className="w-4 h-4 text-coral flex-shrink-0 mt-1" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )
        )}

        {/* Gallery */}
        {(pkg.gallery_images || pkg.gallery_urls) && (
          <PackageGallery
            images={(pkg.gallery_images || pkg.gallery_urls) as string[] | GalleryImage[]}
            title="Photo Gallery"
          />
        )}

        {/* FAQs */}
        {itinerary?.faqs && itinerary.faqs.length > 0 && (
          <PackageFAQ faqs={itinerary.faqs} />
        )}

        {/* Booking Instructions */}
        {itinerary?.booking_instructions && (
          <BookingInstructions instructions={itinerary.booking_instructions} />
        )}

        {/* Why Choose Us — admin-editable via /admin/tour-trust-section */}
        {tourTrustSection.is_published && trustPillars.length > 0 && (
          <section className="py-12 md:py-16 bg-gradient-to-b from-lake/10 to-white">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-3xl font-display text-ink text-center mb-3">
                {tourTrustSection.heading}
              </h2>
              <p className="text-ink/60 font-body text-center mb-8 max-w-xl mx-auto">
                {tourTrustSection.description}
              </p>
              <div className="grid md:grid-cols-4 gap-6">
                {trustPillars.map((pillar) => {
                  const Icon = TRUST_PILLAR_ICONS[pillar.icon_name] || Shield;
                  const colorClass = TRUST_PILLAR_COLORS[pillar.icon_name] || "text-teal";
                  return (
                    <div
                      key={pillar.title}
                      className="text-center p-6 bg-white rounded-2xl border-3 border-ink shadow-retro-sm"
                    >
                      <Icon className={`w-12 h-12 ${colorClass} mx-auto mb-4`} />
                      <h3 className="font-display text-lg text-ink mb-2">{pillar.title}</h3>
                      <p className="text-ink/60 font-body text-sm">{pillar.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-teal to-lake">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-display text-white mb-4">
              Ready to Explore Safely?
            </h2>
            <p className="text-white/80 font-body mb-8 max-w-xl mx-auto">
              Book your {pkg.title} with verified, professional drivers
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href={buildBookingUrl({ packageId: pkg.id, packageTitle: pkg.title, packageType: 'tour' })}
                className="inline-flex items-center gap-2 px-8 py-4 bg-sunshine text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Book Online
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-whatsapp text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>
              <a
                href="tel:+918445206116"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <Phone className="w-5 h-5" />
                Call Now
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
