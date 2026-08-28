'use client';

import { useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { capture } from '@/lib/analytics/capture';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { CTA_PLACEMENTS } from '@/lib/analytics/properties';

interface QuickEnquiryFormProps {
  onClose?: () => void;
}

export default function QuickEnquiryForm({ onClose }: QuickEnquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
    company: '', // honeypot — real users never fill this
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowError(false);
    setShowSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, source: 'mobile_quick_enquiry' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowSuccess(true);
        setFormData({ name: '', phone: '', message: '', company: '' });
        setTimeout(() => {
          setShowSuccess(false);
          onClose?.();
        }, 3000);
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Enquiry submission error:', error);
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = '918445206116';
    let whatsappMessage = `Hi, I would like to enquire about taxi services:\n\n`;
    if (formData.name) whatsappMessage += `Name: ${formData.name}\n`;
    if (formData.phone) whatsappMessage += `Phone: ${formData.phone}\n`;
    if (formData.message) whatsappMessage += `\nMessage: ${formData.message}`;

    capture(ANALYTICS_EVENTS.contactWhatsappClicked, {
      placement: CTA_PLACEMENTS.mobileEnquiryModal,
      context: 'form_prefilled',
    });

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-white to-sunshine/5 rounded-2xl shadow-retro-lg p-6 border-3 border-ink">
      <h3 className="text-2xl font-display text-ink mb-4">Quick Enquiry</h3>

      {showSuccess && (
        <div className="mb-4 p-3 bg-teal/10 border-2 border-teal rounded-xl">
          <p className="text-teal font-body font-semibold text-sm">
            ✓ Thank you! We&apos;ll contact you shortly.
          </p>
        </div>
      )}

      {showError && (
        <div className="mb-4 p-3 bg-coral/10 border-2 border-coral rounded-xl">
          <p className="text-coral font-body font-semibold text-sm">
            Something went wrong. Please try again or use WhatsApp.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot — hidden from real users, left open for bots. See
            /api/contact/route.ts for the server-side check. */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
          <label htmlFor="quick-company">Company</label>
          <input
            type="text"
            id="quick-company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
        </div>

        <div>
          <label htmlFor="quick-name" className="block text-sm font-bold font-body text-ink mb-2">
            Name <span className="text-coral">*</span>
          </label>
          <input
            type="text"
            id="quick-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-3 rounded-xl border-3 border-ink/20 focus:border-teal focus:ring-0 transition-all font-body"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="quick-phone" className="block text-sm font-bold font-body text-ink mb-2">
            Phone <span className="text-coral">*</span>
          </label>
          <input
            type="tel"
            id="quick-phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            pattern="[0-9]{10}"
            className="w-full px-4 py-3 rounded-xl border-3 border-ink/20 focus:border-teal focus:ring-0 transition-all font-body"
            placeholder="10-digit mobile number"
          />
        </div>

        <div>
          <label htmlFor="quick-message" className="block text-sm font-bold font-body text-ink mb-2">
            Message
          </label>
          <textarea
            id="quick-message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border-3 border-ink/20 focus:border-teal focus:ring-0 transition-all resize-none font-body"
            placeholder="Tell us about your trip..."
          />
        </div>

        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full inline-flex items-center justify-center"
            disabled={isSubmitting}
          >
            <Send className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Sending...' : 'Send Enquiry'}
          </Button>
          <button
            type="button"
            onClick={handleWhatsAppClick}
            className="w-full inline-flex items-center justify-center bg-whatsapp text-white px-6 py-3 rounded-xl font-bold font-body border-3 border-ink shadow-retro hover:shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            WhatsApp Instead
          </button>
        </div>
      </form>
    </div>
  );
}
