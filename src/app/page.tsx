import Link from "next/link";
import { Header, Footer, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { Car, MapPin, Clock, Star, Plane, Train, ArrowRight, Shield, UserCheck, Phone, Sparkles, Heart, Award } from "lucide-react";
import BookingWidget from "@/components/BookingWidget";
import DestinationFlipCard from "@/components/home/DestinationFlipCard";
import SeasonalHero from "@/components/home/SeasonalHero";
import SocialProofTicker from "@/components/home/SocialProofTicker";
import AnimatedCounter from "@/components/home/AnimatedCounter";
import { getDestinations } from "@/lib/supabase";

// Gradient mapping for destinations (fallback if not in DB)
const GRADIENT_MAP: Record<string, string> = {
  kathgodam: "from-teal/30 to-teal/10",
  pantnagar: "from-sunshine/30 to-sunshine/10",
  "kainchi-dham": "from-coral/30 to-coral/10",
  ranikhet: "from-teal/30 to-teal/10",
  mukteshwar: "from-sunshine/30 to-sunshine/10",
  "jim-corbett": "from-coral/30 to-coral/10",
};

export default async function Home() {
  // Fetch destinations from Supabase
  const destinations = await getDestinations();
  return (
    <>
      <Header />

      {/* Seasonal Hero Section */}
      <SeasonalHero />

      {/* Booking Widget with Urgency Badge */}
      <section className="py-12 px-4 -mt-32 relative z-20">
        <div className="container mx-auto">
          {/* Urgency Badge */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 bg-coral/90 text-white px-6 py-3 rounded-full border-3 border-ink shadow-retro animate-pulse">
              <span className="text-xl">⚡</span>
              <span className="font-body font-bold text-sm md:text-base">
                Peak season ahead - book early for best availability!
              </span>
            </div>
          </div>
          <BookingWidget />
        </div>
      </section>

      {/* Social Proof Ticker */}
      <SocialProofTicker />

      {/* Destinations Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
              Explore Amazing Destinations 🗺️
            </h2>
            <p className="text-lg font-body text-ink/70">
              Discover the beauty of Uttarakhand&apos;s hill stations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.length > 0 ? (
              destinations.slice(0, 6).map((destination) => (
                <DestinationFlipCard
                  key={destination.id}
                  slug={destination.slug}
                  name={destination.name}
                  emoji={destination.emoji || "📍"}
                  hero_image_url={destination.hero_image_url}
                  description={destination.description || ""}
                  distance_from_nainital={destination.distance_from_nainital || 0}
                  gradient={GRADIENT_MAP[destination.slug] || "from-teal/30 to-teal/10"}
                />
              ))
            ) : (
              /* Fallback if no destinations loaded */
              <p className="col-span-full text-center text-ink/70 font-body">
                Loading destinations...
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Featured Packages */}
      <section className="py-20 px-4 bg-white/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
              Popular Tour Packages 🎉
            </h2>
            <p className="text-lg font-body text-ink/70">
              Handpicked adventures for unforgettable memories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Package Card 1 */}
            <Link href="/tour/nainital-darshan" className="group">
              <Card className="h-full transition-transform group-hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle>Nainital Darshan</CardTitle>
                    <Badge variant="popular">Popular</Badge>
                  </div>
                  <CardDescription>
                    Complete city tour covering all major attractions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-ink/70">
                      <Clock className="w-5 h-5 mr-2" />
                      <span className="font-body">8-10 hours</span>
                    </div>
                    <div className="flex items-center text-ink/70">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span className="font-body">Naini Lake, Snow View, Mall Road</span>
                    </div>
                    <div className="flex items-center text-ink/70">
                      <Car className="w-5 h-5 mr-2" />
                      <span className="font-body">Sedan / SUV / Tempo</span>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-3xl font-display text-teal">₹2,000</span>
                      <span className="text-sm text-ink/60 font-body ml-1">starting</span>
                    </div>
                  </div>
                  <Button variant="primary" className="w-full">
                    View Details & Book
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Package Card 2 */}
            <Link href="/tour/bhimtal-lake-tour" className="group">
              <Card className="h-full transition-transform group-hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle>Bhimtal Lake Tour</CardTitle>
                    <Badge variant="limited">Limited</Badge>
                  </div>
                  <CardDescription>
                    Scenic lake tour with island temple visit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-ink/70">
                      <Clock className="w-5 h-5 mr-2" />
                      <span className="font-body">5-6 hours</span>
                    </div>
                    <div className="flex items-center text-ink/70">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span className="font-body">Bhimtal, Island Temple, Boating</span>
                    </div>
                    <div className="flex items-center text-ink/70">
                      <Car className="w-5 h-5 mr-2" />
                      <span className="font-body">Sedan / SUV / Tempo</span>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-3xl font-display text-teal">₹1,800</span>
                      <span className="text-sm text-ink/60 font-body ml-1">starting</span>
                    </div>
                  </div>
                  <Button variant="primary" className="w-full">
                    View Details & Book
                  </Button>
                </CardContent>
              </Card>
            </Link>

            {/* Package Card 3 */}
            <Link href="/tour/kainchi-dham" className="group">
              <Card className="h-full transition-transform group-hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle>Kainchi Dham</CardTitle>
                    <Badge variant="available">Available</Badge>
                  </div>
                  <CardDescription>
                    Spiritual journey to the famous Neem Karoli Baba Ashram
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-ink/70">
                      <Clock className="w-5 h-5 mr-2" />
                      <span className="font-body">4-5 hours</span>
                    </div>
                    <div className="flex items-center text-ink/70">
                      <MapPin className="w-5 h-5 mr-2" />
                      <span className="font-body">Kainchi Dham, Temple, Ashram</span>
                    </div>
                    <div className="flex items-center text-ink/70">
                      <Car className="w-5 h-5 mr-2" />
                      <span className="font-body">Sedan / SUV / Tempo</span>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-3xl font-display text-teal">₹1,500</span>
                      <span className="text-sm text-ink/60 font-body ml-1">starting</span>
                    </div>
                  </div>
                  <Button variant="primary" className="w-full">
                    View Details & Book
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Point-to-Point Transfers */}
      <section className="py-20 px-4 bg-white/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
              Airport & Station Transfers ✈️
            </h2>
            <p className="text-lg font-body text-ink/70">
              Hassle-free pickups and drops with fixed transparent pricing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Transfer Route 1 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-teal/10 p-3 rounded-lg">
                    <Plane className="w-8 h-8 text-teal" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-ink/40" />
                  <div className="bg-sunshine/30 p-3 rounded-lg">
                    <MapPin className="w-8 h-8 text-ink" />
                  </div>
                </div>
                <h3 className="font-display text-2xl mb-2">Pantnagar Airport</h3>
                <p className="font-body text-ink/70 mb-4">
                  Direct transfer from Pantnagar Airport to Nainital
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-ink/70">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm font-body">2 hours</span>
                  </div>
                  <div className="flex items-center text-ink/70">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm font-body">65 km</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-3xl font-display text-teal">₹2,500</span>
                  <Badge variant="available">Available</Badge>
                </div>
                <Button variant="primary" className="w-full">
                  Book Transfer
                </Button>
              </CardContent>
            </Card>

            {/* Transfer Route 2 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-teal/10 p-3 rounded-lg">
                    <Train className="w-8 h-8 text-teal" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-ink/40" />
                  <div className="bg-sunshine/30 p-3 rounded-lg">
                    <MapPin className="w-8 h-8 text-ink" />
                  </div>
                </div>
                <h3 className="font-display text-2xl mb-2">Kathgodam Station</h3>
                <p className="font-body text-ink/70 mb-4">
                  Pickup from Kathgodam Railway Station to Nainital
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-ink/70">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm font-body">1.5 hours</span>
                  </div>
                  <div className="flex items-center text-ink/70">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm font-body">35 km</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-3xl font-display text-teal">₹1,200</span>
                  <Badge variant="available">Available</Badge>
                </div>
                <Button variant="primary" className="w-full">
                  Book Transfer
                </Button>
              </CardContent>
            </Card>

            {/* Transfer Route 3 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-teal/10 p-3 rounded-lg">
                    <Plane className="w-8 h-8 text-teal" />
                  </div>
                  <ArrowRight className="w-6 h-6 text-ink/40" />
                  <div className="bg-sunshine/30 p-3 rounded-lg">
                    <MapPin className="w-8 h-8 text-ink" />
                  </div>
                </div>
                <h3 className="font-display text-2xl mb-2">Delhi to Nainital</h3>
                <p className="font-body text-ink/70 mb-4">
                  Comfortable long-distance transfer from Delhi
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-ink/70">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm font-body">7-8 hours</span>
                  </div>
                  <div className="flex items-center text-ink/70">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm font-body">315 km</span>
                  </div>
                </div>
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-3xl font-display text-teal">₹8,500</span>
                  <Badge variant="limited">Limited</Badge>
                </div>
                <Button variant="primary" className="w-full">
                  Book Transfer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Guest Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
              What Our Guests Say 💬
            </h2>
            <p className="text-lg font-body text-ink/70">
              Real experiences from travelers like you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 - Solo Female Traveler */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                </div>
                <p className="font-body text-ink/80 mb-6 italic">
                  {`"As a solo female traveler, safety was my top concern. The driver was extremely professional, courteous, and I felt completely safe throughout my 3-day trip. Worth every rupee!"`}
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-coral/20 rounded-full flex items-center justify-center font-display text-2xl mr-3">
                    S
                  </div>
                  <div>
                    <p className="font-bold text-ink">Sneha Kapoor</p>
                    <p className="text-sm text-ink/60">Delhi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 - Family with Elderly */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                </div>
                <p className="font-body text-ink/80 mb-6 italic">
                  {`"Traveling with my elderly parents needed someone trustworthy. The driver helped with luggage, drove carefully on mountain roads, and treated us like family. Highly recommend!"`}
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-teal/20 rounded-full flex items-center justify-center font-display text-2xl mr-3">
                    V
                  </div>
                  <div>
                    <p className="font-bold text-ink">Vikram Sharma</p>
                    <p className="text-sm text-ink/60">Mumbai</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 - Safety Comparison */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                  <Star className="w-5 h-5 text-sunshine fill-sunshine" />
                </div>
                <p className="font-body text-ink/80 mb-6 italic">
                  {`"I've used cheaper services before, but after one bad experience with an unprofessional driver, I only trust Nainital Taxi now. Their verified drivers and zero-alcohol policy give me peace of mind."`}
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-sunshine/30 rounded-full flex items-center justify-center font-display text-2xl mr-3">
                    A
                  </div>
                  <div>
                    <p className="font-bold text-ink">Anjali Mishra</p>
                    <p className="text-sm text-ink/60">Bangalore</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Safety Promise Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#D4F1E0] to-[#C5E8D5] text-ink relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-teal/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-sunshine/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/60 px-4 py-2 rounded-full mb-6">
              <Shield className="w-5 h-5 text-sunshine" />
              <span className="font-body text-sm text-ink/90">Your Safety, Our Priority</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
              The Nainital Taxi Safety Promise
            </h2>
            <p className="text-lg font-body text-ink/70 max-w-2xl mx-auto">
              We understand you&apos;re not just booking a ride - you&apos;re trusting us with your family&apos;s safety. That&apos;s why we maintain the highest standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Promise 1 */}
            <div className="bg-white/60 backdrop-blur-sm border-2 border-teal/30 rounded-2xl p-6 hover:bg-white/80 transition-colors">
              <div className="w-12 h-12 bg-teal/15 rounded-xl flex items-center justify-center mb-4">
                <UserCheck className="w-6 h-6 text-teal" />
              </div>
              <h3 className="font-display text-xl text-ink mb-2">Verified Drivers</h3>
              <p className="font-body text-ink/70 text-sm">
                Every driver undergoes thorough background verification, license validation, and character reference checks before joining our team.
              </p>
            </div>

            {/* Promise 2 */}
            <div className="bg-white/60 backdrop-blur-sm border-2 border-teal/30 rounded-2xl p-6 hover:bg-white/80 transition-colors">
              <div className="w-12 h-12 bg-coral/15 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-coral" />
              </div>
              <h3 className="font-display text-xl text-ink mb-2">Zero Alcohol Policy</h3>
              <p className="font-body text-ink/70 text-sm">
                Our drivers pledge complete sobriety. No exceptions. Random checks ensure strict compliance with this non-negotiable policy.
              </p>
            </div>

            {/* Promise 3 */}
            <div className="bg-white/60 backdrop-blur-sm border-2 border-teal/30 rounded-2xl p-6 hover:bg-white/80 transition-colors">
              <div className="w-12 h-12 bg-sunshine/15 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-sunshine" />
              </div>
              <h3 className="font-display text-xl text-ink mb-2">Professional Training</h3>
              <p className="font-body text-ink/70 text-sm">
                Defensive driving techniques, first-aid certification, and customer service training ensure you&apos;re in capable hands.
              </p>
            </div>

            {/* Promise 4 */}
            <div className="bg-white/60 backdrop-blur-sm border-2 border-teal/30 rounded-2xl p-6 hover:bg-white/80 transition-colors">
              <div className="w-12 h-12 bg-teal/15 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-teal" />
              </div>
              <h3 className="font-display text-xl text-ink mb-2">Family Values</h3>
              <p className="font-body text-ink/70 text-sm">
                Our drivers are trained to treat every passenger like their own family - helpful, respectful, and genuinely caring.
              </p>
            </div>

            {/* Promise 5 */}
            <div className="bg-white/60 backdrop-blur-sm border-2 border-teal/30 rounded-2xl p-6 hover:bg-white/80 transition-colors">
              <div className="w-12 h-12 bg-coral/15 rounded-xl flex items-center justify-center mb-4">
                <Car className="w-6 h-6 text-coral" />
              </div>
              <h3 className="font-display text-xl text-ink mb-2">Spotless Vehicles</h3>
              <p className="font-body text-ink/70 text-sm">
                Daily sanitized, regularly serviced, and thoroughly inspected vehicles. Your comfort and hygiene are non-negotiable.
              </p>
            </div>

            {/* Promise 6 */}
            <div className="bg-white/60 backdrop-blur-sm border-2 border-teal/30 rounded-2xl p-6 hover:bg-white/80 transition-colors">
              <div className="w-12 h-12 bg-sunshine/15 rounded-xl flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-sunshine" />
              </div>
              <h3 className="font-display text-xl text-ink mb-2">24/7 Support</h3>
              <p className="font-body text-ink/70 text-sm">
                Round-the-clock assistance for any concerns. Our team is always just a call away, treating your worries as our own.
              </p>
            </div>
          </div>

          {/* Bottom Message */}
          <div className="text-center bg-white/70 backdrop-blur-sm border-2 border-teal/30 rounded-2xl p-8 max-w-3xl mx-auto">
            <h3 className="font-display text-2xl text-sunshine mb-3">Why We&apos;re Not the Cheapest</h3>
            <p className="font-body text-ink/80 mb-4">
              Quality drivers deserve fair wages. Well-maintained vehicles cost more to upkeep. Rigorous safety standards require investment. Your safety is worth this - and we won&apos;t compromise on it.
            </p>
            <p className="font-display text-lg text-ink/90 italic">
              &ldquo;Cheap fares can cost you dearly. Choose safety.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 bg-white/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
              Why Families Trust Us
            </h2>
            <p className="text-lg font-body text-ink/70 max-w-2xl mx-auto">
              Premium service with uncompromised safety standards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card hover={false} className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 bg-teal/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-teal" />
                </div>
                <h3 className="font-display text-xl mb-2">Verified & Sober Drivers</h3>
                <p className="font-body text-ink/70 text-sm">Background-checked professionals with strict zero-alcohol policy</p>
              </CardContent>
            </Card>

            <Card hover={false} className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 bg-coral/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-7 h-7 text-coral" />
                </div>
                <h3 className="font-display text-xl mb-2">Family-First Service</h3>
                <p className="font-body text-ink/70 text-sm">Courteous drivers who treat your loved ones like their own</p>
              </CardContent>
            </Card>

            <Card hover={false} className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 bg-sunshine/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Award className="w-7 h-7 text-ink" />
                </div>
                <h3 className="font-display text-xl mb-2">
                  <AnimatedCounter end={10000} suffix="+" duration={2000} /> Safe Journeys
                </h3>
                <p className="font-body text-ink/70 text-sm">Trusted by thousands of families across India</p>
              </CardContent>
            </Card>

            <Card hover={false} className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 bg-teal/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-teal" />
                </div>
                <h3 className="font-display text-xl mb-2">Spotless Vehicles</h3>
                <p className="font-body text-ink/70 text-sm">Daily sanitized, well-maintained fleet for your comfort</p>
              </CardContent>
            </Card>

            <Card hover={false} className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 bg-coral/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-7 h-7 text-coral" />
                </div>
                <h3 className="font-display text-xl mb-2">Local Expertise</h3>
                <p className="font-body text-ink/70 text-sm">Drivers who know every scenic route and hidden gem</p>
              </CardContent>
            </Card>

            <Card hover={false} className="text-center">
              <CardContent className="pt-6">
                <div className="w-14 h-14 bg-sunshine/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-7 h-7 text-ink" />
                </div>
                <h3 className="font-display text-xl mb-2">24/7 Support</h3>
                <p className="font-body text-ink/70 text-sm">Round-the-clock assistance whenever you need us</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </>
  );
}
