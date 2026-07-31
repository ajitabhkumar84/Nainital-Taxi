"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Car,
  Star,
  Grid3X3,
  List,
  RefreshCw,
  Wind,
  Music,
  Baby,
  Users,
  Wrench,
  Save,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Vehicle, VehicleType, VehicleStatus } from "@/lib/supabase/types";
import ImageUploader from "@/components/admin/ImageUploader";
import { getVehicleTypeName } from "@/lib/pricing";

const MAX_LABEL_LENGTH = 24;

const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  sedan: "Sedan",
  suv_normal: "SUV Normal",
  suv_deluxe: "SUV Deluxe",
  suv_luxury: "SUV Luxury",
};

const STATUS_STYLES: Record<VehicleStatus, { bg: string; text: string; label: string }> = {
  available: { bg: "bg-green-100", text: "text-green-800", label: "Available" },
  booked: { bg: "bg-blue-100", text: "text-blue-800", label: "Booked" },
  maintenance: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Maintenance" },
  retired: { bg: "bg-gray-100", text: "text-gray-500", label: "Retired" },
};

interface VehicleCategoryImages {
  sedan: string;
  suv_normal: string;
  suv_deluxe: string;
  suv_luxury: string;
}

const CATEGORY_LABELS: Record<keyof VehicleCategoryImages, string> = {
  sedan: "Sedan",
  suv_normal: "SUV Normal",
  suv_deluxe: "SUV Deluxe",
  suv_luxury: "SUV Luxury",
};

export default function FleetAdminPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Vehicle Category Images state
  const [categoryImages, setCategoryImages] = useState<VehicleCategoryImages>({
    sedan: "",
    suv_normal: "",
    suv_deluxe: "",
    suv_luxury: "",
  });
  const [categoryImagesSaving, setCategoryImagesSaving] = useState(false);
  const [categoryImagesSaved, setCategoryImagesSaved] = useState(false);

  // Vehicle Category Labels state — customer-facing display names per fixed
  // category (does not add/remove categories, only renames them)
  const [categoryLabels, setCategoryLabels] = useState<Record<VehicleType, string>>({
    sedan: getVehicleTypeName("sedan"),
    suv_normal: getVehicleTypeName("suv_normal"),
    suv_deluxe: getVehicleTypeName("suv_deluxe"),
    suv_luxury: getVehicleTypeName("suv_luxury"),
  });
  const [categoryLabelsSaving, setCategoryLabelsSaving] = useState(false);
  const [categoryLabelsSaved, setCategoryLabelsSaved] = useState(false);

  // Fetch vehicle category images from admin_settings
  useEffect(() => {
    const fetchCategoryImages = async () => {
      try {
        const response = await fetch("/api/admin/settings?key=vehicle_category_images");
        if (response.ok) {
          const data = await response.json();
          if (data?.value) {
            const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
            setCategoryImages((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch (error) {
        console.error("Error fetching category images:", error);
      }
    };
    fetchCategoryImages();
  }, []);

  // Fetch vehicle category labels from admin_settings
  useEffect(() => {
    const fetchCategoryLabels = async () => {
      try {
        const response = await fetch("/api/admin/settings?key=vehicle_category_labels");
        if (response.ok) {
          const data = await response.json();
          if (data?.value) {
            const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
            setCategoryLabels((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch (error) {
        console.error("Error fetching category labels:", error);
      }
    };
    fetchCategoryLabels();
  }, []);

  const saveCategoryLabels = async () => {
    setCategoryLabelsSaving(true);
    setCategoryLabelsSaved(false);

    try {
      // Defense in depth beyond the input's maxLength attribute
      const trimmed = Object.fromEntries(
        Object.entries(categoryLabels).map(([key, value]) => [key, value.slice(0, MAX_LABEL_LENGTH)])
      ) as Record<VehicleType, string>;

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: [
            {
              key: "vehicle_category_labels",
              value: JSON.stringify(trimmed),
            },
          ],
        }),
      });

      if (response.ok) {
        setCategoryLabels(trimmed);
        setCategoryLabelsSaved(true);
        setTimeout(() => setCategoryLabelsSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error saving category labels:", error);
    } finally {
      setCategoryLabelsSaving(false);
    }
  };

  const saveCategoryImages = async () => {
    setCategoryImagesSaving(true);
    setCategoryImagesSaved(false);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: [
            {
              key: "vehicle_category_images",
              value: JSON.stringify(categoryImages),
            },
          ],
        }),
      });

      if (response.ok) {
        setCategoryImagesSaved(true);
        setTimeout(() => setCategoryImagesSaved(false), 3000);
      }
    } catch (error) {
      console.error("Error saving category images:", error);
    } finally {
      setCategoryImagesSaving(false);
    }
  };

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/vehicles");
      if (response.ok) {
        const data = await response.json();
        setVehicles(data);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleToggleActive = async (vehicle: Vehicle) => {
    try {
      const response = await fetch("/api/admin/vehicles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: vehicle.id,
          is_active: !vehicle.is_active,
        }),
      });

      if (response.ok) {
        setVehicles((prev) =>
          prev.map((v) => (v.id === vehicle.id ? { ...v, is_active: !v.is_active } : v))
        );
      }
    } catch (error) {
      console.error("Error toggling vehicle status:", error);
    }
  };

  const handleToggleFeatured = async (vehicle: Vehicle) => {
    try {
      const response = await fetch("/api/admin/vehicles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: vehicle.id,
          is_featured: !vehicle.is_featured,
        }),
      });

      if (response.ok) {
        setVehicles((prev) =>
          prev.map((v) => (v.id === vehicle.id ? { ...v, is_featured: !v.is_featured } : v))
        );
      }
    } catch (error) {
      console.error("Error toggling vehicle featured:", error);
    }
  };

  const handleStatusChange = async (vehicle: Vehicle, newStatus: VehicleStatus) => {
    try {
      const response = await fetch("/api/admin/vehicles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: vehicle.id,
          status: newStatus,
        }),
      });

      if (response.ok) {
        setVehicles((prev) =>
          prev.map((v) => (v.id === vehicle.id ? { ...v, status: newStatus } : v))
        );
      }
    } catch (error) {
      console.error("Error changing vehicle status:", error);
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (!confirm(`Are you sure you want to delete "${vehicle.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/vehicles?id=${vehicle.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
    }
  };

  const handleReorder = async (vehicleId: string, direction: "up" | "down") => {
    const currentIndex = vehicles.findIndex((v) => v.id === vehicleId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= vehicles.length) return;

    const reordered = [...vehicles];
    [reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]];

    // Update display orders
    const updates = reordered.map((v, idx) => ({
      id: v.id,
      display_order: idx,
    }));

    setVehicles(reordered.map((v, idx) => ({ ...v, display_order: idx })));

    // Save to database
    for (const update of updates) {
      await fetch("/api/admin/vehicles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(update),
      });
    }
  };

  // Filter and search
  const filteredVehicles = vehicles
    .filter((v) => {
      if (filterType !== "all" && v.vehicle_type !== filterType) return false;
      if (filterStatus !== "all" && v.status !== filterStatus) return false;
      return true;
    })
    .filter(
      (v) =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.registration_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.nickname && v.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const stats = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === "available" && v.is_active).length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
    inactive: vehicles.filter((v) => !v.is_active).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-teal animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display text-ink">Fleet Management</h1>
          <p className="text-ink/60 font-body">Manage your vehicle fleet</p>
        </div>
        <Link
          href="/admin/fleet/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-sunshine text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Vehicle
        </Link>
      </div>

      {/* Vehicle Category Default Images */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 shadow-retro-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-ink flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-teal" />
            Vehicle Category Default Images
          </h2>
          <button
            onClick={saveCategoryImages}
            disabled={categoryImagesSaving}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold border-2 transition-all",
              categoryImagesSaved
                ? "bg-whatsapp/20 border-whatsapp text-whatsapp"
                : "bg-sunshine text-ink border-ink hover:shadow-retro-sm"
            )}
          >
            <Save className="w-4 h-4" />
            {categoryImagesSaving ? "Saving..." : categoryImagesSaved ? "Saved!" : "Save Images"}
          </button>
        </div>
        <p className="text-sm text-ink/50 font-body mb-4">
          These images appear on the pricing table for all package pages.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(CATEGORY_LABELS) as Array<keyof VehicleCategoryImages>).map((key) => (
            <ImageUploader
              key={key}
              value={categoryImages[key]}
              onChange={(url) => setCategoryImages((prev) => ({ ...prev, [key]: url }))}
              folder="vehicles/categories"
              label={CATEGORY_LABELS[key]}
              recommendedSize="400 x 300"
              aspectRatio="4:3"
            />
          ))}
        </div>
      </div>

      {/* Vehicle Category Labels */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 shadow-retro-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-ink flex items-center gap-2">
            <Car className="w-5 h-5 text-teal" />
            Vehicle Category Labels
          </h2>
          <button
            onClick={saveCategoryLabels}
            disabled={categoryLabelsSaving}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-semibold border-2 transition-all",
              categoryLabelsSaved
                ? "bg-whatsapp/20 border-whatsapp text-whatsapp"
                : "bg-sunshine text-ink border-ink hover:shadow-retro-sm"
            )}
          >
            <Save className="w-4 h-4" />
            {categoryLabelsSaving ? "Saving..." : categoryLabelsSaved ? "Saved!" : "Save Labels"}
          </button>
        </div>
        <p className="text-sm text-ink/50 font-body mb-4">
          Customize the display name shown to customers for each vehicle category (booking widget,
          booking flow, pricing tables) — e.g. name the exact car model. This renames the 4 fixed
          categories only; it does not add or remove categories.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(CATEGORY_LABELS) as VehicleType[]).map((key) => (
            <div key={key}>
              <label className="block text-xs font-body font-semibold text-ink/60 mb-1">
                {CATEGORY_LABELS[key]}
              </label>
              <input
                type="text"
                maxLength={MAX_LABEL_LENGTH}
                value={categoryLabels[key]}
                onChange={(e) =>
                  setCategoryLabels((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-lg border-2 border-ink/20 font-body text-sm focus:border-teal focus:outline-none"
                placeholder={CATEGORY_LABELS[key]}
              />
              <div className="text-right text-xs font-body text-ink/40 mt-1">
                {categoryLabels[key].length}/{MAX_LABEL_LENGTH}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border-3 border-ink p-4 text-center">
          <div className="text-2xl font-display text-ink">{stats.total}</div>
          <div className="text-sm text-ink/60 font-body">Total</div>
        </div>
        <div className="bg-white rounded-xl border-3 border-ink p-4 text-center">
          <div className="text-2xl font-display text-teal">{stats.available}</div>
          <div className="text-sm text-ink/60 font-body">Available</div>
        </div>
        <div className="bg-white rounded-xl border-3 border-ink p-4 text-center">
          <div className="text-2xl font-display text-yellow-600">{stats.maintenance}</div>
          <div className="text-sm text-ink/60 font-body">Maintenance</div>
        </div>
        <div className="bg-white rounded-xl border-3 border-ink p-4 text-center">
          <div className="text-2xl font-display text-ink/50">{stats.inactive}</div>
          <div className="text-sm text-ink/60 font-body">Inactive</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or registration..."
            className="w-full pl-10 pr-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
          />
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine bg-white"
        >
          <option value="all">All Types</option>
          {Object.entries(VEHICLE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine bg-white"
        >
          <option value="all">All Status</option>
          {Object.entries(STATUS_STYLES).map(([value, style]) => (
            <option key={value} value={value}>
              {style.label}
            </option>
          ))}
        </select>

        {/* View Toggle */}
        <div className="flex gap-1 bg-white rounded-xl border-3 border-ink p-1">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "list" ? "bg-sunshine" : "hover:bg-sunrise/50"
            )}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "grid" ? "bg-sunshine" : "hover:bg-sunrise/50"
            )}
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Vehicles List/Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-3 border-ink">
          <Car className="w-12 h-12 text-ink/20 mx-auto mb-4" />
          <p className="text-ink/60 font-body">No vehicles found</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-xl border-3 border-ink overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-sunrise/50 border-b-3 border-ink">
              <tr>
                <th className="px-4 py-3 text-left font-display text-ink">Vehicle</th>
                <th className="px-4 py-3 text-left font-display text-ink">Type</th>
                <th className="px-4 py-3 text-center font-display text-ink">Features</th>
                <th className="px-4 py-3 text-center font-display text-ink">Status</th>
                <th className="px-4 py-3 text-center font-display text-ink">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((vehicle, index) => (
                <tr key={vehicle.id} className="border-b border-ink/10 hover:bg-sunrise/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-12 rounded-lg overflow-hidden border-2 border-ink/20 bg-sunrise/30 flex-shrink-0">
                        {vehicle.featured_image_url ? (
                          <Image
                            src={vehicle.featured_image_url}
                            alt={vehicle.name}
                            width={64}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {vehicle.emoji || "🚗"}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-display text-ink flex items-center gap-2">
                          {vehicle.name}
                          {vehicle.is_featured && (
                            <Star className="w-4 h-4 text-sunshine" fill="currentColor" />
                          )}
                        </div>
                        <div className="text-sm text-ink/60 font-body">
                          {vehicle.registration_number}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-lake/20 text-teal rounded-lg text-sm font-body">
                      {VEHICLE_TYPE_LABELS[vehicle.vehicle_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className={cn(
                          "p-1 rounded",
                          vehicle.has_ac ? "text-teal" : "text-ink/20"
                        )}
                        title="AC"
                      >
                        <Wind className="w-4 h-4" />
                      </span>
                      <span
                        className={cn(
                          "p-1 rounded",
                          vehicle.has_music_system ? "text-teal" : "text-ink/20"
                        )}
                        title="Music"
                      >
                        <Music className="w-4 h-4" />
                      </span>
                      <span
                        className={cn(
                          "p-1 rounded",
                          vehicle.has_child_seat ? "text-teal" : "text-ink/20"
                        )}
                        title="Child Seat"
                      >
                        <Baby className="w-4 h-4" />
                      </span>
                      <span className="text-sm text-ink/60 font-body flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {vehicle.capacity}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <select
                        value={vehicle.status}
                        onChange={(e) =>
                          handleStatusChange(vehicle, e.target.value as VehicleStatus)
                        }
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-body font-semibold border-0",
                          STATUS_STYLES[vehicle.status].bg,
                          STATUS_STYLES[vehicle.status].text
                        )}
                      >
                        {Object.entries(STATUS_STYLES).map(([value, style]) => (
                          <option key={value} value={value}>
                            {style.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleToggleActive(vehicle)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-body font-semibold transition-colors",
                          vehicle.is_active ? "bg-teal/20 text-teal" : "bg-ink/10 text-ink/50"
                        )}
                      >
                        {vehicle.is_active ? "Active" : "Inactive"}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {/* Reorder */}
                      <button
                        onClick={() => handleReorder(vehicle.id, "up")}
                        disabled={index === 0}
                        className="p-1 hover:bg-ink/10 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorder(vehicle.id, "down")}
                        disabled={index === filteredVehicles.length - 1}
                        className="p-1 hover:bg-ink/10 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* Featured */}
                      <button
                        onClick={() => handleToggleFeatured(vehicle)}
                        className={cn(
                          "p-1 rounded-lg transition-colors",
                          vehicle.is_featured
                            ? "bg-sunshine text-ink"
                            : "bg-ink/10 text-ink/30 hover:text-ink/60"
                        )}
                        title={vehicle.is_featured ? "Remove featured" : "Mark as featured"}
                      >
                        <Star className="w-4 h-4" fill={vehicle.is_featured ? "currentColor" : "none"} />
                      </button>

                      {/* View on Fleet page */}
                      <Link
                        href="/fleet"
                        target="_blank"
                        className="p-2 hover:bg-lake/20 rounded-lg transition-colors"
                        title="View fleet page"
                      >
                        <Eye className="w-4 h-4 text-teal" />
                      </Link>

                      {/* Edit */}
                      <Link
                        href={`/admin/fleet/${vehicle.id}`}
                        className="p-2 hover:bg-sunshine/30 rounded-lg transition-colors"
                        title="Edit vehicle"
                      >
                        <Edit2 className="w-4 h-4 text-ink" />
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(vehicle)}
                        className="p-2 hover:bg-coral/20 rounded-lg transition-colors"
                        title="Delete vehicle"
                      >
                        <Trash2 className="w-4 h-4 text-coral" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl border-3 border-ink overflow-hidden hover:shadow-retro transition-shadow"
            >
              {/* Image */}
              <div className="h-40 bg-gradient-to-br from-teal/20 to-lake/20 relative">
                {vehicle.featured_image_url ? (
                  <Image
                    src={vehicle.featured_image_url}
                    alt={vehicle.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl">{vehicle.emoji || "🚗"}</span>
                  </div>
                )}
                {/* Status Badge */}
                <span
                  className={cn(
                    "absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-body font-semibold",
                    STATUS_STYLES[vehicle.status].bg,
                    STATUS_STYLES[vehicle.status].text
                  )}
                >
                  {STATUS_STYLES[vehicle.status].label}
                </span>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-display text-lg text-ink flex items-center gap-2">
                      {vehicle.name}
                      {vehicle.is_featured && (
                        <Star className="w-4 h-4 text-sunshine" fill="currentColor" />
                      )}
                    </h3>
                    <p className="text-sm text-ink/60 font-body">{vehicle.registration_number}</p>
                  </div>
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full mt-2",
                      vehicle.is_active ? "bg-teal" : "bg-ink/30"
                    )}
                  />
                </div>

                {/* Type & Features */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-lake/20 text-teal rounded-lg text-xs font-body">
                    {VEHICLE_TYPE_LABELS[vehicle.vehicle_type]}
                  </span>
                  <span className="text-xs text-ink/60 font-body flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {vehicle.capacity}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm border-t border-ink/10 pt-3">
                  <span className="text-ink/50 font-body">
                    {vehicle.total_trips} trips · {vehicle.total_kilometers.toLocaleString()} km
                  </span>
                  <div className="flex gap-1">
                    <Link
                      href={`/admin/fleet/${vehicle.id}`}
                      className="p-1.5 hover:bg-sunshine/30 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-ink" />
                    </Link>
                    <button
                      onClick={() => handleDelete(vehicle)}
                      className="p-1.5 hover:bg-coral/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-coral" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-ink/50 font-body">
        Showing {filteredVehicles.length} of {vehicles.length} vehicles
      </div>
    </div>
  );
}
