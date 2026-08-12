import { Metadata } from "next";
import Link from "next/link";
import { Header, Button } from "@/components/ui";
import FooterServer from "@/components/ui/FooterServer";
import { Phone } from "lucide-react";
import RouteBrowser from "@/components/rates/RouteBrowser";
import { getRoutesWithCategories } from "@/lib/supabase";
import { getOneWayTaxiSettings } from "@/lib/oneWayTaxi";

// Generate metadata for SEO — sourced from the admin-editable
// one_way_taxi_settings singleton (see src/lib/oneWayTaxi.ts) now that this
// page is server-rendered and can actually emit a real <title>/description.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getOneWayTaxiSettings();

  return {
    // `absolute` bypasses the root layout's "%s | Nainital Taxi" template —
    // seo_title is already the complete, brand-inclusive title (same
    // reasoning as the homepage's generateMetadata in src/app/page.tsx).
    title: { absolute: settings.seo_title },
    description: settings.seo_description,
    // Relative URL — resolved against metadataBase in src/app/layout.tsx, so
    // the production domain lives in exactly one place (see src/lib/siteUrl.ts).
    alternates: { canonical: "/rates" },
  };
}

export default async function RatesPage() {
  const [settings, { categories }] = await Promise.all([
    getOneWayTaxiSettings(),
    getRoutesWithCategories(),
  ]);

  const stats = [
    { value: settings.stat_1_value, label: settings.stat_1_label },
    { value: settings.stat_2_value, label: settings.stat_2_label },
    { value: settings.stat_3_value, label: settings.stat_3_label },
  ].filter((s) => s.value.trim() !== "" || s.label.trim() !== "");

  return (
    <>
      <Header />

      {/* Hero */}
      <div className="bg-lake border-b border-slate-200">
        <div className="container mx-auto max-w-[1200px] px-4 py-16 md:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-display font-semibold text-ink mb-4">
              {settings.hero_heading}
            </h1>
            <p className="text-base text-slate-500">
              {settings.hero_subheading}
            </p>
          </div>

          {stats.length > 0 && (
            <div className="mt-10 rounded-lg border border-slate-200 bg-white grid grid-cols-3 divide-x divide-slate-200 max-w-2xl overflow-hidden">
              {stats.map((stat, i) => (
                <div key={i} className="px-4 py-5 md:px-6 text-center">
                  <div className="text-2xl md:text-3xl font-display font-semibold text-ink tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Routes */}
      <div className="container mx-auto max-w-[1200px] px-4 py-12 md:py-16">
        <RouteBrowser categories={categories} />
      </div>

      {/* Closing CTA */}
      <div className="bg-lake border-t border-slate-200">
        <div className="container mx-auto max-w-[1200px] px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-display font-semibold text-ink mb-3">
              Can&apos;t find your route?
            </h2>
            <p className="text-base text-slate-500 mb-8">
              We offer custom routes and packages. Contact us for a personalized quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="whatsapp" size="md" asChild className="min-h-[44px]">
                <Link
                  href="https://wa.me/918445206116?text=Hi,%20I%20need%20a%20custom%20taxi%20route"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp Us
                </Link>
              </Button>
              <Button variant="outline" size="md" asChild className="min-h-[44px]">
                <Link href="tel:+918445206116">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <FooterServer />
    </>
  );
}
