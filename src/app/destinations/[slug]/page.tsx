import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header, Button, Card, CardContent } from "@/components/ui";
import { MapPin, Clock, Car, CheckCircle2, Phone, MessageCircle, Calendar, Shield, UserCheck, Heart, Sparkles } from "lucide-react";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import DestinationPricingCard from "@/components/destinations/DestinationPricingCard";
import DetailedAttractions from "@/components/packages/DetailedAttractions";
import DetailedInclusionsExclusions from "@/components/packages/DetailedInclusionsExclusions";
import BookingInstructions from "@/components/packages/BookingInstructions";
import {
  getDestinationBySlug,
  getPackages,
  getAllPricingForPackage,
  getSeasonDateRanges,
  Package,
} from "@/lib/supabase";
import { TransferContent } from "@/lib/supabase/types";

interface DestinationPageProps {
  params: {
    slug: string;
  };
}

// Vehicle type display names and capacities
const VEHICLE_INFO = {
  sedan: { name: "Sedan", capacity: "4 seater", model: "Dzire/Amaze/Xcent" },
  suv_normal: { name: "SUV Standard", capacity: "6-7 seater", model: "Ertiga/Triber" },
  suv_deluxe: { name: "SUV Deluxe", capacity: "7 seater", model: "Innova/Marazzo" },
  suv_luxury: { name: "SUV Luxury", capacity: "7 seater", model: "Innova Crysta" },
} as const;

// Generate metadata for SEO
export async function generateMetadata({ params }: DestinationPageProps): Promise<Metadata> {
  const destination = await getDestinationBySlug(params.slug);

  if (!destination) {
    return {
      title: "Destination Not Found",
    };
  }

  return {
    title: destination.meta_title || `${destination.name} - Nainital Taxi Service`,
    description: destination.meta_description || destination.description || `Book taxi from Nainital to ${destination.name}. Reliable service, fixed rates, comfortable vehicles.`,
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

  if (transferPackage) {
    pricingData = await getAllPricingForPackage(transferPackage.id);
    seasonRanges = await getSeasonDateRanges();
  }

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

  return (
    <>
      <Header />
      <FloatingWhatsApp />

      {/* Hero Section */}
      <section
        className="relative min-h-[60vh] flex items-center justify-center px-4 pt-24 overflow-hidden"
        style={{
          backgroundImage: destination.hero_image_url
            ? `url('${destination.hero_image_url}')`
            : "url('https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2070&auto=format&fit=crop')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/60 to-ink/80"></div>

        {/* Hero Content */}
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {destination.emoji && (
              <div className="text-6xl mb-4">{destination.emoji}</div>
            )}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display text-white mb-4">
              {destination.name}
            </h1>
            {destination.tagline && (
              <p className="text-xl sm:text-2xl font-body text-white/90 mb-6">
                {destination.tagline}
              </p>
            )}
            <p className="text-lg font-body text-white/85 mb-8 max-w-2xl mx-auto">
              {destination.description}
            </p>

            {minPrice > 0 && (
              <div className="inline-flex items-center bg-sunshine border-3 border-ink rounded-xl px-6 py-3 shadow-retro">
                <span className="text-2xl font-display text-ink">₹{minPrice.toLocaleString()}</span>
                <span className="text-sm font-body text-ink/70 ml-2">starting</span>
              </div>
            )}
          </div>
        </div>

        {/* Wavy SVG Divider */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-16 md:h-24">
            <path
              fill="#FFF8E7"
              fillOpacity="1"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Quick Stats */}
      {transferPackage && (
        <section className="py-12 px-4 -mt-16 relative z-20">
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

      {/* Destination Description */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-3xl font-display text-ink mb-4">
                {transferPackage?.title || `Nainital to ${destination.name}`}
              </h2>
              <p className="font-body text-ink/80 mb-6 leading-relaxed">
                {transferPackage?.description || destination.description}
              </p>

              {destination.highlights && destination.highlights.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {destination.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-teal mr-2 mt-0.5 flex-shrink-0" />
                      <span className="font-body text-ink/80">{highlight}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Transparent Pricing Section */}
      {transferPackage && Object.keys(pricingByVehicle).length > 0 && (
        <section className="py-20 px-4 bg-white/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
                Transparent Pricing
              </h2>
              <p className="text-lg font-body text-ink/70">
                Choose your preferred vehicle - Fixed, honest pricing
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(pricingByVehicle).map(([vehicleType, prices]) => {
                const vehicle = VEHICLE_INFO[vehicleType as keyof typeof VEHICLE_INFO];
                const seasonPrice = prices["Season"] || 0;
                const offSeasonPrice = prices["Off-Season"] || 0;

                return (
                  <DestinationPricingCard
                    key={vehicleType}
                    vehicleType={vehicleType}
                    vehicle={vehicle || { name: vehicleType, capacity: "", model: "" }}
                    seasonPrice={seasonPrice}
                    offSeasonPrice={offSeasonPrice}
                    seasonDates={seasonDates}
                    offSeasonDates={offSeasonDates}
                    destinationSlug={params.slug}
                    destinationName={destination.name}
                    packageId={transferPackage?.id || ""}
                    packageTitle={transferPackage?.title || `Nainital to ${destination.name}`}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
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

      {/* Why Book With Us */}
      <section className="py-20 px-4 bg-white/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
              Why Book {destination.name} Taxi With Us?
            </h2>
            <p className="text-lg font-body text-ink/70">Your safety is our top priority - not the lowest price</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 bg-teal/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-teal" />
                </div>
                <h3 className="font-display text-xl mb-2">Zero Alcohol Policy</h3>
                <p className="font-body text-ink/70 text-sm">Strict sobriety standards with no exceptions for your safety</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 bg-coral/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-7 h-7 text-coral" />
                </div>
                <h3 className="font-display text-xl mb-2">Verified Drivers</h3>
                <p className="font-body text-ink/70 text-sm">Background-checked, professionally trained drivers</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 bg-sunshine/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-7 h-7 text-ink" />
                </div>
                <h3 className="font-display text-xl mb-2">Family-First Care</h3>
                <p className="font-body text-ink/70 text-sm">Drivers who treat passengers like their own family</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 bg-teal/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-teal" />
                </div>
                <h3 className="font-display text-xl mb-2">Spotless Vehicles</h3>
                <p className="font-body text-ink/70 text-sm">Daily sanitized, well-maintained comfortable cars</p>
              </CardContent>
            </Card>
          </div>
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

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-display text-xl text-ink mb-2">
                  How long does the journey from Nainital to {destination.name} take?
                </h3>
                <p className="font-body text-ink/70">
                  The journey takes approximately {transferPackage?.duration || destination.duration || "N/A"} depending on traffic and weather conditions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-display text-xl text-ink mb-2">Is the price per person or per vehicle?</h3>
                <p className="font-body text-ink/70">
                  All prices are per vehicle, not per person. You can share the cost with your travel companions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-display text-xl text-ink mb-2">Are tolls and fuel included?</h3>
                <p className="font-body text-ink/70">
                  Yes, our prices include fuel charges, tolls, and driver allowance. The quoted price is what you pay.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-display text-xl text-ink mb-2">Can I book for the same day?</h3>
                <p className="font-body text-ink/70">
                  Yes! Subject to availability, we accept same-day bookings. Call or WhatsApp us for immediate assistance.
                </p>
              </CardContent>
            </Card>

            {destination.best_time_to_visit && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-display text-xl text-ink mb-2">
                    When is the best time to visit {destination.name}?
                  </h3>
                  <p className="font-body text-ink/70">{destination.best_time_to_visit}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Booking Instructions */}
      {transferPackage?.itinerary && (() => {
        const content = transferPackage.itinerary as TransferContent;
        if (!content.booking_instructions) return null;

        return <BookingInstructions instructions={content.booking_instructions} />;
      })()}

      {/* Footer */}
      <footer className="py-12 px-4 border-t-3 border-ink">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-teal" />
            <p className="font-display text-ink">Your Safety. Our Promise.</p>
          </div>
          <p className="font-body text-ink/70 mb-4">
            © 2024 Nainital Taxi. Trusted by families across India.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button variant="whatsapp" size="sm">
              WhatsApp Us
            </Button>
            <Button variant="outline" size="sm">
              Call Now
            </Button>
          </div>
        </div>
      </footer>
    </>
  );
}
