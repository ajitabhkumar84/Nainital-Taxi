"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FAQAccordionItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQAccordionItem[];
}

// Reusable animated expand/collapse accordion, extracted from
// ContactFAQ.tsx's inline pattern so other pages (e.g. Multi-Day Rental)
// don't have to duplicate it or fall back to a plain native <details>.
export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-sunrise rounded-2xl shadow-retro overflow-hidden border-3 border-ink hover:shadow-retro-lg transition-shadow"
        >
          <button
            type="button"
            onClick={() => toggle(index)}
            className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-sunshine/10 transition-colors"
            aria-expanded={openIndex === index}
          >
            <span className="text-lg font-display text-ink pr-8">{item.question}</span>
            <ChevronDown
              className={`w-6 h-6 text-teal flex-shrink-0 transform transition-transform duration-300 ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openIndex === index ? "max-h-96" : "max-h-0"
            }`}
          >
            <div className="px-6 py-5 bg-white border-t-3 border-ink">
              <p className="font-body text-ink/80 leading-relaxed">{item.answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
