'use client';

import { useState } from 'react';
import { ChevronDown, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'How can I book a taxi with Nainital Taxi?',
    answer:
      'You can book a taxi by filling out our online form above, calling us directly at +918445206116, or sending us a message on WhatsApp. We respond instantly to all booking requests.',
  },
  {
    question: 'What are your operating hours?',
    answer:
      'We operate 24/7, 365 days a year. You can book a taxi or contact us anytime, day or night, including weekends and holidays.',
  },
  {
    question: 'Do you charge for cancellations?',
    answer:
      'We understand that plans change. Free cancellation is available up to 2 hours before your scheduled pickup time. Cancellations within 2 hours may incur a minimal charge.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept multiple payment methods including cash, UPI (Google Pay, PhonePe, Paytm), credit/debit cards, and bank transfers. Payment can be made before or after your journey.',
  },
  {
    question: 'Are your drivers experienced and verified?',
    answer:
      'Yes, all our drivers are highly experienced, licensed, and background-verified. They have extensive knowledge of the Nainital region and prioritize your safety and comfort. We maintain a strict zero-alcohol policy.',
  },
  {
    question: 'Do you provide airport and railway station pickup services?',
    answer:
      'Absolutely! We provide reliable pickup and drop services from Pantnagar Airport, Kathgodam Railway Station, and all major locations in Uttarakhand.',
  },
  {
    question: 'Can I request a specific vehicle type?',
    answer:
      'Yes, we have a diverse fleet including Sedans, SUVs, Innova Crysta, and Tempo Travellers. You can specify your preferred vehicle type when booking, and we\'ll do our best to accommodate your request.',
  },
  {
    question: 'What if I have extra luggage or special requirements?',
    answer:
      'Please inform us about extra luggage, child seats, wheelchair accessibility, or any special requirements when booking. We\'ll ensure your vehicle is equipped accordingly at no extra charge.',
  },
  {
    question: 'How do you calculate the taxi fare?',
    answer:
      'Our fares are transparent and competitive, based on distance, vehicle type, and route. You\'ll receive a clear quote before booking with no hidden charges. Check our rates page for detailed pricing.',
  },
  {
    question: 'Do you offer multi-day tour packages?',
    answer:
      'Yes, we offer customized multi-day tour packages covering popular destinations like Nainital, Kainchi Dham, Ranikhet, Almora, Jim Corbett, and more. Contact us to plan your perfect Kumaon Hills tour.',
  },
];

export default function ContactFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-lg font-body text-ink/70">
            Everything you need to know about booking with Nainital Taxi
          </p>
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

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
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
          <h3 className="text-2xl font-display text-ink mb-3">
            Still Have Questions?
          </h3>
          <p className="font-body text-ink/70 mb-6">
            Our team is here to help! Contact us anytime for personalized assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/918445206116?text=Hi%2C%20I%20have%20a%20question%20about%20your%20taxi%20services"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-whatsapp text-white px-6 py-3 rounded-xl font-display font-bold border-3 border-ink shadow-retro hover:shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              WhatsApp Us
            </a>
            <a
              href="tel:+918445206116"
              className="inline-flex items-center justify-center bg-teal text-white px-6 py-3 rounded-xl font-display font-bold border-3 border-ink shadow-retro hover:shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call: 8445206116
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
