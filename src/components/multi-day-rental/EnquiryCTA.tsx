import React from "react";
import Link from "next/link";
import { MessageCircle, Send, ShieldCheck } from "lucide-react";
import type { MultiDayRentalPage } from "@/lib/supabase/types";

interface EnquiryCTAProps {
  pageData: MultiDayRentalPage;
  whatsappNumber: string;
}

/**
 * Conversion block that sits directly under the inclusions/exclusions section.
 * That is the point where a visitor has just finished evaluating the offer and
 * previously had nothing to act on until the very bottom of the page.
 *
 * Mobile-first: one dominant full-width WhatsApp button, the form as a clearly
 * secondary option, and a reassurance line rather than a second heading.
 */
export default function EnquiryCTA({ pageData, whatsappNumber }: EnquiryCTAProps) {
  if (pageData.enquiry_cta_enabled === false) return null;

  const heading = pageData.enquiry_cta_heading;
  if (!heading) return null;

  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
    pageData.enquiry_cta_whatsapp_message || "Hi! I would like a quote for a multi-day taxi rental."
  )}`;

  const secondaryHref = pageData.enquiry_cta_secondary_href || "/contact";
  const secondaryIsExternal = /^https?:\/\//i.test(secondaryHref);
  const secondaryLabel = pageData.enquiry_cta_secondary_label || "Use the Enquiry Form";

  const secondaryClassName =
    "w-full sm:w-auto min-h-[52px] inline-flex items-center justify-center gap-2 bg-white text-ink px-6 py-3 rounded-xl font-bold border-3 border-ink shadow-retro-sm hover:shadow-retro transition-all";

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-10 lg:py-14 bg-lake">
      <div className="max-w-4xl mx-auto rounded-3xl border-3 border-ink bg-gradient-to-br from-yellow/25 via-white to-white shadow-retro p-6 sm:p-8 lg:p-10 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display text-ink">{heading}</h2>

        {pageData.enquiry_cta_description && (
          <p className="mt-3 font-body text-base sm:text-lg text-ink/70 max-w-2xl mx-auto">
            {pageData.enquiry_cta_description}
          </p>
        )}

        <div className="mt-7 flex flex-col sm:flex-row sm:justify-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto min-h-[56px] inline-flex items-center justify-center gap-2 bg-[#25d366] text-white px-8 py-4 rounded-xl font-bold text-lg border-3 border-ink shadow-retro hover:shadow-retro-lg transition-all"
          >
            <MessageCircle className="w-6 h-6" />
            <span>{pageData.enquiry_cta_whatsapp_label || "Send Your Enquiry on WhatsApp"}</span>
          </a>

          {secondaryIsExternal ? (
            <a href={secondaryHref} target="_blank" rel="noopener noreferrer" className={secondaryClassName}>
              <Send className="w-5 h-5" />
              <span>{secondaryLabel}</span>
            </a>
          ) : (
            <Link href={secondaryHref} className={secondaryClassName}>
              <Send className="w-5 h-5" />
              <span>{secondaryLabel}</span>
            </Link>
          )}
        </div>

        {pageData.enquiry_cta_reassurance && (
          <p className="mt-5 inline-flex items-center gap-2 font-body text-sm text-ink/60">
            <ShieldCheck className="w-4 h-4 text-teal" />
            {pageData.enquiry_cta_reassurance}
          </p>
        )}
      </div>
    </section>
  );
}
