import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui";
import HeaderServer from "@/components/ui/HeaderServer";
import FooterServer from "@/components/ui/FooterServer";
import { ChevronRight, Phone } from "lucide-react";
import RouteBrowser from "@/components/rates/RouteBrowser";
import { getRoutesWithCategories } from "@/lib/supabase";
import { getOneWayTaxiSettings } from "@/lib/oneWayTaxi";
import { routeDetailsHref } from "@/lib/routeLinks";
import { VEHICLE_ORDER, formatPrice, seasonNameForDate } from "@/lib/pricing";
import { WhatsAppCTA } from "@/components/analytics/ContactCTA";
import { CTA_PLACEMENTS } from "@/lib/analytics/properties";
import type { RouteWithCategory, RoutePricing } from "@/lib/supabase/types";

type RouteWithPricing = RouteWithCategory & { pricing?: RoutePricing[] };

/** How many routes the server-rendered "Popular fares" list shows. */
const HIGHLIGHT_COUNT = 8;

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

/**
 * Cheapest published fare on a route, for the server-rendered highlight list.
 *
 * Duplicates the shape of RateCalculator's priceFor()/cheapestFare() rather
 * than importing them: those live in a 'use client' module, and pulling a
 * client module into the server component would drag the whole calculator
 * into this file's module graph for two numbers. The rule is the same —
 * cheapest active row, preferring the season that applies today.
 */
function cheapestPublishedFare(route: RouteWithPricing, date: string): number | null {
  const seasonName = seasonNameForDate(date);
  const prices = VEHICLE_ORDER.flatMap((vehicle) => {
    const active = (route.pricing || []).filter(
      (p) => p.is_active && p.price > 0 && p.vehicle_type === vehicle
    );
    if (active.length === 0) return [];
    const exact = active.filter((p) => p.season_name === seasonName);
    const pool = exact.length > 0 ? exact : active;
    return [Math.min(...pool.map((p) => p.price))];
  });
  return prices.length > 0 ? Math.min(...prices) : null;
}

export default async function RatesPage() {
  const [settings, { categories, allRoutes }] = await Promise.all([
    getOneWayTaxiSettings(),
    getRoutesWithCategories(),
  ]);

  const stats = [
    { value: settings.stat_1_value, label: settings.stat_1_label },
    { value: settings.stat_2_value, label: settings.stat_2_label },
    { value: settings.stat_3_value, label: settings.stat_3_label },
  ].filter((s) => s.value.trim() !== "" || s.label.trim() !== "");

  // ---------------------------------------------------------------------
  // Everything below is built on the server and rendered into the raw HTML.
  //
  // The calculator, search and route rows are inside RouteBrowser, which is a
  // Client Component — Googlebot has to execute JS to see any of it. These
  // two blocks (prose and priced internal links) are the page's
  // indexable surface, so they are assembled here from data that is already
  // fetched rather than passed down through the client boundary.
  // ---------------------------------------------------------------------
  const today = new Date().toISOString().split("T")[0];

  // Real routes in admin display order, so /admin/routes reordering is what
  // controls which legs get the internal links — not a hardcoded list here.
  const highlightRoutes = allRoutes
    .map((route) => ({
      route,
      href: routeDetailsHref(route),
      fare: cheapestPublishedFare(route, today),
    }))
    .filter((entry) => entry.fare !== null)
    .slice(0, HIGHLIGHT_COUNT);

  // One chip per distinct destination page a route actually points at. Built
  // from routes.destination_slug so we can never link a /destinations/[slug]
  // that no route is tied to — the name shown is the drop location of the
  // first route that references it.
  const destinationLinks = Array.from(
    allRoutes
      .filter((route) => !!route.destination_slug)
      .reduce((acc, route) => {
        const slug = route.destination_slug as string;
        if (!acc.has(slug)) acc.set(slug, route.drop_location);
        return acc;
      }, new Map<string, string>())
      .entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const introParagraphs = settings.seo_intro_body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <HeaderServer />

      {/* Hero */}
      <div className="border-b border-slate-200 bg-lake">
        <div className="container mx-auto max-w-[1200px] px-4 py-16 md:py-20">
          <div className="max-w-2xl">
            <h1 className="mb-4 font-display text-3xl font-semibold text-ink md:text-4xl">
              {settings.hero_heading}
            </h1>
            <p className="text-base text-slate-500">{settings.hero_subheading}</p>
          </div>

          {stats.length > 0 && (
            <div className="mt-10 grid max-w-2xl grid-cols-3 divide-x divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {stats.map((stat, i) => (
                <div key={i} className="px-4 py-5 text-center md:px-6">
                  <div className="font-display text-2xl font-semibold tabular-nums text-ink md:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Calculator + routes (client) */}
      <div className="container mx-auto max-w-[1200px] px-4 py-12 md:py-16">
        <RouteBrowser categories={categories} />
      </div>

      {/* ---------------- Server-rendered SEO block ---------------- */}
      <div className="border-t border-slate-200 bg-lake">
        <div className="container mx-auto max-w-[1200px] px-4 py-14 md:py-16">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Editorial */}
            <section className="lg:col-span-7">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
                {settings.seo_intro_heading}
              </h2>
              <div className="mt-4 max-w-[65ch] space-y-4">
                {introParagraphs.map((paragraph, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-slate-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>

            {/* Priced internal links */}
            <div className="lg:col-span-5">
              {highlightRoutes.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                    Popular fares
                  </h2>
                  <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                    {highlightRoutes.map(({ route, href, fare }) => {
                      const label = `${route.pickup_location} to ${route.drop_location} taxi fare`;
                      const body = (
                        <>
                          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">
                            {label}
                          </span>
                          <span className="shrink-0 text-[13px] font-semibold tabular-nums text-slate-500">
                            from {formatPrice(fare as number)}
                          </span>
                        </>
                      );

                      return (
                        <li key={route.id}>
                          {href ? (
                            <Link
                              href={href}
                              className="flex min-h-[48px] items-center gap-3 py-2.5 hover:text-sunshine"
                            >
                              {body}
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                            </Link>
                          ) : (
                            <div className="flex min-h-[48px] items-center gap-3 py-2.5">{body}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {destinationLinks.length > 0 && (
                <section className="mt-8">
                  <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                    Destination guides
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {destinationLinks.map(([slug, name]) => (
                      <Link
                        key={slug}
                        href={`/destinations/${slug}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-medium text-ink hover:border-sunshine hover:text-sunshine"
                      >
                        {name}
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Closing CTA */}
      <div className="border-t border-slate-200 bg-white">
        <div className="container mx-auto max-w-[1200px] px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-3 font-display text-2xl font-semibold text-ink md:text-3xl">
              Can&apos;t find your route?
            </h2>
            <p className="mb-8 text-base text-slate-500">
              We offer custom routes and packages. Contact us for a personalized quote.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="whatsapp" size="md" asChild className="min-h-[44px]">
                <WhatsAppCTA
                  href="https://wa.me/918445206116?text=Hi%2C%20I%20need%20a%20custom%20taxi%20route"
                  placement={CTA_PLACEMENTS.ratesNoMatch}
                  context="closing_cta"
                >
                  WhatsApp Us
                </WhatsAppCTA>
              </Button>
              <Button variant="outline" size="md" asChild className="min-h-[44px]">
                <Link href="tel:+918445206116">
                  <Phone className="mr-2 h-4 w-4" />
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
