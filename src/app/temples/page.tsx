import Link from "next/link";
import { Metadata } from "next";
import { Header, Footer, Badge } from "@/components/ui";
import { Church, MapPin, Star, ArrowRight, Navigation, Sparkles } from "lucide-react";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { getTempleCategoriesWithTemples, getTemplesPageConfig } from "@/lib/supabase/queries_enhanced";
import { DEFAULT_TEMPLES_PAGE_CONFIG } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Sacred Temples of Kumaon | Nainital Taxi Services",
  description: "Explore 30+ sacred temples across Kumaon region including Nainital, Almora, Champawat. Book comfortable taxi services for your spiritual journey.",
  keywords: "Kumaon temples, Nainital temples, spiritual tourism, temple taxi service, Uttarakhand pilgrimage",
};

// Icon mapping for categories
const getCategoryIcon = (iconName: string) => {
  const icons: Record<string, string> = {
    om: "🕉️",
    shiva: "🔱",
    shakti: "🌺",
    temple: "🛕",
    lotus: "🪷",
    mountain: "⛰️",
    star: "⭐",
    heritage: "🏛️",
    custom: "✨",
  };
  return icons[iconName] || "🛕";
};

export default async function TemplesPage() {
  const categories = await getTempleCategoriesWithTemples();
  const pageConfig = await getTemplesPageConfig();

  // Use page config or defaults
  const config = pageConfig || DEFAULT_TEMPLES_PAGE_CONFIG;

  return (
    <>
      <Header />
      <FloatingWhatsApp />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 bg-gradient-to-b from-sunshine/20 via-coral/10 to-transparent">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-sunshine/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-10 w-32 h-32 bg-coral/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-sunshine/30 px-4 py-2 rounded-full mb-6 border-2 border-ink/10">
            <Church className="w-5 h-5 text-ink" />
            <span className="font-body text-sm text-ink font-semibold">
              {config.hero_badge || "30+ Sacred Sites"}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display text-ink mb-6">
            {config.hero_title || "Sacred Temples of Kumaon"}
          </h1>

          <p className="text-lg md:text-xl font-body text-ink/70 max-w-2xl mx-auto">
            {config.hero_subtitle || "Discover divine destinations across 6 districts with comfortable taxi services"}
          </p>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-8">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-sunshine/20 rounded-full flex items-center justify-center border-2 border-sunshine">
                <Church className="w-6 h-6 text-sunshine" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-display text-ink">30+</div>
                <div className="text-sm text-ink/60 font-body">Sacred Sites</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-lake/20 rounded-full flex items-center justify-center border-2 border-lake">
                <MapPin className="w-6 h-6 text-lake" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-display text-ink">6</div>
                <div className="text-sm text-ink/60 font-body">Districts</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-coral/20 rounded-full flex items-center justify-center border-2 border-coral">
                <Navigation className="w-6 h-6 text-coral" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-display text-ink">24/7</div>
                <div className="text-sm text-ink/60 font-body">Taxi Service</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation (Sticky) */}
      {config.show_category_navigation && categories.length > 0 && (
        <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-sm border-b-3 border-ink shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
              <span className="text-sm font-body text-ink/60 whitespace-nowrap">
                Jump to:
              </span>
              <div className="flex gap-2">
                {categories.map((category) => (
                  <a
                    key={category.id}
                    href={`#${category.category_slug}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-ink/5 hover:bg-sunshine/30 border-2 border-ink rounded-full font-body text-sm text-ink whitespace-nowrap transition-all hover:scale-105"
                  >
                    <span className="text-lg">{getCategoryIcon(category.icon)}</span>
                    {category.category_name}
                    <span className="text-xs bg-ink/10 px-2 py-0.5 rounded-full">
                      {category.temples?.length || 0}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar (Client-side filtering) */}
      {config.enable_search || config.enable_district_filter || config.enable_type_filter ? (
        <section className="py-6 px-4 bg-gradient-to-b from-lake/5 to-transparent">
          <div className="container mx-auto">
            <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                {config.enable_search && (
                  <div className="flex-1">
                    <input
                      type="text"
                      id="temple-search"
                      placeholder="Search temples by name..."
                      className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                    />
                  </div>
                )}

                {/* District Filter */}
                {config.enable_district_filter && (
                  <div className="md:w-64">
                    <select
                      id="district-filter"
                      className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                    >
                      <option value="">All Districts</option>
                      <option value="Nainital">Nainital</option>
                      <option value="Almora">Almora</option>
                      <option value="Champawat">Champawat</option>
                      <option value="Bageshwar">Bageshwar</option>
                      <option value="Pithoragarh">Pithoragarh</option>
                      <option value="Udham Singh Nagar">Udham Singh Nagar</option>
                    </select>
                  </div>
                )}

                {/* Type Filter */}
                {config.enable_type_filter && (
                  <div className="md:w-64">
                    <select
                      id="type-filter"
                      className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                    >
                      <option value="">All Types</option>
                      <option value="Shiva">Shiva</option>
                      <option value="Shakti">Shakti</option>
                      <option value="Ashram">Ashram</option>
                      <option value="Heritage">Heritage</option>
                      <option value="Local">Local</option>
                      <option value="Pilgrimage">Pilgrimage</option>
                    </select>
                  </div>
                )}

                {/* Reset Button */}
                <button
                  id="reset-filters"
                  className="px-6 py-3 bg-coral/10 border-3 border-coral text-coral rounded-xl font-body font-semibold hover:bg-coral hover:text-white transition-colors"
                >
                  Reset
                </button>
              </div>

              {/* Results count */}
              <div className="mt-4 text-sm text-ink/60 font-body">
                <span id="results-count"></span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Introduction Text */}
      {config.intro_text && (
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-3xl">
            <p className="text-lg font-body text-ink/70 text-center leading-relaxed">
              {config.intro_text}
            </p>
          </div>
        </section>
      )}

      {/* Category Sections with Temples */}
      {categories.length === 0 ? (
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <Church className="w-16 h-16 text-ink/20 mx-auto mb-4" />
            <h3 className="text-2xl font-display text-ink mb-2">
              No temples available yet
            </h3>
            <p className="text-ink/60 font-body">
              Check back soon for sacred destinations across Kumaon
            </p>
          </div>
        </section>
      ) : (
        <div>
          {categories.map((category, categoryIndex) => (
            <section
              key={category.id}
              id={category.category_slug}
              className={`py-16 px-4 category-section ${
                categoryIndex % 2 === 0 ? "bg-white" : "bg-gradient-to-b from-ink/2 to-white"
              }`}
            >
              <div className="container mx-auto">
                {/* Category Header */}
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <span className="text-5xl">{getCategoryIcon(category.icon)}</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-display text-ink mb-3">
                    {category.category_name}
                  </h2>
                  {category.category_description && (
                    <p className="text-lg text-ink/70 font-body max-w-2xl mx-auto">
                      {category.category_description}
                    </p>
                  )}
                </div>

                {/* Temples Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {category.temples.map((temple) => (
                    <Link
                      key={temple.id}
                      href={`/temples/${temple.slug}`}
                      data-district={temple.district}
                      data-temple-type={temple.temple_type}
                      className="temple-card"
                    >
                      <div className="bg-white rounded-2xl border-3 border-ink shadow-retro hover:shadow-retro-lg transition-all overflow-hidden group h-full flex flex-col">
                        {/* Image */}
                        <div className="h-56 relative overflow-hidden">
                          {temple.featured_image_url ? (
                            <img
                              src={temple.featured_image_url}
                              alt={temple.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-sunshine/30 to-coral/10 flex items-center justify-center">
                              <Church className="w-16 h-16 text-ink/20" />
                            </div>
                          )}

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />

                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex gap-2">
                            <Badge className="flex items-center gap-1 bg-lake/90 border-lake text-white">
                              <MapPin className="w-3 h-3" />
                              {temple.district}
                            </Badge>
                          </div>

                          <div className="absolute top-3 right-3">
                            {temple.is_featured && (
                              <Badge className="flex items-center gap-1 bg-sunshine/90 border-sunshine text-ink">
                                <Star className="w-3 h-3" />
                                Featured
                              </Badge>
                            )}
                          </div>

                          {/* Temple Type */}
                          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-body text-ink border-2 border-ink">
                            {temple.temple_type}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-grow flex flex-col">
                          <h3 className="font-display text-2xl text-ink mb-2 group-hover:text-coral transition-colors">
                            {temple.name}
                          </h3>

                          {temple.subtitle && (
                            <p className="font-body text-sm text-ink/60 mb-4">
                              {temple.subtitle}
                            </p>
                          )}

                          {/* Highlights */}
                          {temple.highlights && temple.highlights.length > 0 && (
                            <ul className="space-y-2 mb-4 flex-grow">
                              {temple.highlights.slice(0, 3).map((highlight, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-ink/70 font-body">
                                  <Sparkles className="w-4 h-4 text-sunshine flex-shrink-0 mt-0.5" />
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Distance */}
                          {temple.distance_from_nainital && (
                            <div className="flex items-center gap-2 text-sm text-ink/60 mb-4">
                              <Navigation className="w-4 h-4" />
                              <span>{temple.distance_from_nainital} km from Nainital</span>
                            </div>
                          )}

                          {/* CTA */}
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-ink/10">
                            <span className="text-sm text-ink/50 font-body">Explore Temple</span>
                            <div className="inline-flex items-center gap-1 px-4 py-2 bg-lake text-white rounded-xl border-3 border-ink shadow-retro-sm group-hover:shadow-none group-hover:translate-x-[2px] group-hover:translate-y-[2px] transition-all">
                              <span className="text-sm font-body font-semibold">Visit</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Category Footer */}
                <div className="text-center mt-8">
                  <p className="text-sm text-ink/40 font-body">
                    {category.temples.length} {category.temples.length === 1 ? "temple" : "temples"} in this category
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Additional Info Section */}
      {config.additional_info && config.additional_info.length > 0 && (
        <section className="py-16 px-4 bg-gradient-to-b from-sunshine/10 to-white">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {config.additional_info.map((info, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-white rounded-full border-3 border-ink shadow-retro flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">{info.icon}</span>
                  </div>
                  <h3 className="font-display text-xl text-ink mb-2">{info.title}</h3>
                  <p className="font-body text-ink/70">{info.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      {config.bottom_cta && (
        <section className="py-16 px-4 bg-gradient-to-br from-ink to-ink/95">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display text-white mb-4">
              {config.bottom_cta.heading || "Plan Your Spiritual Journey"}
            </h2>
            <p className="text-lg text-white/80 font-body mb-8 max-w-2xl mx-auto">
              {config.bottom_cta.subheading || "Book comfortable taxi services for your temple visits across Kumaon"}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {config.bottom_cta.primaryButtonText && (
                <a
                  href={config.bottom_cta.primaryButtonLink || "https://wa.me/918445206116"}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-whatsapp text-white rounded-xl border-3 border-white shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-body font-semibold"
                >
                  {config.bottom_cta.primaryButtonText}
                  <ArrowRight className="w-5 h-5" />
                </a>
              )}
              {config.bottom_cta.secondaryButtonText && (
                <a
                  href="tel:+918445206116"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-ink rounded-xl border-3 border-white shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all font-body font-semibold"
                >
                  {config.bottom_cta.secondaryButtonText}
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQs Section */}
      {config.page_faqs && config.page_faqs.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-display text-ink text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {config.page_faqs.map((faq, index) => (
                <details
                  key={index}
                  className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro group"
                >
                  <summary className="font-display text-lg text-ink cursor-pointer list-none flex items-center justify-between">
                    {faq.question}
                    <span className="text-2xl group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-4 font-body text-ink/70 leading-relaxed">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Client-side Filter Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const searchInput = document.getElementById('temple-search');
              const districtFilter = document.getElementById('district-filter');
              const typeFilter = document.getElementById('type-filter');
              const resetButton = document.getElementById('reset-filters');
              const resultsCount = document.getElementById('results-count');
              const templeCards = document.querySelectorAll('.temple-card');
              const categorySections = document.querySelectorAll('.category-section');

              function filterTemples() {
                const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
                const selectedDistrict = districtFilter ? districtFilter.value : '';
                const selectedType = typeFilter ? typeFilter.value : '';

                let visibleCount = 0;

                templeCards.forEach(card => {
                  const templeName = card.querySelector('h3').textContent.toLowerCase();
                  const templeSubtitle = card.querySelector('p')?.textContent.toLowerCase() || '';
                  const district = card.getAttribute('data-district');
                  const type = card.getAttribute('data-temple-type');

                  const matchesSearch = !searchTerm || templeName.includes(searchTerm) || templeSubtitle.includes(searchTerm);
                  const matchesDistrict = !selectedDistrict || district === selectedDistrict;
                  const matchesType = !selectedType || type === selectedType;

                  if (matchesSearch && matchesDistrict && matchesType) {
                    card.style.display = 'block';
                    visibleCount++;
                  } else {
                    card.style.display = 'none';
                  }
                });

                // Show/hide category sections based on visible cards
                categorySections.forEach(section => {
                  const visibleCards = section.querySelectorAll('.temple-card[style="display: block;"]');
                  if (visibleCards.length === 0) {
                    section.style.display = 'none';
                  } else {
                    section.style.display = 'block';
                  }
                });

                if (resultsCount) {
                  resultsCount.textContent = visibleCount + ' temple' + (visibleCount !== 1 ? 's' : '') + ' found';
                }
              }

              if (searchInput) searchInput.addEventListener('input', filterTemples);
              if (districtFilter) districtFilter.addEventListener('change', filterTemples);
              if (typeFilter) typeFilter.addEventListener('change', filterTemples);

              if (resetButton) {
                resetButton.addEventListener('click', () => {
                  if (searchInput) searchInput.value = '';
                  if (districtFilter) districtFilter.value = '';
                  if (typeFilter) typeFilter.value = '';
                  filterTemples();
                });
              }

              // Initial count
              filterTemples();
            })();
          `,
        }}
      />

      <Footer />
    </>
  );
}
