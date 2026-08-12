import { permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import {
  getMultiDayRentalPageData,
  getMultiDayRentalFeaturedPackages,
  multiDayRentalMetadata,
} from "@/lib/multiDayRental";
import { getSiteWhatsappNumber } from "@/lib/siteContact";
import MultiDayRentalPageContent from "@/components/multi-day-rental/MultiDayRentalPageContent";
import Header from "@/components/ui/Header";
// Direct path, not the ui barrel — see the note in FooterServer.tsx.
import FooterServer from "@/components/ui/FooterServer";

export async function generateMetadata(): Promise<Metadata> {
  const pageData = await getMultiDayRentalPageData();
  return multiDayRentalMetadata(pageData);
}

export default async function MultiDayRentalLegacyPage() {
  const [pageData, whatsappNumber] = await Promise.all([
    getMultiDayRentalPageData(),
    getSiteWhatsappNumber(),
  ]);

  // Admin moved the page to a different slug — send visitors (and search
  // engines) to the new address instead of serving stale content at the
  // old URL. 308/permanent so link equity transfers.
  if (pageData?.page_slug && pageData.page_slug !== 'multi-day-rental') {
    permanentRedirect(`/${pageData.page_slug}`);
  }

  const featuredPackages = await getMultiDayRentalFeaturedPackages(pageData);

  return (
    <>
      <Header />
      <MultiDayRentalPageContent
        pageData={pageData}
        whatsappNumber={whatsappNumber}
        featuredPackages={featuredPackages}
      />
      <FooterServer />
    </>
  );
}
