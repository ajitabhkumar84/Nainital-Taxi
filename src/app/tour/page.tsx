import Link from "next/link";
import { Metadata } from "next";
import { Header, Footer, Button, Card, CardContent, Badge } from "@/components/ui";
import { Clock, MapPin, Star, ArrowRight, Users } from "lucide-react";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { getPackages } from "@/lib/supabase/queries_enhanced";

export const metadata: Metadata = {
  title: "Tour Packages | Nainital Taxi - Hotel + Taxi Packages",
  description: "Explore our curated tour packages with hotel accommodations and taxi services. Multi-day tours to Nainital, Ranikhet, Mukteshwar, Jim Corbett and more.",
  keywords: "Nainital tour packages, hotel taxi package, Uttarakhand tours, Nainital holiday packages, hill station tours",
};

export default async function TourPackagesPage() {
  const packages = await getPackages("tour");

  return (
    <>
      <Header />
      <FloatingWhatsApp />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 bg-gradient-to-b from-sunshine/20 to-transparent">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-sunshine/30 px-4 py-2 rounded-full mb-6">
            <Star className="w-5 h-5 text-ink" />
            <span className="font-body text-sm text-ink font-semibold">Hotel + Taxi Packages</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-ink mb-6">
            Popular Tour Packages
          </h1>
          <p className="text-lg md:text-xl font-body text-ink/70 max-w-2xl mx-auto">
            Handpicked adventures with comfortable stays and reliable transportation.
            Everything arranged for a hassle-free vacation.
          </p>
        </div>
      </section>

      {/* Tour Packages Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          {packages.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl font-body text-ink/60">
                No tour packages available at the moment.
              </p>
              <p className="text-ink/50 mt-2">Please check back later or contact us for custom tours.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <Link key={pkg.id} href={`/tour/${pkg.slug}`}>
                  <Card className="overflow-hidden group cursor-pointer hover:shadow-retro-lg transition-all h-full flex flex-col">
                    {/* Image */}
                    <div className="h-56 relative overflow-hidden">
                      {pkg.image_url ? (
                        <img
                          src={pkg.image_url}
                          alt={pkg.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-teal/30 to-teal/10 flex items-center justify-center">
                          <MapPin className="w-16 h-16 text-teal/50" />
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {pkg.is_popular && (
                          <Badge variant="popular" className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Popular
                          </Badge>
                        )}
                        {pkg.is_seasonal && (
                          <Badge variant="limited">Seasonal</Badge>
                        )}
                      </div>

                      {/* Duration Badge */}
                      {pkg.duration && (
                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-body text-ink flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {pkg.duration}
                        </div>
                      )}
                    </div>

                    <CardContent className="pt-6 flex-grow flex flex-col">
                      <h3 className="font-display text-2xl text-ink mb-2">
                        {pkg.title}
                      </h3>

                      <p className="font-body text-ink/70 mb-4 line-clamp-2 flex-grow">
                        {pkg.description}
                      </p>

                      {/* Places Covered */}
                      {pkg.places_covered && pkg.places_covered.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-ink/60 mb-4">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">
                            {pkg.places_covered.slice(0, 3).join(", ")}
                            {pkg.places_covered.length > 3 && ` +${pkg.places_covered.length - 3} more`}
                          </span>
                        </div>
                      )}

                      {/* Stats Row */}
                      <div className="flex items-center justify-between text-sm text-ink/60 mb-4">
                        {pkg.distance && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{pkg.distance} km</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{pkg.min_passengers}-{pkg.max_passengers || 6} pax</span>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-ink/10">
                        <span className="text-sm text-ink/50">View Details</span>
                        <Button variant="primary" size="sm" className="group-hover:bg-teal group-hover:border-teal transition-colors">
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

      {/* Why Choose Our Packages Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-lake/10 to-white">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-display text-ink text-center mb-12">
            Why Book Our Tour Packages?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-sunshine/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏨</span>
              </div>
              <h3 className="font-display text-xl text-ink mb-2">Quality Hotels</h3>
              <p className="font-body text-ink/70 text-sm">
                Carefully selected accommodations from budget to luxury options
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-teal/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🚕</span>
              </div>
              <h3 className="font-display text-xl text-ink mb-2">Verified Drivers</h3>
              <p className="font-body text-ink/70 text-sm">
                Professional, background-checked drivers for your safety
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-coral/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
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

      <Footer />
    </>
  );
}
