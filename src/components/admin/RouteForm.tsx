"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  MapPin,
  ArrowRight,
  Clock,
  FileText,
  DollarSign,
  Hotel,
  Eye,
  Package,
  FolderTree,
} from "lucide-react";
import { Route, RoutePricing, VehicleType, RouteCategory } from "@/lib/supabase/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

interface RouteFormProps {
  initialData?: (Route & { pricing?: RoutePricing[] }) | null;
  onSubmit: (data: Partial<Route & { pricing: Partial<RoutePricing>[] }>) => Promise<void>;
  isSubmitting: boolean;
}

const VEHICLE_TYPES: VehicleType[] = ["sedan", "suv_normal", "suv_deluxe", "suv_luxury"];
const SEASON_NAMES = ["Off-Season", "Season"] as const;

function generateSlug(pickup: string, drop: string): string {
  return `${pickup}-to-${drop}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function RouteForm({ initialData, onSubmit, isSubmitting }: RouteFormProps) {
  // Categories
  const [categories, setCategories] = useState<RouteCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Basic Info
  const [pickupLocation, setPickupLocation] = useState(initialData?.pickup_location || "");
  const [dropLocation, setDropLocation] = useState(initialData?.drop_location || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [distance, setDistance] = useState(initialData?.distance?.toString() || "");
  const [duration, setDuration] = useState(initialData?.duration || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [categoryId, setCategoryId] = useState(initialData?.category_id || "");
  const [displayOrder, setDisplayOrder] = useState(initialData?.display_order?.toString() || "0");

  // Optional Features
  const [featuredPackageId, setFeaturedPackageId] = useState(initialData?.featured_package_id || "");
  const [hasHotelOption, setHasHotelOption] = useState(initialData?.has_hotel_option ?? false);

  // Display Options
  const [showOnDestinationPage, setShowOnDestinationPage] = useState(
    initialData?.show_on_destination_page ?? true
  );

  // Status
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [enableOnlineBooking, setEnableOnlineBooking] = useState(
    initialData?.enable_online_booking ?? true
  );

  // SEO
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || "");

  // Pricing - Initialize with existing pricing or empty structure
  const initializePricing = (): Partial<RoutePricing>[] => {
    if (initialData?.pricing && initialData.pricing.length > 0) {
      return initialData.pricing;
    }

    // Create default pricing structure
    const defaultPricing: Partial<RoutePricing>[] = [];
    VEHICLE_TYPES.forEach((vehicleType) => {
      SEASON_NAMES.forEach((seasonName) => {
        defaultPricing.push({
          vehicle_type: vehicleType,
          season_name: seasonName,
          price: 0,
          is_active: true,
        });
      });
    });
    return defaultPricing;
  };

  const [pricing, setPricing] = useState<Partial<RoutePricing>[]>(initializePricing());

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/route-categories", {
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch categories");

      const { data } = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handlePickupChange = (value: string) => {
    setPickupLocation(value);
    if (!initialData && value && dropLocation) {
      setSlug(generateSlug(value, dropLocation));
    }
  };

  const handleDropChange = (value: string) => {
    setDropLocation(value);
    if (!initialData && pickupLocation && value) {
      setSlug(generateSlug(pickupLocation, value));
    }
  };

  const handlePriceChange = (vehicleType: VehicleType, seasonName: string, value: string) => {
    setPricing((prev) =>
      prev.map((p) =>
        p.vehicle_type === vehicleType && p.season_name === seasonName
          ? { ...p, price: parseInt(value) || 0 }
          : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pickupLocation || !dropLocation) {
      alert("Pickup and drop locations are required");
      return;
    }

    await onSubmit({
      pickup_location: pickupLocation,
      drop_location: dropLocation,
      slug,
      distance: distance ? Number(distance) : null,
      duration: duration || null,
      description: description || null,
      category_id: categoryId || null,
      display_order: Number(displayOrder) || 0,
      featured_package_id: featuredPackageId || null,
      has_hotel_option: hasHotelOption,
      show_on_destination_page: showOnDestinationPage,
      is_active: isActive,
      enable_online_booking: enableOnlineBooking,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      pricing: pricing.filter((p) => p.price && p.price > 0),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Route Information */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-coral" />
          Route Information
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Pickup Location *
            </label>
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => handlePickupChange(e.target.value)}
              placeholder="e.g., Delhi, Kathgodam Railway Station"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              required
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Drop Location *
            </label>
            <input
              type="text"
              value={dropLocation}
              onChange={(e) => handleDropChange(e.target.value)}
              placeholder="e.g., Nainital"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block font-body text-sm text-ink/60 mb-2">
            Route Slug (URL)
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="delhi-to-nainital"
            className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Distance (km)
            </label>
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="320"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Duration
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="7-8 hours"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block font-body text-sm text-ink/60 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of this route..."
            className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2 flex items-center gap-2">
              <FolderTree className="w-4 h-4" />
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              disabled={loadingCategories}
            >
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category_name}
                </option>
              ))}
            </select>
            {loadingCategories && (
              <p className="text-xs text-ink/50 mt-1">Loading categories...</p>
            )}
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <p className="text-xs text-ink/50 mt-1">
              Lower numbers appear first (e.g., 1, 2, 3...)
            </p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-whatsapp" />
          Pricing
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-ink/20">
                <th className="text-left font-display text-ink p-3">Vehicle Type</th>
                <th className="text-center font-display text-ink p-3">Off-Season</th>
                <th className="text-center font-display text-ink p-3">Season</th>
              </tr>
            </thead>
            <tbody>
              {VEHICLE_TYPES.map((vehicleType) => {
                const offSeasonPrice = pricing.find(
                  (p) => p.vehicle_type === vehicleType && p.season_name === "Off-Season"
                );
                const seasonPrice = pricing.find(
                  (p) => p.vehicle_type === vehicleType && p.season_name === "Season"
                );

                return (
                  <tr key={vehicleType} className="border-b border-ink/10">
                    <td className="p-3 font-body text-ink capitalize">
                      {vehicleType.replace("_", " ")}
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={offSeasonPrice?.price || ""}
                        onChange={(e) =>
                          handlePriceChange(vehicleType, "Off-Season", e.target.value)
                        }
                        placeholder="₹"
                        className="w-full px-3 py-2 border-2 border-ink rounded-lg font-body text-center focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={seasonPrice?.price || ""}
                        onChange={(e) =>
                          handlePriceChange(vehicleType, "Season", e.target.value)
                        }
                        placeholder="₹"
                        className="w-full px-3 py-2 border-2 border-ink rounded-lg font-body text-center focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optional Features */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">Optional Features</h2>

        <div className="space-y-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Featured Package ID (Optional)
            </label>
            <input
              type="text"
              value={featuredPackageId}
              onChange={(e) => setFeaturedPackageId(e.target.value)}
              placeholder="Package UUID"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <p className="text-xs text-ink/50 font-body mt-1">
              Link this route to a featured tour package
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasHotelOption}
              onChange={(e) => setHasHotelOption(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-coral"
            />
            <span className="font-body">Include Hotel Option</span>
          </label>
        </div>
      </div>

      {/* Status & Visibility */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">Status & Visibility</h2>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-whatsapp"
            />
            <span className="font-body">Active (visible on website)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enableOnlineBooking}
              onChange={(e) => setEnableOnlineBooking(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-teal"
            />
            <span className="font-body">Enable Online Booking</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnDestinationPage}
              onChange={(e) => setShowOnDestinationPage(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-lake"
            />
            <span className="font-body">Show on Destination Pages</span>
          </label>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">SEO Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">Meta Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Leave blank to auto-generate"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              placeholder="Leave blank to auto-generate"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-8 py-4 bg-whatsapp text-white font-body font-semibold text-lg rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? "Saving..." : initialData ? "Update Route" : "Create Route"}
        </button>
      </div>
    </form>
  );
}
