"use client";

import React from "react";
import { MapPin, Clock, Star } from "lucide-react";
import { DetailedAttraction } from "@/lib/supabase/types";

interface DetailedAttractionsProps {
  attractions: DetailedAttraction[];
  flexibilityNote?: string;
}

export default function DetailedAttractions({
  attractions,
  flexibilityNote,
}: DetailedAttractionsProps) {
  if (!attractions || attractions.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-coral/10 via-white to-sunrise/20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3">
            Attractions & <span className="text-teal">Stops</span>
          </h2>
          <p className="text-ink/60 font-body">
            Explore all the amazing places covered in this tour
          </p>
        </div>

        <div className="space-y-8">
          {attractions.map((attraction, index) => {
            const isEven = index % 2 === 0;

            return (
              <div
                key={attraction.id}
                className="bg-white rounded-2xl border-3 border-ink shadow-retro-sm overflow-hidden"
              >
                {attraction.is_highlighted && attraction.badge_text && (
                  <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-coral to-sunshine text-white px-4 py-2 rounded-full text-sm font-body font-bold shadow-lg">
                    ⭐ {attraction.badge_text}
                  </div>
                )}

                <div
                  className={`grid md:grid-cols-2 gap-0 ${
                    isEven ? "" : "md:grid-flow-dense"
                  }`}
                >
                  {/* Image Side */}
                  {attraction.image_url && (
                    <div
                      className={`relative h-64 md:h-auto bg-gradient-to-br from-teal/20 to-lake/20 ${
                        isEven ? "" : "md:col-start-2"
                      }`}
                    >
                      <img
                        src={attraction.image_url}
                        alt={attraction.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content Side */}
                  <div
                    className={`p-6 md:p-8 ${
                      attraction.image_url
                        ? isEven
                          ? "bg-gradient-to-br from-coral/5 to-white"
                          : "bg-gradient-to-br from-teal/5 to-white md:col-start-1"
                        : "md:col-span-2 bg-gradient-to-br from-sunrise/10 to-white"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-teal to-lake rounded-full flex items-center justify-center text-white font-display font-bold text-xl md:text-2xl shadow-lg">
                          {attraction.order}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl md:text-3xl font-display text-ink mb-3">
                          {attraction.name}
                        </h3>
                        <p className="text-ink/70 font-body leading-relaxed mb-4">
                          {attraction.description}
                        </p>

                        {/* Route Info */}
                        {attraction.route_info && (
                          <div className="flex items-center gap-2 text-sm text-teal bg-teal/10 px-4 py-2 rounded-lg inline-block mb-2 border border-teal/30">
                            <MapPin className="w-4 h-4" />
                            <span className="font-body font-semibold">Route:</span>
                            <span className="font-body">{attraction.route_info}</span>
                          </div>
                        )}

                        {/* Time Estimate */}
                        {attraction.time_estimate && (
                          <div className="flex items-center gap-2 text-sm text-ink/60 font-body font-semibold mt-2">
                            <Clock className="w-4 h-4" />
                            {attraction.time_estimate}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Flexibility Note */}
        {flexibilityNote && (
          <div className="mt-12 bg-gradient-to-br from-lake/10 to-white rounded-2xl shadow-lg p-6 md:p-8 border-2 border-lake/30">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-lake rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-display text-ink mb-2">
                  Flexible Itinerary
                </h3>
                <p className="text-ink/70 font-body leading-relaxed">
                  {flexibilityNote}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
