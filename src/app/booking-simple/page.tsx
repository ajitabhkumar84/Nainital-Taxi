"use client";

import { Suspense } from "react";
import { useBookingStore } from "@/store/bookingStore";
import { CheckCircle2, Shield, Star, Users, Award } from "lucide-react";
import { Header, Footer } from "@/components/ui";
import SimplifiedStep1BookingDetails from "@/components/booking/SimplifiedStep1BookingDetails";
import SimplifiedStep2ContactAndPayment from "@/components/booking/SimplifiedStep2ContactAndPayment";

const steps = [
  { number: 1, title: "Booking Details", description: "Route, vehicle & date" },
  { number: 2, title: "Contact & Confirm", description: "Your details" },
];

export default function SimplifiedBookingPage() {
  const currentStep = useBookingStore((state) => state.currentStep);

  // Map 4-step store to 2-step display
  // Steps 1-3 from store = Step 1 display
  // Step 4 from store = Step 2 display
  const displayStep = currentStep <= 3 ? 1 : 2;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-sunrise/30 via-white to-lake/30 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-display text-ink mb-3">
              Book Your Ride
            </h1>
            <p className="text-lg text-ink/70 font-body mb-6">
              Quick 2-step booking process
            </p>

            {/* Trust Signals */}
            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <div className="w-10 h-10 bg-teal/20 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-teal fill-teal" />
                </div>
                <div className="text-left">
                  <div className="font-bold">4.8/5 Rating</div>
                  <div className="text-xs text-ink/60">Google Reviews</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <div className="w-10 h-10 bg-whatsapp/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-whatsapp" />
                </div>
                <div className="text-left">
                  <div className="font-bold">500+ Happy</div>
                  <div className="text-xs text-ink/60">Customers</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <div className="w-10 h-10 bg-coral/20 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-coral" />
                </div>
                <div className="text-left">
                  <div className="font-bold">100% Safe</div>
                  <div className="text-xs text-ink/60">Verified Drivers</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <div className="w-10 h-10 bg-sunshine/30 rounded-full flex items-center justify-center">
                  <Award className="w-5 h-5 text-ink" />
                </div>
                <div className="text-left">
                  <div className="font-bold">15+ Years</div>
                  <div className="text-xs text-ink/60">Experience</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="mb-12">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-0 right-0 h-1 bg-ink/20 -z-10">
                  <div
                    className="h-full bg-teal transition-all duration-500"
                    style={{ width: `${((displayStep - 1) / 1) * 100}%` }}
                  />
                </div>

                {/* Steps */}
                {steps.map((step) => (
                  <div key={step.number} className="flex flex-col items-center flex-1">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center
                        font-bold text-lg transition-all duration-300
                        border-4 border-white shadow-lg
                        ${
                          step.number < displayStep
                            ? "bg-teal text-white"
                            : step.number === displayStep
                            ? "bg-sunshine text-ink animate-pulse"
                            : "bg-white text-ink/40 border-ink/20"
                        }
                      `}
                    >
                      {step.number < displayStep ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <div
                        className={`
                          font-body font-bold text-sm
                          ${step.number === displayStep ? "text-ink" : "text-ink/50"}
                        `}
                      >
                        {step.title}
                      </div>
                      <div className="text-xs text-ink/40 mt-1 hidden sm:block">
                        {step.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <Suspense fallback={<div>Loading...</div>}>
            {displayStep === 1 && <SimplifiedStep1BookingDetails />}
            {displayStep === 2 && <SimplifiedStep2ContactAndPayment />}
          </Suspense>
        </div>
      </div>
      <Footer />
    </>
  );
}
