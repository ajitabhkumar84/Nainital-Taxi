import React from "react";
import { Star, Check, X, Phone, MessageCircle, Shield } from "lucide-react";
import type { MultiDayRentalPage } from "@/lib/supabase/types";
import Badge from "@/components/ui/Badge";
import FAQAccordion from "@/components/ui/FAQAccordion";
import { SAFETY_ICON_MAP } from "@/lib/pillarIcons";
import { detectActiveSeasonTier } from "@/lib/seasonality";
import type { FeaturedPackagesData } from "@/lib/multiDayRental";
import MultiDayPricingSection, { type MultiDayPricingData } from "./MultiDayPricingSection";
import EnquiryCTA from "./EnquiryCTA";
import FeaturedPackagesSection from "./FeaturedPackagesSection";

const NO_FEATURED_PACKAGES: FeaturedPackagesData = { packages: [], minPrices: {} };

export default function MultiDayRentalPageContent({
  pageData,
  whatsappNumber,
  featuredPackages = NO_FEATURED_PACKAGES,
}: {
  pageData: MultiDayRentalPage | null;
  whatsappNumber: string;
  featuredPackages?: FeaturedPackagesData;
}) {
  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <h1 className="text-3xl font-display text-ink mb-4">Page Not Available</h1>
          <p className="text-ink/70">The multi-day rental page is currently being configured.</p>
        </div>
      </div>
    );
  }

  const baseWhatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`;
  // Resolved here, on the server, and handed to the (client) pricing section —
  // see the note on MultiDayPricingSection's initialActiveTier prop.
  const activeSeasonTier = detectActiveSeasonTier(pageData);

  const pricingData: MultiDayPricingData = {
    pricing_heading: pageData.pricing_heading,
    pricing_subheading: pageData.pricing_subheading,
    pricing_season_label: pageData.pricing_season_label,
    pricing_mid_season_label: pageData.pricing_mid_season_label,
    pricing_off_season_label: pageData.pricing_off_season_label,
    pricing_season_ranges: pageData.pricing_season_ranges,
    pricing_mid_season_ranges: pageData.pricing_mid_season_ranges,
    pricing_off_season_ranges: pageData.pricing_off_season_ranges,
    season_override: pageData.season_override,
    pricing_note_text: pageData.pricing_note_text,
    car_categories: pageData.car_categories,
  };

  return (
    <main className="min-h-screen bg-sunrise">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal via-teal/90 to-teal/80 text-white overflow-hidden min-h-[65vh]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-black rounded-full blur-3xl"></div>
        </div>

        {/* Top padding clears the fixed global Header the route renders above us. */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 lg:pt-32 lg:pb-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 order-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-semibold">
                <Star className="w-4 h-4 text-yellow" fill="currentColor" />
                {pageData.hero_badge}
              </div>

              {/* Headline */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display leading-tight">
                {pageData.hero_headline_line1}
                <span className="text-yellow block">{pageData.hero_headline_line2}</span>
                <span className="text-2xl md:text-3xl lg:text-4xl">{pageData.hero_headline_line3}</span>
              </h1>

              {/* Subheadline */}
              <p className="text-base md:text-lg text-white/90 leading-relaxed font-body">
                {pageData.hero_subheadline}
              </p>

              {/* Trust Badges */}
              {pageData.hero_trust_badges && pageData.hero_trust_badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pageData.hero_trust_badges.map((badge, index) => (
                    <Badge key={index} variant="secondary" size="md" className="bg-white/15 text-white border-white/30">
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <a
                  href="#pricing-table"
                  className="inline-flex items-center gap-2 bg-yellow text-ink px-6 py-3 rounded-xl font-bold border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all"
                >
                  <span>View Rates</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
                <a
                  href={`${baseWhatsappUrl}?text=${encodeURIComponent('Hi, I want to book a car for complete tour')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-ink px-6 py-3 rounded-xl font-bold border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all"
                >
                  <MessageCircle className="w-5 h-5 text-[#25d366]" />
                  <span>Quick Booking</span>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                {pageData.hero_trust_indicators?.map((indicator, index) => (
                  <div key={index}>
                    <div className="text-2xl md:text-3xl font-bold text-yellow">{indicator.number}</div>
                    <div className="text-xs text-white/80 font-body">{indicator.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            {pageData.hero_image_url && (
              <div className="order-2">
                <div className="relative">
                  <img
                    src={pageData.hero_image_url}
                    alt="Taxi for complete tour in Uttarakhand"
                    className="rounded-2xl shadow-2xl w-full border-3 border-ink max-h-52 object-cover lg:max-h-none"
                    loading="eager"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Safety Promise — floating gradient card, not a full-width block */}
      {pageData.safety_pillars && pageData.safety_pillars.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl p-8 lg:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-display text-white mb-2">{pageData.safety_heading}</h2>
              {pageData.safety_subheading && (
                <p className="text-white/70 font-body">{pageData.safety_subheading}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {pageData.safety_pillars.map((pillar, index) => {
                const Icon = SAFETY_ICON_MAP[pillar.icon] || Shield;
                return (
                  <div key={index} className="text-center">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-yellow" />
                    </div>
                    <h3 className="font-display text-white text-lg mb-1">{pillar.title}</h3>
                    <p className="text-white/60 text-sm font-body">{pillar.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section — client component: the rate checker needs local state */}
      <MultiDayPricingSection
        pageData={pricingData}
        whatsappNumber={whatsappNumber}
        initialActiveTier={activeSeasonTier}
      />

      {/* Inclusion/Exclusion Section */}
      <section className="py-16 lg:py-20 bg-lake">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display text-ink mb-4">
              {pageData.inclusion_exclusion_heading}
            </h2>
            <p className="text-lg text-ink/70 font-body">
              {pageData.inclusion_exclusion_subheading}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* What's INCLUDED */}
            <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-retro p-8 border-3 border-green-400">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center border-2 border-ink">
                  <Check className="w-7 h-7 text-white" strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-display text-ink">What&apos;s Included</h3>
              </div>

              <ul className="space-y-4">
                {pageData.items_included?.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-ink font-body">{item.title}</div>
                      <div className="text-sm text-ink/60 font-body">{item.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* What's EXCLUDED */}
            <div className="bg-gradient-to-br from-orange-50 to-white rounded-2xl shadow-retro p-8 border-3 border-coral">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-coral rounded-full flex items-center justify-center border-2 border-ink">
                  <X className="w-7 h-7 text-white" strokeWidth={3} />
                </div>
                <h3 className="text-2xl font-display text-ink">What&apos;s NOT Included</h3>
              </div>

              <ul className="space-y-4">
                {pageData.items_excluded?.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      <X className="w-6 h-6 text-coral" />
                    </div>
                    <div>
                      <div className="font-semibold text-ink font-body">{item.title}</div>
                      <div className="text-sm text-ink/60 font-body">{item.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Enquiry CTA — the conversion point right after the offer is understood */}
      <EnquiryCTA pageData={pageData} whatsappNumber={whatsappNumber} />

      {/* Featured Packages — admin-picked cross-sell. Replaces the removed
          "Choose Your Duration" section, whose columns are retained but unused. */}
      <FeaturedPackagesSection
        pageData={pageData}
        packages={featuredPackages.packages}
        minPrices={featuredPackages.minPrices}
      />

      {/* SEO Content & FAQs — 2-column desktop layout */}
      {(pageData.seo_content_body || (pageData.seo_content_highlights && pageData.seo_content_highlights.length > 0)) && (
        <section className="py-16 lg:py-20 bg-lake">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {pageData.seo_content_heading && (
              <h2 className="text-3xl md:text-4xl font-display text-ink mb-8 text-center">
                {pageData.seo_content_heading}
              </h2>
            )}
            <div className="grid lg:grid-cols-2 gap-10">
              {pageData.seo_content_body && (
                <div
                  className="prose-content text-ink/80 font-body [&_h2]:font-display [&_h2]:text-ink [&_h2]:text-xl [&_h2]:mb-2 [&_h2]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3"
                  dangerouslySetInnerHTML={{ __html: pageData.seo_content_body }}
                />
              )}
              {pageData.seo_content_highlights && pageData.seo_content_highlights.length > 0 && (
                <ul className="space-y-3 self-start">
                  {pageData.seo_content_highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-3 bg-white rounded-xl border-2 border-ink/10 p-4">
                      <Check className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
                      <span className="font-body text-ink/80">{highlight}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQs Section */}
      {pageData.faqs && pageData.faqs.length > 0 && (
        <section className="py-16 lg:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display text-ink mb-4">
                {pageData.faq_heading}
              </h2>
              <p className="text-lg text-ink/70 font-body">
                {pageData.faq_subheading}
              </p>
            </div>

            <FAQAccordion items={pageData.faqs} />
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-teal via-teal/90 to-teal/80 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display mb-6">
            {pageData.cta_heading}
          </h2>
          <p className="text-lg md:text-xl mb-8 text-white/90 font-body">
            {pageData.cta_description}
          </p>

          {pageData.cta_features && pageData.cta_features.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {pageData.cta_features.map((feature, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border-2 border-white/30">
                  <div className="text-2xl mb-2">✓</div>
                  <span className="font-semibold font-body">{feature.text}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href={`${baseWhatsappUrl}?text=${encodeURIComponent('Hi, I want to book a car for complete tour')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25d366] text-white px-8 py-4 rounded-xl font-bold border-3 border-ink shadow-retro hover:shadow-retro-lg transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Book on WhatsApp</span>
            </a>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-ink px-8 py-4 rounded-xl font-bold border-3 border-ink shadow-retro hover:shadow-retro-lg transition-all"
            >
              <Phone className="w-5 h-5" />
              <span>Contact Us</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
