'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { useBookingEntry } from '@/hooks/useBookingEntry';
import { CheckCircle2, Shield, Star, Users, Award, Lock } from 'lucide-react';
import Step1PackageSelection from '@/components/booking/Step1PackageSelection';
import Step2TripDetails from '@/components/booking/Step2TripDetails';
import Step3ContactInfo from '@/components/booking/Step3ContactInfo';
import Step4Payment from '@/components/booking/Step4Payment';

// Wrapper component to handle URL params
function BookingPageContent() {
  const { ready } = useBookingEntry();
  const currentStep = useBookingStore((state) => state.currentStep);
  const packageId = useBookingStore((state) => state.packageId);
  const stepContentRef = useRef<HTMLDivElement>(null);

  // Each step transition leaves the scroll position wherever the previous
  // step's "Continue" button was, which can be mid- or end-of-page for the
  // newly rendered step. Jump instantly (no smooth-scroll lag on mobile),
  // then focus the new step's first field so the user can start typing
  // right away; preventScroll avoids the browser re-scrolling to it and
  // undoing the jump to the top.
  useEffect(() => {
    window.scrollTo(0, 0);
    const firstField = stepContentRef.current?.querySelector<HTMLElement>('input, select, textarea');
    firstField?.focus({ preventScroll: true });
  }, [currentStep]);

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
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF0D4] to-[#E8F4F8] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header — full promotional banner only on step 1; steps 2-4 get a
            compact title + a single trust cue so the flow doesn't repeat a
            full hero section on every step. */}
        {currentStep === 1 ? (
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-[#2D3436] mb-3">
              Book Your Ride
            </h1>
            <p className="text-lg text-[#636E72] mb-6">
              Complete your booking in 4 easy steps
            </p>

            {/* Trust Signals */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2D3436]">
                <div className="w-10 h-10 bg-teal/20 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-teal fill-teal" />
                </div>
                <div className="text-left">
                  <div className="font-bold">4.8/5 Rating</div>
                  <div className="text-xs text-gray-500">Google Reviews</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2D3436]">
                <div className="w-10 h-10 bg-whatsapp/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-whatsapp" />
                </div>
                <div className="text-left">
                  <div className="font-bold">500+ Happy</div>
                  <div className="text-xs text-gray-500">Customers</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2D3436]">
                <div className="w-10 h-10 bg-coral/20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-coral" />
                </div>
                <div className="text-left">
                  <div className="font-bold">100% Safe</div>
                  <div className="text-xs text-gray-500">Verified Drivers</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2D3436]">
                <div className="w-10 h-10 bg-sunshine/30 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-ink" />
                </div>
                <div className="text-left">
                  <div className="font-bold">15+ Years</div>
                  <div className="text-xs text-gray-500">Experience</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#2D3436]">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-sm text-[#636E72] mb-2">
              {steps[currentStep - 1].description}
            </p>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500">
              <Lock className="w-3.5 h-3.5" />
              Secure Checkout
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-12">
          <div className="max-w-4xl mx-auto">
            {/* Desktop Step Indicator */}
            <div className="hidden md:flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
                <div
                  className="h-full bg-[#4D96FF] transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                />
              </div>

              {/* Steps */}
              {steps.map((step) => (
                <div key={step.number} className="flex flex-col items-center">
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      font-bold text-lg transition-all duration-300
                      border-4 border-white shadow-lg
                      ${
                        step.number < currentStep
                          ? 'bg-[#4D96FF] text-white'
                          : step.number === currentStep
                          ? 'bg-[#FFD93D] text-[#2D3436] animate-pulse'
                          : 'bg-white text-gray-400'
                      }
                    `}
                  >
                    {step.number < currentStep ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <div
                      className={`
                        font-bold text-sm
                        ${step.number === currentStep ? 'text-[#2D3436]' : 'text-gray-500'}
                      `}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {step.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Step Indicator */}
            <div className="md:hidden">
              <div className="flex items-center justify-center gap-2 mb-4">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className={`
                      flex-1 h-2 rounded-full transition-all duration-300
                      ${
                        step.number <= currentStep
                          ? step.number === currentStep
                            ? 'bg-[#FFD93D]'
                            : 'bg-[#4D96FF]'
                          : 'bg-gray-200'
                      }
                    `}
                  />
                ))}
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-[#2D3436]">
                  Step {currentStep} of {steps.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {steps[currentStep - 1].title}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          <div ref={stepContentRef} className="bg-white rounded-3xl shadow-2xl border-4 border-[#2D3436] p-8 md:p-12">
            {currentStep === 1 && <Step1PackageSelection />}
            {currentStep === 2 && <Step2TripDetails />}
            {currentStep === 3 && <Step3ContactInfo />}
            {currentStep === 4 && <Step4Payment />}
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Secure Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Instant Confirmation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function BookingLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF0D4] to-[#E8F4F8] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2D3436] mb-3">
            Book Your Ride
          </h1>
          <p className="text-lg text-[#636E72]">Loading booking form...</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-[#2D3436] p-8 md:p-12 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export default with Suspense wrapper
export default function BookingPage() {
  return (
    <Suspense fallback={<BookingLoading />}>
      <BookingPageContent />
    </Suspense>
  );
}
