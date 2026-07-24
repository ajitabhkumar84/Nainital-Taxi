"use client";

import FloatingWhatsApp from "./FloatingWhatsApp";
import MobileEnquiryBar from "./contact/MobileEnquiryBar";

interface GlobalContactWidgetsProps {
  contextMessage?: string;
  routeName?: string;
  packageName?: string;
  destinationName?: string;
}

/**
 * Global contact widgets that appear on all pages
 * Includes FloatingWhatsApp (desktop) and MobileEnquiryBar (mobile)
 */
export default function GlobalContactWidgets(props: GlobalContactWidgetsProps) {
  return (
    <>
      <FloatingWhatsApp {...props} />
      <MobileEnquiryBar />
    </>
  );
}
