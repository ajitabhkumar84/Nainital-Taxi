"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PackageFAQ as FAQType } from "@/lib/supabase/types";

interface PackageFAQProps {
  faqs: FAQType[];
}

export default function PackageFAQ({ faqs }: PackageFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-lake/10">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3 flex items-center justify-center gap-3">
            <HelpCircle className="w-8 h-8 text-teal" />
            Frequently Asked Questions
          </h2>
          <p className="text-ink/60 font-body">
            Everything you need to know
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border-3 border-ink overflow-hidden shadow-retro-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 hover:bg-sunrise/10 transition-colors"
              >
                <span className="font-display text-lg text-ink">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-ink/60 flex-shrink-0 transition-transform",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openIndex === index ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="px-4 md:px-5 pb-4 md:pb-5 border-t-2 border-ink/10 pt-4">
                  <p className="font-body text-ink/80 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
