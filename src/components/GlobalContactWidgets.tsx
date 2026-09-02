"use client";

import { usePathname } from "next/navigation";
import FloatingWhatsApp from "./FloatingWhatsApp";
import MobileEnquiryBar from "./contact/MobileEnquiryBar";

interface GlobalContactWidgetsProps {
  contextMessage?: string;
  routeName?: string;
  packageName?: string;
  destinationName?: string;
}

// Pages that own the bottom of the screen already.
//
// /lp — PPC landing pages ship their own always-visible sticky contact bar, so
// the scroll-triggered global widgets would just duplicate/clash with it.
//
// /booking — the wizard's StepShell renders a fixed bottom action bar at the
// same position and z-index as MobileEnquiryBar, and a sticky summary rail
// underneath where FloatingWhatsApp sits. Two stacked bottom bars on the
// highest-intent page on the site is the worst available outcome. The
// affordance is not lost: StepShell puts a "Need help?" WhatsApp link in the
// rail and an icon button in the action bar, reported as
// CTA_PLACEMENTS.bookingRail — and unlike these widgets (which only appear
// after 300/600px of scroll) it is visible immediately. Expect `mobile_bar`
// volume on /booking to move to `booking_rail`; that is the migration, not a
// regression.
//
// Note this prefix also covers the retired /booking-simple, which now 301s to
// /booking anyway.
const SUPPRESSED_PREFIXES = ["/lp", "/booking"];

/**
 * Global contact widgets that appear on all pages
 * Includes FloatingWhatsApp (desktop) and MobileEnquiryBar (mobile)
 */
export default function GlobalContactWidgets(props: GlobalContactWidgetsProps) {
  const pathname = usePathname();

  if (SUPPRESSED_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) {
    return null;
  }

  return (
    <>
      <FloatingWhatsApp {...props} />
      <MobileEnquiryBar />
    </>
  );
}
