"use client";

import { capture } from "@/lib/analytics/capture";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import type { CtaPlacement } from "@/lib/analytics/properties";

/**
 * Instrumented Call and WhatsApp links.
 *
 * WHY THESE EXIST
 * ---------------
 * A 2026-08-28 audit found ~27 `tel:` and ~36 `wa.me` call sites across the
 * app with no shared component between them — every one hand-rolled its own
 * anchor. Those clicks are the business's main lead channel and none of them
 * were measured.
 *
 * These are deliberately thin: an <a> with an onClick, plus `placement`. They
 * take `className` and `children` rather than imposing any styling, because
 * the existing call sites have wildly divergent Tailwind (pill buttons, icon-
 * only FABs, inline text links, footer rows) and a component that tried to own
 * appearance would need a variant prop per site and get adopted nowhere.
 *
 * They are client leaves, so **server components can render them directly** —
 * which matters because ~11 of the highest-traffic CTAs (the /lp/taxi PPC
 * page, /rates, /destinations, /tour, /routes/[slug]) live in server
 * components where an onClick is otherwise impossible without restructuring.
 *
 * Call and WhatsApp emit *separate* events, not one event with a channel
 * property: they are different lead types with different intent and different
 * follow-up, and keeping them distinct means neither is buried behind a
 * breakdown filter.
 */

interface ContactCTAProps {
  /** Where on the site this CTA lives — drives the main analytics breakdown. */
  placement: CtaPlacement;
  className?: string;
  children: React.ReactNode;
  /** Optional free-form note, e.g. which content the CTA sat beside. */
  context?: string;
  "aria-label"?: string;
}

interface CallCTAProps extends ContactCTAProps {
  /** Full tel: href, or a bare number — normalised below. */
  href: string;
}

export function CallCTA({
  href,
  placement,
  className,
  children,
  context,
  ...rest
}: CallCTAProps) {
  const telHref = href.startsWith("tel:") ? href : `tel:${href}`;

  return (
    <a
      href={telHref}
      className={className}
      data-analytics-cta="call"
      onClick={() =>
        capture(ANALYTICS_EVENTS.contactCallClicked, {
          placement,
          context: context ?? null,
        })
      }
      {...rest}
    >
      {children}
    </a>
  );
}

interface WhatsAppCTAProps extends ContactCTAProps {
  /** Full https://wa.me/... URL. */
  href: string;
  /** Opening in a new tab is the norm for WhatsApp; defaults to true. */
  newTab?: boolean;
}

export function WhatsAppCTA({
  href,
  placement,
  className,
  children,
  context,
  newTab = true,
  ...rest
}: WhatsAppCTAProps) {
  return (
    <a
      href={href}
      className={className}
      data-analytics-cta="whatsapp"
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      onClick={() =>
        capture(ANALYTICS_EVENTS.contactWhatsappClicked, {
          placement,
          context: context ?? null,
        })
      }
      {...rest}
    >
      {children}
    </a>
  );
}
