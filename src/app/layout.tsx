import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";
import { generateLocalBusinessSchema } from "@/lib/structuredData";
import GlobalContactWidgets from "@/components/GlobalContactWidgets";
import { getTrackingConfig } from "@/lib/trackingScripts";
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

const baseUrl = "https://nainialtaxi.com";

export const metadata: Metadata = {
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
  },
  twitter: {
    card: "summary_large_image",
    title: "Nainital Taxi - Premium Taxi & Tour Services",
    description: "Book premium taxi services in Nainital. Reliable transfers and tour packages.",
  },
  alternates: {
    canonical: baseUrl,
  },
};

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
        {children}
        <GlobalContactWidgets />
        <TrackingBodyEnd tracking={trackingConfig} nonce={nonce} />
      </body>
      {/* GoogleAnalytics must likewise be a direct sibling of <body>. */}
      <TrackingGa tracking={trackingConfig} nonce={nonce} />
    </html>
  );
}
