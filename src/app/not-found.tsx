import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Phone, MessageCircle, ArrowRight, Home } from "lucide-react";
import { Header } from "@/components/ui";
import FooterServer from "@/components/ui/FooterServer";
import { getSiteContactConfig } from "@/lib/siteContact";

/**
 * Custom 404.
 *
 * Until now every notFound() — thrown by /tour/[name], /destinations/[slug]
 * and /[slug] when a slug doesn't resolve — landed on Next's bare default
 * page: no header, no footer, no way back. The traffic that hits this is not
 * random. It is stale Google results after a package is renamed, and WhatsApp
 * links forwarded months after the trip they referenced. Those are people who
 * were actively looking for a taxi, so the page's job is to route them back
 * into the funnel rather than apologise.
 *
 * Server component so it inherits the root layout (fonts, CSP nonce, tracking)
 * and so the phone number comes from the same admin-managed config as the rest
 * of the site — a hardcoded number here would silently go stale.
 */
export const metadata: Metadata = {
  title: "Page Not Found",
  // A 404 is served with a 404 status, which is enough for crawlers, but this
  // makes it explicit that the page should never be indexed on its own.
  robots: { index: false, follow: true },
};

const DESTINATIONS = [
  { href: "/rates", label: "Fixed one-way fares", hint: "Kathgodam, Delhi, Pantnagar" },
  { href: "/destinations", label: "Places around Nainital", hint: "Bhimtal, Kainchi Dham, Mukteshwar" },
  { href: "/tour", label: "Tour packages", hint: "Full-day and multi-day trips" },
];

export default async function NotFound() {
  const contact = await getSiteContactConfig();
  const telHref = `tel:${contact.phone}`;
  const whatsappHref = `https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    "Hi! I followed a link to your site that didn't work. Can you help me with a taxi booking?"
  )}`;

  return (
    <>
      <Header />

      <main className="px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-[720px]">
          <p className="font-body text-sm font-semibold uppercase tracking-wide text-teal-400">
            Error 404
          </p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl font-bold text-ink">
            We couldn&apos;t find that page
          </h1>
          <p className="mt-4 font-body text-base md:text-lg text-teal-400">
            The link may be out of date, or the page may have moved. Everything below still
            works — or just call us and we&apos;ll sort the booking out directly.
          </p>

          {/* Call and WhatsApp first: on mobile these convert better than any
              amount of navigation, and this visitor already had their journey
              interrupted once. */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href={telHref}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-sunshine px-6 py-3 font-body text-base font-semibold text-white shadow-retro-sm transition-colors hover:bg-sunshine-500"
            >
              <Phone className="h-5 w-5" aria-hidden="true" />
              Call {contact.phone}
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-whatsapp px-6 py-3 font-body text-base font-semibold text-white shadow-retro-sm transition-colors hover:brightness-95"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              WhatsApp us
            </a>
          </div>

          <nav aria-label="Popular pages" className="mt-12">
            <h2 className="font-display text-lg font-bold text-ink">Try one of these instead</h2>
            <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
              {DESTINATIONS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-slate-50"
                  >
                    <span className="flex items-start gap-3">
                      <MapPin
                        className="mt-0.5 h-5 w-5 shrink-0 text-teal-400"
                        aria-hidden="true"
                      />
                      <span>
                        <span className="block font-body font-semibold text-ink">
                          {item.label}
                        </span>
                        <span className="block font-body text-sm text-teal-400">{item.hint}</span>
                      </span>
                    </span>
                    <ArrowRight
                      className="h-5 w-5 shrink-0 text-teal-300 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-body text-base font-semibold text-sunshine hover:underline"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Back to the homepage
            </Link>
          </div>
        </div>
      </main>

      <FooterServer />
    </>
  );
}
