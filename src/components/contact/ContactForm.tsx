'use client';

import { useState } from 'react';
import { User, MapPin, Car, Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui';

interface ContactFormProps {
  formTitle?: string;
  formDescription?: string;
  whatsappNumber?: string;
}

export default function ContactForm({
  formTitle = "Request a Free Quote",
  formDescription = "Fill out the form below and our team will get back to you shortly to confirm your booking.",
  whatsappNumber = '918445206116',
}: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // React pools the event across the await below, so grab the form node now.
    const form = e.currentTarget;
    setIsSubmitting(true);
    setErrorMessage('');
    setShowSuccess(false);

    try {
      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        pickup: formData.get('pickup'),
        drop: formData.get('drop'),
        date: formData.get('date'),
        time: formData.get('time'),
        passengers: formData.get('passengers'),
        vehicle: formData.get('vehicle'),
        message: formData.get('message'),
        company: formData.get('company'), // honeypot — real users never fill this
        source: 'contact_page',
      };

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        form.reset();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        throw new Error(result.error || 'Form submission failed');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      // Surface the server's own wording where there is one — it distinguishes
      // "rate limited", "invalid phone" and "we could not deliver this" from
      // each other, which a single generic string cannot.
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = () => {
    const form = document.getElementById('contact-form') as HTMLFormElement;
    const formData = new FormData(form);

    const name = formData.get('name');
    const phone = formData.get('phone');
    const pickup = formData.get('pickup');
    const drop = formData.get('drop');
    const date = formData.get('date');
    const time = formData.get('time');
    const passengers = formData.get('passengers');
    const vehicle = formData.get('vehicle');
    const message = formData.get('message');

    let whatsappMessage = `Hi, I would like to book a taxi:\n\n`;
    whatsappMessage += `Name: ${name}\n`;
    whatsappMessage += `Phone: ${phone}\n`;
    whatsappMessage += `Pickup: ${pickup}\n`;
    whatsappMessage += `Drop: ${drop}\n`;
    whatsappMessage += `Date: ${date}\n`;
    if (time) whatsappMessage += `Time: ${time}\n`;
    whatsappMessage += `Passengers: ${passengers}\n`;
    whatsappMessage += `Vehicle: ${vehicle}\n`;
    if (message) whatsappMessage += `\nAdditional Info: ${message}`;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display text-ink mb-3">
            {formTitle}
          </h2>
          <p className="text-lg font-body text-ink/70">
            {formDescription}
          </p>
        </div>

        <form
          id="contact-form"
          onSubmit={handleSubmit}
          className="bg-gradient-to-br from-white to-sunshine/5 rounded-3xl shadow-retro-lg p-6 md:p-8 border-3 border-ink"
        >

          {/* Honeypot — hidden from real users, left open for bots. Positioned
              off-screen rather than display:none, since unsophisticated bots
              skip display:none fields. Server silently discards submissions
              that fill it (see /api/contact/route.ts). */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
            <label htmlFor="company">Company</label>
            <input
              type="text"
              id="company"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
          </div>

          {/* Your Information */}
          <div className="mb-6">
            <h3 className="text-xl font-display text-ink mb-4 flex items-center">
              <div className="w-8 h-8 bg-teal/20 rounded-full flex items-center justify-center mr-2">
                <User className="w-5 h-5 text-teal" />
              </div>
              Your Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-bold font-body text-ink mb-2">
                  Full Name <span className="text-coral">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-4 py-3 rounded-xl border-3 border-ink/20 focus:border-teal focus:ring-0 transition-all font-body"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-bold font-body text-ink mb-2">
                  Phone Number <span className="text-coral">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  pattern="[0-9]{10}"
                  className="w-full px-4 py-3 rounded-xl border-3 border-ink/20 focus:border-teal focus:ring-0 transition-all font-body"
                  placeholder="10-digit mobile number"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-bold font-body text-ink mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-4 py-3 rounded-xl border-3 border-ink/20 focus:border-teal focus:ring-0 transition-all font-body"
                  placeholder="your.email@example.com (Optional)"
                />
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="mb-6">
            <h3 className="text-xl font-display text-ink mb-4 flex items-center">
              <div className="w-8 h-8 bg-sunshine/30 rounded-full flex items-center justify-center mr-2">
                <MapPin className="w-5 h-5 text-ink" />
              </div>
              Trip Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pickup" className="block text-sm font-bold font-body text-ink mb-2">
                  Pickup Location <span className="text-coral">*</span>
                </label>
                <input
                  type="text"
                  id="pickup"
                  name="pickup"
                  required
                  className="w-full px-4 py-3 rounded-xl border-3 border-ink/20 focus:border-teal focus:ring-0 transition-all font-body"
                  placeholder="e.g., Kathgodam Railway Station"
                />
              </div>
              <div>
                <label htmlFor="drop" className="block text-sm font-bold font-body text-ink mb-2">
                  Drop Location <span className="text-coral">*</span>
                </label>
                <input
                  type="text"
                  id="drop"
                  name="drop"
                  required
                  className="w-full px-4 py-3 rounded-xl border-3 border-ink/20 focus:border-teal focus:ring-0 transition-all font-body"
                  placeholder="e.g., Nainital"
                />
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-bold font-body text-ink mb-2">
                  Travel Date <span className="text-coral">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  className="w-full px-4 py-3 rounded-xl border-3 border-ink/20 focus:border-teal focus:ring-0 transition-all font-body"
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-bold font-body text-ink mb-2">
                  Preferred Time
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  className="w-full px-4 py-3 rounded-xl border-3 border-ink/20 focus:border-teal focus:ring-0 transition-all font-body"
                />
              </div>
            </div>
          </div>

          {/* Vehicle & Passengers */}
          <div className="mb-6">
            <h3 className="text-xl font-display text-ink mb-4 flex items-center">
              <div className="w-8 h-8 bg-coral/20 rounded-full flex items-center justify-center mr-2">
                <Car className="w-5 h-5 text-coral" />
              </div>
              Vehicle & Passengers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="passengers" className="block text-sm font-bold font-body text-ink mb-2">
                  Number of Passengers
                </label>
                <select
                  id="passengers"
                  name="passengers"
                  className="w-full px-4 py-3 rounded-xl border-3 border-ink/20 focus:border-teal focus:ring-0 transition-all font-body"
                >
                  <option value="1-4">1-4 Passengers (Sedan)</option>
                  <option value="5-7">5-7 Passengers (SUV / Innova / Crysta)</option>
                  <option value="8-12">8-12 Passengers (Tempo Traveller)</option>
                  <option value="12+">12+ Passengers (Mini Bus)</option>
                </select>
              </div>
              <div>
                <label htmlFor="vehicle" className="block text-sm font-bold font-body text-ink mb-2">
                  Preferred Vehicle Type
                </label>
                <select
                  id="vehicle"
                  name="vehicle"
                  className="w-full px-4 py-3 rounded-xl border-3 border-ink/20 focus:border-teal focus:ring-0 transition-all font-body"
                >
                  <option value="any">Any Available</option>
                  <option value="sedan">Sedan (Dzire/Etios)</option>
                  <option value="suv">SUV (Ertiga/XUV)</option>
                  <option value="innova">Innova Crysta</option>
                  <option value="tempo">Tempo Traveller</option>
                </select>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label htmlFor="message" className="block text-sm font-bold font-body text-ink mb-2">
              Additional Requirements or Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border-3 border-ink/20 focus:border-teal focus:ring-0 transition-all resize-none font-body"
              placeholder="Tell us about any special requirements, luggage, child seats, etc."
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="flex-1 inline-flex items-center justify-center"
              disabled={isSubmitting}
            >
              <Send className="w-5 h-5 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="flex-1 inline-flex items-center justify-center bg-transparent text-whatsapp px-8 py-4 rounded-xl font-bold font-body border-3 border-whatsapp hover:bg-whatsapp/10 transition-all"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Send via WhatsApp
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mt-6 p-4 bg-teal/10 border-3 border-teal rounded-xl">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-teal mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-teal font-body font-semibold">Thank you! We&apos;ll contact you shortly.</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-6 p-4 bg-coral/10 border-3 border-coral rounded-xl">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-coral mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-coral font-body font-semibold">{errorMessage}</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
