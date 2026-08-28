"use client";

import React, { useState, useEffect } from "react";
import { Header, Button } from "@/components/ui";
import FooterClient from "@/components/ui/FooterClient";
import { Car, Calendar, MapPin, IndianRupee, Phone, MessageCircle, Check, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { buildBookingUrl } from "@/lib/bookingLink";
import type { VehicleType } from "@/store/bookingStore";
import { capture } from '@/lib/analytics/capture';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

interface Route {
  id: string;
  name: string;
  from_location: string;
  to_location: string;
}

interface QuoteResult {
  route: {
    name: string;
    from: string;
    to: string;
    distance: number;
    duration: string;
  };
  pricing: {
    price: number;
    vehicleType: string;
    seasonName: string;
    date: string;
  };
  availability: {
    carsAvailable: number;
    status: 'available' | 'limited' | 'sold_out';
  };
}

const VEHICLE_TYPES = [
  { value: 'sedan', label: 'Sedan (4 Seater)', models: 'Dzire, Amaze, Xcent' },
  { value: 'suv_normal', label: 'SUV Standard (6-7 Seater)', models: 'Ertiga, Triber' },
  { value: 'suv_deluxe', label: 'SUV Deluxe (7 Seater)', models: 'Innova, Marazzo' },
  { value: 'suv_luxury', label: 'SUV Luxury (7 Seater)', models: 'Innova Crysta' },
];

export default function InstantQuotePage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('sedan');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoutes();
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/routes-with-categories');
      const { data } = await response.json();

      // Flatten all routes from all categories
      const allRoutes: Route[] = [];
      data.categories.forEach((category: any) => {
        category.routes.forEach((route: any) => {
          allRoutes.push({
            id: route.id,
            name: route.name,
            from_location: route.from_location,
            to_location: route.to_location,
          });
        });
      });

      setRoutes(allRoutes);
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  const handleGetQuote = async () => {
    if (!selectedRoute || !selectedVehicle || !selectedDate) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setQuoteResult(null);

    try {
      const response = await fetch('/api/instant-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: selectedRoute,
          vehicleType: selectedVehicle,
          date: selectedDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to get quote');
        return;
      }

      setQuoteResult(data.data);

      capture(ANALYTICS_EVENTS.quoteRequested, {
        route_id: selectedRoute,
        vehicle_type: selectedVehicle,
        trip_date: selectedDate,
        price_total: data.data?.price ?? null,
      });
    } catch (err) {
      setError('Failed to get quote. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicleInfo = VEHICLE_TYPES.find(v => v.value === selectedVehicle);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-sunrise/30 via-white to-lake/30 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-block bg-white px-6 py-2 rounded-full border-3 border-ink shadow-retro mb-6">
              <span className="text-sm font-body font-bold text-ink">
                ⚡ Instant Quote Calculator
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-display text-ink mb-6">
              Get Your Taxi Fare
              <span className="text-teal"> Instantly</span>
            </h1>
            <p className="text-xl text-ink/80 font-body">
              No form submission needed. Select your route, vehicle, and date to see exact pricing.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8">
            {/* Quote Form */}
            <div className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-8">
              <h2 className="text-2xl font-display text-ink mb-6">Calculate Your Fare</h2>

              {/* Route Selection */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-body font-bold text-ink mb-2">
                  <MapPin className="w-4 h-4" />
                  Select Route
                </label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body text-ink focus:outline-none focus:border-teal"
                >
                  <option value="">Choose a route...</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Selection */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-body font-bold text-ink mb-2">
                  <Car className="w-4 h-4" />
                  Select Vehicle
                </label>
                <div className="space-y-2">
                  {VEHICLE_TYPES.map((vehicle) => (
                    <label
                      key={vehicle.value}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedVehicle === vehicle.value
                          ? 'border-teal bg-teal/10'
                          : 'border-ink/20 hover:border-ink'
                      }`}
                    >
                      <input
                        type="radio"
                        name="vehicle"
                        value={vehicle.value}
                        checked={selectedVehicle === vehicle.value}
                        onChange={(e) => setSelectedVehicle(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="font-body font-bold text-ink">{vehicle.label}</div>
                        <div className="text-sm text-ink/60">{vehicle.models}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-body font-bold text-ink mb-2">
                  <Calendar className="w-4 h-4" />
                  Travel Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body text-ink focus:outline-none focus:border-teal"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-coral/20 border-2 border-coral rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-coral shrink-0 mt-0.5" />
                  <p className="text-sm font-body text-ink">{error}</p>
                </div>
              )}

              {/* Get Quote Button */}
              <Button
                onClick={handleGetQuote}
                disabled={loading || !selectedRoute || !selectedVehicle || !selectedDate}
                variant="primary"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <IndianRupee className="w-5 h-5 mr-2" />
                    Get Instant Quote
                  </>
                )}
              </Button>
            </div>

            {/* Quote Result */}
            <div className="lg:sticky lg:top-24 h-fit">
              {quoteResult ? (
                <div className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-teal to-lake p-6 border-b-3 border-ink">
                    <div className="flex items-center gap-2 text-white mb-2">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-body font-bold">Quote Ready</span>
                    </div>
                    <div className="text-4xl font-display text-white">
                      ₹{quoteResult.pricing.price.toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm text-white/80 font-body mt-1">
                      {quoteResult.pricing.seasonName} Pricing
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="text-sm text-ink/60 font-body mb-1">Route</div>
                      <div className="font-body font-bold text-ink">{quoteResult.route.name}</div>
                      <div className="text-sm text-ink/70">{quoteResult.route.distance} km • {quoteResult.route.duration}</div>
                    </div>

                    <div>
                      <div className="text-sm text-ink/60 font-body mb-1">Vehicle</div>
                      <div className="font-body font-bold text-ink">{selectedVehicleInfo?.label}</div>
                      <div className="text-sm text-ink/70">{selectedVehicleInfo?.models}</div>
                    </div>

                    <div>
                      <div className="text-sm text-ink/60 font-body mb-1">Travel Date</div>
                      <div className="font-body font-bold text-ink">
                        {new Date(selectedDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>
                    </div>

                    {/* Availability Status */}
                    <div className={`p-4 rounded-lg border-2 ${
                      quoteResult.availability.status === 'available'
                        ? 'bg-teal/10 border-teal'
                        : quoteResult.availability.status === 'limited'
                        ? 'bg-sunshine/10 border-sunshine'
                        : 'bg-coral/10 border-coral'
                    }`}>
                      <div className="text-sm font-body font-bold text-ink">
                        {quoteResult.availability.status === 'available' && '✓ Available'}
                        {quoteResult.availability.status === 'limited' && '⚠️ Limited Availability'}
                        {quoteResult.availability.status === 'sold_out' && '✕ Sold Out'}
                      </div>
                      <div className="text-xs text-ink/70 mt-1">
                        {quoteResult.availability.carsAvailable} vehicles available
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="space-y-3 pt-4">
                      <Link
                        href={buildBookingUrl({
                          vehicle: selectedVehicle as VehicleType,
                          date: selectedDate,
                          packageType: 'transfer',
                        })}
                        className="block"
                      >
                        <Button variant="primary" className="w-full">
                          Book Now
                        </Button>
                      </Link>

                      <div className="grid grid-cols-2 gap-3">
                        <a href="tel:+918445206116">
                          <Button variant="outline" size="sm" className="w-full">
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/918445206116?text=${encodeURIComponent(
                            `Hi! I got a quote for ${quoteResult.route.name} on ${selectedDate}. Price: ₹${quoteResult.pricing.price}. I want to book.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-8 text-center">
                  <div className="text-6xl mb-4">💡</div>
                  <h3 className="text-xl font-display text-ink mb-2">
                    Select your preferences
                  </h3>
                  <p className="text-sm text-ink/60 font-body">
                    Choose route, vehicle, and date to see your instant quote
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Benefits Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border-2 border-ink p-6 text-center">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-display text-lg text-ink mb-2">Instant Results</h3>
                <p className="text-sm text-ink/70 font-body">No waiting. Get exact pricing in seconds.</p>
              </div>
              <div className="bg-white rounded-xl border-2 border-ink p-6 text-center">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="font-display text-lg text-ink mb-2">Transparent Pricing</h3>
                <p className="text-sm text-ink/70 font-body">Fixed rates. No hidden charges.</p>
              </div>
              <div className="bg-white rounded-xl border-2 border-ink p-6 text-center">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-display text-lg text-ink mb-2">Real-Time Availability</h3>
                <p className="text-sm text-ink/70 font-body">See live vehicle availability.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <FooterClient />
    </>
  );
}
