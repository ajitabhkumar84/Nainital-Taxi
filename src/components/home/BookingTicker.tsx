"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, MapPin, Car, Compass, CalendarRange, Landmark } from "lucide-react";
import { TickerBooking } from "@/lib/supabase/types";

const DISMISS_KEY = "nt_ticker_dismissed";
const SHOW_MS = 6000;
const GAP_MIN_MS = 20000;
const GAP_MAX_MS = 40000;
const FIRST_DELAY_MS = 4000;

const SERVICE_ICONS: Record<string, React.ElementType> = {
  transfer: Car,
  day_tour: Compass,
  multi_day_rental: CalendarRange,
  temple_trip: Landmark,
};

function timeAgoLabel(lastShownAt: string | null | undefined) {
  if (!lastShownAt) return "recently";
  const diffMs = Date.now() - new Date(lastShownAt).getTime();
  const diffMin = Math.max(1, Math.round(diffMs / 60000));
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  return `${diffHr} hr ago`;
}

export default function BookingTicker() {
  const [bookings, setBookings] = useState<TickerBooking[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY)) {
      setDismissed(true);
      return;
    }

    fetch("/api/ticker")
      .then((res) => res.json())
      .then((result) => setBookings(result.data || []))
      .catch((err) => console.error("Error fetching ticker bookings:", err));
  }, []);

  useEffect(() => {
    if (dismissed || bookings.length === 0) return;

    const scheduleNext = (delay: number, index: number) => {
      timeoutRef.current = setTimeout(() => {
        setActiveIndex(index);
        timeoutRef.current = setTimeout(() => {
          setActiveIndex(null);
          const gap = GAP_MIN_MS + Math.random() * (GAP_MAX_MS - GAP_MIN_MS);
          scheduleNext(gap, (index + 1) % bookings.length);
        }, SHOW_MS);
      }, delay);
    };

    scheduleNext(FIRST_DELAY_MS, 0);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [dismissed, bookings]);

  const handleDismiss = () => {
    setActiveIndex(null);
    setDismissed(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DISMISS_KEY, "1");
    }
  };

  if (dismissed || activeIndex === null || !bookings[activeIndex]) return null;

  const booking = bookings[activeIndex];
  const Icon = (booking.service_type && SERVICE_ICONS[booking.service_type]) || MapPin;

  return (
    <div
      className="fixed bottom-4 left-4 z-40 max-w-xs transition-all duration-300 ease-out opacity-100 translate-x-0"
      role="status"
    >
      <div className="bg-white rounded-xl border-3 border-ink shadow-retro p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-teal/20 border-2 border-ink flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-teal" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body text-ink">
            <span className="font-semibold">
              {booking.guest_first_name} from {booking.guest_city}
            </span>{" "}
            booked {booking.service_label}
          </p>
          <p className="text-xs text-ink/50 font-body mt-1">{timeAgoLabel(booking.last_shown_at)}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-coral/10 transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-ink/40" />
        </button>
      </div>
    </div>
  );
}
