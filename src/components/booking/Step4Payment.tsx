'use client';

import { useState } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { Button } from '@/components/ui';
import { ArrowLeft, Copy, Check, MessageCircle, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { generateWhatsAppLink, generateEmailLink, generateBookingSummary } from '@/lib/messageGenerators';
import Image from 'next/image';

const UPI_ID = '7351721351@upi';
const PAYTM_NUMBER = '7351721351';
const WHATSAPP_NUMBER = '8445206116';

export default function Step4Payment() {
  const booking = useBookingStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const summary = generateBookingSummary(booking);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      alert('Failed to copy. Please copy manually.');
    }
  };

  const handleWhatsAppShare = () => {
    const link = generateWhatsAppLink(booking);
    window.open(link, '_blank');
  };

  const handleEmailShare = () => {
    const link = generateEmailLink(booking);
    window.location.href = link;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-[#2D3436] mb-2">
          Complete Your Booking
        </h2>
        <p className="text-gray-600">
          Review your booking and make payment
        </p>
      </div>

      {/* Booking Summary */}
      <div className="p-6 rounded-2xl border-4 border-[#2D3436] bg-white">
        <h3 className="font-bold text-lg text-[#2D3436] mb-4">
          📋 Booking Summary
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Package:</span>
            <span className="font-bold text-[#2D3436]">{summary.package}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Vehicle:</span>
            <span className="font-bold text-[#2D3436]">{summary.vehicle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-bold text-[#2D3436]">{summary.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-bold text-[#2D3436]">{summary.time}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Passengers:</span>
            <span className="font-bold text-[#2D3436]">{summary.passengers}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pickup:</span>
            <span className="font-bold text-[#2D3436] text-right">{summary.pickup}</span>
          </div>
          {booking.seasonName && (
            <div className="flex justify-between">
              <span className="text-gray-600">Season:</span>
              <span className="font-bold text-[#2D3436]">{summary.season}</span>
            </div>
          )}
          <div className="pt-3 border-t-2 border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-bold">Total Amount:</span>
              <span className="text-3xl font-bold text-[#2D3436]">{summary.price}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="p-6 rounded-2xl border-4 border-[#FFD93D] bg-[#FFF8E7]">
        <h3 className="font-bold text-lg text-[#2D3436] mb-4 flex items-center gap-2">
          💳 Payment Instructions
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFD93D] flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-bold text-[#2D3436]">Pay via UPI</p>
              <p className="text-sm text-gray-600">
                Use any UPI app (Paytm, PhonePe, Google Pay, etc.)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFD93D] flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-bold text-[#2D3436]">Take Screenshot</p>
              <p className="text-sm text-gray-600">
                After payment, take a screenshot of the confirmation
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#FFD93D] flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-bold text-[#2D3436]">Share on WhatsApp</p>
              <p className="text-sm text-gray-600">
                Click the button below to share booking details with us
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* UPI Payment Details */}
      <div className="p-6 rounded-2xl border-4 border-[#4D96FF] bg-[#E8F4F8]">
        <h3 className="font-bold text-lg text-[#2D3436] mb-4">
          💰 UPI Payment Details
        </h3>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-2xl border-4 border-[#2D3436] shadow-[4px_4px_0px_#2D3436]">
            <Image
              src="/nainital-upi.jpg"
              alt="UPI QR Code"
              width={250}
              height={250}
              className="rounded-xl"
            />
            <p className="text-center text-sm text-gray-600 mt-2">
              Scan to pay with any UPI app
            </p>
          </div>
        </div>

        {/* UPI ID */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-[#2D3436] mb-2">
              UPI ID
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-white rounded-xl border-4 border-[#2D3436] font-bold text-[#2D3436]">
                {UPI_ID}
              </div>
              <Button
                onClick={() => copyToClipboard(UPI_ID, 'upi')}
                variant="secondary"
                className="flex-shrink-0"
              >
                {copiedField === 'upi' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#2D3436] mb-2">
              PayTM Number
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-white rounded-xl border-4 border-[#2D3436] font-bold text-[#2D3436]">
                {PAYTM_NUMBER}
              </div>
              <Button
                onClick={() => copyToClipboard(PAYTM_NUMBER, 'paytm')}
                variant="secondary"
                className="flex-shrink-0"
              >
                {copiedField === 'paytm' ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#2D3436] mb-2">
              Account Name
            </label>
            <div className="px-4 py-3 bg-white rounded-xl border-4 border-[#2D3436] font-bold text-[#2D3436]">
              Go Kumaon
            </div>
          </div>
        </div>
      </div>

      {/* Share Booking Details */}
      <div className="p-6 rounded-2xl border-4 border-[#25D366] bg-green-50">
        <h3 className="font-bold text-lg text-[#2D3436] mb-4 flex items-center gap-2">
          📤 Share Booking Details
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          After making payment, click below to share your booking details and payment screenshot with us
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <Button
            onClick={handleWhatsAppShare}
            className="bg-[#25D366] hover:bg-[#20BA59] border-[#25D366] text-white h-auto py-4"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            <div className="text-left">
              <div className="font-bold">Share on WhatsApp</div>
              <div className="text-xs opacity-90">Preferred method</div>
            </div>
          </Button>

          <Button
            onClick={handleEmailShare}
            variant="secondary"
            className="h-auto py-4"
          >
            <Mail className="w-5 h-5 mr-2" />
            <div className="text-left">
              <div className="font-bold">Share via Email</div>
              <div className="text-xs opacity-70">Alternative method</div>
            </div>
          </Button>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-white border-2 border-green-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-bold mb-1">Important:</p>
              <p>
                Your booking will be confirmed once we verify your payment screenshot.
                You&apos;ll receive a confirmation message within 15 minutes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <div className="p-6 rounded-2xl border-2 border-gray-200 bg-gray-50">
        <h3 className="font-bold text-[#2D3436] mb-3">
          Need Help?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          If you face any issues with payment, feel free to contact us directly
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={`https://wa.me/91${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20BA59] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Support
          </a>
          <a
            href={`tel:+91${WHATSAPP_NUMBER}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4D96FF] text-white rounded-xl font-bold hover:bg-[#3D86EF] transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call Us
          </a>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t-2 border-gray-200">
        <Button
          onClick={booking.prevStep}
          variant="secondary"
          size="lg"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleWhatsAppShare}
          size="lg"
          className="bg-[#25D366] hover:bg-[#20BA59] border-[#25D366]"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Share on WhatsApp
        </Button>
      </div>
    </div>
  );
}
