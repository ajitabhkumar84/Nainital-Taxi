'use client';

import { useState, useEffect } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { Button, Input } from '@/components/ui';
import { ArrowRight, ArrowLeft, Calendar, Users, MapPin, Phone, MessageCircle } from 'lucide-react';
import { getPackagePrice, getAvailabilityForDate, formatPrice } from '@/lib/pricing';

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00'
];

export default function Step2TripDetails() {
  const {
    packageId,
    vehicleType,
    tripDate,
    tripTime,
    passengerCount,
    pickupLocation,
    dropoffLocation,
    setTripDate,
    setTripTime,
    setPassengerCount,
    setPickupLocation,
    setDropoffLocation,
    setCalculatedPrice,
    setAvailability,
    availabilityStatus,
    carsAvailable,
    calculatedPrice,
    seasonName,
    nextStep,
    prevStep,
  } = useBookingStore();

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);
  const [selectedDate, setSelectedDate] = useState(tripDate || '');

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  useEffect(() => {
    if (selectedDate && packageId && vehicleType) {
      checkAvailabilityAndPrice(selectedDate);
    }
  }, [selectedDate, packageId, vehicleType]);

  async function checkAvailabilityAndPrice(date: string) {
    if (!packageId || !vehicleType) return;

    setCheckingAvailability(true);
    setFetchingPrice(true);

    try {
      // Check availability
      const availabilityData = await getAvailabilityForDate(date);
      if (availabilityData) {
        setAvailability(availabilityData.status, availabilityData.carsAvailable);
      }

      // Get price
      const priceData = await getPackagePrice(packageId, vehicleType, date);
      if (priceData) {
        setCalculatedPrice(priceData.price, priceData.seasonId, priceData.seasonName);
      }
    } catch (error) {
      console.error('Error checking availability and price:', error);
    } finally {
      setCheckingAvailability(false);
      setFetchingPrice(false);
    }
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setTripDate(date);
  };

  const handleNext = () => {
    if (!tripDate || !tripTime || !pickupLocation) {
      alert('Please fill in all required fields');
      return;
    }

    if (availabilityStatus === 'sold_out' || availabilityStatus === 'blocked') {
      alert('This date is not available. Please contact us or choose another date.');
      return;
    }

    nextStep();
  };

  const getAvailabilityColor = () => {
    switch (availabilityStatus) {
      case 'available':
        return 'bg-green-50 border-green-500 text-green-700';
      case 'limited':
        return 'bg-yellow-50 border-yellow-500 text-yellow-700';
      case 'sold_out':
        return 'bg-red-50 border-red-500 text-red-700';
      case 'blocked':
        return 'bg-gray-50 border-gray-500 text-gray-700';
      default:
        return '';
    }
  };

  const getAvailabilityMessage = () => {
    switch (availabilityStatus) {
      case 'available':
        return `✅ Great! We have ${carsAvailable} cars available on this date.`;
      case 'limited':
        return `⚠️ Hurry! Only ${carsAvailable} car${carsAvailable === 1 ? '' : 's'} left for this date!`;
      case 'sold_out':
        return '❌ All cars are booked for this date. Please contact us for alternatives.';
      case 'blocked':
        return '🚫 Online booking unavailable for this date. Please contact us directly.';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-[#2D3436] mb-2">
          Trip Details
        </h2>
        <p className="text-gray-600">
          When and where do you want to go?
        </p>
      </div>

      {/* Date Selection */}
      <div>
        <label className="block text-sm font-bold text-[#2D3436] mb-2">
          Select Date <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            min={minDate}
            className="pl-12"
            required
          />
        </div>

        {/* Availability Status */}
        {checkingAvailability && tripDate && (
          <div className="mt-3 p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
              <span>Checking availability...</span>
            </div>
          </div>
        )}

        {!checkingAvailability && tripDate && availabilityStatus && (
          <div className={`mt-3 p-4 rounded-xl border-2 ${getAvailabilityColor()}`}>
            <p className="font-medium">{getAvailabilityMessage()}</p>

            {/* Show contact buttons for sold out/blocked */}
            {(availabilityStatus === 'sold_out' || availabilityStatus === 'blocked') && (
              <div className="flex flex-wrap gap-3 mt-4">
                <a
                  href={`https://wa.me/918445206116?text=Hi, I want to book for ${tripDate} but it shows as unavailable. Can you help?`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20BA59] transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact on WhatsApp
                </a>
                <a
                  href="tel:+918445206116"
                  className="flex items-center gap-2 px-4 py-2 bg-[#4D96FF] text-white rounded-xl font-bold hover:bg-[#3D86EF] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call Now
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Price Display */}
      {tripDate && calculatedPrice !== null && (
        <div className="p-6 rounded-2xl border-4 border-[#FFD93D] bg-[#FFF8E7]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Estimated Price</div>
              <div className="text-3xl font-bold text-[#2D3436]">
                {formatPrice(calculatedPrice)}
              </div>
              {seasonName && (
                <div className="text-sm text-gray-600 mt-1">
                  {seasonName} pricing
                </div>
              )}
            </div>
            {fetchingPrice && (
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#FFD93D]" />
            )}
          </div>
        </div>
      )}

      {/* Time Selection */}
      <div>
        <label className="block text-sm font-bold text-[#2D3436] mb-3">
          Pickup Time <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {timeSlots.map((time) => (
            <button
              key={time}
              onClick={() => setTripTime(time)}
              className={`
                p-3 rounded-xl border-3 font-medium transition-all duration-200
                ${
                  tripTime === time
                    ? 'border-[#4D96FF] bg-[#E8F4F8] text-[#2D3436] shadow-[2px_2px_0px_#4D96FF]'
                    : 'border-[#2D3436] bg-white hover:shadow-[2px_2px_0px_#2D3436]'
                }
              `}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Passenger Count */}
      <div>
        <label className="block text-sm font-bold text-[#2D3436] mb-2">
          Number of Passengers <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="number"
            value={passengerCount}
            onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
            min={1}
            max={10}
            className="pl-12"
            required
          />
        </div>
      </div>

      {/* Pickup Location */}
      <div>
        <label className="block text-sm font-bold text-[#2D3436] mb-2">
          Pickup Location <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            placeholder="e.g., Hotel Manu Maharani, Nainital"
            className="pl-12"
            required
          />
        </div>
      </div>

      {/* Drop-off Location (Optional) */}
      <div>
        <label className="block text-sm font-bold text-[#2D3436] mb-2">
          Drop-off Location (Optional)
        </label>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            value={dropoffLocation}
            onChange={(e) => setDropoffLocation(e.target.value)}
            placeholder="Same as pickup (if not specified)"
            className="pl-12"
          />
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
          disabled={
            !tripDate ||
            !tripTime ||
            !pickupLocation ||
            availabilityStatus === 'sold_out' ||
            availabilityStatus === 'blocked'
          }
          size="lg"
          className="group"
        >
          Continue to Contact Info
          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
