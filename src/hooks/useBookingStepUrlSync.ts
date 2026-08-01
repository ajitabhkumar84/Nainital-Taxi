'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookingStore, BookingStep } from '@/store/bookingStore';

const STEP_PARAM = 'step';

function parseStepParam(value: string | null): BookingStep | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return n >= 1 && n <= 4 ? (n as BookingStep) : null;
}

/**
 * Mirrors currentStep into a `step` URL param via raw History API calls (not
 * next/navigation's router) so in-flow step changes never trigger a Next.js
 * route re-render or scroll-to-top — booking/page.tsx already does its own
 * intentional scroll-to-top + focus on step change. Browser Back/Forward
 * still updates Next's useSearchParams() through its own popstate listener,
 * which is what the URL -> store direction below relies on.
 */
export function useBookingStepUrlSync(ready: boolean) {
  const searchParams = useSearchParams();
  const currentStep = useBookingStore((s) => s.currentStep);
  const setCurrentStep = useBookingStore((s) => s.setCurrentStep);

  // The step value this hook itself last wrote to the URL. Lets both effects
  // agree on "is the URL already in sync" without relying on Next's
  // useSearchParams(), which never reflects our own raw history writes.
  const lastSyncedStepRef = useRef<BookingStep | null>(null);

  // Store -> URL
  useEffect(() => {
    if (!ready) return;
    if (lastSyncedStepRef.current === currentStep) return;

    const url = new URL(window.location.href);
    const urlStep = parseStepParam(url.searchParams.get(STEP_PARAM));
    url.searchParams.set(STEP_PARAM, String(currentStep));

    if (urlStep === null) {
      // First tagging right after the entry patch landed - annotate the
      // current history entry, don't create a new one.
      window.history.replaceState(null, '', url);
    } else {
      // Real in-flow transition - push so Back has this step to land on.
      window.history.pushState(null, '', url);
    }
    lastSyncedStepRef.current = currentStep;
  }, [ready, currentStep]);

  // URL -> Store (browser Back/Forward)
  useEffect(() => {
    if (!ready) return;
    const urlStep = parseStepParam(searchParams.get(STEP_PARAM));
    if (urlStep === null || urlStep === lastSyncedStepRef.current) return;
    lastSyncedStepRef.current = urlStep;
    setCurrentStep(urlStep);
  }, [ready, searchParams, setCurrentStep]);
}
