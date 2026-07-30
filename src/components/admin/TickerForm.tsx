"use client";

import React, { useState } from "react";
import { Save, X, Radio } from "lucide-react";
import { TickerBooking } from "@/lib/supabase/types";

interface TickerFormProps {
  initialData?: TickerBooking | null;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

const SERVICE_TYPES = [
  { value: "transfer", label: "Fixed-fare transfer" },
  { value: "day_tour", label: "Day tour / package" },
  { value: "multi_day_rental", label: "Multi-day rental" },
  { value: "temple_trip", label: "Temple trip" },
];

export default function TickerForm({ initialData, onSubmit, isSubmitting, onCancel }: TickerFormProps) {
  const [guestFirstName, setGuestFirstName] = useState(initialData?.guest_first_name || "");
  const [guestCity, setGuestCity] = useState(initialData?.guest_city || "");
  const [serviceLabel, setServiceLabel] = useState(initialData?.service_label || "");
  const [serviceType, setServiceType] = useState(initialData?.service_type || "transfer");
  const [realBookingDate, setRealBookingDate] = useState(initialData?.real_booking_date || "");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await onSubmit({
      guest_first_name: guestFirstName,
      guest_city: guestCity,
      service_label: serviceLabel,
      service_type: serviceType || null,
      real_booking_date: realBookingDate || null,
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-ink">
          {initialData ? "Edit Ticker Booking" : "Add Ticker Booking"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-coral/10 transition-colors"
        >
          <X className="w-5 h-5 text-coral" />
        </button>
      </div>

      <div className="bg-white rounded-xl border-3 border-ink p-6 shadow-retro">
        <h3 className="text-lg font-display text-ink mb-4 flex items-center gap-2">
          <Radio className="w-5 h-5" />
          Booking Details
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-body text-ink mb-2">
                Guest First Name <span className="text-coral">*</span>
              </label>
              <input
                type="text"
                value={guestFirstName}
                onChange={(e) => setGuestFirstName(e.target.value)}
                placeholder="e.g., Priya S."
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-body text-ink mb-2">
                City <span className="text-coral">*</span>
              </label>
              <input
                type="text"
                value={guestCity}
                onChange={(e) => setGuestCity(e.target.value)}
                placeholder="e.g., Delhi"
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-body text-ink mb-2">
              Service Label <span className="text-coral">*</span>
            </label>
            <input
              type="text"
              value={serviceLabel}
              onChange={(e) => setServiceLabel(e.target.value)}
              placeholder="e.g., Nainital → Kathgodam transfer"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-body text-ink mb-2">Service Type</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              >
                {SERVICE_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-body text-ink mb-2">Real Booking Date</label>
              <input
                type="date"
                value={realBookingDate}
                onChange={(e) => setRealBookingDate(e.target.value)}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              />
              <p className="text-xs text-ink/60 mt-1">Recordkeeping only — not shown to visitors</p>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 border-3 border-ink rounded accent-teal"
            />
            <span className="font-body text-ink">Active (eligible for rotation)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t-3 border-ink">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl border-3 border-ink font-display bg-white hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl border-3 border-ink font-display bg-sunshine text-ink shadow-retro hover:shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? "Saving..." : "Save Booking"}
        </button>
      </div>
    </form>
  );
}
