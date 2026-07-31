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

// PPC landing pages ship their own always-visible sticky contact bar, so
// the scroll-triggered global widgets would just duplicate/clash with it.
const SUPPRESSED_PREFIXES = ["/lp"];

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
