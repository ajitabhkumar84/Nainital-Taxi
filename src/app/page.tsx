import Link from "next/link";
import { Header, Footer, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { Car, MapPin, Clock, Star, Plane, Train, ArrowRight, Shield, UserCheck, Phone, Sparkles, Heart, Award } from "lucide-react";
import BookingWidget from "@/components/BookingWidget";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

export default function Home() {
  return (
    <>
      <Header />
      <FloatingWhatsApp />

      {/* Hero Section with Naini Lake Background */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 overflow-hidden">
        {/* Background Image - Naini Lake */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=2070&auto=format&fit=crop')",
          }}
        >
          {/* Dark Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink/70"></div>

          {/* Secondary Gradient for Depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal/30 via-transparent to-sunshine/20"></div>
        </div>

        {/* Decorative Floating Elements with Retro Pop Style */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-32 left-10 w-24 h-24 bg-sunshine/30 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute top-48 right-20 w-32 h-32 bg-coral/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-40 left-1/4 w-28 h-28 bg-teal/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>

        {/* Hero Content with Glassmorphism */}
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md border-3 border-white/30 rounded-3xl p-8 md:p-12 shadow-retro-lg">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display text-white mb-6 drop-shadow-lg">
              Your <span className="text-sunshine drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">Vacation</span> Starts Here! 🏔️
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-body text-white/95 mb-8 md:mb-12 max-w-3xl mx-auto drop-shadow-md leading-relaxed">
              Explore the breathtaking hills of Nainital with our premium taxi services.
              Book instantly or customize your perfect mountain getaway.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg">
                Book Your Ride Now
              </Button>
              <Button variant="secondary" size="lg">
                Explore Packages
              </Button>
            </div>

            {/* Trust Badge Bar */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-white/90 text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-sunshine" />
                  <span className="font-body">Verified Drivers</span>
                </div>
                <div className="hidden sm:block w-1 h-1 bg-white/40 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-sunshine" />
                  <span className="font-body">Zero Alcohol Policy</span>
                </div>
                <div className="hidden sm:block w-1 h-1 bg-white/40 rounded-full"></div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-sunshine" />
                  <span className="font-body">10,000+ Safe Trips</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wavy SVG Divider at bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-20 md:h-32">
            <path
              fill="#FFF8E7"
              fillOpacity="1"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Booking Widget */}
      <section className="py-12 px-4 -mt-32 relative z-20">
        <div className="container mx-auto">
          <BookingWidget />
        </div>
      </section>

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
            {/* Destination 1 - Kathgodam */}
            <Link href="/destinations/kathgodam">
              <Card className="overflow-hidden group cursor-pointer hover:shadow-retro-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-teal/30 to-teal/10 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                  🚂
                </div>
                <CardContent className="pt-6">
                  <h3 className="font-display text-2xl mb-2">Kathgodam</h3>
                  <p className="font-body text-ink/70 mb-4">
                    Railway station gateway to Nainital, scenic mountain drive
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink/60">35 km from Nainital</span>
                    <Button variant="outline" size="sm">
                      Explore →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Destination 2 - Pantnagar */}
            <Link href="/destinations/pantnagar">
              <Card className="overflow-hidden group cursor-pointer hover:shadow-retro-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-sunshine/30 to-sunshine/10 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                  ✈️
                </div>
                <CardContent className="pt-6">
                  <h3 className="font-display text-2xl mb-2">Pantnagar Airport</h3>
                  <p className="font-body text-ink/70 mb-4">
                    Nearest airport to Nainital, meet & greet service available
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink/60">65 km from Nainital</span>
                    <Button variant="outline" size="sm">
                      Explore →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Destination 3 - Kainchi Dham */}
            <Link href="/destinations/kainchi-dham">
              <Card className="overflow-hidden group cursor-pointer hover:shadow-retro-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-coral/30 to-coral/10 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                  🕉️
                </div>
                <CardContent className="pt-6">
                  <h3 className="font-display text-2xl mb-2">Kainchi Dham</h3>
                  <p className="font-body text-ink/70 mb-4">
                    Famous ashram of Neem Karoli Baba, spiritual retreat
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink/60">17 km from Nainital</span>
                    <Button variant="outline" size="sm">
                      Explore →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Destination 4 - Ranikhet */}
            <Link href="/destinations/ranikhet">
              <Card className="overflow-hidden group cursor-pointer hover:shadow-retro-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-teal/30 to-teal/10 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                  🏔️
                </div>
                <CardContent className="pt-6">
                  <h3 className="font-display text-2xl mb-2">Ranikhet</h3>
                  <p className="font-body text-ink/70 mb-4">
                    Majestic views of Himalayas, golf course, and pine forests
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink/60">62 km from Nainital</span>
                    <Button variant="outline" size="sm">
                      Explore →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Destination 5 - Mukteshwar */}
            <Link href="/destinations/mukteshwar">
              <Card className="overflow-hidden group cursor-pointer hover:shadow-retro-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-sunshine/30 to-sunshine/10 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                  ⛰️
                </div>
                <CardContent className="pt-6">
                  <h3 className="font-display text-2xl mb-2">Mukteshwar</h3>
                  <p className="font-body text-ink/70 mb-4">
                    Adventure hub with rock climbing and panoramic vistas
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink/60">51 km from Nainital</span>
                    <Button variant="outline" size="sm">
                      Explore →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Destination 6 - Jim Corbett */}
            <Link href="/destinations/jim-corbett">
              <Card className="overflow-hidden group cursor-pointer hover:shadow-retro-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-coral/30 to-coral/10 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                  🐅
                </div>
                <CardContent className="pt-6">
                  <h3 className="font-display text-2xl mb-2">Jim Corbett</h3>
                  <p className="font-body text-ink/70 mb-4">
                    India&apos;s oldest national park, famous for Royal Bengal Tigers
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink/60">115 km from Nainital</span>
                    <Button variant="outline" size="sm">
                      Explore →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
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
      <section className="py-20 px-4 bg-gradient-to-br from-ink to-ink/95 text-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-teal/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-sunshine/10 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6">
              <Shield className="w-5 h-5 text-sunshine" />
              <span className="font-body text-sm text-white/90">Your Safety, Our Priority</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display text-white mb-4">
              The Nainital Taxi Safety Promise
            </h2>
            <p className="text-lg font-body text-white/70 max-w-2xl mx-auto">
              We understand you&apos;re not just booking a ride - you&apos;re trusting us with your family&apos;s safety. That&apos;s why we maintain the highest standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Promise 1 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-teal/20 rounded-xl flex items-center justify-center mb-4">
                <UserCheck className="w-6 h-6 text-teal" />
              </div>
              <h3 className="font-display text-xl text-white mb-2">Verified Drivers</h3>
              <p className="font-body text-white/70 text-sm">
                Every driver undergoes thorough background verification, license validation, and character reference checks before joining our team.
              </p>
            </div>

            {/* Promise 2 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-coral/20 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-coral" />
              </div>
              <h3 className="font-display text-xl text-white mb-2">Zero Alcohol Policy</h3>
              <p className="font-body text-white/70 text-sm">
                Our drivers pledge complete sobriety. No exceptions. Random checks ensure strict compliance with this non-negotiable policy.
              </p>
            </div>

            {/* Promise 3 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-sunshine/20 rounded-xl flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-sunshine" />
              </div>
              <h3 className="font-display text-xl text-white mb-2">Professional Training</h3>
              <p className="font-body text-white/70 text-sm">
                Defensive driving techniques, first-aid certification, and customer service training ensure you&apos;re in capable hands.
              </p>
            </div>

            {/* Promise 4 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-teal/20 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-teal" />
              </div>
              <h3 className="font-display text-xl text-white mb-2">Family Values</h3>
              <p className="font-body text-white/70 text-sm">
                Our drivers are trained to treat every passenger like their own family - helpful, respectful, and genuinely caring.
              </p>
            </div>

            {/* Promise 5 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-coral/20 rounded-xl flex items-center justify-center mb-4">
                <Car className="w-6 h-6 text-coral" />
              </div>
              <h3 className="font-display text-xl text-white mb-2">Spotless Vehicles</h3>
              <p className="font-body text-white/70 text-sm">
                Daily sanitized, regularly serviced, and thoroughly inspected vehicles. Your comfort and hygiene are non-negotiable.
              </p>
            </div>

            {/* Promise 6 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-sunshine/20 rounded-xl flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-sunshine" />
              </div>
              <h3 className="font-display text-xl text-white mb-2">24/7 Support</h3>
              <p className="font-body text-white/70 text-sm">
                Round-the-clock assistance for any concerns. Our team is always just a call away, treating your worries as our own.
              </p>
            </div>
          </div>

          {/* Bottom Message */}
          <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-3xl mx-auto">
            <h3 className="font-display text-2xl text-sunshine mb-3">Why We&apos;re Not the Cheapest</h3>
            <p className="font-body text-white/80 mb-4">
              Quality drivers deserve fair wages. Well-maintained vehicles cost more to upkeep. Rigorous safety standards require investment. Your safety is worth this - and we won&apos;t compromise on it.
            </p>
            <p className="font-display text-lg text-white/90 italic">
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
                <h3 className="font-display text-xl mb-2">10,000+ Safe Journeys</h3>
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
