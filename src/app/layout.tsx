import type { Metadata } from "next";
import { Chewy, Nunito } from "next/font/google";
import "./globals.css";
import { generateLocalBusinessSchema } from "@/lib/structuredData";
import GlobalContactWidgets from "@/components/GlobalContactWidgets";

const chewy = Chewy({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-chewy",
  display: "swap",
});

const nunito = Nunito({
  weight: ["400", "600", "700", "800"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localBusinessSchema = generateLocalBusinessSchema();

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body className={`${chewy.variable} ${nunito.variable}`}>
        {children}
        <GlobalContactWidgets />
      </body>
    </html>
  );
}
