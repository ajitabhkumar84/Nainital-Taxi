"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Car, FolderTree, Phone } from "lucide-react";
import RouteCard from "@/components/RouteCard";
import { RouteWithCategory, RoutePricing, RouteCategory } from "@/lib/supabase/types";

interface CategoryWithRoutes extends RouteCategory {
  routes: (RouteWithCategory & { pricing?: RoutePricing[] })[];
}

export default function RatesPage() {
  const [categories, setCategories] = useState<CategoryWithRoutes[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutesWithCategories();
  }, []);

  const fetchRoutesWithCategories = async () => {
    try {
      const response = await fetch("/api/routes-with-categories");

      if (!response.ok) throw new Error("Failed to fetch routes");

      const { data } = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIconEmoji = (icon: string) => {
    const iconMap: Record<string, string> = {
      car: "🚗",
      mountain: "⛰️",
      temple: "🛕",
      city: "🏙️",
      lake: "🏞️",
      nature: "🌲",
      road: "🛣️",
      custom: "✨",
    };
    return iconMap[icon] || "📁";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sunrise/30 via-white to-lake/30 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xl font-display text-ink">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading routes...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sunrise/30 via-white to-lake/30">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-coral via-sunshine to-sunrise border-b-3 border-ink">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-white px-6 py-2 rounded-full border-3 border-ink shadow-retro mb-6">
              <span className="text-sm font-body font-bold text-ink">
                🚕 Transparent Pricing
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-display text-ink mb-6">
              Transfer Routes
            </h1>
            <p className="text-xl text-ink/80 font-body max-w-2xl mx-auto">
              Browse all available taxi routes from Nainital. Fixed rates, no
              hidden charges, comfortable vehicles.
            </p>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto">
              <div className="bg-white/90 backdrop-blur rounded-xl border-2 border-ink p-4">
                <div className="text-3xl font-display text-ink">500+</div>
                <div className="text-sm font-body text-ink/70">
                  Happy Travelers
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur rounded-xl border-2 border-ink p-4">
                <div className="text-3xl font-display text-ink">24/7</div>
                <div className="text-sm font-body text-ink/70">Support</div>
              </div>
              <div className="bg-white/90 backdrop-blur rounded-xl border-2 border-ink p-4">
                <div className="text-3xl font-display text-ink">15+</div>
                <div className="text-sm font-body text-ink/70">Years</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation (if multiple categories) */}
      {categories.length > 1 && (
        <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b-3 border-ink shadow-retro">
          <div className="container mx-auto px-4 py-4">
            <div className="flex gap-3 overflow-x-auto">
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`#${category.category_slug}`}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-ink rounded-xl font-body font-semibold text-ink hover:bg-sunshine transition-colors whitespace-nowrap"
                >
                  <span>{getIconEmoji(category.icon)}</span>
                  <span>{category.category_name}</span>
                  <span className="text-xs bg-lake/20 px-2 py-0.5 rounded-full">
                    {category.routes.length}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {categories.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border-3 border-ink p-12 text-center shadow-retro">
            <Car className="w-16 h-16 text-ink/20 mx-auto mb-4" />
            <h3 className="text-2xl font-display text-ink mb-2">
              No routes available
            </h3>
            <p className="text-ink/60 font-body mb-6">
              We're updating our routes. Please check back soon or contact us
              directly.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-whatsapp text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Phone className="w-5 h-5" />
              Contact Us
            </Link>
          </div>
        ) : (
          <div className="space-y-16">
            {categories.map((category, index) => (
              <section
                key={category.id}
                id={category.category_slug}
                className={`scroll-mt-24 ${
                  index % 2 === 1 ? "bg-white/50 rounded-3xl p-8 border-3 border-ink/10" : ""
                }`}
              >
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-white p-4 rounded-2xl border-3 border-ink shadow-retro">
                    <span className="text-4xl">
                      {getIconEmoji(category.icon)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-display text-ink">
                      {category.category_name}
                    </h2>
                    {category.category_description && (
                      <p className="text-ink/60 font-body mt-1">
                        {category.category_description}
                      </p>
                    )}
                  </div>
                  <div className="bg-lake/20 px-4 py-2 rounded-full border-2 border-lake">
                    <span className="text-sm font-body font-bold text-lake">
                      {category.routes.length} Route
                      {category.routes.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Routes Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.routes.map((route) => (
                    <RouteCard key={route.id} route={route} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-teal via-lake to-sky border-t-3 border-ink">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-4xl font-display mb-6">
              Can't Find Your Route?
            </h2>
            <p className="text-xl font-body mb-8 text-white/90">
              We offer custom routes and packages. Contact us for a personalized
              quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="https://wa.me/918445206116?text=Hi,%20I%20need%20a%20custom%20taxi%20route"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-whatsapp text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                💬 WhatsApp Us
              </Link>
              <Link
                href="tel:+918445206116"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <Phone className="w-5 h-5" />
                Call Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
