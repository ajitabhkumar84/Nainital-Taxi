"use client";

import React, { useState, useEffect } from "react";
import { useBookingStore } from "@/store/bookingStore";
import { Button } from "@/components/ui";
import { Calendar, MapPin, Clock, Car, Users, IndianRupee, ArrowRight } from "lucide-react";

export default function SimplifiedStep1BookingDetails() {
  const {
    packageId,
    packageTitle,
    vehicleType,
    bookingDate,
    pickupTime,
    pickupLocation,
    dropoffLocation,
    passengers,
    finalPrice,
    setVehicleType,
    setBookingDate,
    setPickupTime,
    setPickupLocation,
    setDropoffLocation,
    setPassengers,
    nextStep,
  } = useBookingStore();

  const [error, setError] = useState("");

  const handleContinue = () => {
    // Validation
    if (!packageId) {
      setError("Please select a package");
      return;
    }
    if (!vehicleType) {
      setError("Please select a vehicle");
      return;
    }
    if (!bookingDate) {
      setError("Please select a date");
      return;
    }
    if (!pickupTime) {
      setError("Please select pickup time");
      return;
    }
    if (!pickupLocation) {
      setError("Please enter pickup location");
      return;
    }

    setError("");
    nextStep();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border-3 border-ink shadow-retro-lg p-8">
        <h2 className="text-2xl font-display text-ink mb-6">Booking Details</h2>

        {/* Package Selection */}
        <div className="mb-6">
          <label className="block text-sm font-body font-bold text-ink mb-2">
            <Car className="w-4 h-4 inline mr-2" />
            Selected Package
          </label>
          <div className="bg-teal/10 border-2 border-teal rounded-lg p-4">
            <div className="font-body font-bold text-ink">{packageTitle || "No package selected"}</div>
            <div className="text-sm text-ink/60 mt-1">You can change this in the previous step</div>
          </div>
        </div>

        {/* Vehicle Type */}
        <div className="mb-6">
          <label className="block text-sm font-body font-bold text-ink mb-2">
            <Car className="w-4 h-4 inline mr-2" />
            Vehicle Type *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { value: "sedan", label: "Sedan (4 Seater)", models: "Dzire, Amaze" },
              { value: "suv_normal", label: "SUV Standard (6-7 Seater)", models: "Ertiga, Triber" },
              { value: "suv_deluxe", label: "SUV Deluxe (7 Seater)", models: "Innova, Marazzo" },
              { value: "suv_luxury", label: "SUV Luxury (7 Seater)", models: "Innova Crysta" },
            ].map((vehicle) => (
              <label
                key={vehicle.value}
                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  vehicleType === vehicle.value
                    ? "border-teal bg-teal/10"
                    : "border-ink/20 hover:border-ink"
                }`}
              >
                <input
                  type="radio"
                  name="vehicle"
                  value={vehicle.value}
                  checked={vehicleType === vehicle.value}
                  onChange={(e) => setVehicleType(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-body font-bold text-ink">{vehicle.label}</div>
                  <div className="text-sm text-ink/60">{vehicle.models}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-body font-bold text-ink mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Booking Date *
            </label>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-bold text-ink mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Pickup Time *
            </label>
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
            />
          </div>
        </div>

        {/* Locations */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-body font-bold text-ink mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Pickup Location *
            </label>
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="Enter pickup location"
              className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-body font-bold text-ink mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Drop-off Location (Optional)
            </label>
            <input
              type="text"
              value={dropoffLocation || ""}
              onChange={(e) => setDropoffLocation(e.target.value)}
              placeholder="Enter drop-off location"
              className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
            />
          </div>
        </div>

        {/* Passengers */}
        <div className="mb-6">
          <label className="block text-sm font-body font-bold text-ink mb-2">
            <Users className="w-4 h-4 inline mr-2" />
            Number of Passengers *
          </label>
          <input
            type="number"
            value={passengers}
            onChange={(e) => setPassengers(parseInt(e.target.value))}
            min={1}
            max={7}
            className="w-full px-4 py-3 rounded-lg border-2 border-ink font-body focus:outline-none focus:border-teal"
          />
        </div>

        {/* Estimated Price */}
        {finalPrice > 0 && (
          <div className="bg-gradient-to-r from-whatsapp/10 to-teal/10 border-2 border-teal rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-ink/60 font-body mb-1">Estimated Fare</div>
                <div className="text-3xl font-display text-ink flex items-center gap-2">
                  <IndianRupee className="w-7 h-7" />
                  {finalPrice.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="text-sm text-ink/70 font-body">
                + GST (if applicable)
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-coral/20 border-2 border-coral rounded-lg">
            <p className="text-sm font-body text-ink">{error}</p>
          </div>
        )}

        {/* Continue Button */}
        <Button onClick={handleContinue} variant="primary" size="lg" className="w-full">
          Continue to Contact Details
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
