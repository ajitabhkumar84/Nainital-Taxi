"use client";

import { useEffect } from "react";
import { capture } from "@/lib/analytics/capture";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { CTA_PLACEMENTS } from "@/lib/analytics/properties";

/**
 * Sitewide safety net for Call/WhatsApp anchors that have not been migrated to
 * <CallCTA>/<WhatsAppCTA> yet.
 *
 * There are ~63 contact CTAs across the app and migrating all of them in one
 * change would be a very large diff touching many server components. This
 * listener means the unmigrated ones are still counted from day one, tagged
 * `placement: 'unmigrated'` — so the data is complete immediately, and the
 * remaining migration backlog is visible *in PostHog* (filter that placement,
 * group by source_page) rather than being an invisible gap someone has to
 * remember.
 *
 * WHAT IT DOES NOT CATCH
 * ----------------------
 * Only real anchor clicks. Six CTAs are <button> elements calling
 * window.open()/window.location and never produce an <a> click at all — the
 * floating WhatsApp FAB, both mobile enquiry-bar buttons, the contact form's
 * "Send via WhatsApp", the quick-enquiry modal, and the Step 4 payment-
 * screenshot share. Those are instrumented explicitly at their handlers. This
 * is precisely why a delegated listener alone was rejected as the whole
 * strategy: it would silently miss the payment-screenshot share, which is one
 * of the two headline metrics.
 *
 * Capture phase, so it still records the click if a handler further down calls
 * stopPropagation() (Step1PackageSelection's WhatsApp quote link does exactly
 * that to stop the click selecting the vehicle card behind it).
 */
export default function ContactClickListener() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!anchor) return;

      // Read the literal attribute rather than anchor.href: the DOM property
      // resolves to an absolute URL, which mangles tel: matching.
      const href = anchor.getAttribute("href");
      if (!href) return;

      // Already-instrumented CTAs fire their own event with a real placement.
      // data-analytics-cta is set by CallCTA/WhatsAppCTA's call sites when a
      // component is migrated, so this listener stops double-counting it.
      if (anchor.hasAttribute("data-analytics-cta")) return;

      if (href.startsWith("tel:")) {
        capture(ANALYTICS_EVENTS.contactCallClicked, {
          placement: CTA_PLACEMENTS.unmigrated,
          link_text: anchor.textContent?.trim().slice(0, 60) || null,
        });
        return;
      }

      if (href.includes("wa.me") || href.includes("api.whatsapp.com")) {
        capture(ANALYTICS_EVENTS.contactWhatsappClicked, {
          placement: CTA_PLACEMENTS.unmigrated,
          link_text: anchor.textContent?.trim().slice(0, 60) || null,
        });
      }
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
