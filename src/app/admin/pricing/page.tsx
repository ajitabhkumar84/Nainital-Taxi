"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Save,
  IndianRupee,
  Car,
  Package,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { VehicleType, VehicleTypeDisplayNames, Package as PackageType } from "@/lib/supabase/types";

interface PricingEntry {
  id: string;
  package_id: string;
  vehicle_type: VehicleType;
  season_id: string;
  season_name: string;
  price: number;
  notes: string | null;
  is_active: boolean;
}

interface Season {
  id: string;
  name: string;
  description: string | null;
}

const VEHICLE_TYPES: VehicleType[] = ["sedan", "suv_normal", "suv_deluxe", "suv_luxury"];

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

export default function PricingPage() {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [pricing, setPricing] = useState<PricingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch packages
      const { data: packagesData, error: packagesError } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (packagesError) throw packagesError;

      // Fetch seasons
      const { data: seasonsData, error: seasonsError } = await supabase
        .from("seasons")
        .select("id, name, description")
        .eq("is_active", true);

      if (seasonsError) throw seasonsError;

      // Fetch all pricing
      const { data: pricingData, error: pricingError } = await supabase
        .from("pricing")
        .select("*, seasons(name)")
        .eq("is_active", true);

      if (pricingError) throw pricingError;

      const typedPackages = (packagesData as PackageType[]) || [];
      const typedSeasons = (seasonsData as Season[]) || [];

      setPackages(typedPackages);
      setSeasons(typedSeasons);

      // Transform pricing data
      const transformedPricing = (pricingData || []).map((p: Record<string, unknown>) => ({
        id: p.id as string,
        package_id: p.package_id as string,
        vehicle_type: p.vehicle_type as VehicleType,
        season_id: p.season_id as string,
        season_name: (p.seasons as { name: string } | null)?.name || "Unknown",
        price: p.price as number,
        notes: p.notes as string | null,
        is_active: p.is_active as boolean,
      }));

      setPricing(transformedPricing);

      if (typedPackages.length > 0) {
        setSelectedPackage(typedPackages[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getPriceKey = (packageId: string, vehicleType: VehicleType, seasonId: string) => {
    return `${packageId}-${vehicleType}-${seasonId}`;
  };

  const getCurrentPrice = (packageId: string, vehicleType: VehicleType, seasonId: string) => {
    const key = getPriceKey(packageId, vehicleType, seasonId);
    if (editedPrices[key] !== undefined) {
      return editedPrices[key];
    }
    const priceEntry = pricing.find(
      (p) => p.package_id === packageId && p.vehicle_type === vehicleType && p.season_id === seasonId
    );
    return priceEntry?.price || 0;
  };

  const handlePriceChange = (
    packageId: string,
    vehicleType: VehicleType,
    seasonId: string,
    value: string
  ) => {
    const key = getPriceKey(packageId, vehicleType, seasonId);
    const numValue = parseInt(value) || 0;
    setEditedPrices((prev) => ({ ...prev, [key]: numValue }));
    setHasChanges(true);
  };

  const savePrice = async (packageId: string, vehicleType: VehicleType, seasonId: string) => {
    const key = getPriceKey(packageId, vehicleType, seasonId);
    const newPrice = editedPrices[key];

    if (newPrice === undefined) return;

    setSaving(key);
    try {
      // Check if pricing entry exists
      const existingEntry = pricing.find(
        (p) => p.package_id === packageId && p.vehicle_type === vehicleType && p.season_id === seasonId
      );

      if (existingEntry) {
        // Update existing
        const response = await fetch("/api/admin/pricing", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-auth": ADMIN_PASSWORD,
          },
          body: JSON.stringify({ id: existingEntry.id, price: newPrice }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update price");
        }

        setPricing((prev) =>
          prev.map((p) =>
            p.id === existingEntry.id ? { ...p, price: newPrice } : p
          )
        );
      } else {
        // Insert new
        const response = await fetch("/api/admin/pricing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-auth": ADMIN_PASSWORD,
          },
          body: JSON.stringify({
            package_id: packageId,
            vehicle_type: vehicleType,
            season_id: seasonId,
            price: newPrice,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create price");
        }

        const { data } = await response.json();

        if (data) {
          setPricing((prev) => [
            ...prev,
            {
              id: data.id,
              package_id: data.package_id,
              vehicle_type: data.vehicle_type,
              season_id: data.season_id,
              season_name: (data.seasons as { name: string } | null)?.name || "Unknown",
              price: data.price,
              notes: data.notes,
              is_active: data.is_active,
            },
          ]);
        }
      }

      // Remove from edited prices
      setEditedPrices((prev) => {
        const newEdited = { ...prev };
        delete newEdited[key];
        return newEdited;
      });

      setHasChanges(Object.keys(editedPrices).length > 1);
    } catch (error) {
      console.error("Error saving price:", error);
      alert("Failed to save price. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  const saveAllPrices = async () => {
    const keys = Object.keys(editedPrices);
    for (const key of keys) {
      const [packageId, vehicleType, seasonId] = key.split("-");
      await savePrice(packageId, vehicleType as VehicleType, seasonId);
    }
    setHasChanges(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN").format(price);
  };

  const selectedPackageData = packages.find((p) => p.id === selectedPackage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl font-display text-ink animate-pulse">
          Loading pricing...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink">Pricing Manager</h1>
          <p className="text-ink/60 font-body mt-1">
            Set prices for each package, vehicle type, and season
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={saveAllPrices}
            className="flex items-center gap-2 px-6 py-3 bg-whatsapp text-white border-3 border-ink rounded-xl font-display shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Save className="w-5 h-5" />
            Save All Changes
          </button>
        )}
      </div>

      {/* Package Selector */}
      <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-5 h-5 text-ink" />
          <h2 className="font-display text-lg text-ink">Select Package</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setSelectedPackage(pkg.id)}
              className={cn(
                "px-4 py-2 rounded-xl font-body text-sm border-2 transition-all",
                selectedPackage === pkg.id
                  ? "bg-sunshine border-ink shadow-retro-sm"
                  : "bg-white border-ink/20 hover:border-ink/40"
              )}
            >
              {pkg.title}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Table */}
      {selectedPackageData && (
        <div className="bg-white rounded-2xl border-3 border-ink shadow-retro overflow-hidden">
          <div className="p-4 border-b-3 border-ink bg-sunrise/30">
            <h2 className="font-display text-xl text-ink">{selectedPackageData.title}</h2>
            <p className="text-ink/60 font-body text-sm mt-1">
              {selectedPackageData.type === "tour" ? "Tour Package" : "Transfer"} •{" "}
              {selectedPackageData.duration}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-ink/20">
                  <th className="text-left p-4 font-display text-ink">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Vehicle Type
                    </div>
                  </th>
                  {seasons.map((season) => (
                    <th key={season.id} className="text-center p-4 font-display text-ink">
                      {season.name}
                      {season.description && (
                        <div className="text-xs font-body text-ink/60 font-normal">
                          {season.description}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VEHICLE_TYPES.map((vehicleType) => (
                  <tr key={vehicleType} className="border-b border-ink/10 hover:bg-sunrise/10">
                    <td className="p-4">
                      <div className="font-body font-semibold text-ink">
                        {VehicleTypeDisplayNames[vehicleType]}
                      </div>
                    </td>
                    {seasons.map((season) => {
                      const key = getPriceKey(selectedPackage!, vehicleType, season.id);
                      const currentPrice = getCurrentPrice(selectedPackage!, vehicleType, season.id);
                      const isEdited = editedPrices[key] !== undefined;
                      const isSaving = saving === key;

                      return (
                        <td key={season.id} className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                              <input
                                type="number"
                                value={currentPrice}
                                onChange={(e) =>
                                  handlePriceChange(
                                    selectedPackage!,
                                    vehicleType,
                                    season.id,
                                    e.target.value
                                  )
                                }
                                className={cn(
                                  "w-32 pl-8 pr-3 py-2 border-2 rounded-lg font-body text-right focus:outline-none focus:ring-2 focus:ring-sunshine",
                                  isEdited ? "border-sunshine bg-sunshine/10" : "border-ink/20"
                                )}
                              />
                            </div>
                            {isEdited && (
                              <button
                                onClick={() =>
                                  savePrice(selectedPackage!, vehicleType, season.id)
                                }
                                disabled={isSaving}
                                className={cn(
                                  "p-2 rounded-lg transition-colors",
                                  isSaving
                                    ? "bg-ink/10 text-ink/40"
                                    : "bg-whatsapp text-white hover:opacity-90"
                                )}
                              >
                                <Save className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-lake/20 rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-teal mt-0.5" />
          <div className="font-body text-sm text-ink">
            <strong>Pricing Tips:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-ink/70">
              <li>Prices are in INR (Indian Rupees)</li>
              <li>Season prices apply automatically based on the booking date</li>
              <li>Changes are highlighted in yellow until saved</li>
              <li>Click the save button next to each price or use &quot;Save All Changes&quot;</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
          <div className="text-3xl font-display text-ink">{packages.length}</div>
          <div className="text-sm font-body text-ink/60">Active Packages</div>
        </div>
        <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
          <div className="text-3xl font-display text-ink">{seasons.length}</div>
          <div className="text-sm font-body text-ink/60">Seasons Configured</div>
        </div>
        <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
          <div className="text-3xl font-display text-ink">{pricing.length}</div>
          <div className="text-sm font-body text-ink/60">Price Entries</div>
        </div>
      </div>
    </div>
  );
}
