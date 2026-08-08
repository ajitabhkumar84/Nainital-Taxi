"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, MessageCircle, RotateCcw } from "lucide-react";
import type { MultiDayRentalPage, MultiDayCarCategory } from "@/lib/supabase/types";
import {
  MAX_TRIP_DAYS,
  formatMonthDayRanges,
  formatTripDates,
  getTierBreakdown,
  toISODateLocal,
  type SeasonTier,
  type TierBreakdown,
} from "@/lib/seasonality";

const TIER_ORDER: SeasonTier[] = ["season", "mid_season", "off_season"];

const TIER_PRICE_FIELD: Record<SeasonTier, keyof MultiDayCarCategory> = {
  season: "season_price",
  mid_season: "mid_season_price",
  off_season: "off_season_price",
};

// Each tier keeps the colour it already had on this page (teal / grey / green)
// so the legend, the per-car columns and the rate-checker result all read as
// the same thing.
const TIER_STYLES: Record<
  SeasonTier,
  { legendIdle: string; legendActive: string; cellIdle: string; cellActive: string; text: string; accent: string }
> = {
  season: {
    legendIdle: "bg-teal/10 border-teal/40",
    legendActive: "bg-teal/10 border-teal ring-2 ring-teal/40",
    cellIdle: "bg-teal/5 border border-teal/20",
    cellActive: "bg-teal/20 border-2 border-teal",
    text: "text-teal",
    accent: "text-teal/80",
  },
  mid_season: {
    legendIdle: "bg-gray-50 border-gray-300",
    legendActive: "bg-gray-50 border-gray-500 ring-2 ring-gray-400/40",
    cellIdle: "bg-gray-50 border border-gray-200",
    cellActive: "bg-gray-200 border-2 border-gray-400",
    text: "text-gray-700",
    accent: "text-gray-600",
  },
  off_season: {
    legendIdle: "bg-green-50 border-green-300",
    legendActive: "bg-green-50 border-green-500 ring-2 ring-green-400/40",
    cellIdle: "bg-green-50 border border-green-200",
    cellActive: "bg-green-200 border-2 border-green-400",
    text: "text-green-700",
    accent: "text-green-600",
  },
};

function formatINR(value: number | undefined | null): string {
  return `₹${(value ?? 0).toLocaleString("en-IN")}`;
}

function buildWhatsappLink(number: string, message: string): string {
  return `https://wa.me/${number.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
}

function tierPrice(category: MultiDayCarCategory, tier: SeasonTier): number {
  return (category[TIER_PRICE_FIELD[tier]] as number) ?? 0;
}

/** Total for the whole trip: each tier's day count at that tier's daily rate. */
function tripTotal(category: MultiDayCarCategory, breakdown: TierBreakdown): number {
  return breakdown.tiers.reduce(
    (sum, tier) => sum + breakdown.counts[tier] * tierPrice(category, tier),
    0
  );
}

/**
 * Only the pricing-related slice of the page is passed across the server/client
 * boundary. Handing over the whole row would serialise the FAQ list and the
 * rich-text SEO body into the RSC payload for no reason.
 */
export type MultiDayPricingData = Pick<
  MultiDayRentalPage,
  | "pricing_heading"
  | "pricing_subheading"
  | "pricing_season_label"
  | "pricing_mid_season_label"
  | "pricing_off_season_label"
  | "pricing_season_ranges"
  | "pricing_mid_season_ranges"
  | "pricing_off_season_ranges"
  | "season_override"
  | "pricing_note_text"
  | "car_categories"
>;

interface MultiDayPricingSectionProps {
  pageData: MultiDayPricingData;
  whatsappNumber: string;
  /**
   * Today's tier, computed on the server. Computing it in the browser instead
   * would let a UTC server and an IST visitor disagree about what "today" is
   * and produce a hydration mismatch.
   */
  initialActiveTier: SeasonTier;
}

export default function MultiDayPricingSection({
  pageData,
  whatsappNumber,
  initialActiveTier,
}: MultiDayPricingSectionProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Resolved after mount, for the same server-vs-visitor timezone reason as
  // initialActiveTier: rendering a server-derived `min` would mismatch on
  // hydration. Until then the inputs simply have no lower bound.
  const [today, setToday] = useState("");
  useEffect(() => setToday(toISODateLocal(new Date())), []);

  const tierLabels: Record<SeasonTier, string> = {
    season: pageData.pricing_season_label,
    mid_season: pageData.pricing_mid_season_label,
    off_season: pageData.pricing_off_season_label,
  };

  const tierRanges: Record<SeasonTier, string[]> = {
    season: formatMonthDayRanges(pageData.pricing_season_ranges),
    mid_season: formatMonthDayRanges(pageData.pricing_mid_season_ranges),
    off_season: formatMonthDayRanges(pageData.pricing_off_season_ranges),
  };

  const breakdown = useMemo(
    () => (startDate && endDate ? getTierBreakdown(pageData, startDate, endDate) : null),
    [pageData, startDate, endDate]
  );

  const tripDates = breakdown ? formatTripDates(startDate, endDate) : null;

  // With dates chosen the guest's own tier(s) drive the highlighting; without
  // them we fall back to whichever tier is live today.
  const highlightedTiers: SeasonTier[] = breakdown ? breakdown.tiers : [initialActiveTier];

  const handleStartChange = (value: string) => {
    setStartDate(value);
    // An end date before the new start would silently produce no result.
    if (endDate && value && endDate < value) setEndDate(value);
  };

  const clearDates = () => {
    setStartDate("");
    setEndDate("");
  };

  const rangeIsTooLong = Boolean(startDate && endDate && endDate >= startDate && !breakdown);

  return (
    <section id="pricing-table" className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-4">{pageData.pricing_heading}</h2>
          <p className="text-lg md:text-xl text-ink/70 max-w-3xl mx-auto font-body">
            {pageData.pricing_subheading}
          </p>
        </div>

        {/* Rate checker — answers "which rate applies to MY trip?" */}
        <div className="max-w-3xl mx-auto mb-8 bg-lake rounded-2xl border-3 border-ink shadow-retro-sm p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-teal" />
            <h3 className="font-display text-lg text-ink">Check your rate</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="trip-start" className="block font-body text-sm text-ink/70 mb-1">
                Travel from
              </label>
              <input
                id="trip-start"
                type="date"
                value={startDate}
                min={today || undefined}
                onChange={(e) => handleStartChange(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2 bg-white border-2 border-ink/20 rounded-xl font-body focus:border-teal focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="trip-end" className="block font-body text-sm text-ink/70 mb-1">
                Travel until
              </label>
              <input
                id="trip-end"
                type="date"
                value={endDate}
                min={startDate || today || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full min-h-[44px] px-4 py-2 bg-white border-2 border-ink/20 rounded-xl font-body focus:border-teal focus:outline-none"
              />
            </div>
          </div>

          <div aria-live="polite" className="mt-4">
            {breakdown ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-body text-ink">
                  <strong className="font-display text-lg">
                    {breakdown.totalDays} {breakdown.totalDays === 1 ? "day" : "days"}
                  </strong>
                  {tripDates && <span className="text-ink/60"> ({tripDates})</span>}
                  <span className="text-ink/60"> · </span>
                  {breakdown.tiers.length === 1 ? (
                    <span className={`font-semibold ${TIER_STYLES[breakdown.tiers[0]].text}`}>
                      {tierLabels[breakdown.tiers[0]]} applies
                    </span>
                  ) : (
                    <span className="font-semibold text-ink/80">
                      {breakdown.tiers
                        .map((tier) => `${breakdown.counts[tier]} × ${tierLabels[tier]}`)
                        .join(" + ")}
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={clearDates}
                  className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-ink font-body underline-offset-2 hover:underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            ) : rangeIsTooLong ? (
              <p className="font-body text-sm text-coral">
                Please pick a trip of {MAX_TRIP_DAYS} days or fewer — for longer journeys, message us
                and we&apos;ll quote it directly.
              </p>
            ) : (
              <p className="font-body text-sm text-ink/60">
                Pick your dates to see exactly which seasonal rate applies. Showing today&apos;s rate
                ({tierLabels[initialActiveTier]}) until then.
              </p>
            )}
          </div>

          {pageData.season_override !== "auto" && (
            <p className="mt-3 font-body text-xs text-ink/50">
              Special rates are currently in effect, so {tierLabels[initialActiveTier]} applies to all
              travel dates.
            </p>
          )}
        </div>

        {/* Season legend — now states the actual date windows for each tier */}
        <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
          {TIER_ORDER.map((tier) => {
            const isHighlighted = highlightedTiers.includes(tier);
            const styles = TIER_STYLES[tier];
            const ranges = tierRanges[tier];
            return (
              <div
                key={tier}
                className={`border-3 rounded-xl p-4 text-center ${
                  isHighlighted ? styles.legendActive : styles.legendIdle
                }`}
              >
                <div className={`font-bold mb-1 font-display ${styles.text}`}>{tierLabels[tier]}</div>
                {isHighlighted && (
                  <div className={`text-[10px] uppercase tracking-wide font-bold mb-1 ${styles.accent}`}>
                    {breakdown ? "Your dates" : "Active now"}
                  </div>
                )}
                {ranges.length > 0 ? (
                  <ul className="font-body text-xs text-ink/60 space-y-0.5">
                    {ranges.map((range) => (
                      <li key={range}>{range}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-body text-xs text-ink/40">Dates on request</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Pricing Cards Grid */}
        <div className="space-y-6">
          {pageData.car_categories
            ?.slice()
            .sort((a, b) => a.order - b.order)
            .map((category, index) => {
              const perDayPrices = highlightedTiers.map((tier) => tierPrice(category, tier));
              const minPerDay = Math.min(...perDayPrices);
              const maxPerDay = Math.max(...perDayPrices);
              const estimate = breakdown ? tripTotal(category, breakdown) : null;

              const baseMessage = (
                category.whatsapp_message ||
                "Hi! 👋 Need a quick quote for a multi-day {category} rental in Nainital. 🚕"
              ).replace("{category}", category.name);
              // Carrying the guest's own dates into the chat saves the first
              // two messages of every enquiry.
              const whatsappMessage = tripDates
                ? `${baseMessage}\n\nTravel dates: ${tripDates} (${breakdown?.totalDays} days)`
                : baseMessage;

              return (
                <div
                  key={index}
                  className={`bg-white rounded-2xl ${
                    category.is_popular ? "shadow-retro hover:shadow-retro-lg" : "shadow-retro-sm hover:shadow-retro"
                  } transition-all duration-300 border-3 ${
                    category.is_popular ? "border-yellow" : "border-ink"
                  } overflow-hidden ${category.is_popular ? "relative" : ""}`}
                >
                  {category.is_popular && (
                    <div className="absolute -top-3 right-6 bg-coral text-white px-4 py-1 rounded-full text-sm font-bold border-2 border-ink shadow-retro-sm z-10">
                      ⭐ POPULAR
                    </div>
                  )}
                  <div className="md:flex">
                    {category.image_url && (
                      <div className="md:w-56 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-40 md:h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div
                        className={`${
                          category.is_popular
                            ? "bg-gradient-to-r from-yellow/20 to-yellow/10"
                            : "bg-gradient-to-r from-gray-100 to-gray-50"
                        } px-6 py-4 border-b-3 ${category.is_popular ? "border-yellow" : "border-ink/20"}`}
                      >
                        <h3 className="text-xl md:text-2xl font-display text-ink">
                          {category.name}
                          {category.name && !category.name.toLowerCase().includes("similar") ? " or similar" : ""}
                        </h3>
                        <p
                          className={`text-sm mt-1 font-body ${
                            category.is_popular ? "text-ink/70 font-medium" : "text-ink/60"
                          }`}
                        >
                          {category.vehicles}
                        </p>
                        {(category.capacity || category.tagline) && (
                          <p className="text-xs text-ink/50 font-body mt-1">
                            {[category.capacity, category.tagline].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>

                      <div className={`p-6 ${category.is_popular ? "bg-yellow/5" : ""}`}>
                        <div className="mb-4">
                          <span className="text-xs uppercase tracking-wide text-ink/50 font-body">
                            {breakdown ? "Your rate" : "Starting from"}
                          </span>
                          <div className="text-3xl font-bold font-display text-teal">
                            {minPerDay === maxPerDay ? formatINR(minPerDay) : `${formatINR(minPerDay)}–${formatINR(maxPerDay)}`}
                            <span className="text-sm font-body text-ink/50">/day</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                          {TIER_ORDER.map((tier) => {
                            const styles = TIER_STYLES[tier];
                            const isHighlighted = highlightedTiers.includes(tier);
                            return (
                              <div
                                key={tier}
                                className={`text-center p-3 rounded-xl ${
                                  isHighlighted ? styles.cellActive : styles.cellIdle
                                }`}
                              >
                                <div className={`text-[10px] font-semibold mb-1 font-body ${styles.accent}`}>
                                  {tierLabels[tier].toUpperCase()}
                                </div>
                                <div className={`text-lg font-bold font-display ${styles.accent}`}>
                                  {formatINR(tierPrice(category, tier))}
                                </div>
                                {isHighlighted && breakdown && (
                                  <div className="text-[10px] font-body text-ink/60 mt-1">
                                    {breakdown.counts[tier]} {breakdown.counts[tier] === 1 ? "day" : "days"}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {estimate !== null && (
                          <div className="mb-5 rounded-xl border-2 border-dashed border-teal/40 bg-teal/5 p-4">
                            <div className="font-body text-sm text-ink/70">
                              Your trip ·{" "}
                              {breakdown!.tiers
                                .map((tier) => `${breakdown!.counts[tier]} × ${formatINR(tierPrice(category, tier))}`)
                                .join(" + ")}
                            </div>
                            <div className="font-display text-2xl text-teal font-bold">
                              ≈ {formatINR(estimate)}
                            </div>
                            <div className="font-body text-[11px] text-ink/50 mt-1">
                              Indicative total — the exact figure depends on your itinerary and running.
                            </div>
                          </div>
                        )}

                        {/* Both CTAs route to WhatsApp — the standard booking flow
                            (useBookingStore) only supports 'tour' | 'transfer'
                            entries and has no multi-day-rental contract, so a
                            "/booking" link would drop visitors on a blank Step 1
                            with no context. */}
                        <div className="flex flex-wrap gap-3">
                          <a
                            href={buildWhatsappLink(whatsappNumber, whatsappMessage)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 bg-teal text-white px-6 py-3 rounded-xl font-bold border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all"
                          >
                            <MessageCircle className="w-5 h-5" />
                            Book Now via WhatsApp
                          </a>
                          <a
                            href={buildWhatsappLink(whatsappNumber, whatsappMessage)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Chat on WhatsApp"
                            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center bg-[#25d366] text-white rounded-xl border-3 border-ink shadow-retro-sm hover:shadow-retro transition-all"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Note */}
        {pageData.pricing_note_text && (
          <div className="mt-8 text-center">
            <p className="text-sm text-ink/60 italic font-body">ℹ️ {pageData.pricing_note_text}</p>
          </div>
        )}
      </div>
    </section>
  );
}
