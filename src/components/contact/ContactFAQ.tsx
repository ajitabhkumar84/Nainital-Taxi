'use client';

import { useState } from 'react';
import { ChevronDown, MessageCircle, Phone } from 'lucide-react';
import type { ContactFaqItem } from '@/lib/supabase/types';
import { captureContactClick } from '@/lib/analytics/capture';
import { CTA_PLACEMENTS } from '@/lib/analytics/properties';

interface ContactFAQProps {
  heading?: string;
  subheading?: string;
  faqs?: ContactFaqItem[];
  ctaHeading?: string;
  ctaDescription?: string;
  whatsappNumber?: string;
  phoneNumber?: string;
}

export default function ContactFAQ({
  heading = 'Frequently Asked Questions',
  subheading = 'Everything you need to know about booking with Nainital Taxi',
  faqs = [],
  ctaHeading = 'Still Have Questions?',
  ctaDescription = 'Our team is here to help! Contact us anytime for personalized assistance.',
  whatsappNumber = '918445206116',
  phoneNumber = '+918445206116',
}: ContactFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    'Hi, I have a question about your taxi services'
  )}`;

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3">{heading}</h2>
          <p className="text-lg font-body text-ink/70">{subheading}</p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-sunrise rounded-2xl shadow-retro overflow-hidden border-3 border-ink hover:shadow-retro-lg transition-shadow"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-sunshine/10 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="text-lg font-display text-ink pr-8">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-6 h-6 text-teal flex-shrink-0 transform transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* max-h is the open-state ceiling, not a design measurement:
                  answers are admin-editable now, so it has to clear the longest
                  one anyone might write or the text is silently clipped. */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-[1500px]' : 'max-h-0'
                }`}
              >
                <div className="px-6 py-5 bg-white border-t-3 border-ink">
                  <p className="font-body text-ink/80 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions CTA */}
        <div className="mt-10 text-center bg-gradient-to-br from-sunshine/20 to-teal/20 rounded-2xl p-8 border-3 border-ink shadow-retro">
          <h3 className="text-2xl font-display text-ink mb-3">{ctaHeading}</h3>
          <p className="font-body text-ink/70 mb-6">{ctaDescription}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-analytics-cta="whatsapp"
              onClick={() => captureContactClick(whatsappUrl, CTA_PLACEMENTS.contactFaq)}
              className="inline-flex items-center justify-center bg-whatsapp text-white px-6 py-3 rounded-xl font-display font-bold border-3 border-ink shadow-retro hover:shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp Us
            </a>
            <a
              href={`tel:${phoneNumber}`}
              data-analytics-cta="call"
              onClick={() => captureContactClick(`tel:${phoneNumber}`, CTA_PLACEMENTS.contactFaq)}
              className="inline-flex items-center justify-center bg-teal text-white px-6 py-3 rounded-xl font-display font-bold border-3 border-ink shadow-retro hover:shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call: {phoneNumber}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
