'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { useBookingEntry } from '@/hooks/useBookingEntry';
import { useBookingStepUrlSync } from '@/hooks/useBookingStepUrlSync';
import { Check, Lock } from 'lucide-react';
import Step1PackageSelection from '@/components/booking/Step1PackageSelection';
import type { TransferRoute } from '@/components/booking/TransferRouteSelector';
import type { PickupLocationRow } from '@/lib/supabase/types';
import Step2TripDetails from '@/components/booking/Step2TripDetails';
import Step3ContactInfo from '@/components/booking/Step3ContactInfo';
import Step4Payment from '@/components/booking/Step4Payment';
import { capture } from '@/lib/analytics/capture';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { BOOKING_STEP_NAMES, bookingProperties } from '@/lib/analytics/properties';

export interface BookingPageClientProps {
  // Fetched server-side in src/app/booking/page.tsx and drilled down to
  // Step 1's transfer picker, so its dropdowns are populated on first paint.
  pickupLocations: PickupLocationRow[];
  transferRoutes: TransferRoute[];
}

/**
 * One line, four facts. This replaces the step-1 promotional hero (an h1, a
 * subtitle and four 40px trust tiles) plus the trust row that used to repeat at
 * the bottom of every step — together about 290px of non-functional height on
 * the most conversion-critical page on the site. The same claims survive at the
 * same font size; only the packaging is gone.
 */
const TRUST_POINTS = ['4.8/5 rated', '1500+ travellers', 'Verified drivers', '15+ years'];

// Wrapper component to handle URL params
function BookingPageContent({ pickupLocations, transferRoutes }: BookingPageClientProps) {
  const { ready } = useBookingEntry();
  useBookingStepUrlSync(ready);
  const currentStep = useBookingStore((state) => state.currentStep);
  const packageId = useBookingStore((state) => state.packageId);
  const stepContentRef = useRef<HTMLDivElement>(null);

  // Each step transition leaves the scroll position wherever the previous
  // step's "Continue" button was, which can be mid- or end-of-page for the
  // newly rendered step. Jump instantly (no smooth-scroll lag on mobile),
  // then focus the new step's first field so the user can start typing
  // right away; preventScroll avoids the browser re-scrolling to it and
  // undoing the jump to the top.
  //
  // Since the two-column redesign the scrollTo is close to a no-op on desktop
  // (there is nothing left to scroll) but still matters on mobile. The focus
  // query resolves inside StepShell's form column only — StepShell keeps its
  // own ref there deliberately, so this can never focus a control in the
  // sticky rail.
  useEffect(() => {
    window.scrollTo(0, 0);
    const firstField = stepContentRef.current?.querySelector<HTMLElement>('input, select, textarea');
    firstField?.focus({ preventScroll: true });
  }, [currentStep]);

  /**
   * The funnel's backbone: one event per step actually shown to the user.
   *
   * Gated on `ready` on purpose. This component mounts with the Zustand
   * default currentStep=1 and only receives the real step once
   * useBookingEntry's patch lands — so without the guard every deep-linked
   * arrival (which starts at step 2) would first emit a step-1 view for a
   * screen the visitor never saw, inflating the top of the funnel and making
   * step 1 -> 2 drop-off look far worse than it is.
   *
   * Reaching step 4 is also the "completed the wizard, payment screen with the
   * UPI QR is up" milestone. It is emitted here rather than inside
   * Step4Payment because that component renders either the payment form or the
   * post-submission confirmation screen depending on state, and this fires for
   * the former.
   */
  useEffect(() => {
    if (!ready) return;

    const props = {
      ...bookingProperties(useBookingStore.getState()),
      step: currentStep,
      step_name: BOOKING_STEP_NAMES[currentStep] ?? String(currentStep),
    };

    capture(ANALYTICS_EVENTS.bookingStepViewed, props);

    if (currentStep === 4) {
      capture(ANALYTICS_EVENTS.bookingPaymentViewed, props);
    }
  }, [currentStep, ready]);

  // Until the entry contract has been applied, currentStep is still the
  // Zustand default of 1 — rendering before `ready` would flash the full
  // "Choose Your Adventure" picker for a frame on every deep-linked arrival.
  if (!ready) {
    return <BookingLoading />;
  }

  const steps = [
    {
      number: 1,
      title: packageId ? 'Choose Your Vehicle' : 'Package & Vehicle',
      description: packageId ? 'Pick your ride' : 'Select your ride',
    },
    { number: 2, title: 'Trip Details', description: 'When & where' },
    { number: 3, title: 'Contact Info', description: 'Your details' },
    { number: 4, title: 'Payment', description: 'Complete booking' },
  ];

  return (
    <BookingFrame>
      {/*
        Header and step indicator share one row. Previously these were two
        stacked blocks (a centred title card, then a full-width 4-node stepper
        with labels and descriptions) totalling ~218px before the form started.
      */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-ink truncate">
              {steps[currentStep - 1].title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {steps[currentStep - 1].description}
            </p>
          </div>

          {/* Desktop step pills */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center gap-1.5">
                <div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center
                    text-xs font-bold transition-colors
                    ${
                      step.number < currentStep
                        ? 'bg-sunshine text-white'
                        : step.number === currentStep
                        ? 'bg-ink text-white'
                        : 'bg-slate-100 text-slate-400'
                    }
                  `}
                  aria-current={step.number === currentStep ? 'step' : undefined}
                  title={step.title}
                >
                  {step.number < currentStep ? <Check className="w-4 h-4" /> : step.number}
                </div>
                {step.number < steps.length && (
                  <div
                    className={`w-4 h-px ${
                      step.number < currentStep ? 'bg-sunshine' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile progress bars + trust strip */}
        <div className="md:hidden mt-2.5 flex items-center gap-1.5">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`
                flex-1 h-1 rounded-full transition-colors
                ${step.number <= currentStep ? 'bg-sunshine' : 'bg-slate-200'}
              `}
            />
          ))}
          <span className="text-xs font-semibold text-slate-500 shrink-0 ml-1">
            {currentStep}/{steps.length}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
            <Lock className="w-3 h-3" />
            Secure checkout
          </span>
          {TRUST_POINTS.map((point) => (
            <span key={point} className="flex items-center gap-2">
              <span className="text-slate-300">&middot;</span>
              {point}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div ref={stepContentRef}>
        {currentStep === 1 && (
          <Step1PackageSelection
            pickupLocations={pickupLocations}
            transferRoutes={transferRoutes}
          />
        )}
        {currentStep === 2 && <Step2TripDetails />}
        {currentStep === 3 && <Step3ContactInfo />}
        {currentStep === 4 && <Step4Payment />}
      </div>
    </BookingFrame>
  );
}

/**
 * Page chrome shared by the wizard and its loading skeleton. They must stay
 * visually identical: a deep-linked arrival renders the skeleton until the
 * entry patch lands, and any difference in card styling shows up as a flash
 * when `ready` flips.
 *
 * `min-h-[100dvh]` rather than `min-h-screen`: on iOS `100vh` is the *unshrunk*
 * viewport height and overshoots once the browser chrome collapses, which
 * leaves a dead strip under the fixed action bar. `pb-28` clears that bar on
 * mobile; desktop has no bar and only needs a normal gutter.
 */
function BookingFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-lake pt-3 pb-28 lg:pb-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-retro-lg p-4 sm:p-5 lg:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function BookingLoading() {
  return (
    <BookingFrame>
      <div className="animate-pulse">
        <div className="h-7 bg-slate-200 rounded w-1/3 mb-2" />
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-6" />
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:items-start">
          <div className="space-y-4">
            <div className="h-11 bg-slate-200 rounded-md" />
            <div className="h-11 bg-slate-200 rounded-md" />
            <div className="h-11 bg-slate-200 rounded-md" />
          </div>
          <div className="hidden lg:block h-48 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    </BookingFrame>
  );
}

// Export default with Suspense wrapper.
//
// This boundary must stay HERE, inside the client component, rather than
// moving up into the server page: it's what satisfies Next's requirement for
// useSearchParams() (read by useBookingEntry / useBookingStepUrlSync) during
// static rendering. Those hooks remain the only reader of the URL — the
// server page deliberately does NOT thread searchParams down, because
// useBookingStepUrlSync writes step changes via the raw History API, which a
// request-time searchParams prop would never see.
export default function BookingPageClient({
  pickupLocations,
  transferRoutes,
}: BookingPageClientProps) {
  return (
    <Suspense fallback={<BookingLoading />}>
      <BookingPageContent pickupLocations={pickupLocations} transferRoutes={transferRoutes} />
    </Suspense>
  );
}
