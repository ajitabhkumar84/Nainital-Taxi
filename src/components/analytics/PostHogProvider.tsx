"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import {
  POSTHOG_HOST,
  POSTHOG_KEY,
  capturePageview,
  isAnalyticsReady,
} from "@/lib/analytics/capture";
import ContactClickListener from "./ContactClickListener";

/**
 * Initialises posthog-js in the browser and emits manual pageviews.
 *
 * MOUNTING
 * --------
 * Rendered inside <body> in src/app/layout.tsx, wrapping {children}. It has to
 * be inside <body> rather than a sibling of it: TrackingScripts.tsx documents
 * that Google's <GoogleTagManager>/<GoogleAnalytics> must be direct siblings of
 * <body>, and adding another element in that position risks disturbing a
 * placement that is already load-bearing. This component renders its children
 * unchanged, so nesting costs nothing.
 *
 * It does NOT create a React context. posthog-js keeps its own module-level
 * singleton, and src/lib/analytics/capture.ts talks to that directly — so any
 * client component can fire an event with a plain import and no provider
 * plumbing. The provider exists to own initialisation and pageviews, nothing
 * more.
 *
 * NO CSP WORK NEEDED
 * ------------------
 * posthog-js is an npm import bundled by Next, not an injected <script> tag,
 * so it needs no nonce. Its network calls go to the same-origin /ingest proxy
 * (next.config.mjs rewrites), which `connect-src 'self'` already permits. This
 * is exactly why the proxy was chosen over direct ingestion — see
 * src/lib/security/csp.ts, where every other vendor had to be allowlisted by
 * hand.
 *
 * CONFIGURATION INTENT (2026-08-28)
 * ---------------------------------
 * autocapture and session replay are both off, deliberately:
 *   - autocapture would fire on every click sitewide. Each event is a Vercel
 *     function invocation through the proxy, and this project runs close to
 *     free-tier limits everywhere (see the cost notes in next.config.mjs).
 *     Named events keep volume proportional to real user actions.
 *   - session replay would record the booking form, which collects customer
 *     name, phone and email. Recording those is a privacy liability we have no
 *     need for, and replay needs `worker-src 'self' blob:` in the CSP, which we
 *     would rather not add.
 * If replay is ever wanted, both of those have to be handled first.
 */

function PostHogPageview() {
  const pathname = usePathname();
  // useSearchParams() forces this into a Suspense boundary (see the default
  // export). It is read so a query-string change on the same pathname still
  // produces one pageview — but note the booking wizard's ?step= transitions
  // are deliberately NOT pageviews; booking_step_viewed reports those instead.
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    capturePageview(pathname);
    // searchParams is in the dep list so a filter/param change still counts as
    // a view; the wizard's step param is excluded at the source by
    // useBookingStepUrlSync writing it through history.pushState, which does
    // not re-render this component.
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // No key is the normal state locally and in preview deploys. Treat it as
    // "analytics off" rather than an error — capture() no-ops in the same way,
    // so nothing downstream needs its own guard.
    if (!POSTHOG_KEY || isAnalyticsReady()) return;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // Tells posthog-js where its own static assets live behind the proxy;
      // without it the toolbar and feature-flag bundles 404.
      ui_host: "https://us.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: false,
      disable_session_recording: true,
      // The site is public marketing content with no login, so there is no
      // identified user to persist across sessions. Cookie-based anonymous
      // ids are enough and avoid localStorage quota interactions with the
      // persisted Zustand booking store.
      persistence: "localStorage+cookie",
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.debug();
      },
    });
  }, []);

  return (
    <>
      {/*
        useSearchParams() opts a component into client-side rendering and Next
        requires it to sit under Suspense, or `next build` fails the whole route
        with "useSearchParams() should be wrapped in a suspense boundary".
        BookingPageClient.tsx wraps itself for the same reason.
      */}
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {/*
        Mounted here rather than in GlobalContactWidgets: that component is
        suppressed on /lp* (it ships its own sticky contact bar), and /lp/taxi
        is the paid-traffic landing page whose Call/WhatsApp clicks matter
        most. The provider renders everywhere.
      */}
      <ContactClickListener />
      {children}
    </>
  );
}
