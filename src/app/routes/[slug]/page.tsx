import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button, Card, CardContent } from "@/components/ui";
import HeaderServer from "@/components/ui/HeaderServer";
import FooterServer from "@/components/ui/FooterServer";
import { MapPin, Clock, Car, CheckCircle2, Phone, MessageCircle, Calendar } from "lucide-react";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { getRouteBySlug } from "@/lib/supabase";
import { buildBookingUrl } from "@/lib/bookingLink";
import { VEHICLE_ORDER, getVehicleTypeName } from "@/lib/pricing";

// Used when a route has no uploaded hero image. Local rather than a remote
// stock URL so the LCP image never depends on a third-party host — same
// fallback destinations/[slug]/page.tsx uses.
const FALLBACK_HERO = "/images/hero/summer.webp";

const PHONE_DISPLAY = "+91 8445206116";
const PHONE_TEL = "+918445206116";

interface RoutePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: RoutePageProps): Promise<Metadata> {
  const route = await getRouteBySlug(params.slug);

  if (!route) {
    return {
      title: "Route Not Found",
    };
  }

  const { pickup_location: pickup, drop_location: drop } = route;
  const path = `/routes/${route.slug}`;
  const title = route.meta_title || `${pickup} to ${drop} Taxi | Nainital Taxi`;
  const description =
    route.meta_description ||
    route.description ||
    `Book a taxi from ${pickup} to ${drop}. Fixed fares, verified drivers, comfortable vehicles.`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      // Omitted entirely when there's no uploaded image — same reasoning as
      // the destinations page: the purpose-built 1200x630 card from
      // src/app/opengraph-image.tsx applies instead, rather than cropping
      // FALLBACK_HERO badly into a 1.91:1 OG frame.
      ...(route.hero_image_url
        ? {
            images: [
              {
                url: route.hero_image_url,
                alt: `Taxi service from ${pickup} to ${drop}`,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function RoutePage({ params }: RoutePageProps) {
  const route = await getRouteBySlug(params.slug);

  if (!route) {
    notFound();
  }

  const { pickup_location: pickup, drop_location: drop } = route;
  const routeName = `${pickup} to ${drop}`;

  // Group active pricing by vehicle type -> season, same shape the
  // destinations page builds from getAllPricingForPackage().
  const pricingByVehicle = route.pricing.reduce((acc, item) => {
    if (!acc[item.vehicle_type]) acc[item.vehicle_type] = {};
    acc[item.vehicle_type][item.season_name] = item.price;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  const vehiclesWithPricing = VEHICLE_ORDER.filter((vt) => pricingByVehicle[vt]);
  const hasPricing = vehiclesWithPricing.length > 0;

  const minPrice = hasPricing
    ? Math.min(
        ...vehiclesWithPricing.flatMap((vt) => Object.values(pricingByVehicle[vt]))
      )
    : null;

  const bookingUrl = buildBookingUrl({
    routeId: route.id,
    packageType: "transfer",
    packageTitle: routeName,
    pickup,
    dropoff: drop,
  });

  const whatsappMessage = `Hi! I want to book a taxi from ${routeName}. Can you provide details?`;
  const whatsappHref = `https://wa.me/918445206116?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <>
      <HeaderServer />
      <FloatingWhatsApp routeName={routeName} />

      <main className="min-h-screen bg-white">
        {/* Hero Section — same treatment as destinations/[slug]: image + title,
            graceful fallback when no hero image has been uploaded yet. */}
        <section className="relative h-[40vh] md:h-[50vh] min-h-[280px] flex items-end overflow-hidden">
          <Image
            src={route.hero_image_url || FALLBACK_HERO}
            alt={`Taxi service from ${pickup} to ${drop}`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />

          <div className="container mx-auto relative z-10 px-4 pb-8 md:pb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display text-white drop-shadow-lg">
              {routeName} Taxi
            </h1>
          </div>
        </section>

        {/* Description */}
        <section className="bg-white py-12 md:py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-display text-ink mb-6">
              Nainital Taxi from {pickup} to {drop}
            </h2>

            {route.description && (
              <div className="font-body text-base md:text-lg leading-relaxed text-ink/75 space-y-4">
                {route.description
                  .split(/\n\s*\n/)
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-teal mr-2 mt-0.5 flex-shrink-0" />
                <span className="font-body text-ink/80">Fixed, all-inclusive fares — no surge pricing</span>
              </div>
              <div className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-teal mr-2 mt-0.5 flex-shrink-0" />
                <span className="font-body text-ink/80">Verified, experienced drivers</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="py-12 px-4 relative z-20">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center bg-white/95 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-teal" />
                  <div className="text-3xl font-display text-ink mb-1">
                    {route.distance ? `${route.distance} KM` : "—"}
                  </div>
                  <div className="text-sm font-body text-ink/70">Distance</div>
                </CardContent>
              </Card>

              <Card className="text-center bg-white/95 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-teal" />
                  <div className="text-3xl font-display text-ink mb-1">
                    {route.duration || "—"}
                  </div>
                  <div className="text-sm font-body text-ink/70">Duration</div>
                </CardContent>
              </Card>

              <Card className="text-center bg-white/95 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <Car className="w-8 h-8 mx-auto mb-2 text-teal" />
                  <div className="text-3xl font-display text-ink mb-1">
                    {minPrice !== null ? `₹${minPrice.toLocaleString("en-IN")}+` : "On request"}
                  </div>
                  <div className="text-sm font-body text-ink/70">Starting Price</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing — falls back to a contact CTA when no pricing has been
            entered yet, rather than rendering an empty table. */}
        <section className="py-12 px-4 bg-lake/10">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-display text-ink text-center mb-8">
              Transparent Pricing
            </h2>

            {hasPricing ? (
              <div className="bg-white rounded-2xl border-3 border-ink shadow-retro overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-teal text-white">
                      <tr>
                        <th className="px-6 py-4 text-left font-display">Vehicle Type</th>
                        <th className="px-6 py-4 text-left font-display">Off-Season</th>
                        <th className="px-6 py-4 text-left font-display">Season</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehiclesWithPricing.map((vt, idx) => (
                        <tr key={vt} className={idx % 2 === 0 ? "bg-white" : "bg-lake/5"}>
                          <td className="px-6 py-4 font-body font-bold text-ink">
                            {getVehicleTypeName(vt)}
                          </td>
                          <td className="px-6 py-4 font-body font-bold text-ink">
                            {pricingByVehicle[vt]["Off-Season"]
                              ? `₹${pricingByVehicle[vt]["Off-Season"].toLocaleString("en-IN")}`
                              : "—"}
                          </td>
                          <td className="px-6 py-4 font-body font-bold text-ink">
                            {pricingByVehicle[vt]["Season"]
                              ? `₹${pricingByVehicle[vt]["Season"].toLocaleString("en-IN")}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-lake/10 border-t-3 border-ink">
                  <p className="text-sm text-ink/70 font-body text-center">
                    Prices include driver allowance and fuel. Tolls, parking, and state permits extra.
                  </p>
                </div>
              </div>
            ) : (
              <Card className="text-center bg-white">
                <CardContent className="py-10">
                  <p className="font-body text-lg text-ink/80 mb-6">
                    Rates for this route aren&apos;t published yet — WhatsApp or call us for a quote.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button variant="whatsapp" size="lg" asChild>
                      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        WhatsApp for Rates
                      </a>
                    </Button>
                    <Button variant="secondary" size="lg" asChild>
                      <a href={`tel:${PHONE_TEL}`}>
                        <Phone className="w-5 h-5 mr-2" />
                        Call {PHONE_DISPLAY}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-gradient-to-r from-teal to-teal/80 border-3 border-ink">
              <CardContent className="pt-6 text-center">
                <h2 className="text-3xl md:text-4xl font-display text-white mb-4">
                  Ready to Book Your {routeName} Taxi?
                </h2>
                <p className="text-lg font-body text-white/90 mb-8">
                  Get instant booking confirmation or reach out for special requests
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="whatsapp" size="lg" asChild>
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      WhatsApp Booking
                    </a>
                  </Button>
                  <Button variant="secondary" size="lg" asChild>
                    <a href={`tel:${PHONE_TEL}`}>
                      <Phone className="w-5 h-5 mr-2" />
                      Call {PHONE_DISPLAY}
                    </a>
                  </Button>
                  {route.enable_online_booking ? (
                    <Button variant="primary" size="lg" asChild>
                      <Link href={bookingUrl}>
                        <Calendar className="w-5 h-5 mr-2" />
                        Book Now
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="primary" size="lg" asChild>
                      <Link href="/contact">
                        <Calendar className="w-5 h-5 mr-2" />
                        Submit Query
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <FooterServer />
    </>
  );
}
