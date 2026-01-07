"use client";

import React from "react";
import { Phone, MessageCircle, Info } from "lucide-react";
import { BookingInstructions as BookingInstructionsType } from "@/lib/supabase/types";

interface BookingInstructionsProps {
  instructions: BookingInstructionsType;
}

export default function BookingInstructions({ instructions }: BookingInstructionsProps) {
  if (!instructions || !instructions.steps || instructions.steps.length === 0) {
    return null;
  }

  const whatsappNumber = instructions.whatsapp_number || "917351721351";
  const phoneNumber = instructions.contact_phone || "7351721351";
  const message = instructions.whatsapp_message || "Hi, I want to book this package";

  return (
    <section className="py-12 md:py-16 bg-gradient-to-br from-sunshine/20 to-white">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3">
            How to <span className="text-teal">Book</span>
          </h2>
          <p className="text-ink/60 font-body">
            Simple {instructions.steps.length}-step booking process
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
          {instructions.steps.map((step) => (
            <div
              key={step.step_number}
              className="relative bg-white rounded-2xl border-3 border-ink p-6 shadow-retro-sm hover:shadow-retro transition-all"
            >
              {/* Step Number */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-teal to-lake text-white rounded-full flex items-center justify-center font-display text-2xl font-bold shadow-lg border-3 border-ink">
                {step.step_number}
              </div>

              <div className="pt-6 text-center">
                <h3 className="text-xl font-display text-ink mb-2">
                  {step.title}
                </h3>
                <p className="text-ink/70 font-body text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Phone CTA */}
          {phoneNumber && (
            <a
              href={`tel:${phoneNumber}`}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-ink to-ink/90 text-sunshine px-8 py-4 rounded-xl font-body font-bold hover:shadow-retro transition-all border-3 border-ink shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <Phone className="w-6 h-6" />
              Call Now: {phoneNumber}
            </a>
          )}

          {/* WhatsApp CTA */}
          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-whatsapp to-[#1fb855] text-white px-8 py-4 rounded-xl font-body font-bold hover:shadow-retro transition-all border-3 border-ink shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <MessageCircle className="w-6 h-6" />
              WhatsApp Us
            </a>
          )}
        </div>

        {/* Additional Notes */}
        {instructions.additional_notes && (
          <div className="mt-8 bg-lake/10 rounded-xl p-6 border-2 border-lake/30">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-lake flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-body font-semibold text-ink mb-1">
                  Additional Information
                </h4>
                <p className="text-ink/70 font-body text-sm leading-relaxed">
                  {instructions.additional_notes}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
