"use client";

import React from "react";
import { Plus, X } from "lucide-react";
import type { MonthDayRange } from "@/lib/supabase/types";

const MONTHS = [
  { value: "01", label: "Jan" }, { value: "02", label: "Feb" }, { value: "03", label: "Mar" },
  { value: "04", label: "Apr" }, { value: "05", label: "May" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Aug" }, { value: "09", label: "Sep" },
  { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" },
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

function splitMonthDay(mmdd: string): [string, string] {
  const [month, day] = mmdd.split("-");
  return [month || "01", day || "01"];
}

interface MonthDayRangeInputProps {
  label: string;
  ranges: MonthDayRange[];
  onChange: (ranges: MonthDayRange[]) => void;
  legacyHint?: string[];
}

// No date-range library exists in this codebase (confirmed) and season
// ranges recur annually (month/day only, no year — e.g. "20 Dec - 15 Jan"
// wraps the year boundary), so a plain <input type="date"> doesn't fit.
// This is a small dependency-free month+day picker instead.
export default function MonthDayRangeInput({ label, ranges, onChange, legacyHint }: MonthDayRangeInputProps) {
  const updateRange = (index: number, field: "start" | "end", part: "month" | "day", newValue: string) => {
    const updated = [...ranges];
    const [month, day] = splitMonthDay(updated[index][field]);
    const nextMonth = part === "month" ? newValue : month;
    const nextDay = part === "day" ? newValue : day;
    updated[index] = { ...updated[index], [field]: `${nextMonth}-${nextDay}` };
    onChange(updated);
  };

  const addRange = () => {
    onChange([...ranges, { start: "01-01", end: "01-01" }]);
  };

  const removeRange = (index: number) => {
    onChange(ranges.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block font-body text-sm text-ink/70">{label}</label>
        <button
          type="button"
          onClick={addRange}
          className="inline-flex items-center gap-1 text-xs text-teal hover:underline font-body"
        >
          <Plus className="w-3 h-3" /> Add Range
        </button>
      </div>

      {legacyHint && legacyHint.length > 0 && (
        <p className="text-xs text-ink/40 font-body italic mb-2">
          Previously: {legacyHint.join(", ")}
        </p>
      )}

      <div className="space-y-2">
        {ranges.map((range, index) => {
          const [startMonth, startDay] = splitMonthDay(range.start);
          const [endMonth, endDay] = splitMonthDay(range.end);
          return (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <select
                value={startMonth}
                onChange={(e) => updateRange(index, "start", "month", e.target.value)}
                className="px-2 py-1.5 border-2 border-ink/20 rounded-lg text-sm focus:border-teal focus:outline-none"
              >
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select
                value={startDay}
                onChange={(e) => updateRange(index, "start", "day", e.target.value)}
                className="px-2 py-1.5 border-2 border-ink/20 rounded-lg text-sm focus:border-teal focus:outline-none"
              >
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <span className="text-ink/50 text-sm">to</span>
              <select
                value={endMonth}
                onChange={(e) => updateRange(index, "end", "month", e.target.value)}
                className="px-2 py-1.5 border-2 border-ink/20 rounded-lg text-sm focus:border-teal focus:outline-none"
              >
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select
                value={endDay}
                onChange={(e) => updateRange(index, "end", "day", e.target.value)}
                className="px-2 py-1.5 border-2 border-ink/20 rounded-lg text-sm focus:border-teal focus:outline-none"
              >
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <button
                type="button"
                onClick={() => removeRange(index)}
                className="p-1 text-coral hover:bg-coral/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        {ranges.length === 0 && (
          <p className="text-xs text-ink/40 font-body">No ranges set — this tier won&apos;t auto-activate.</p>
        )}
      </div>
    </div>
  );
}
