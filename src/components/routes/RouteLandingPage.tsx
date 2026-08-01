"use client";

import React from "react";
import Link from "next/link";
import { Header, Footer, Button } from "@/components/ui";
import {
  MapPin, Clock, IndianRupee, Car, Phone, MessageCircle,
  Check, Star, Shield, Users, Calendar, Navigation
} from "lucide-react";

export interface RouteLandingPageProps {
  route: {
    name: string;
    from: string;
    to: string;
    distance: string;
    duration: string;
    description: string;
  };
  pricing: Array<{
    vehicleType: string;
    vehicleName: string;
    capacity: string;
    seasonPrice: number;
    offSeasonPrice: number;
  }>;
  highlights: string[];
  roadConditions: string;
  bestTime: string;
  keyInfo: Array<{
    title: string;
    description: string;
  }>;
}

export default function RouteLandingPage({
  route,
  pricing,
  highlights,
  roadConditions,
  bestTime,
  keyInfo,
}: RouteLandingPageProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-teal via-lake to-ink text-white pt-32 pb-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block bg-white/20 backdrop-blur px-4 py-2 rounded-full border-2 border-white/30 mb-6">
                <span className="text-sm font-body font-bold">
                  🚕 Premium Taxi Service
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display mb-6">
                {route.name} Taxi
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                {route.description}
              </p>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur px-6 py-3 rounded-xl border-2 border-white/20">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span className="font-body font-bold">{route.distance}</span>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur px-6 py-3 rounded-xl border-2 border-white/20">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span className="font-body font-bold">{route.duration}</span>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur px-6 py-3 rounded-xl border-2 border-white/20">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-5 h-5" />
                    <span className="font-body font-bold">Starting ₹{pricing[0].offSeasonPrice}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/booking">
                  <Button variant="primary" size="lg" className="bg-white text-ink hover:bg-white/90">
                    Book Now
                  </Button>
                </Link>
                <a href="tel:+918445206116">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    <Phone className="w-5 h-5 mr-2" />
                    Call: 8445206116
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Table */}
        <section className="py-16 bg-gradient-to-br from-sunrise/20 via-white to-lake/20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-display text-ink mb-4">
                  Transparent Pricing
                </h2>
                <p className="text-lg text-ink/70 font-body">
                  Fixed rates • No hidden charges • All-inclusive
                </p>
              </div>

              <div className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-teal text-white">
                      <tr>
                        <th className="px-6 py-4 text-left font-display">Vehicle Type</th>
                        <th className="px-6 py-4 text-left font-display">Capacity</th>
                        <th className="px-6 py-4 text-left font-display">Off-Season</th>
                        <th className="px-6 py-4 text-left font-display">Peak Season</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricing.map((item, index) => (
                        <tr
                          key={item.vehicleType}
                          className={index % 2 === 0 ? 'bg-white' : 'bg-lake/5'}
                        >
                          <td className="px-6 py-4 font-body font-bold text-ink">
                            <div className="flex items-center gap-2">
                              <Car className="w-5 h-5 text-teal" />
                              {item.vehicleName}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-body text-ink/70">{item.capacity}</td>
                          <td className="px-6 py-4 font-body font-bold text-ink">
                            ₹{item.offSeasonPrice.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 font-body font-bold text-ink">
                            ₹{item.seasonPrice.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 bg-lake/10 border-t-3 border-ink">
                  <p className="text-sm text-ink/70 font-body text-center">
                    * Prices include driver allowance and fuel. GST extra.
                  </p>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link href="/quote">
                  <Button variant="primary" size="lg">
                    <IndianRupee className="w-5 h-5 mr-2" />
                    Get Instant Quote
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl font-display text-ink mb-8 text-center">
                Why Choose Us?
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {highlights.map((highlight, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-white to-lake/5 rounded-xl border-2 border-ink p-6"
                  >
                    <div className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-teal shrink-0 mt-1" />
                      <p className="font-body text-ink">{highlight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Route Info */}
        <section className="py-16 bg-gradient-to-br from-lake/10 to-sunrise/10">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl border-2 border-ink p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Navigation className="w-6 h-6 text-teal" />
                  <h3 className="text-2xl font-display text-ink">Road Conditions</h3>
                </div>
                <p className="font-body text-ink/80">{roadConditions}</p>
              </div>

              <div className="bg-white rounded-xl border-2 border-ink p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6 text-teal" />
                  <h3 className="text-2xl font-display text-ink">Best Time to Travel</h3>
                </div>
                <p className="font-body text-ink/80">{bestTime}</p>
              </div>
            </div>

            <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {keyInfo.map((info, index) => (
                <div key={index} className="bg-white rounded-xl border-2 border-ink p-6">
                  <h4 className="font-display text-lg text-ink mb-2">{info.title}</h4>
                  <p className="text-sm font-body text-ink/70">{info.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div className="bg-gradient-to-br from-teal/10 to-lake/10 rounded-xl border-2 border-ink p-6">
                  <div className="flex justify-center mb-3">
                    <Star className="w-8 h-8 text-sunshine fill-sunshine" />
                  </div>
                  <div className="text-3xl font-display text-ink mb-1">4.8/5</div>
                  <div className="text-sm font-body text-ink/70">Customer Rating</div>
                </div>
                <div className="bg-gradient-to-br from-teal/10 to-lake/10 rounded-xl border-2 border-ink p-6">
                  <div className="flex justify-center mb-3">
                    <Users className="w-8 h-8 text-teal" />
                  </div>
                  <div className="text-3xl font-display text-ink mb-1">500+</div>
                  <div className="text-sm font-body text-ink/70">Happy Customers</div>
                </div>
                <div className="bg-gradient-to-br from-teal/10 to-lake/10 rounded-xl border-2 border-ink p-6">
                  <div className="flex justify-center mb-3">
                    <Shield className="w-8 h-8 text-teal" />
                  </div>
                  <div className="text-3xl font-display text-ink mb-1">100%</div>
                  <div className="text-sm font-body text-ink/70">Safe & Verified</div>
                </div>
                <div className="bg-gradient-to-br from-teal/10 to-lake/10 rounded-xl border-2 border-ink p-6">
                  <div className="flex justify-center mb-3">
                    <Clock className="w-8 h-8 text-teal" />
                  </div>
                  <div className="text-3xl font-display text-ink mb-1">24/7</div>
                  <div className="text-sm font-body text-ink/70">Support</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-teal via-lake to-ink text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-display mb-6">Ready to Book Your Taxi?</h2>
              <p className="text-xl mb-8 text-white/90">
                Book now or call us for instant confirmation
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/booking">
                  <Button variant="primary" size="lg" className="bg-white text-ink hover:bg-white/90">
                    Book Online
                  </Button>
                </Link>
                <a href="tel:+918445206116">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    <Phone className="w-5 h-5 mr-2" />
                    Call: 8445206116
                  </Button>
                </a>
                <a
                  href={`https://wa.me/918445206116?text=${encodeURIComponent(
                    `Hi! I want to book a taxi for ${route.name}. Can you help?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
