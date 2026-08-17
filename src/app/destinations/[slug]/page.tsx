import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Button, Card, CardContent, TourTrustSection } from "@/components/ui";
import HeaderServer from "@/components/ui/HeaderServer";
import FooterServer from "@/components/ui/FooterServer";
import FAQAccordion, { FAQAccordionItem } from "@/components/ui/FAQAccordion";
import { MapPin, Clock, Car, CheckCircle2, Phone, MessageCircle, Calendar } from "lucide-react";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import PackageCard from "@/components/home/PackageCard";
import PricingGridForDestination from "@/components/destinations/PricingGridForDestination";
import DestinationPricingTable from "@/components/destinations/DestinationPricingTable";
import DetailedAttractions from "@/components/packages/DetailedAttractions";
import DetailedInclusionsExclusions from "@/components/packages/DetailedInclusionsExclusions";
import BookingInstructions from "@/components/packages/BookingInstructions";
import {
  getDestinationBySlug,
  getPackages,
  getPackagesByIds,
  getMinPricePerPackage,
  getAllPricingForPackage,
  getSeasonDateRanges,
  getTourTrustSection,
  getVehicleCategoryImages,
  Package,
} from "@/lib/supabase";
import { Destination, TransferContent } from "@/lib/supabase/types";

// Used when a destination has no uploaded hero image. Local rather than a
// remote stock URL so the LCP image never depends on a third-party host.
const FALLBACK_HERO = "/images/hero/summer.webp";

/**
 * The FAQs shown when the linked transfer package has no admin-authored ones.
 * Same copy that used to be hardcoded in the JSX, moved into data so the
 * package-managed and fallback sets can share one renderer.
 */
function buildDefaultDestinationFaqs(
  destination: Destination,
  transferPackage?: Package
): FAQAccordionItem[] {
  const duration = transferPackage?.duration || destination.duration || "N/A";

  const faqs: FAQAccordionItem[] = [
    {
      question: `How long does the journey from Nainital to ${destination.name} take?`,
      answer: `The journey takes approximately ${duration} depending on traffic and weather conditions.`,
    },
    {
      question: "Is the price per person or per vehicle?",
      answer:
        "All prices are per vehicle, not per person. You can share the cost with your travel companions.",
    },
    {
      question: "What's included in the fare?",
      answer:
        "Our fares include driver allowance and fuel. Tolls, parking, and any state permits are charged extra.",
    },
    {
      question: "Can I book for the same day?",
      answer:
        "Yes! Subject to availability, we accept same-day bookings. Call or WhatsApp us for immediate assistance.",
    },
  ];

  if (destination.best_time_to_visit) {
    faqs.push({
      question: `When is the best time to visit ${destination.name}?`,
      answer: destination.best_time_to_visit,
    });
  }

  return faqs;
}

interface DestinationPageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DestinationPageProps): Promise<Metadata> {
  const destination = await getDestinationBySlug(params.slug);

  if (!destination) {
    return {
      title: "Destination Not Found",
    };
  }

  // Relative URLs — resolved against metadataBase in src/app/layout.tsx, so
  // the production domain lives in exactly one place.
  const path = `/destinations/${destination.slug}`;

  return {
    title: destination.meta_title || `${destination.name} - Nainital Taxi Service`,
    description: destination.meta_description || destination.description || `Book taxi from Nainital to ${destination.name}. Reliable service, fixed rates, comfortable vehicles.`,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: destination.meta_title || `${destination.name} - Nainital Taxi Service`,
      description: destination.meta_description || destination.description || `Book taxi from Nainital to ${destination.name}.`,
      url: path,
      type: "website",
      // FALLBACK_HERO was used here before: a 4:3-ish seasonal photo sized for
      // a full-bleed hero, which crops badly at 1.91:1 and is well over the
      // size WhatsApp will render a preview for. When the destination has no
      // uploaded image, `images` is omitted so the purpose-built 1200x630 card
      // from src/app/opengraph-image.tsx applies instead.
      ...(destination.hero_image_url
        ? {
            images: [
              {
                url: destination.hero_image_url,
                alt: `Taxi service from Nainital to ${destination.name}`,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function DestinationPage({ params }: DestinationPageProps) {
  // Fetch destination data
  const destination = await getDestinationBySlug(params.slug);

  if (!destination) {
    notFound();
  }

  // Find the transfer package for this destination
  const allPackages = await getPackages("transfer");
  const transferPackage = allPackages.find(
    (pkg: Package) =>
      pkg.slug?.includes(params.slug) ||
      pkg.title?.toLowerCase().includes(destination.name.toLowerCase())
  );

  // Fetch pricing data if package exists
  let pricingData: Array<{
    vehicle_type: string;
    season_name: string;
    price: number;
  }> = [];
  let seasonRanges: Array<{
    name: "Season" | "Off-Season";
    start_date: string;
    end_date: string;
    description: string | null;
  }> = [];

  let vehicleCategoryImages: Record<string, string> | null = null;

  if (transferPackage) {
    [pricingData, seasonRanges, vehicleCategoryImages] = await Promise.all([
      getAllPricingForPackage(transferPackage.id),
      getSeasonDateRanges(),
      getVehicleCategoryImages(),
    ]);
  }

  // Deliberately outside the transferPackage guard: a destination with no
  // transfer package still gets its cross-sell row and trust banner.
  const [linkedPackages, minPrices, tourTrustSection] = await Promise.all([
    getPackagesByIds(destination.package_ids || []),
    getMinPricePerPackage(),
    getTourTrustSection(),
  ]);

  // Group pricing by vehicle type
  const pricingByVehicle = pricingData.reduce((acc, item) => {
    if (!acc[item.vehicle_type]) {
      acc[item.vehicle_type] = {};
    }
    acc[item.vehicle_type][item.season_name] = item.price;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  // Get season date descriptions
  const seasonDates = seasonRanges
    .filter((s) => s.name === "Season")
    .map((s) => {
      const start = new Date(s.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      const end = new Date(s.end_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
      return `${start} - ${end}`;
    });

  const offSeasonDates = seasonRanges
    .filter((s) => s.name === "Off-Season")
    .map((s) => {
      const start = new Date(s.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      const end = new Date(s.end_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
      return `${start} - ${end}`;
    });

  const minPrice = transferPackage && Object.keys(pricingByVehicle).length > 0
    ? Math.min(...Object.values(pricingByVehicle).map((prices) => prices["Off-Season"] || 0))
    : 0;

  // Prefer FAQs authored on the linked transfer package (editable in
  // /admin/packages) and fall back to the generic destination set.
  const transferContent = transferPackage?.itinerary as TransferContent | undefined;
  const faqItems: FAQAccordionItem[] = transferContent?.faqs?.length
    ? transferContent.faqs
    : buildDefaultDestinationFaqs(destination, transferPackage);

  return (
    <>
      <HeaderServer />
      <FloatingWhatsApp destinationName={destination.name} />

      <main className="min-h-screen bg-white">
      {/* Hero Section — image + title only. The fixed Header overlaps the top
          of the image, which is fine because the title sits at the bottom. */}
      <section className="relative h-[40vh] md:h-[50vh] min-h-[280px] flex items-end overflow-hidden">
        <Image
          src={destination.hero_image_url || FALLBACK_HERO}
          alt={`Taxi service from Nainital to ${destination.name}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* Bottom-anchored scrim: enough contrast for the title without
            washing out the photo the way a full-bleed overlay did. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />

        <div className="container mx-auto relative z-10 px-4 pb-8 md:pb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display text-white drop-shadow-lg">
            {destination.emoji && <span className="mr-3">{destination.emoji}</span>}
            {destination.name}
          </h1>
        </div>
      </section>

      {/* Description — plain white section, comfortable measure. */}
      <section className="bg-white py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          {destination.tagline && (
            <p className="text-lg md:text-xl font-body text-teal mb-3">
              {destination.tagline}
            </p>
          )}
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-6">
            {transferPackage?.title || `Nainital to ${destination.name}`}
          </h2>

          {(() => {
            const body = transferPackage?.description || destination.description || "";
            const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
            if (paragraphs.length === 0) return null;
            return (
              <div className="font-body text-base md:text-lg leading-relaxed text-ink/75 space-y-4">
                {paragraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            );
          })()}

          {destination.highlights && destination.highlights.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
              {destination.highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-teal mr-2 mt-0.5 flex-shrink-0" />
                  <span className="font-body text-ink/80">{highlight}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Taxi Fares — routes-based pricing table (independent of transferPackage) */}
      <DestinationPricingTable
        destinationSlug={params.slug}
        destinationName={destination.name}
      />

      {/* Quick Stats */}
      {transferPackage && (
        <section className="py-12 px-4 relative z-20">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center bg-white/95 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-teal" />
                  <div className="text-3xl font-display text-ink mb-1">
                    {destination.distance_from_nainital} KM
                  </div>
                  <div className="text-sm font-body text-ink/70">Distance</div>
                </CardContent>
              </Card>

              <Card className="text-center bg-white/95 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-teal" />
                  <div className="text-3xl font-display text-ink mb-1">
                    {transferPackage.duration || destination.duration || "N/A"}
                  </div>
                  <div className="text-sm font-body text-ink/70">Duration</div>
                </CardContent>
              </Card>

              <Card className="text-center bg-white/95 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <Car className="w-8 h-8 mx-auto mb-2 text-teal" />
                  <div className="text-3xl font-display text-ink mb-1">
                    ₹{minPrice.toLocaleString()}+
                  </div>
                  <div className="text-sm font-body text-ink/70">Starting Price</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      {/* Transparent Pricing Section */}
      {transferPackage && Object.keys(pricingByVehicle).length > 0 && (
        <PricingGridForDestination
          pricingByVehicle={pricingByVehicle}
          seasonDates={seasonDates}
          offSeasonDates={offSeasonDates}
          vehicleCategoryImages={vehicleCategoryImages || undefined}
          packageId={transferPackage.id}
          packageTitle={transferPackage.title || `Nainital to ${destination.name}`}
          destinationSlug={params.slug}
          destinationName={destination.name}
        />
      )}

      {/* Cross-sell: tour packages linked to this destination in the admin */}
      {linkedPackages.length > 0 && (
        <section className="py-12 md:py-16 px-4 bg-lake/30">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-display text-ink text-center mb-3">
              Top Packages for {destination.name}
            </h2>
            <p className="font-body text-ink/60 text-center mb-10">
              Make a full trip of it — curated tours covering {destination.name} and nearby.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {linkedPackages.map((pkg) => (
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
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Book With Us — admin-editable via /admin/tour-trust-section */}
      <TourTrustSection
        data={tourTrustSection}
        headingOverride={`Why Book ${destination.name} Taxi With Us?`}
      />

      {/* CTA Section — placed after pricing/packages/trust so it closes the
          value pitch rather than interrupting it. */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-r from-teal to-teal/80 border-3 border-ink">
            <CardContent className="pt-6 text-center">
              <h2 className="text-3xl md:text-4xl font-display text-white mb-4">
                Ready to Book Your {destination.name} Taxi?
              </h2>
              <p className="text-lg font-body text-white/90 mb-8">
                Get instant booking confirmations or reach out for special requests
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="whatsapp" size="lg" className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp Booking
                </Button>
                <Button variant="secondary" size="lg" className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Call +91 8445206116
                </Button>
                <Button variant="primary" size="lg" className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Submit Query
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Destination Information Paragraphs - Admin Managed */}
      {transferPackage?.itinerary && (() => {
        const content = transferPackage.itinerary as TransferContent;
        if (!content.paragraphs || content.paragraphs.length === 0) return null;

        return (
          <section className="py-16 px-4">
            <div className="container mx-auto max-w-4xl space-y-8">
              {content.paragraphs.map((para, idx) => (
                para.title && para.content ? (
                  <Card key={idx} className="overflow-hidden">
                    <CardContent className="pt-6">
                      <h2 className="text-2xl md:text-3xl font-display text-ink mb-4">
                        {para.title}
                      </h2>
                      <p className="font-body text-ink/80 leading-relaxed whitespace-pre-line">
                        {para.content}
                      </p>
                    </CardContent>
                  </Card>
                ) : null
              ))}
            </div>
          </section>
        );
      })()}

      {/* Detailed Attractions */}
      {transferPackage?.itinerary && (() => {
        const content = transferPackage.itinerary as TransferContent;
        if (!content.detailed_attractions || content.detailed_attractions.length === 0) return null;

        return (
          <DetailedAttractions
            attractions={content.detailed_attractions}
            flexibilityNote={content.itinerary_flexibility_note}
          />
        );
      })()}

      {/* Detailed Inclusions / Exclusions */}
      {transferPackage?.itinerary && (() => {
        const content = transferPackage.itinerary as TransferContent;
        if (!content.detailed_includes && !content.detailed_excludes) return null;

        return (
          <DetailedInclusionsExclusions
            includes={content.detailed_includes}
            excludes={content.detailed_excludes}
          />
        );
      })()}

      {/* FAQ Section — hidden entirely when the admin unticks "Show FAQs".
          Nullish means the row predates the show_faqs column, so default on. */}
      {destination.show_faqs !== false && faqItems.length > 0 && (
        <section className="py-16 md:py-20 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-display text-ink text-center mb-10">
              Frequently Asked Questions
            </h2>
            <FAQAccordion items={faqItems} />
          </div>
        </section>
      )}

      {/* Booking Instructions */}
      {transferPackage?.itinerary && (() => {
        const content = transferPackage.itinerary as TransferContent;
        if (!content.booking_instructions) return null;

        return <BookingInstructions instructions={content.booking_instructions} />;
      })()}
      </main>

      <FooterServer />
    </>
  );
}
