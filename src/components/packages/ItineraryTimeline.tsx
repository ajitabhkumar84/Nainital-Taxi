"use client";

import React, { useState } from "react";
import { ChevronDown, MapPin, Utensils, Moon, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DayPlan } from "@/lib/supabase/types";

interface ItineraryTimelineProps {
  days: DayPlan[];
}

export default function ItineraryTimeline({ days }: ItineraryTimelineProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  if (!days || days.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-sunrise/20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3">
            Day-wise Itinerary
          </h2>
          <p className="text-ink/60 font-body">
            Your journey, planned to perfection
          </p>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-teal via-sunshine to-coral rounded-full hidden md:block" />

          {/* Days */}
          <div className="space-y-4">
            {days.map((day, index) => (
              <div key={index} className="relative">
                {/* Day Number Circle */}
                <div
                  className={cn(
                    "absolute left-0 md:left-4 w-12 h-12 rounded-full border-3 border-ink flex items-center justify-center font-display text-lg z-10 transition-all",
                    expandedDay === index
                      ? "bg-sunshine shadow-retro-sm"
                      : "bg-white"
                  )}
                >
                  {day.day_number}
                </div>

                {/* Day Card */}
                <div
                  className={cn(
                    "ml-16 md:ml-24 bg-white rounded-2xl border-3 border-ink overflow-hidden transition-all",
                    expandedDay === index ? "shadow-retro" : "shadow-retro-sm"
                  )}
                >
                  {/* Day Header */}
                  <button
                    onClick={() => setExpandedDay(expandedDay === index ? null : index)}
                    className="w-full p-4 md:p-6 text-left flex items-center justify-between hover:bg-sunrise/20 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-display text-xl text-ink">
                          Day {day.day_number}: {day.title}
                        </h3>
                        {(day.time_start || day.time_end) && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal/20 text-teal text-xs font-body font-semibold rounded-full border border-teal/30">
                            {day.time_start && day.time_end
                              ? `${day.time_start} - ${day.time_end}`
                              : day.time_start || day.time_end}
                          </span>
                        )}
                      </div>
                      {day.overnight_stay && (
                        <p className="text-sm text-ink/60 font-body mt-1 flex items-center gap-1">
                          <Moon className="w-4 h-4" />
                          Overnight: {day.overnight_stay}
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-6 h-6 text-ink/60 transition-transform flex-shrink-0",
                        expandedDay === index && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Day Content */}
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      expandedDay === index ? "max-h-[500px]" : "max-h-0"
                    )}
                  >
                    <div className="px-4 md:px-6 pb-6 space-y-4 border-t-2 border-ink/10 pt-4">
                      {/* Description */}
                      {day.description && (
                        <p className="font-body text-ink/80 leading-relaxed">
                          {day.description}
                        </p>
                      )}

                      {/* Highlights */}
                      {day.highlights && day.highlights.length > 0 && (
                        <div>
                          <h4 className="font-body font-semibold text-ink mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-teal" />
                            Highlights
                          </h4>
                          <div className="grid gap-2">
                            {day.highlights.map((highlight, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 font-body text-ink/70"
                              >
                                <CheckCircle2 className="w-4 h-4 text-whatsapp flex-shrink-0 mt-0.5" />
                                {highlight}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Meals */}
                      {day.meals_included && day.meals_included.length > 0 && (
                        <div className="flex items-center gap-2 pt-2 border-t border-ink/10">
                          <Utensils className="w-4 h-4 text-coral" />
                          <span className="font-body text-sm text-ink/60">
                            Meals: {day.meals_included.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
