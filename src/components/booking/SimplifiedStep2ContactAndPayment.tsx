"use client";

import React, { useState } from "react";
import { useBookingStore } from "@/store/bookingStore";
import { Button } from "@/components/ui";
import { User, Phone, Mail, MessageCircle, CreditCard, Check, ArrowLeft } from "lucide-react";

export default function SimplifiedStep2ContactAndPayment() {
  const {
    customerName,
    customerPhone,
    customerEmail,
    customerWhatsapp,
    specialRequests,
    requiresChildSeat,
    setCustomerName,
    setCustomerPhone,
    setCustomerEmail,
    setCustomerWhatsapp,
    setSpecialRequests,
    setRequiresChildSeat,
    prevStep,
  } = useBookingStore();

  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!customerName || !customerPhone) {
      setError("Please fill in all required fields");
      return;
    }

    if (customerPhone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setError("");

    // TODO: Integrate with actual booking API
    console.log("Booking submitted:", useBookingStore.getState());

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-12 text-center">
        <div className="w-20 h-20 bg-whatsapp/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-whatsapp" />
        </div>
        <h2 className="text-3xl font-display text-ink mb-4">Booking Request Received!</h2>
        <p className="text-lg text-ink/70 font-body mb-6">
          We&apos;ll call you within 5 minutes to confirm your booking details.
        </p>
        <div className="bg-lake/10 border-2 border-lake rounded-lg p-6 mb-6">
          <p className="font-body text-ink mb-2">Our team will contact you at:</p>
          <p className="text-xl font-display text-teal">{customerPhone}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href={`tel:+918445206116`}>
            <Button variant="outline" size="lg">
              <Phone className="w-5 h-5 mr-2" />
              Call Us Now
            </Button>
          </a>
          <a
            href={`https://wa.me/918445206116?text=${encodeURIComponent(
              `Hi! I just submitted a booking request. My number is ${customerPhone}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="primary" size="lg">
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat on WhatsApp
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-8">
        <h2 className="text-2xl font-display text-ink mb-6">Contact Information</h2>

        {/* Name */}
        <div className="mb-6">
          <label className="block text-sm font-body font-bold text-ink mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Full Name *
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
          />
        </div>

        {/* Phone & WhatsApp */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-body font-bold text-ink mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Phone Number *
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-bold text-ink mb-2">
              <MessageCircle className="w-4 h-4 inline mr-2" />
              WhatsApp (Optional)
            </label>
            <input
              type="tel"
              value={customerWhatsapp || ""}
              onChange={(e) => setCustomerWhatsapp(e.target.value)}
              placeholder="WhatsApp number if different"
              className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-6">
          <label className="block text-sm font-body font-bold text-ink mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email (Optional)
          </label>
          <input
            type="email"
            value={customerEmail || ""}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
          />
        </div>

        {/* Special Requests */}
        <div className="mb-6">
          <label className="block text-sm font-body font-bold text-ink mb-2">
            Special Requests (Optional)
          </label>
          <textarea
            rows={3}
            value={specialRequests || ""}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Any special requirements?"
            className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
          />
        </div>

        {/* Child Seat */}
        <div className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requiresChildSeat}
              onChange={(e) => setRequiresChildSeat(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="font-body font-bold text-ink">I need a child seat</div>
              <div className="text-sm text-ink/60">Rs 300 per day</div>
            </div>
          </label>
        </div>

        {/* Payment Info */}
        <div className="bg-gradient-to-r from-sunshine/20 to-coral/20 border-2 border-ink rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <CreditCard className="w-6 h-6 text-ink shrink-0 mt-1" />
            <div>
              <h3 className="font-display text-lg text-ink mb-2">Payment Information</h3>
              <p className="text-sm text-ink/70 font-body mb-3">
                We&apos;ll call you to confirm the booking and discuss payment options:
              </p>
              <ul className="text-sm text-ink/70 font-body space-y-1">
                <li>• Pay advance online (UPI/Card)</li>
                <li>• Pay cash to driver</li>
                <li>• Pay after ride completion</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-coral/20 border-2 border-coral rounded-lg">
            <p className="text-sm font-body text-ink">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={prevStep} variant="outline" size="lg" className="sm:w-auto w-full">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <Button onClick={handleSubmit} variant="primary" size="lg" className="flex-1">
            <Check className="w-5 h-5 mr-2" />
            Confirm Booking Request
          </Button>
        </div>

        <p className="text-xs text-center text-ink/50 font-body mt-4">
          By confirming, you agree to our terms and conditions
        </p>
      </div>
    </div>
  );
}
