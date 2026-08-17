"use client";

import React, { useState } from "react";
import { MapPin, Clock, Star, ChevronDown, ChevronUp } from "lucide-react";
import { DetailedAttraction } from "@/lib/supabase/types";
import Image from "next/image";

interface DetailedAttractionsProps {
  attractions: DetailedAttraction[];
  flexibilityNote?: string;
}

const CARD_TINTS = [
  "from-teal/10 to-lake",
  "from-coral/10 to-sunrise",
  "from-sunshine/15 to-sunrise",
  "from-lake to-teal/5",
  "from-coral/5 to-sunshine/10",
  "from-teal/5 to-coral/5",
];

export default function DetailedAttractions({
  attractions,
  flexibilityNote,
}: DetailedAttractionsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!attractions || attractions.length === 0) {
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-coral/10 via-sunshine/10 to-lake/20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3">
            Attractions & <span className="text-teal">Stops</span>
          </h2>
          <p className="text-ink/60 font-body">
            Explore all the amazing places covered in this tour
          </p>
        </div>

        {/* Compact Grid: 2 cols mobile, 3 cols desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {attractions.map((attraction, index) => {
            const isExpanded = expandedId === attraction.id;

            return (
              <div
                key={attraction.id}
                className={`bg-gradient-to-br ${CARD_TINTS[index % CARD_TINTS.length]} rounded-xl border-2 border-ink/15 overflow-hidden transition-all duration-300 cursor-pointer hover:border-ink/30 hover:shadow-md ${
                  isExpanded ? "col-span-2 md:col-span-3 border-ink/30 shadow-lg" : ""
                }`}
                onClick={() => toggleExpand(attraction.id)}
              >
                {/* Compact Card View */}
                <div className={`${isExpanded ? "flex flex-col md:flex-row" : ""}`}>
                  {/* Image + Number Badge */}
                  <div className={`relative ${isExpanded ? "h-48 md:h-auto md:w-64 flex-shrink-0" : "h-28 md:h-32"}`}>
                    {attraction.image_url ? (
                      <Image
                        src={attraction.image_url}
                        alt={attraction.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal/20 to-lake/30 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-teal/40" />
                      </div>
                    )}

                    {/* Numbered Badge */}
                    <div className="absolute top-2 left-2 w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-teal to-coral rounded-full flex items-center justify-center text-white font-display text-xs md:text-sm font-bold shadow-md border-2 border-white/50">
                      {attraction.order}
                    </div>

                    {/* Highlight Badge */}
                    {attraction.is_highlighted && attraction.badge_text && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-coral to-sunshine text-white px-2 py-0.5 rounded-full text-[10px] font-body font-bold shadow-sm">
                        {attraction.badge_text}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`p-3 ${isExpanded ? "flex-1 p-4 md:p-5" : ""}`}>
                    <h3 className={`font-display text-ink leading-tight mb-1 ${isExpanded ? "text-xl md:text-2xl" : "text-sm md:text-base line-clamp-2"}`}>
                      {attraction.name}
                    </h3>

                    {/* Time estimate - always visible */}
                    {attraction.time_estimate && (
                      <div className="flex items-center gap-1 text-[11px] md:text-xs text-ink/50 font-body">
                        <Clock className="w-3 h-3" />
                        <span className="line-clamp-1">{attraction.time_estimate}</span>
                      </div>
                    )}

                    {/* Expand indicator on compact view */}
                    {!isExpanded && (
                      <div className="flex items-center gap-1 mt-2 text-teal text-[11px] font-body font-semibold">
                        <span>Details</span>
                        <ChevronDown className="w-3 h-3" />
                      </div>
                    )}

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        {attraction.description && (
                          <p className="text-ink/70 font-body text-sm leading-relaxed">
                            {attraction.description}
                          </p>
                        )}

                        {attraction.route_info && (
                          <div className="flex items-center gap-2 text-sm text-teal bg-teal/10 px-3 py-2 rounded-lg border border-teal/20">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="font-body">
                              <span className="font-semibold">Route: </span>
                              {attraction.route_info}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-teal text-xs font-body font-semibold pt-1">
                          <span>Collapse</span>
                          <ChevronUp className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Flexibility Note */}
        {flexibilityNote && (
          <div className="mt-10 bg-gradient-to-br from-lake/30 to-white rounded-2xl shadow-lg p-6 md:p-8 border-2 border-lake/30">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-teal to-lake rounded-full flex items-center justify-center">
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
