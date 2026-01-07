"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Loader2,
  Car,
  Settings,
  Palette,
  Image as ImageIcon,
  Wrench,
  ToggleLeft,
} from "lucide-react";
import Link from "next/link";
import { Vehicle, VehicleType, VehicleStatus } from "@/lib/supabase/types";
import ImageUploader, { GalleryUploader } from "./ImageUploader";

interface VehicleFormProps {
  vehicle?: Vehicle;
  isEditing?: boolean;
}

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: "sedan", label: "Sedan" },
  { value: "suv_normal", label: "SUV Normal" },
  { value: "suv_deluxe", label: "SUV Deluxe" },
  { value: "suv_luxury", label: "SUV Luxury" },
];

const VEHICLE_STATUSES: { value: VehicleStatus; label: string; color: string }[] = [
  { value: "available", label: "Available", color: "bg-green-100 text-green-800" },
  { value: "booked", label: "Booked", color: "bg-blue-100 text-blue-800" },
  { value: "maintenance", label: "Maintenance", color: "bg-yellow-100 text-yellow-800" },
  { value: "retired", label: "Retired", color: "bg-gray-100 text-gray-800" },
];

export default function VehicleForm({ vehicle, isEditing }: VehicleFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Basic Info
  const [name, setName] = useState(vehicle?.name || "");
  const [nickname, setNickname] = useState(vehicle?.nickname || "");
  const [registrationNumber, setRegistrationNumber] = useState(vehicle?.registration_number || "");
  const [vehicleType, setVehicleType] = useState<VehicleType>(vehicle?.vehicle_type || "sedan");
  const [modelName, setModelName] = useState(vehicle?.model_name || "");
  const [status, setStatus] = useState<VehicleStatus>(vehicle?.status || "available");

  // Specifications
  const [capacity, setCapacity] = useState(vehicle?.capacity?.toString() || "4");
  const [luggageCapacity, setLuggageCapacity] = useState(vehicle?.luggage_capacity?.toString() || "");
  const [hasAc, setHasAc] = useState(vehicle?.has_ac ?? true);
  const [hasMusicSystem, setHasMusicSystem] = useState(vehicle?.has_music_system ?? true);
  const [hasChildSeat, setHasChildSeat] = useState(vehicle?.has_child_seat ?? false);

  // Aesthetic
  const [primaryColor, setPrimaryColor] = useState(vehicle?.primary_color || "");
  const [colorHex, setColorHex] = useState(vehicle?.color_hex || "#000000");
  const [emoji, setEmoji] = useState(vehicle?.emoji || "");
  const [personalityTrait, setPersonalityTrait] = useState(vehicle?.personality_trait || "");
  const [tagline, setTagline] = useState(vehicle?.tagline || "");

  // Media
  const [featuredImageUrl, setFeaturedImageUrl] = useState(vehicle?.featured_image_url || "");
  const [imageUrls, setImageUrls] = useState<string[]>(vehicle?.image_urls || []);

  // Maintenance
  const [lastServiceDate, setLastServiceDate] = useState(vehicle?.last_service_date || "");
  const [nextServiceDate, setNextServiceDate] = useState(vehicle?.next_service_date || "");
  const [totalTrips, setTotalTrips] = useState(vehicle?.total_trips?.toString() || "0");
  const [totalKilometers, setTotalKilometers] = useState(vehicle?.total_kilometers?.toString() || "0");

  // Status
  const [isFeatured, setIsFeatured] = useState(vehicle?.is_featured ?? false);
  const [isActive, setIsActive] = useState(vehicle?.is_active ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const adminPassword =
      localStorage.getItem("admin_password") ||
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
      "nainital2024";

    const data = {
      name,
      nickname: nickname || null,
      registration_number: registrationNumber,
      vehicle_type: vehicleType,
      model_name: modelName || null,
      status,
      capacity: parseInt(capacity) || 4,
      luggage_capacity: luggageCapacity ? parseInt(luggageCapacity) : null,
      has_ac: hasAc,
      has_music_system: hasMusicSystem,
      has_child_seat: hasChildSeat,
      primary_color: primaryColor || null,
      color_hex: colorHex || null,
      emoji: emoji || null,
      personality_trait: personalityTrait || null,
      tagline: tagline || null,
      featured_image_url: featuredImageUrl || null,
      image_urls: imageUrls,
      last_service_date: lastServiceDate || null,
      next_service_date: nextServiceDate || null,
      total_trips: parseInt(totalTrips) || 0,
      total_kilometers: parseInt(totalKilometers) || 0,
      is_featured: isFeatured,
      is_active: isActive,
    };

    try {
      const response = await fetch("/api/admin/vehicles", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": adminPassword,
        },
        body: JSON.stringify(isEditing ? { id: vehicle?.id, ...data } : data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save vehicle");
      }

      const savedVehicle = await response.json();
      router.push(`/admin/fleet/${savedVehicle.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/fleet"
            className="p-2 hover:bg-ink/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-display text-ink">
            {isEditing ? "Edit Vehicle" : "Add Vehicle"}
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving || !name || !registrationNumber}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {error && (
        <div className="bg-coral/10 border-3 border-coral rounded-xl p-4 text-coral font-body">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2 flex items-center gap-2">
          <Car className="w-5 h-5" />
          Basic Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">
              Vehicle Name <span className="text-coral">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Swift Dzire White"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              required
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., The Happy Wanderer"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">
              Registration Number <span className="text-coral">*</span>
            </label>
            <input
              type="text"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
              placeholder="e.g., UK07AB1234"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine uppercase"
              required
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Model Name</label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="e.g., Swift Dzire, Innova Crysta"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">
              Vehicle Type <span className="text-coral">*</span>
            </label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine bg-white"
            >
              {VEHICLE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as VehicleStatus)}
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine bg-white"
            >
              {VEHICLE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Specifications
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Seating Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              min="1"
              max="20"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Luggage Capacity (bags)</label>
            <input
              type="number"
              value={luggageCapacity}
              onChange={(e) => setLuggageCapacity(e.target.value)}
              min="0"
              placeholder="e.g., 3"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasAc}
              onChange={(e) => setHasAc(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-teal"
            />
            <span className="font-body text-ink">Air Conditioning</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasMusicSystem}
              onChange={(e) => setHasMusicSystem(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-teal"
            />
            <span className="font-body text-ink">Music System</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasChildSeat}
              onChange={(e) => setHasChildSeat(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-teal"
            />
            <span className="font-body text-ink">Child Seat Available</span>
          </label>
        </div>
      </div>

      {/* Aesthetic */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2 flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Appearance & Personality
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Primary Color</label>
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="e.g., Pearl White, Sunset Orange"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Color Hex</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-12 h-10 border-3 border-ink rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                placeholder="#FFFFFF"
                className="flex-1 px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              />
            </div>
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Emoji</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="e.g., 🚗"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Personality Trait</label>
            <input
              type="text"
              value={personalityTrait}
              onChange={(e) => setPersonalityTrait(e.target.value)}
              placeholder="e.g., Reliable, Adventurous"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
        </div>

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g., Your trusted companion for mountain adventures"
            className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
          />
        </div>
      </div>

      {/* Media */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Media
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ImageUploader
            value={featuredImageUrl}
            onChange={setFeaturedImageUrl}
            folder="vehicles/featured"
            label="Featured Image"
            recommendedSize="800 x 600"
            aspectRatio="4:3"
          />

          <GalleryUploader
            value={imageUrls}
            onChange={setImageUrls}
            folder="vehicles/gallery"
            label="Gallery Images"
            recommendedSize="800 x 600"
            aspectRatio="4:3"
            maxImages={6}
          />
        </div>
      </div>

      {/* Maintenance */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2 flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Maintenance & Stats
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Last Service Date</label>
            <input
              type="date"
              value={lastServiceDate}
              onChange={(e) => setLastServiceDate(e.target.value)}
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Next Service Date</label>
            <input
              type="date"
              value={nextServiceDate}
              onChange={(e) => setNextServiceDate(e.target.value)}
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Total Trips</label>
            <input
              type="number"
              value={totalTrips}
              onChange={(e) => setTotalTrips(e.target.value)}
              min="0"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Total Kilometers</label>
            <input
              type="number"
              value={totalKilometers}
              onChange={(e) => setTotalKilometers(e.target.value)}
              min="0"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2 flex items-center gap-2">
          <ToggleLeft className="w-5 h-5" />
          Visibility & Display
        </h2>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-teal"
            />
            <span className="font-body text-ink">Active (visible on fleet page)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-teal"
            />
            <span className="font-body text-ink">Featured (highlighted display)</span>
          </label>
        </div>
      </div>
    </form>
  );
}
