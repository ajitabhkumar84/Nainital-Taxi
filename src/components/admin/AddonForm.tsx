"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  X,
  Image as ImageIcon,
  Package,
  MapPin,
  Car,
  Sparkles,
} from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import { Addon } from "@/lib/supabase/types";

interface AddonFormProps {
  initialData?: (Addon & { package_ids?: string[]; route_ids?: string[]; destination_ids?: string[] }) | null;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

interface PackageOption {
  id: string;
  title: string;
}

interface RouteOption {
  id: string;
  pickup_location: string;
  drop_location: string;
}

interface DestinationOption {
  id: string;
  name: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export default function AddonForm({ initialData, onSubmit, isSubmitting, onCancel }: AddonFormProps) {
  // Basic Info
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [shortDescription, setShortDescription] = useState(initialData?.short_description || "");

  // Media
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
  const [iconEmoji, setIconEmoji] = useState(initialData?.icon_emoji || "");

  // Visibility
  const [showBeforeBooking, setShowBeforeBooking] = useState(initialData?.show_before_booking ?? true);
  const [showAfterBooking, setShowAfterBooking] = useState(initialData?.show_after_booking ?? false);

  // Pricing
  const [offSeasonPrice, setOffSeasonPrice] = useState(initialData?.off_season_price?.toString() || "0");
  const [seasonPrice, setSeasonPrice] = useState(initialData?.season_price?.toString() || "0");

  // Display
  const [displayOrder, setDisplayOrder] = useState(initialData?.display_order?.toString() || "0");
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

  // Scope - Packages, Routes, and Destinations
  const [selectedPackages, setSelectedPackages] = useState<string[]>(initialData?.package_ids || []);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>(initialData?.route_ids || []);
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(initialData?.destination_ids || []);

  // Options for multi-select
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [destinations, setDestinations] = useState<DestinationOption[]>([]);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (!initialData && name) {
      setSlug(generateSlug(name));
    }
  }, [name, initialData]);

  // Fetch packages, routes, and destinations for assignment
  useEffect(() => {
    fetchPackages();
    fetchRoutes();
    fetchDestinations();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/admin/packages');
      const result = await response.json();
      if (result.data) {
        setPackages(result.data.map((p: any) => ({ id: p.id, title: p.title })));
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await fetch('/api/admin/routes');
      const result = await response.json();
      if (result.data) {
        setRoutes(result.data.map((r: any) => ({
          id: r.id,
          pickup_location: r.pickup_location,
          drop_location: r.drop_location,
        })));
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchDestinations = async () => {
    try {
      const response = await fetch('/api/destinations');
      const result = await response.json();
      if (result.data) {
        setDestinations(result.data.map((d: any) => ({ id: d.id, name: d.name })));
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      slug,
      description: description || null,
      short_description: shortDescription || null,
      image_url: imageUrl || null,
      icon_emoji: iconEmoji || null,
      show_before_booking: showBeforeBooking,
      show_after_booking: showAfterBooking,
      off_season_price: parseFloat(offSeasonPrice) || 0,
      season_price: parseFloat(seasonPrice) || 0,
      display_order: parseInt(displayOrder) || 0,
      is_featured: isFeatured,
      is_active: isActive,
      package_ids: selectedPackages,
      route_ids: selectedRoutes,
      destination_ids: selectedDestinations,
    };

    await onSubmit(data);
  };

  const togglePackage = (packageId: string) => {
    setSelectedPackages(prev =>
      prev.includes(packageId)
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  const toggleRoute = (routeId: string) => {
    setSelectedRoutes(prev =>
      prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
  };

  const toggleDestination = (destinationId: string) => {
    setSelectedDestinations(prev =>
      prev.includes(destinationId)
        ? prev.filter(id => id !== destinationId)
        : [...prev, destinationId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display text-ink">
          {initialData ? "Edit Addon" : "Create New Addon"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-coral/10 transition-colors"
        >
          <X className="w-5 h-5 text-coral" />
        </button>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 shadow-retro">
        <h3 className="text-lg font-display text-ink mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body text-ink mb-2">
              Addon Name <span className="text-coral">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Portable WiFi Device"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-body text-ink mb-2">
              Slug <span className="text-coral">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="portable-wifi-device"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-body text-ink mb-2">
              Short Description
            </label>
            <input
              type="text"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief description shown in addon card"
              maxLength={500}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <p className="text-xs text-ink/60 mt-1">{shortDescription.length}/500 characters</p>
          </div>

          <div>
            <label className="block text-sm font-body text-ink mb-2">
              Full Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the addon"
              rows={4}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
        </div>
      </div>

      {/* Media */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 shadow-retro">
        <h3 className="text-lg font-display text-ink mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Media
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body text-ink mb-2">Icon Emoji</label>
            <input
              type="text"
              value={iconEmoji}
              onChange={(e) => setIconEmoji(e.target.value)}
              placeholder="e.g., 📶, 👶, 🎒"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body text-2xl focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <p className="text-xs text-ink/60 mt-1">Single emoji character shown in addon card</p>
          </div>

          <div>
            <label className="block text-sm font-body text-ink mb-2">Image</label>
            <ImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              label="Upload Addon Image"
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 shadow-retro">
        <h3 className="text-lg font-display text-ink mb-4">Season-Based Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-body text-ink mb-2">
              Off-Season Price (₹) <span className="text-coral">*</span>
            </label>
            <input
              type="number"
              value={offSeasonPrice}
              onChange={(e) => setOffSeasonPrice(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-body text-ink mb-2">
              Season Price (₹) <span className="text-coral">*</span>
            </label>
            <input
              type="number"
              value={seasonPrice}
              onChange={(e) => setSeasonPrice(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              required
            />
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 shadow-retro">
        <h3 className="text-lg font-display text-ink mb-4">Visibility Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showBeforeBooking}
              onChange={(e) => setShowBeforeBooking(e.target.checked)}
              className="w-5 h-5 border-3 border-ink rounded accent-teal"
            />
            <span className="font-body text-ink">
              Show Before Booking (Step 2)
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showAfterBooking}
              onChange={(e) => setShowAfterBooking(e.target.checked)}
              className="w-5 h-5 border-3 border-ink rounded accent-teal"
            />
            <span className="font-body text-ink">
              Show After Booking (Success Screen)
            </span>
          </label>
        </div>
      </div>

      {/* Scope Assignment */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 shadow-retro">
        <h3 className="text-lg font-display text-ink mb-4">Scope Assignment</h3>
        <p className="text-sm text-ink/60 mb-4">
          Select which packages, transfer routes, and destinations this addon should be available for. Leave empty to show for all.
        </p>

        <div className="space-y-4">
          {/* Packages */}
          <div>
            <label className="block text-sm font-body text-ink mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Packages
            </label>
            <div className="max-h-48 overflow-y-auto border-3 border-ink rounded-xl p-3 space-y-2">
              {packages.length === 0 ? (
                <p className="text-sm text-ink/60">Loading packages...</p>
              ) : (
                packages.map(pkg => (
                  <label key={pkg.id} className="flex items-center gap-2 cursor-pointer hover:bg-sunrise/20 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedPackages.includes(pkg.id)}
                      onChange={() => togglePackage(pkg.id)}
                      className="w-4 h-4 border-2 border-ink rounded accent-teal"
                    />
                    <span className="text-sm font-body text-ink">{pkg.title}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-ink/60 mt-1">{selectedPackages.length} packages selected</p>
          </div>

          {/* Routes */}
          <div>
            <label className="block text-sm font-body text-ink mb-2 flex items-center gap-2">
              <Car className="w-4 h-4" />
              Transfer Routes
            </label>
            <div className="max-h-48 overflow-y-auto border-3 border-ink rounded-xl p-3 space-y-2">
              {routes.length === 0 ? (
                <p className="text-sm text-ink/60">Loading routes...</p>
              ) : (
                routes.map(route => (
                  <label key={route.id} className="flex items-center gap-2 cursor-pointer hover:bg-sunrise/20 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedRoutes.includes(route.id)}
                      onChange={() => toggleRoute(route.id)}
                      className="w-4 h-4 border-2 border-ink rounded accent-teal"
                    />
                    <span className="text-sm font-body text-ink">
                      {route.pickup_location} → {route.drop_location}
                    </span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-ink/60 mt-1">{selectedRoutes.length} routes selected</p>
          </div>

          {/* Destinations */}
          <div>
            <label className="block text-sm font-body text-ink mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Destinations
            </label>
            <div className="max-h-48 overflow-y-auto border-3 border-ink rounded-xl p-3 space-y-2">
              {destinations.length === 0 ? (
                <p className="text-sm text-ink/60">Loading destinations...</p>
              ) : (
                destinations.map(dest => (
                  <label key={dest.id} className="flex items-center gap-2 cursor-pointer hover:bg-sunrise/20 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedDestinations.includes(dest.id)}
                      onChange={() => toggleDestination(dest.id)}
                      className="w-4 h-4 border-2 border-ink rounded accent-teal"
                    />
                    <span className="text-sm font-body text-ink">{dest.name}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-xs text-ink/60 mt-1">{selectedDestinations.length} destinations selected</p>
          </div>
        </div>
      </div>

      {/* Status & Display */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 shadow-retro">
        <h3 className="text-lg font-display text-ink mb-4">Status & Display</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-body text-ink mb-2">Display Order</label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              min="0"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <p className="text-xs text-ink/60 mt-1">Lower numbers appear first</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-5 h-5 border-3 border-ink rounded accent-teal"
              />
              <span className="font-body text-ink">
                Featured (Show &quot;POPULAR&quot; badge)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 border-3 border-ink rounded accent-teal"
              />
              <span className="font-body text-ink">
                Active (Visible to customers)
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
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
          {isSubmitting ? "Saving..." : "Save Addon"}
        </button>
      </div>
    </form>
  );
}
