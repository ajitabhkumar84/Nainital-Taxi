import React from "react";
import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui";
import HeaderServer from "@/components/ui/HeaderServer";
import FooterServer from "@/components/ui/FooterServer";
import {
  Building2, Users, Shield, FileCheck, MessageCircle, Phone,
  Download, CheckCircle, Star, TrendingUp, Clock, Award,
  Mail, MapPin, IndianRupee, Car, Calendar
} from "lucide-react";
import Link from "next/link";
import { B2BPageConfig, DEFAULT_B2B_CONFIG } from "@/lib/supabase/types";
import { SITE_URL } from "@/lib/siteUrl";
import Image from "next/image";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getB2BConfig(): Promise<B2BPageConfig> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "b2b_page_config")
    .single();

  if (error || !data?.value) {
    return DEFAULT_B2B_CONFIG;
  }

  try {
    const config = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
    return { ...DEFAULT_B2B_CONFIG, ...config };
  } catch {
    return DEFAULT_B2B_CONFIG;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getB2BConfig();

  return {
    title: config.meta_title || "B2B Partnership | Tour Operator Services | Nainital Taxi",
    description: config.meta_description || "Partner with Nainital's most reliable taxi service. Competitive rates for tour operators.",
    alternates: {
      canonical: `${SITE_URL}/b2b`,
    },
  };
}

export default async function B2BPage() {
  const config = await getB2BConfig();

  return (
    <>
      <HeaderServer />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-ink via-teal to-lake text-white pt-32 pb-20">
          <div className="absolute inset-0 bg-[url('/patterns/dots.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-block bg-white/20 backdrop-blur px-6 py-2 rounded-full border-2 border-white/30 mb-6">
                <span className="text-sm font-body font-bold">
                  🤝 {config.hero_subtitle}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display mb-6 leading-tight">
                {config.hero_title}
              </h1>
              <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-3xl mx-auto">
                {config.hero_description}
              </p>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-10">
                <div className="bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl p-6">
                  <div className="text-4xl font-display mb-2">{config.years_experience}</div>
                  <div className="text-sm font-body text-white/80">Years Experience</div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl p-6">
                  <div className="text-4xl font-display mb-2">{config.satisfied_operators}</div>
                  <div className="text-sm font-body text-white/80">Tour Partners</div>
                </div>
                <div className="bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-2xl p-6">
                  <div className="text-4xl font-display mb-2">{config.monthly_trips}</div>
                  <div className="text-sm font-body text-white/80">Monthly Trips</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="#partnership-form">
                  <Button variant="primary" size="lg" className="bg-white text-ink hover:bg-white/90">
                    <Building2 className="w-5 h-5 mr-2" />
                    {config.hero_cta_text}
                  </Button>
                </a>
                {config.rate_card_pdf_url && (
                  <a href={config.rate_card_pdf_url} download>
                    <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                      <Download className="w-5 h-5 mr-2" />
                      {config.hero_cta_secondary_text}
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Company Info Bar */}
        <section className="bg-gradient-to-r from-lake/20 to-teal/20 border-y-3 border-ink py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm font-body">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal" />
                <span className="font-bold text-ink">GST: {config.gst_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal" />
                <span className="text-ink">{config.company_address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-teal" />
                <span className="text-ink">{config.total_vehicles} Vehicle Fleet</span>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-gradient-to-br from-white to-lake/5">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
                  {config.benefits_section_title}
                </h2>
                <p className="text-xl text-ink/70 font-body max-w-2xl mx-auto">
                  Built specifically for tour operators who need reliability and transparency
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {config.benefits.sort((a, b) => a.order - b.order).map((benefit, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-8 hover:shadow-retro-xl transition-shadow"
                  >
                    <div className="text-5xl mb-4">{benefit.icon}</div>
                    <h3 className="text-2xl font-display text-ink mb-3">{benefit.title}</h3>
                    <p className="text-ink/70 font-body">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Fleet Showcase */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
                  Our Fleet
                </h2>
                <p className="text-xl text-ink/70 font-body">
                  Well-maintained vehicles with verified, professional drivers
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {config.fleet_items.sort((a, b) => a.order - b.order).map((vehicle, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-white to-lake/10 rounded-2xl border-3 border-ink shadow-retro-lg overflow-hidden"
                  >
                    {vehicle.image_url && (
                      <Image
                        src={vehicle.image_url}
                        alt={vehicle.vehicle_name}
                        width={640}
                        height={192}
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-2xl font-display text-ink mb-2">{vehicle.vehicle_name}</h3>
                      <div className="space-y-2 text-sm font-body text-ink/70">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-teal" />
                          <span>{vehicle.capacity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-teal" />
                          <span>Model: {vehicle.model_year}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-teal" />
                          <span>{vehicle.ac_status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-20 bg-gradient-to-br from-sunrise/20 via-white to-lake/20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
                  {config.pricing_section_title}
                </h2>
                <p className="text-xl text-ink/70 font-body max-w-2xl mx-auto">
                  {config.pricing_section_description}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {config.pricing_tiers.sort((a, b) => a.order - b.order).map((tier, index) => (
                  <div
                    key={index}
                    className={`bg-white rounded-2xl border-3 border-ink shadow-retro-lg overflow-hidden ${
                      tier.is_featured ? 'ring-4 ring-teal transform scale-105' : ''
                    }`}
                  >
                    {tier.is_featured && (
                      <div className="bg-gradient-to-r from-teal to-lake text-white text-center py-2 font-body font-bold text-sm">
                        ⭐ MOST POPULAR
                      </div>
                    )}
                    <div className="p-8">
                      <h3 className="text-3xl font-display text-ink mb-2">{tier.name}</h3>
                      <p className="text-sm text-ink/60 font-body mb-6">For tour operators with</p>

                      <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="w-5 h-5 text-teal shrink-0 mt-1" />
                          <div>
                            <div className="font-body font-bold text-ink">{tier.monthly_volume}</div>
                            <div className="text-xs text-ink/60">Monthly volume</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <IndianRupee className="w-5 h-5 text-teal shrink-0 mt-1" />
                          <div>
                            <div className="font-body font-bold text-ink">{tier.discount}</div>
                            <div className="text-xs text-ink/60">Discount on retail</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-teal shrink-0 mt-1" />
                          <div>
                            <div className="font-body font-bold text-ink">{tier.payment_terms}</div>
                            <div className="text-xs text-ink/60">Payment terms</div>
                          </div>
                        </div>
                      </div>

                      <a href="#partnership-form">
                        <Button
                          variant={tier.is_featured ? 'primary' : 'outline'}
                          className="w-full"
                        >
                          Choose {tier.name}
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-8">
                <div className="flex items-start gap-4">
                  <Shield className="w-8 h-8 text-teal shrink-0" />
                  <div>
                    <h4 className="text-xl font-display text-ink mb-2">Margin Protection Policy</h4>
                    <p className="text-ink/70 font-body">
                      We never exceed 18-20% discount to protect your margins. Our operators typically add 20-40% markup,
                      ensuring profitable partnerships for everyone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Service Area */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-display text-ink mb-6">
                Complete Service Coverage
              </h2>
              <p className="text-xl text-ink/70 font-body mb-8">
                {config.service_area_description}
              </p>
              <div className="bg-gradient-to-br from-teal/10 to-lake/10 rounded-2xl border-2 border-ink p-8">
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div>
                    <h4 className="font-display text-lg text-ink mb-3">Popular Routes</h4>
                    <ul className="space-y-2 font-body text-ink/70">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal" />
                        Kathgodam - Nainital
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal" />
                        Delhi - Nainital
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal" />
                        Pantnagar Airport - Nainital
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal" />
                        Nainital Local Sightseeing
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-display text-lg text-ink mb-3">Tour Packages</h4>
                    <ul className="space-y-2 font-body text-ink/70">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal" />
                        Multi-day Nainital tours
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal" />
                        Bhimtal, Naukuchiatal circuits
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal" />
                        Temple tours (Kainchi Dham, etc.)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal" />
                        Custom itineraries
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        {config.testimonials.length > 0 && (
          <section className="py-20 bg-gradient-to-br from-lake/10 to-teal/10">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
                    {config.testimonials_section_title}
                  </h2>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {config.testimonials.sort((a, b) => a.order - b.order).map((testimonial, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-6"
                    >
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-sunshine text-sunshine" />
                        ))}
                      </div>
                      <p className="text-ink/80 font-body mb-4 italic">&quot;{testimonial.testimonial}&quot;</p>
                      <div className="border-t-2 border-ink/10 pt-4">
                        <div className="font-body font-bold text-ink">{testimonial.person_name}</div>
                        <div className="text-sm text-ink/60">{testimonial.designation}</div>
                        <div className="text-sm text-teal font-bold mt-1">{testimonial.company_name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Partnership Form */}
        <section id="partnership-form" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-display text-ink mb-4">
                  {config.form_title}
                </h2>
                <p className="text-xl text-ink/70 font-body">
                  {config.form_description}
                </p>
              </div>

              <div className="bg-gradient-to-br from-white to-lake/10 rounded-2xl border-3 border-ink shadow-retro-xl p-8">
                <form className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-body font-bold text-ink mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
                        placeholder="Your travel company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body font-bold text-ink mb-2">
                        Contact Person *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-body font-bold text-ink mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-body font-bold text-ink mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
                        placeholder="your@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-body font-bold text-ink mb-2">
                      Estimated Monthly Volume
                    </label>
                    <select className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal">
                      <option>5-15 trips per month</option>
                      <option>15-40 trips per month</option>
                      <option>40+ trips per month</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-body font-bold text-ink mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
                      placeholder="Tell us about your business and requirements..."
                    ></textarea>
                  </div>

                  <Button type="submit" variant="primary" size="lg" className="w-full">
                    <Building2 className="w-5 h-5 mr-2" />
                    Submit Partnership Request
                  </Button>
                </form>

                <div className="mt-8 pt-8 border-t-2 border-ink/10">
                  <p className="text-center text-sm text-ink/60 font-body mb-4">
                    Or reach out directly to our B2B team
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <a href={`tel:${config.contact_phone}`}>
                      <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Now
                      </Button>
                    </a>
                    <a
                      href={`https://wa.me/${config.contact_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                        'Hi! I am interested in B2B partnership with Nainital Taxi for my tour business.'
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    </a>
                    <a href={`mailto:${config.contact_email}`}>
                      <Button variant="outline" size="sm">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <FooterServer />
    </>
  );
}
