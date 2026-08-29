/**
 * THE ANALYTICS ENTRY POINT
 *
 * Every event in the app goes through capture(). Nothing imports posthog-js
 * directly except this file and PostHogProvider — so if PostHog is ever
 * swapped, disabled, or wrapped in consent gating, there is exactly one place
 * to change.
 *
 * FAILS SILENT, ALWAYS
 * --------------------
 * Analytics must never be able to break a booking. Every call is wrapped in a
 * try/catch and no-ops when PostHog is not initialised (no env key set, which
 * is the normal state in local dev and in any preview deploy without the var).
 * A thrown error inside a click handler on the payment screen would cost a
 * real booking; a dropped event costs one row in a dashboard. The asymmetry is
 * the whole reason this wrapper exists rather than calling posthog.capture()
 * at ~40 call sites.
 *
 * This is a client-only module. It reads `window` and posthog-js's browser
 * build; importing it from a server component will not crash (the guards
 * handle it) but nothing will be sent, so don't.
 */

import posthog from 'posthog-js';
import { ANALYTICS_EVENTS, type AnalyticsEvent } from './events';

/** Anything JSON-serialisable that PostHog will accept as a property value. */
export type AnalyticsPropertyValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | string[]
  | number[];

export type AnalyticsProperties = Record<string, AnalyticsPropertyValue>;

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/**
 * `/ingest` by default — the same-origin reverse proxy configured in
 * next.config.mjs. Kept as an env var rather than a constant so switching to
 * direct ingestion (which also needs the PostHog hosts added to connect-src in
 * src/lib/security/csp.ts) is a config change, not a code change.
 */
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || '/ingest';

/** True once PostHogProvider has run init() in this browser session. */
export function isAnalyticsReady(): boolean {
  return typeof window !== 'undefined' && Boolean(POSTHOG_KEY) && posthog.__loaded;
}

/**
 * Send one event.
 *
 * `source_page` is attached automatically from the current pathname, so every
 * event — funnel and CTA alike — can be broken down by where it happened
 * without each call site remembering to pass it. Explicit properties win over
 * the automatic ones.
 */
export function capture(
  event: AnalyticsEvent,
  properties: AnalyticsProperties = {}
): void {
  if (!isAnalyticsReady()) return;

  try {
    posthog.capture(event, {
      source_page: window.location.pathname,
      ...properties,
    });
  } catch (error) {
    // Deliberately console.error rather than rethrow: a broken analytics call
    // must not surface to the user or abort the handler it was called from.
    console.error(`[analytics] capture("${event}") failed:`, error);
  }
}

/**
 * Fire the right contact event for an href whose channel is not known at build
 * time.
 *
 * The header and footer CTAs are admin-configurable: their href comes from
 * site_config_header / site_config_footer in Supabase and can be a tel: link,
 * a wa.me link, or an ordinary page URL, decided by whoever edited it in
 * /admin/site-config. That rules out <CallCTA>/<WhatsAppCTA>, which each commit
 * to a channel. This inspects the href instead and stays correct when the owner
 * changes a button from Call to WhatsApp without anyone touching the code.
 *
 * Returns silently for hrefs that are neither — a footer button pointing at
 * /rates is a normal navigation, not a lead.
 */
export function captureContactClick(
  href: string | null | undefined,
  placement: string,
  context?: string
): void {
  if (!href) return;

  if (href.startsWith('tel:')) {
    capture(ANALYTICS_EVENTS.contactCallClicked, {
      placement,
      context: context ?? null,
    });
    return;
  }

  if (href.includes('wa.me') || href.includes('api.whatsapp.com')) {
    capture(ANALYTICS_EVENTS.contactWhatsappClicked, {
      placement,
      context: context ?? null,
    });
  }
}

/**
 * Send a manual $pageview.
 *
 * Pageviews are manual (capture_pageview is off in PostHogProvider) because
 * the booking wizard drives its step transitions through raw history.pushState
 * — see src/hooks/useBookingStepUrlSync.ts — which Next's router never
 * observes. Letting posthog-js auto-capture would produce one pageview per
 * wizard step, double-counting against booking_step_viewed, which already
 * reports the same transitions with far better properties.
 */
export function capturePageview(pathname: string): void {
  if (!isAnalyticsReady()) return;

  try {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      pathname,
    });
  } catch (error) {
    console.error('[analytics] capturePageview failed:', error);
  }
}
