import { notFound } from "next/navigation";
import { Metadata } from "next";
import { RESERVED_PAGE_SLUGS, isValidSlugFormat } from "@/lib/slug";
import { getMultiDayRentalPageData, multiDayRentalMetadata } from "@/lib/multiDayRental";
import { getSiteWhatsappNumber } from "@/lib/siteContact";
import MultiDayRentalPageContent from "@/components/multi-day-rental/MultiDayRentalPageContent";

// Scoped intentionally to just the multi-day-rental page for now. If more
// single-row CMS pages get custom slugs later, this lookup will need to
// check multiple sources instead of just one.

function isEligibleSlug(slug: string): boolean {
  return isValidSlugFormat(slug) && !RESERVED_PAGE_SLUGS.includes(slug);
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  if (!isEligibleSlug(params.slug)) return {};
  const pageData = await getMultiDayRentalPageData();
  if (!pageData || pageData.page_slug !== params.slug) return {};
  return multiDayRentalMetadata(pageData);
}

export default async function DynamicSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  // Cheap fast-path: skip the DB round trip for obviously-invalid or
  // reserved segments — these can never legitimately be this page's slug.
  if (!isEligibleSlug(params.slug)) {
    notFound();
  }

  const [pageData, whatsappNumber] = await Promise.all([
    getMultiDayRentalPageData(),
    getSiteWhatsappNumber(),
  ]);
  if (!pageData || pageData.page_slug !== params.slug) {
    notFound();
  }

  return <MultiDayRentalPageContent pageData={pageData} whatsappNumber={whatsappNumber} />;
}
