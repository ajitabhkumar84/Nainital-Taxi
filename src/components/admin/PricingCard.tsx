"use client";

import React, { useState } from "react";
import { Car, ChevronDown, ChevronUp, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  VehicleType,
  VehicleTypeDisplayNames,
  VEHICLE_TYPES,
  SEASON_NAMES,
  SeasonName,
} from "@/lib/supabase/types";

export interface PricingCardSubject {
  id: string;
  name: string;
  sublabel?: string;
  isActive: boolean;
}

export interface PricingCardPriceRow {
  vehicle_type: VehicleType;
  season_name: SeasonName;
  price: number;
}

export interface PendingPriceEdit {
  vehicle_type: VehicleType;
  season_name: SeasonName;
  price: number | null; // null => vehicle unavailable for this season (deletes the row)
}

interface PricingCardProps {
  subject: PricingCardSubject;
  prices: PricingCardPriceRow[];
  seasonHints?: Partial<Record<SeasonName, string>>;
  onSave: (subjectId: string, edits: PendingPriceEdit[]) => Promise<void>;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN").format(price);
}

function cellKey(vehicleType: VehicleType, seasonName: SeasonName): string {
  return `${vehicleType}__${seasonName}`;
}

export default function PricingCard({ subject, prices, seasonHints, onSave }: PricingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [edits, setEdits] = useState<Record<string, PendingPriceEdit>>({});
  const [saving, setSaving] = useState(false);
  const [cardError, setCardError] = useState("");

  const findPrice = (vehicleType: VehicleType, seasonName: SeasonName) =>
    prices.find((p) => p.vehicle_type === vehicleType && p.season_name === seasonName);

  const isDirty = (vehicleType: VehicleType, seasonName: SeasonName) =>
    cellKey(vehicleType, seasonName) in edits;

  const getDisplayValue = (vehicleType: VehicleType, seasonName: SeasonName): string => {
    const key = cellKey(vehicleType, seasonName);
    if (key in edits) {
      const editedPrice = edits[key].price;
      return editedPrice === null ? "" : String(editedPrice);
    }
    const existing = findPrice(vehicleType, seasonName);
    return existing ? String(existing.price) : "";
  };

  const handleChange = (vehicleType: VehicleType, seasonName: SeasonName, rawValue: string) => {
    const trimmed = rawValue.trim();
    // Blank means "no price" (vehicle unavailable), not zero — never coerce
    // an empty field to 0 here, that's exactly the bug this page had.
    const price = trimmed === "" ? null : Math.max(0, Math.trunc(Number(trimmed)) || 0);
    setEdits((prev) => ({
      ...prev,
      [cellKey(vehicleType, seasonName)]: { vehicle_type: vehicleType, season_name: seasonName, price },
    }));
  };

  const hasEdits = Object.keys(edits).length > 0;

  const unpricedCount = VEHICLE_TYPES.filter(
    (vehicleType) => !SEASON_NAMES.some((season) => findPrice(vehicleType, season))
  ).length;

  // Collapsed summary: one representative price per vehicle that has at
  // least one season priced, so the list stays scannable without expanding
  // every card.
  const summary = VEHICLE_TYPES.map((vehicleType) => {
    const priced = SEASON_NAMES.map((season) => findPrice(vehicleType, season)).find(Boolean);
    if (!priced) return null;
    const shortName = VehicleTypeDisplayNames[vehicleType].split(" (")[0];
    return `${shortName} ₹${formatPrice(priced.price)}`;
  }).filter((entry): entry is string => Boolean(entry));

  const handleSave = async () => {
    if (!hasEdits) return;
    setSaving(true);
    setCardError("");
    try {
      await onSave(subject.id, Object.values(edits));
      setEdits({});
    } catch (err) {
      setCardError(err instanceof Error ? err.message : "Failed to save prices");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-3 border-ink shadow-retro overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-sunrise/10 transition-colors"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg text-ink truncate">{subject.name}</h3>
            {!subject.isActive && (
              <span className="text-xs font-body px-2 py-0.5 rounded-full bg-ink/10 text-ink/60 shrink-0">
                Inactive
              </span>
            )}
          </div>
          {subject.sublabel && (
            <p className="text-sm text-ink/50 font-body truncate">{subject.sublabel}</p>
          )}
          <p className="text-xs text-ink/50 font-body mt-1">
            {summary.length > 0 ? summary.join(" · ") : "No prices set"}
            {unpricedCount > 0 &&
              ` · ${unpricedCount} vehicle${unpricedCount === 1 ? "" : "s"} unavailable`}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-ink/40 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-ink/40 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t-2 border-ink/10 p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-ink/20">
                  <th className="text-left p-3 font-display text-ink text-sm">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Vehicle
                    </div>
                  </th>
                  {SEASON_NAMES.map((season) => (
                    <th key={season} className="text-center p-3 font-display text-ink text-sm">
                      {season}
                      {seasonHints?.[season] && (
                        <div className="text-xs font-body text-ink/50 font-normal">
                          {seasonHints[season]}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VEHICLE_TYPES.map((vehicleType) => (
                  <tr key={vehicleType} className="border-b border-ink/10">
                    <td className="p-3 font-body text-sm text-ink">
                      {VehicleTypeDisplayNames[vehicleType]}
                    </td>
                    {SEASON_NAMES.map((season) => {
                      const dirty = isDirty(vehicleType, season);
                      return (
                        <td key={season} className="p-3">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 text-sm">
                              ₹
                            </span>
                            <input
                              type="number"
                              min={0}
                              value={getDisplayValue(vehicleType, season)}
                              onChange={(e) => handleChange(vehicleType, season, e.target.value)}
                              placeholder="Not available"
                              className={cn(
                                "w-full pl-7 pr-3 py-2 border-2 rounded-lg font-body text-right text-sm focus:outline-none focus:ring-2 focus:ring-sunshine",
                                dirty ? "border-sunshine bg-sunshine/10" : "border-ink/20"
                              )}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {cardError && (
            <div className="mt-3 bg-coral/10 border-2 border-coral rounded-lg p-3 text-coral font-body text-sm">
              {cardError}
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasEdits || saving}
              className={cn(
                "flex items-center gap-2 px-5 py-2 rounded-xl font-body text-sm border-2 border-ink transition-all",
                !hasEdits || saving
                  ? "bg-ink/10 text-ink/40 cursor-not-allowed"
                  : "bg-whatsapp text-white shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              )}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Prices"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
