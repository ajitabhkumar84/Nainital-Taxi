import type { Metadata } from "next";
import { Chewy, Nunito } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Nainital Taxi - Premium Taxi & Tour Services",
  description: "Book premium taxi services in Nainital. Explore Bhimtal, Naukuchiatal, Kainchi Dham, and more with our reliable tour packages.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${chewy.variable} ${nunito.variable}`}>
        {children}
      </body>
    </html>
  );
}
