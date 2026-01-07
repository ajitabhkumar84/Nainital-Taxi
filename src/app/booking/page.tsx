'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBookingStore, BookingType } from '@/store/bookingStore';
import { CheckCircle2 } from 'lucide-react';
import Step1PackageSelection from '@/components/booking/Step1PackageSelection';
import Step2TripDetails from '@/components/booking/Step2TripDetails';
import Step3ContactInfo from '@/components/booking/Step3ContactInfo';
import Step4Payment from '@/components/booking/Step4Payment';

const steps = [
  { number: 1, title: 'Package & Vehicle', description: 'Select your ride' },
  { number: 2, title: 'Trip Details', description: 'When & where' },
  { number: 3, title: 'Contact Info', description: 'Your details' },
  { number: 4, title: 'Payment', description: 'Complete booking' },
];

// Wrapper component to handle URL params
function BookingPageContent() {
  const searchParams = useSearchParams();
  const currentStep = useBookingStore((state) => state.currentStep);
  const setPackage = useBookingStore((state) => state.setPackage);
  const setBookingType = useBookingStore((state) => state.setBookingType);
  const packageId = useBookingStore((state) => state.packageId);

  // Pre-populate from URL parameters
  useEffect(() => {
    const urlPackageId = searchParams.get('packageId');
    const urlPackageTitle = searchParams.get('packageTitle');
    const urlPackageType = searchParams.get('packageType') as BookingType | null;

    // Only pre-populate if we have URL params AND no package is already selected
    if (urlPackageId && urlPackageTitle && !packageId) {
      setPackage(urlPackageId, decodeURIComponent(urlPackageTitle));
      if (urlPackageType) {
        setBookingType(urlPackageType);
      }
    }
  }, [searchParams, packageId, setPackage, setBookingType]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF0D4] to-[#E8F4F8] pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2D3436] mb-3">
            Book Your Ride
          </h1>
          <p className="text-lg text-[#636E72]">
            Complete your booking in 4 easy steps
          </p>
        </div>

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
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-[#2D3436] p-8 md:p-12">
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
