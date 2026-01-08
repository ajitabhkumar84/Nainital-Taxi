import React from "react";
import { Star, Check, X, Phone, MessageCircle } from "lucide-react";
import { MultiDayRentalPage } from "@/lib/supabase/types";
import { Metadata } from "next";

async function getPageData(): Promise<MultiDayRentalPage | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/multi-day-rental`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error fetching multi-day rental page:', error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const pageData = await getPageData();

  return {
    title: pageData?.seo_title || 'Multi-Day Car Rental | Nainital Taxi',
    description: pageData?.seo_description || 'Book multi-day car rentals for Uttarakhand tours',
    keywords: pageData?.seo_keywords || 'multi-day rental, Uttarakhand tour, taxi booking',
  };
}

export default async function MultiDayRentalPage() {
  const pageData = await getPageData();

  if (!pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-display text-ink mb-4">Page Not Available</h1>
          <p className="text-ink/70">The multi-day rental page is currently being configured.</p>
        </div>
      </div>
    );
  }

  const whatsappNumber = '918445206116'; // You can make this dynamic from site settings
  const baseWhatsappUrl = `https://wa.me/${whatsappNumber}`;

  return (
    <main className="min-h-screen bg-sunrise">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal via-teal/90 to-teal/80 text-white overflow-hidden min-h-[65vh]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-black rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
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
              <div className="hidden lg:block">
                <div className="relative">
                  <img
                    src={pageData.hero_image_url}
                    alt="Taxi for complete tour in Uttarakhand"
                    className="rounded-2xl shadow-2xl w-full border-3 border-ink"
                    loading="eager"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-table" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display text-ink mb-4">
              {pageData.pricing_heading}
            </h2>
            <p className="text-lg md:text-xl text-ink/70 max-w-3xl mx-auto font-body">
              {pageData.pricing_subheading}
            </p>
          </div>

          {/* Season Legend */}
          <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
            <div className="bg-teal/10 border-3 border-teal rounded-xl p-4 text-center">
              <div className="font-bold text-teal mb-1 font-display">{pageData.pricing_season_label}</div>
              {pageData.pricing_season_date_ranges && pageData.pricing_season_date_ranges.length > 0 && (
                <div className="text-xs text-ink/60 space-y-0.5 font-body">
                  {pageData.pricing_season_date_ranges.map((range, i) => (
                    <div key={i}>{range}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-gray-50 border-3 border-gray-300 rounded-xl p-4 text-center">
              <div className="font-bold text-gray-700 mb-1 font-display">{pageData.pricing_mid_season_label}</div>
              {pageData.pricing_mid_season_date_ranges && pageData.pricing_mid_season_date_ranges.length > 0 && (
                <div className="text-xs text-ink/60 space-y-0.5 font-body">
                  {pageData.pricing_mid_season_date_ranges.map((range, i) => (
                    <div key={i}>{range}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-green-50 border-3 border-green-400 rounded-xl p-4 text-center">
              <div className="font-bold text-green-700 mb-1 font-display">{pageData.pricing_off_season_label}</div>
              {pageData.pricing_off_season_date_ranges && pageData.pricing_off_season_date_ranges.length > 0 && (
                <div className="text-xs text-ink/60 space-y-0.5 font-body">
                  {pageData.pricing_off_season_date_ranges.map((range, i) => (
                    <div key={i}>{range}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="space-y-6">
            {pageData.car_categories?.sort((a, b) => a.order - b.order).map((category, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl ${
                  category.is_popular ? 'shadow-retro hover:shadow-retro-lg' : 'shadow-retro-sm hover:shadow-retro'
                } transition-all duration-300 border-3 ${
                  category.is_popular ? 'border-yellow' : 'border-ink'
                } overflow-hidden ${category.is_popular ? 'relative' : ''}`}
              >
                {category.is_popular && (
                  <div className="absolute -top-3 right-6 bg-coral text-white px-4 py-1 rounded-full text-sm font-bold border-2 border-ink shadow-retro-sm z-10">
                    ⭐ POPULAR
                  </div>
                )}
                <div
                  className={`${
                    category.is_popular ? 'bg-gradient-to-r from-yellow/20 to-yellow/10' : 'bg-gradient-to-r from-gray-100 to-gray-50'
                  } px-6 py-4 border-b-3 ${category.is_popular ? 'border-yellow' : 'border-ink/20'} flex items-center justify-between`}
                >
                  <div>
                    <h3 className="text-xl md:text-2xl font-display text-ink">{category.name}</h3>
                    <p className={`text-sm mt-1 font-body ${category.is_popular ? 'text-ink/70 font-medium' : 'text-ink/60'}`}>
                      {category.vehicles}
                    </p>
                  </div>
                  {category.image_url && (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="hidden md:block w-24 h-16 object-cover rounded-lg border-2 border-ink"
                    />
                  )}
                </div>
                <div className={`p-6 ${category.is_popular ? 'bg-yellow/5' : ''}`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div
                      className={`text-center p-4 rounded-xl ${
                        category.is_popular ? 'bg-teal/20 border-3 border-teal' : 'bg-teal/10 border-2 border-teal/30'
                      }`}
                    >
                      <div className={`text-xs font-semibold mb-1 font-body ${category.is_popular ? 'text-teal' : 'text-teal/80'}`}>
                        {pageData.pricing_season_label.toUpperCase()}
                      </div>
                      <div className={`text-3xl font-bold font-display ${category.is_popular ? 'text-teal' : 'text-teal/90'}`}>
                        ₹{category.season_price.toLocaleString()}
                      </div>
                      <div className={`text-xs mt-1 font-body ${category.is_popular ? 'text-ink/60' : 'text-ink/50'}`}>per day</div>
                    </div>
                    <div
                      className={`text-center p-4 rounded-xl ${
                        category.is_popular ? 'bg-gray-100 border-3 border-gray-300' : 'bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      <div className={`text-xs font-semibold mb-1 font-body ${category.is_popular ? 'text-gray-700' : 'text-gray-600'}`}>
                        {pageData.pricing_mid_season_label.toUpperCase()}
                      </div>
                      <div className={`text-3xl font-bold font-display ${category.is_popular ? 'text-gray-700' : 'text-gray-600'}`}>
                        ₹{category.mid_season_price.toLocaleString()}
                      </div>
                      <div className={`text-xs mt-1 font-body ${category.is_popular ? 'text-ink/60' : 'text-ink/50'}`}>per day</div>
                    </div>
                    <div
                      className={`text-center p-4 rounded-xl ${
                        category.is_popular ? 'bg-green-100 border-3 border-green-400' : 'bg-green-50 border-2 border-green-200'
                      }`}
                    >
                      <div className={`text-xs font-semibold mb-1 font-body ${category.is_popular ? 'text-green-700' : 'text-green-600'}`}>
                        {pageData.pricing_off_season_label.toUpperCase()}
                      </div>
                      <div className={`text-3xl font-bold font-display ${category.is_popular ? 'text-green-700' : 'text-green-600'}`}>
                        ₹{category.off_season_price.toLocaleString()}
                      </div>
                      <div className={`text-xs mt-1 font-body ${category.is_popular ? 'text-ink/60' : 'text-ink/50'}`}>per day</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Note */}
          {pageData.pricing_note_text && (
            <div className="mt-8 text-center">
              <p className="text-sm text-ink/60 italic font-body">
                ℹ️ {pageData.pricing_note_text}
              </p>
            </div>
          )}
        </div>
      </section>

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

      {/* Tour Duration Packages Section */}
      <section id="packages" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display text-ink mb-4">
              {pageData.packages_heading}
            </h2>
            <p className="text-lg md:text-xl text-ink/70 max-w-3xl mx-auto font-body">
              {pageData.packages_subheading}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[pageData.package_1, pageData.package_2, pageData.package_3, pageData.package_4].map((pkg, index) => (
              <div
                key={index}
                className={`${
                  pkg.is_custom_package
                    ? 'bg-gradient-to-br from-ink to-ink/90 border-3 border-ink text-white'
                    : pkg.is_popular
                    ? 'bg-gradient-to-br from-yellow/10 to-white border-3 border-yellow relative'
                    : 'bg-gradient-to-br from-gray-50 to-white border-3 border-ink/20'
                } rounded-2xl p-6 ${
                  pkg.is_popular ? 'hover:shadow-retro-lg' : 'hover:shadow-retro'
                } transition-all duration-300 ${pkg.is_popular ? 'transform hover:-translate-y-1' : ''}`}
              >
                {pkg.is_popular && !pkg.is_custom_package && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-coral text-white px-4 py-1 rounded-full text-sm font-bold border-2 border-ink">
                    POPULAR
                  </div>
                )}
                <div className="text-center mb-6">
                  <div className={`${pkg.is_custom_package ? 'text-yellow' : 'text-teal'} font-semibold text-sm mb-2 font-body`}>
                    {pkg.badge}
                  </div>
                  <div className="text-4xl font-bold mb-2 font-display">{pkg.duration}</div>
                  <div className={pkg.is_custom_package ? 'text-gray-300' : 'text-ink/60'}>{pkg.subtitle}</div>
                </div>
                <ul className="space-y-3 mb-6">
                  {pkg.features?.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2">
                      <Check
                        className={`w-5 h-5 ${pkg.is_custom_package ? 'text-yellow' : 'text-teal'} mt-0.5 flex-shrink-0`}
                      />
                      <span className={`${pkg.is_custom_package ? 'text-gray-200' : 'text-ink/70'} ${feature.is_bold ? 'font-semibold' : ''} font-body text-sm`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <a
                    href={`${baseWhatsappUrl}?text=${encodeURIComponent(pkg.whatsapp_message)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 bg-[#25d366] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#1fb855] transition-colors text-sm border-2 border-ink"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      {pageData.faqs && pageData.faqs.length > 0 && (
        <section className="py-16 lg:py-20 bg-lake">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display text-ink mb-4">
                {pageData.faq_heading}
              </h2>
              <p className="text-lg text-ink/70 font-body">
                {pageData.faq_subheading}
              </p>
            </div>

            <div className="space-y-4">
              {pageData.faqs.map((faq, index) => (
                <details key={index} className="group bg-white rounded-xl overflow-hidden border-3 border-ink/20 hover:border-teal transition-colors">
                  <summary className="flex items-center justify-between p-6 cursor-pointer font-semibold text-ink hover:text-teal font-body">
                    <span>{faq.question}</span>
                    <svg className="w-5 h-5 text-ink/50 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 text-ink/60 font-body">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
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
