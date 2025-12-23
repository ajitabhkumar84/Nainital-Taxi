'use client';

import { useBookingStore } from '@/store/bookingStore';
import { Button, Input } from '@/components/ui';
import { ArrowRight, ArrowLeft, User, Phone, Mail, MessageSquare } from 'lucide-react';

export default function Step3ContactInfo() {
  const {
    customerName,
    customerPhone,
    customerEmail,
    specialRequests,
    setCustomerName,
    setCustomerPhone,
    setCustomerEmail,
    setSpecialRequests,
    nextStep,
    prevStep,
  } = useBookingStore();

  const handleNext = () => {
    if (!customerName || !customerPhone) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(customerPhone)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    // Validate email if provided
    if (customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        alert('Please enter a valid email address');
        return;
      }
    }

    nextStep();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-[#2D3436] mb-2">
          Your Contact Details
        </h2>
        <p className="text-gray-600">
          We&apos;ll use these details to confirm your booking
        </p>
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-sm font-bold text-[#2D3436] mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter your full name"
            className="pl-12"
            required
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          As per your ID proof
        </p>
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-sm font-bold text-[#2D3436] mb-2">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <div className="flex">
            <div className="flex items-center px-4 py-3 bg-gray-100 border-4 border-r-0 border-[#2D3436] rounded-l-xl font-bold text-[#2D3436]">
              +91
            </div>
            <Input
              type="tel"
              value={customerPhone}
              onChange={(e) => {
                // Only allow numbers
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) {
                  setCustomerPhone(value);
                }
              }}
              placeholder="9876543210"
              className="rounded-l-none pl-4"
              maxLength={10}
              required
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          We&apos;ll send booking confirmation on WhatsApp
        </p>
      </div>

      {/* Email Address (Optional) */}
      <div>
        <label className="block text-sm font-bold text-[#2D3436] mb-2">
          Email Address (Optional)
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="pl-12"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          We&apos;ll send booking details via email too
        </p>
      </div>

      {/* Special Requests */}
      <div>
        <label className="block text-sm font-bold text-[#2D3436] mb-2">
          Special Requests (Optional)
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="e.g., Need child seat, Extra luggage space, Specific pickup time, etc."
            className="w-full pl-12 pr-4 py-3 rounded-xl border-4 border-[#2D3436] focus:border-[#4D96FF] focus:outline-none font-medium text-[#2D3436] placeholder-gray-400 transition-colors resize-none"
            rows={4}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Let us know if you have any special requirements
        </p>
      </div>

      {/* Privacy Note */}
      <div className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200">
        <div className="flex gap-3">
          <div className="text-blue-500 mt-0.5">🔒</div>
          <div className="text-sm text-blue-700">
            <p className="font-bold mb-1">Your privacy is protected</p>
            <p className="text-xs">
              We&apos;ll only use your contact details for this booking and important updates.
              We never share your information with third parties.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t-2 border-gray-200">
        <Button
          onClick={prevStep}
          variant="secondary"
          size="lg"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={!customerName || !customerPhone}
          size="lg"
          className="group"
        >
          Continue to Payment
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
