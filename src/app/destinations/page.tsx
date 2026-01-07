import Link from "next/link";
import { Metadata } from "next";
import { Header, Footer, Button, Card, CardContent } from "@/components/ui";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { getDestinations } from "@/lib/supabase/queries_enhanced";

export const metadata: Metadata = {
  title: "Destinations | Nainital Taxi - Explore Uttarakhand",
  description: "Discover beautiful destinations in Uttarakhand. Book taxi services to Kathgodam, Pantnagar, Bhimtal, Mukteshwar, Ranikhet, Jim Corbett and more.",
  keywords: "Nainital destinations, Uttarakhand taxi, Kathgodam taxi, Bhimtal tour, Mukteshwar trip, Ranikhet taxi",
};

// Gradient colors for destination cards
const gradientColors = [
  "from-teal/30 to-teal/10",
  "from-sunshine/30 to-sunshine/10",
  "from-coral/30 to-coral/10",
];

export default async function DestinationsPage() {
  const destinations = await getDestinations();

  return (
    <>
      <Header />
      <FloatingWhatsApp />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 bg-gradient-to-b from-teal/10 to-transparent">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-ink mb-6">
            Explore Amazing Destinations
          </h1>
          <p className="text-lg md:text-xl font-body text-ink/70 max-w-2xl mx-auto">
            Discover the beauty of Uttarakhand&apos;s hill stations with our reliable taxi services.
            Day trips, transfers, and custom tours available.
          </p>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          {destinations.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl font-body text-ink/60">
                No destinations available at the moment.
              </p>
              <p className="text-ink/50 mt-2">Please check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destinations.map((destination, index) => (
                <Link key={destination.id} href={`/destinations/${destination.slug}`}>
                  <Card className="overflow-hidden group cursor-pointer hover:shadow-retro-lg transition-all h-full">
                    {/* Image/Emoji Area */}
                    <div
                      className={`h-48 bg-gradient-to-br ${gradientColors[index % gradientColors.length]} flex items-center justify-center relative overflow-hidden`}
                    >
                      {destination.hero_image_url ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                          style={{ backgroundImage: `url(${destination.hero_image_url})` }}
                        />
                      ) : (
                        <span className="text-6xl group-hover:scale-110 transition-transform">
                          {destination.emoji || "🏔️"}
                        </span>
                      )}

                      {/* Popular Badge */}
                      {destination.is_popular && (
                        <div className="absolute top-3 right-3 bg-coral text-white text-xs font-bold px-2 py-1 rounded-full">
                          Popular
                        </div>
                      )}
                    </div>

                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-display text-2xl text-ink">
                          {destination.name}
                        </h3>
                        {destination.emoji && !destination.hero_image_url && (
                          <span className="text-2xl">{destination.emoji}</span>
                        )}
                      </div>

                      <p className="font-body text-ink/70 mb-4 line-clamp-2">
                        {destination.tagline || destination.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-ink/60 mb-4">
                        {destination.distance_from_nainital && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{destination.distance_from_nainital} km</span>
                          </div>
                        )}
                        {destination.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{destination.duration}</span>
                          </div>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-ink/50">
                          {destination.distance_from_nainital
                            ? `${destination.distance_from_nainital} km from Nainital`
                            : "View details"}
                        </span>
                        <Button variant="outline" size="sm" className="group-hover:bg-teal group-hover:text-white group-hover:border-teal transition-colors">
                          Explore <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-ink to-ink/95 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display text-white mb-4">
            Can&apos;t Find Your Destination?
          </h2>
          <p className="font-body text-white/70 mb-8 max-w-xl mx-auto">
            We offer custom taxi services to any location in Uttarakhand and beyond.
            Contact us for a personalized quote.
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

      <Footer />
    </>
  );
}
