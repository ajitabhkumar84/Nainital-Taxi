'use client';

import { useState, useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { Button } from '@/components/ui';
import {
  ArrowLeft,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  UserCheck,
  Heart,
} from 'lucide-react';
import Image from 'next/image';
import { calculateAdvanceAmount, formatPrice } from '@/lib/booking';

const UPI_ID = 'gokumaon@ptyes';
const WHATSAPP_NUMBER = '8445206116';

export default function Step4Payment() {
  const booking = useBookingStore();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isBookingCreated, setIsBookingCreated] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [createdAdvanceAmount, setCreatedAdvanceAmount] = useState<number | null>(null);

  // Calculate advance amount
  const totalAmount = booking.calculatedPrice || 0;
  const advanceAmount = calculateAdvanceAmount(totalAmount);
  const remainingAmount = totalAmount - advanceAmount;

  // Check if booking was already created (from store)
  useEffect(() => {
    if (booking.isBookingComplete && booking.bookingId) {
      setIsBookingCreated(true);
      setCreatedBookingId(booking.bookingId);
      setCreatedAdvanceAmount(booking.advanceAmount);
    }
  }, [booking.isBookingComplete, booking.bookingId, booking.advanceAmount]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      alert('Failed to copy. Please copy manually.');
    }
  };

  // Create booking via API
  const handleSubmitBooking = async () => {
    if (isBookingCreated) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: booking.customerName,
          customerPhone: booking.customerPhone,
          customerEmail: booking.customerEmail || undefined,
          packageId: booking.packageId || undefined,
          packageName: booking.packageTitle || 'Custom Booking',
          vehicleType: booking.vehicleType,
          tripDate: booking.tripDate,
          tripTime: booking.tripTime,
          pickupLocation: booking.pickupLocation,
          dropoffLocation: booking.dropoffLocation || undefined,
          passengers: booking.passengerCount,
          totalAmount: totalAmount,
          seasonName: booking.seasonName || 'Off-Season',
          specialRequests: booking.specialRequests || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      // Update store with booking result
      booking.setBookingResult(data.bookingId, data.advanceAmount);

      // Update local state
      setCreatedBookingId(data.bookingId);
      setCreatedAdvanceAmount(data.advanceAmount);
      setIsBookingCreated(true);
    } catch (error) {
      console.error('Booking creation error:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to create booking. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate WhatsApp message with booking ID and advance
  const generateWhatsAppMessage = () => {
    const bookingIdText = createdBookingId || 'Pending';
    const advanceText = createdAdvanceAmount || advanceAmount;

    const message = `Hi, I have made the advance payment for my booking.

*Booking ID:* ${bookingIdText}

*Booking Details:*
- Package: ${booking.packageTitle || 'Custom Booking'}
- Vehicle: ${booking.vehicleType}
- Date: ${booking.tripDate}
- Time: ${booking.tripTime}
- Pickup: ${booking.pickupLocation}
- Passengers: ${booking.passengerCount}

*Payment:*
- Total Amount: ${formatPrice(totalAmount)}
- Advance Paid: ${formatPrice(advanceText)}
- Remaining: ${formatPrice(totalAmount - advanceText)}

*Customer:*
- Name: ${booking.customerName}
- Phone: ${booking.customerPhone}
${booking.customerEmail ? `- Email: ${booking.customerEmail}` : ''}

Please confirm my booking. I will share the payment screenshot shortly.`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppShare = () => {
    const link = `https://wa.me/91${WHATSAPP_NUMBER}?text=${generateWhatsAppMessage()}`;
    window.open(link, '_blank');
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(
      `Booking Confirmation - ${createdBookingId || booking.packageTitle}`
    );
    const body = generateWhatsAppMessage();
    window.location.href = `mailto:bookings@nainitaltaxi.in?subject=${subject}&body=${body}`;
  };

  const handleNewBooking = () => {
    booking.resetBooking();
    window.location.href = '/booking';
  };

  // Success State - Booking Created
  if (isBookingCreated && createdBookingId) {
    return (
      <div className="space-y-8">
        {/* Success Header */}
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-[#2D3436] mb-2">Booking Created!</h2>
          <p className="text-gray-600">Please complete the payment to confirm your booking</p>
        </div>

        {/* Booking ID */}
        <div className="p-6 rounded-2xl border-4 border-green-500 bg-green-50 text-center">
          <p className="text-sm text-gray-600 mb-2">Your Booking ID</p>
          <p className="text-4xl font-bold text-green-700 tracking-wider">{createdBookingId}</p>
          <p className="text-sm text-gray-500 mt-2">Save this ID for future reference</p>
        </div>

        {/* Payment Summary */}
        <div className="p-6 rounded-2xl border-4 border-[#2D3436] bg-white">
          <h3 className="font-bold text-lg text-[#2D3436] mb-4">Payment Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b-2 border-gray-200">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-bold text-xl text-[#2D3436]">{formatPrice(totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-green-50 -mx-6 px-6 border-y-2 border-green-200">
              <div>
                <span className="font-bold text-green-700">Advance Payment</span>
                <span className="text-sm text-green-600 ml-2">(25%)</span>
              </div>
              <span className="font-bold text-2xl text-green-700">
                {formatPrice(createdAdvanceAmount || advanceAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="text-gray-600">Pay to Driver</span>
              <span className="font-bold text-lg text-[#2D3436]">{formatPrice(remainingAmount)}</span>
            </div>
          </div>
        </div>

        {/* UPI Payment Details */}
        <div className="p-6 rounded-2xl border-4 border-[#4D96FF] bg-[#E8F4F8]">
          <h3 className="font-bold text-lg text-[#2D3436] mb-4">Pay Advance via UPI</h3>

          {/* QR Code */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white rounded-2xl border-4 border-[#2D3436] shadow-[4px_4px_0px_#2D3436]">
              <Image
                src="/nainital-upi.jpg"
                alt="UPI QR Code"
                width={200}
                height={200}
                className="rounded-xl"
              />
              <p className="text-center text-sm text-gray-600 mt-2">Scan to pay</p>
            </div>
          </div>

          {/* UPI ID */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-[#2D3436] mb-2">UPI ID</label>
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
              <label className="block text-sm font-bold text-[#2D3436] mb-2">Account Name</label>
              <div className="px-4 py-3 bg-white rounded-xl border-4 border-[#2D3436] font-bold text-[#2D3436]">
                Go Kumaon
              </div>
            </div>
          </div>
        </div>

        {/* Share on WhatsApp */}
        <div className="p-6 rounded-2xl border-4 border-[#25D366] bg-green-50">
          <h3 className="font-bold text-lg text-[#2D3436] mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            Share Payment Screenshot
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            After making payment, share your booking details and payment screenshot with us on
            WhatsApp
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <Button
              onClick={handleWhatsAppShare}
              className="bg-[#25D366] hover:bg-[#20BA59] border-[#25D366] text-white h-auto py-4"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              <div className="text-left">
                <div className="font-bold">Share on WhatsApp</div>
                <div className="text-xs opacity-90">Recommended</div>
              </div>
            </Button>

            <Button onClick={handleEmailShare} variant="secondary" className="h-auto py-4">
              <Mail className="w-5 h-5 mr-2" />
              <div className="text-left">
                <div className="font-bold">Share via Email</div>
                <div className="text-xs opacity-70">Alternative</div>
              </div>
            </Button>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-white border-2 border-green-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-bold mb-1">Your booking will be confirmed once we verify your payment.</p>
                <p>You&apos;ll receive confirmation within 15 minutes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact & New Booking */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={`https://wa.me/91${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20BA59] transition-colors"
          >
            <Phone className="w-4 h-4" />
            Need Help?
          </a>
          <Button onClick={handleNewBooking} variant="secondary" className="flex-1">
            Create New Booking
          </Button>
        </div>
      </div>
    );
  }

  // Pre-submission State
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-[#2D3436] mb-2">Complete Your Booking</h2>
        <p className="text-gray-600">Review your booking and submit to proceed with payment</p>
      </div>

      {/* Safety Trust Badges */}
      <div className="p-4 rounded-2xl border-2 border-teal/30 bg-teal/5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-teal" />
          <span className="font-bold text-[#2D3436]">You&apos;re booking with a trusted service</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-teal" />
            </div>
            <span className="text-gray-600">Verified Drivers</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-coral" />
            </div>
            <span className="text-gray-600">Zero Alcohol</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-sunshine/30 flex items-center justify-center">
              <Heart className="w-4 h-4 text-ink" />
            </div>
            <span className="text-gray-600">Family-First</span>
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="p-6 rounded-2xl border-4 border-[#2D3436] bg-white">
        <h3 className="font-bold text-lg text-[#2D3436] mb-4">Booking Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Package:</span>
            <span className="font-bold text-[#2D3436]">{booking.packageTitle || 'Custom'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Vehicle:</span>
            <span className="font-bold text-[#2D3436]">{booking.vehicleType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-bold text-[#2D3436]">{booking.tripDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-bold text-[#2D3436]">{booking.tripTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Passengers:</span>
            <span className="font-bold text-[#2D3436]">{booking.passengerCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pickup:</span>
            <span className="font-bold text-[#2D3436] text-right">{booking.pickupLocation}</span>
          </div>
          {booking.seasonName && (
            <div className="flex justify-between">
              <span className="text-gray-600">Season:</span>
              <span className="font-bold text-[#2D3436]">{booking.seasonName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="p-6 rounded-2xl border-4 border-[#FFD93D] bg-[#FFF8E7]">
        <h3 className="font-bold text-lg text-[#2D3436] mb-4">Payment Breakdown</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b-2 border-yellow-300">
            <span className="text-gray-700 font-medium">Total Trip Cost</span>
            <span className="text-2xl font-bold text-[#2D3436]">{formatPrice(totalAmount)}</span>
          </div>

          <div className="flex justify-between items-center py-4 bg-green-100 -mx-6 px-6 border-y-2 border-green-300">
            <div>
              <span className="font-bold text-green-800">Advance Payment</span>
              <span className="text-sm text-green-600 block">25% of total (min. Rs 500)</span>
            </div>
            <span className="text-3xl font-bold text-green-700">{formatPrice(advanceAmount)}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div>
              <span className="text-gray-700 font-medium">Pay to Driver</span>
              <span className="text-sm text-gray-500 block">On the day of trip</span>
            </div>
            <span className="text-xl font-bold text-[#2D3436]">{formatPrice(remainingAmount)}</span>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="p-6 rounded-2xl border-4 border-gray-200 bg-gray-50">
        <h3 className="font-bold text-lg text-[#2D3436] mb-4">Customer Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-bold text-[#2D3436]">{booking.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phone:</span>
            <span className="font-bold text-[#2D3436]">{booking.customerPhone}</span>
          </div>
          {booking.customerEmail && (
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-bold text-[#2D3436]">{booking.customerEmail}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">Error</p>
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t-2 border-gray-200">
        <Button onClick={booking.prevStep} variant="secondary" size="lg" disabled={isSubmitting}>
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleSubmitBooking}
          size="lg"
          disabled={isSubmitting || !totalAmount}
          className="bg-green-600 hover:bg-green-700 border-green-600"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating Booking...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Submit Booking
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
