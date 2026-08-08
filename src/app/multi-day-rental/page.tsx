import { permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import {
  getMultiDayRentalPageData,
  getMultiDayRentalFeaturedPackages,
  multiDayRentalMetadata,
} from "@/lib/multiDayRental";
import { getSiteWhatsappNumber } from "@/lib/siteContact";
import MultiDayRentalPageContent from "@/components/multi-day-rental/MultiDayRentalPageContent";

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
    <MultiDayRentalPageContent
      pageData={pageData}
      whatsappNumber={whatsappNumber}
      featuredPackages={featuredPackages}
    />
  );
}
