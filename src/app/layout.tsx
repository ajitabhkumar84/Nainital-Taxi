import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { generateLocalBusinessSchema } from "@/lib/structuredData";
import { SITE_URL } from "@/lib/siteUrl";
import GlobalContactWidgets from "@/components/GlobalContactWidgets";
import PostHogProvider from "@/components/analytics/PostHogProvider";
import { getTrackingConfig } from "@/lib/trackingScripts";
import { getFaviconUrl } from "@/lib/branding";
import {
  TrackingBodyEnd,
  TrackingBodyStart,
  TrackingGa,
  TrackingGtm,
  TrackingHeadScripts,
} from "@/components/TrackingScripts";

const interTight = Inter_Tight({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-chewy",
  display: "swap",
});

const nunito = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const baseUrl = SITE_URL;

// Static file at public/favicon.ico (moved out of src/app/ on purpose — Next's
// App Router file-based icon convention only scans src/app/, so keeping it
// there would have Next auto-inject its own <link rel="icon"> alongside the
// one generateMetadata sets below, leaving two competing icon tags in <head>.
// This is the sole fallback now, referenced explicitly so there's always
// exactly one favicon source.
const DEFAULT_FAVICON = "/favicon.ico";

export async function generateMetadata(): Promise<Metadata> {
  const faviconUrl = (await getFaviconUrl()) ?? DEFAULT_FAVICON;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: "Nainital Taxi - Premium Taxi & Tour Services in Nainital",
      template: "%s | Nainital Taxi"
    },
    description: "Book premium taxi services in Nainital. Reliable transfers from Kathgodam, Delhi, Pantnagar. Tour packages to Bhimtal, Naukuchiatal, Kainchi Dham & more. Best rates guaranteed.",
    keywords: ["nainital taxi", "kathgodam to nainital taxi", "nainital tour packages", "taxi service nainital", "delhi to nainital taxi"],
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: baseUrl,
      siteName: "Nainital Taxi",
      title: "Nainital Taxi - Premium Taxi & Tour Services",
      description: "Book premium taxi services in Nainital. Reliable transfers and tour packages.",
      // `images` is deliberately NOT set here. src/app/opengraph-image.tsx
      // supplies the site-wide 1200x630 card via Next's file convention, which
      // emits og:image plus width/height/type with a correct absolute URL.
      // Setting images here as well would override that with a hand-maintained
      // path. Pages with their own artwork (/tour/[name],
      // /destinations/[slug]) override it per-page instead.
    },
    twitter: {
      card: "summary_large_image",
      title: "Nainital Taxi - Premium Taxi & Tour Services",
      description: "Book premium taxi services in Nainital. Reliable transfers and tour packages.",
      // Same reasoning — the file convention also populates twitter:image.
    },
    icons: {
      icon: faviconUrl,
      shortcut: faviconUrl,
      apple: faviconUrl,
    },
    // No `alternates.canonical` here on purpose. Child pages inherit a parent's
    // `alternates` wholesale when they don't declare their own, so a root canonical
    // pointed every such page (/fleet, /rates, /packages/*, ...) at the homepage —
    // telling Google to drop them. Pages that need a canonical set their own; the
    // rest emit none and are self-canonicalized.
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localBusinessSchema = generateLocalBusinessSchema();
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;
  const trackingConfig = await getTrackingConfig();

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <TrackingHeadScripts tracking={trackingConfig} nonce={nonce} />
      </head>
      {/* GoogleTagManager must be a direct sibling of <body>, not nested inside
          <head>/<body> — see src/components/TrackingScripts.tsx. */}
      <TrackingGtm tracking={trackingConfig} nonce={nonce} />
      <body className={`${interTight.variable} ${nunito.variable}`}>
        <TrackingBodyStart tracking={trackingConfig} />
        {/* Inside <body>, not a sibling of it — the GTM/GA components above
            and below own that position and the comment on TrackingGtm explains
            why it matters. PostHogProvider renders children unchanged, so
            nesting it here costs nothing. */}
        <PostHogProvider>
          {children}
          <GlobalContactWidgets />
        </PostHogProvider>
        <TrackingBodyEnd tracking={trackingConfig} nonce={nonce} />
      </body>
      {/* GoogleAnalytics must likewise be a direct sibling of <body>. */}
      <TrackingGa tracking={trackingConfig} nonce={nonce} />
    </html>
  );
}
