"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  RefreshCw,
  Calendar as CalendarIcon,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface DayAvailability {
  date: string;
  total_fleet_size: number;
  cars_booked: number;
  cars_available: number;
  status: "available" | "limited" | "sold_out" | "blocked";
  is_blocked: boolean;
  internal_notes: string | null;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

export default function AvailabilityPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [fleetSize, setFleetSize] = useState(10);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const fetchAvailability = useCallback(async () => {
    try {
      // Get first and last day of month
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);

      const startDate = firstDay.toISOString().split("T")[0];
      const endDate = lastDay.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate);

      if (error) throw error;

      const availabilityMap: Record<string, DayAvailability> = {};
      ((data as DayAvailability[]) || []).forEach((item) => {
        availabilityMap[item.date] = item;
      });

      setAvailability(availabilityMap);

      // Get fleet size from admin settings
      const { data: settingsData } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "fleet_size")
        .single() as { data: { value: number } | null };

      if (settingsData?.value) {
        setFleetSize(Number(settingsData.value));
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
    } finally {
      setLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty slots for days before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getDateString = (day: number) => {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const getAvailabilityForDay = (day: number): DayAvailability | null => {
    const dateStr = getDateString(day);
    return availability[dateStr] || null;
  };

  const updateAvailability = async (dateStr: string, change: number) => {
    setUpdating(dateStr);
    try {
      const current = availability[dateStr];
      const newCarsBooked = Math.max(0, Math.min(fleetSize, (current?.cars_booked || 0) + change));
      const newCarsAvailable = fleetSize - newCarsBooked;

      const response = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          date: dateStr,
          total_fleet_size: fleetSize,
          cars_booked: newCarsBooked,
          is_blocked: current?.is_blocked || false,
          internal_notes: current?.internal_notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update availability");
      }

      const { data } = await response.json();

      setAvailability((prev) => ({
        ...prev,
        [dateStr]: {
          date: dateStr,
          total_fleet_size: fleetSize,
          cars_booked: newCarsBooked,
          cars_available: newCarsAvailable,
          status: data?.status || (newCarsAvailable === 0 ? "sold_out" : newCarsAvailable <= 2 ? "limited" : "available"),
          is_blocked: current?.is_blocked || false,
          internal_notes: current?.internal_notes || null,
        },
      }));
    } catch (error) {
      console.error("Error updating availability:", error);
      alert("Failed to update availability. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  const toggleBlockDate = async (dateStr: string) => {
    setUpdating(dateStr);
    try {
      const current = availability[dateStr];
      const newBlocked = !current?.is_blocked;

      const response = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          date: dateStr,
          total_fleet_size: fleetSize,
          cars_booked: current?.cars_booked || 0,
          is_blocked: newBlocked,
          internal_notes: current?.internal_notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to toggle block");
      }

      setAvailability((prev) => ({
        ...prev,
        [dateStr]: {
          ...prev[dateStr],
          date: dateStr,
          total_fleet_size: fleetSize,
          cars_booked: current?.cars_booked || 0,
          cars_available: current?.cars_available || fleetSize,
          status: newBlocked ? "blocked" : (current?.status || "available"),
          is_blocked: newBlocked,
          internal_notes: current?.internal_notes || null,
        },
      }));
    } catch (error) {
      console.error("Error toggling block:", error);
    } finally {
      setUpdating(null);
    }
  };

  const saveNotes = async () => {
    if (!selectedDate) return;

    setUpdating(selectedDate);
    try {
      const current = availability[selectedDate];

      const response = await fetch("/api/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          date: selectedDate,
          total_fleet_size: fleetSize,
          cars_booked: current?.cars_booked || 0,
          is_blocked: current?.is_blocked || false,
          internal_notes: notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save notes");
      }

      setAvailability((prev) => ({
        ...prev,
        [selectedDate]: {
          ...prev[selectedDate],
          date: selectedDate,
          total_fleet_size: fleetSize,
          cars_booked: current?.cars_booked || 0,
          cars_available: current?.cars_available || fleetSize,
          status: current?.status || "available",
          is_blocked: current?.is_blocked || false,
          internal_notes: notes || null,
        },
      }));

      setSelectedDate(null);
      setNotes("");
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setUpdating(null);
    }
  };

  const syncCalendar = async () => {
    setIsSyncing(true);
    try {
      // Check sync status first
      const statusResponse = await fetch("/api/calendar-sync");
      const statusData = await statusResponse.json();

      if (!statusData.configured) {
        alert(
          "Google Calendar is not configured.\n\n" +
          "To enable calendar sync, add these environment variables:\n" +
          "- GOOGLE_CALENDAR_ID: Your Google Calendar ID\n" +
          "- GOOGLE_API_KEY: Your Google API Key\n\n" +
          "See the documentation for setup instructions."
        );
        setIsSyncing(false);
        return;
      }

      // Perform sync
      const syncResponse = await fetch("/api/calendar-sync", {
        method: "POST",
      });
      const syncData = await syncResponse.json();

      if (syncData.success) {
        await fetchAvailability();
        alert(
          `Calendar synced successfully!\n\n` +
          `Events processed: ${syncData.eventsProcessed}\n` +
          `Dates updated: ${syncData.datesUpdated.length}`
        );
      } else {
        alert(`Sync failed: ${syncData.errors?.join(", ") || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Sync error:", error);
      alert("Failed to sync calendar. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const getDayClasses = (day: number) => {
    const dateStr = getDateString(day);
    const dayData = availability[dateStr];
    const today = new Date().toISOString().split("T")[0];
    const isToday = dateStr === today;
    const isPast = dateStr < today;

    let bgColor = "bg-whatsapp/20"; // Available
    if (dayData?.is_blocked) {
      bgColor = "bg-ink/20";
    } else if (dayData?.status === "sold_out") {
      bgColor = "bg-coral/30";
    } else if (dayData?.status === "limited") {
      bgColor = "bg-sunshine/50";
    }

    return cn(
      "min-h-[100px] p-2 rounded-xl border-2 transition-all relative",
      bgColor,
      isToday && "ring-2 ring-teal ring-offset-2",
      isPast && "opacity-60",
      dayData?.is_blocked && "border-dashed border-ink/50"
    );
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl font-display text-ink animate-pulse">
          Loading availability...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink">Availability Calendar</h1>
          <p className="text-ink/60 font-body mt-1">
            Manage your fleet availability. Click + or - to adjust cars booked.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={syncCalendar}
            disabled={isSyncing}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-teal text-white border-3 border-ink rounded-xl font-body font-semibold shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all",
              isSyncing && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            {isSyncing ? "Syncing..." : "Sync Calendar"}
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="flex flex-wrap gap-4 text-sm font-body">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-whatsapp/20 border border-ink/20" />
            <span>Available (3+ cars)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-sunshine/50 border border-ink/20" />
            <span>Limited (1-2 cars)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-coral/30 border border-ink/20" />
            <span>Sold Out</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-ink/20 border border-dashed border-ink/50" />
            <span>Blocked</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-sunrise/50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-ink" />
          </button>

          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-display text-ink">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm font-body bg-lake/30 rounded-lg hover:bg-lake/50 transition-colors"
            >
              Today
            </button>
          </div>

          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-sunrise/50 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-ink" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center font-display text-ink/60 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {getDaysInMonth().map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="min-h-[100px]" />;
            }

            const dateStr = getDateString(day);
            const dayData = getAvailabilityForDay(day);
            const carsAvailable = dayData?.cars_available ?? fleetSize;
            const carsBooked = dayData?.cars_booked ?? 0;
            const isBlocked = dayData?.is_blocked ?? false;
            const today = new Date().toISOString().split("T")[0];
            const isPast = dateStr < today;

            return (
              <div key={day} className={getDayClasses(day)}>
                {/* Day Number */}
                <div className="flex items-start justify-between">
                  <span className="font-display text-lg text-ink">{day}</span>
                  {dayData?.internal_notes && (
                    <button
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setNotes(dayData.internal_notes || "");
                      }}
                      className="text-teal"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Availability Info */}
                <div className="mt-2 text-center">
                  <div className="text-2xl font-display text-ink">
                    {isBlocked ? "🚫" : carsAvailable}
                  </div>
                  <div className="text-xs font-body text-ink/60">
                    {isBlocked ? "Blocked" : `of ${fleetSize} available`}
                  </div>
                </div>

                {/* Controls */}
                {!isPast && (
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <button
                      onClick={() => updateAvailability(dateStr, -1)}
                      disabled={updating === dateStr || carsBooked === 0 || isBlocked}
                      className={cn(
                        "w-8 h-8 rounded-lg bg-whatsapp text-white flex items-center justify-center transition-all",
                        (updating === dateStr || carsBooked === 0 || isBlocked)
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:scale-110"
                      )}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-body text-ink/60 w-8 text-center">
                      {carsBooked}
                    </span>
                    <button
                      onClick={() => updateAvailability(dateStr, 1)}
                      disabled={updating === dateStr || carsAvailable === 0 || isBlocked}
                      className={cn(
                        "w-8 h-8 rounded-lg bg-coral text-white flex items-center justify-center transition-all",
                        (updating === dateStr || carsAvailable === 0 || isBlocked)
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:scale-110"
                      )}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Block Toggle */}
                {!isPast && (
                  <button
                    onClick={() => toggleBlockDate(dateStr)}
                    className={cn(
                      "mt-2 w-full text-xs py-1 rounded font-body transition-colors",
                      isBlocked
                        ? "bg-ink/20 text-ink hover:bg-ink/30"
                        : "bg-ink/10 text-ink/60 hover:bg-ink/20"
                    )}
                  >
                    {isBlocked ? "Unblock" : "Block"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border-3 border-ink p-6 w-full max-w-md shadow-retro">
            <h3 className="text-xl font-display text-ink mb-4">
              Notes for {selectedDate}
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes (e.g., 'Wedding booking', 'VIP customer')"
              className="w-full h-32 px-4 py-3 border-3 border-ink rounded-xl font-body resize-none focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setSelectedDate(null);
                  setNotes("");
                }}
                className="flex-1 px-4 py-2 border-3 border-ink rounded-xl font-body hover:bg-sunrise/30 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                disabled={updating === selectedDate}
                className="flex-1 px-4 py-2 bg-sunshine border-3 border-ink rounded-xl font-body font-semibold shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Size Info */}
      <div className="bg-sunrise/50 rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-ink" />
          <div>
            <span className="font-body text-ink">
              Current fleet size: <strong>{fleetSize} cars</strong>
            </span>
            <span className="text-ink/60 font-body text-sm ml-2">
              (Change this in Settings)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
