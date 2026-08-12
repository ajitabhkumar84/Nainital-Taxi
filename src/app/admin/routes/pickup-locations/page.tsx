"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  MapPin,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
} from "lucide-react";
import { PickupLocationRow } from "@/lib/supabase/types";

export default function PickupLocationsPage() {
  const [locations, setLocations] = useState<PickupLocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/admin/pickup-locations");

      if (!response.ok) throw new Error("Failed to fetch pickup locations");

      const { data } = await response.json();
      setLocations(data);
    } catch (error) {
      console.error("Error fetching pickup locations:", error);
      alert("Failed to load pickup locations");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${name}"? Existing routes that already use this name will keep working — it will just disappear from the pickup dropdown for new bookings.`
      )
    ) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/pickup-locations?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete pickup location");

      await fetchLocations();
      alert("Pickup location deleted successfully");
    } catch (error) {
      console.error("Error deleting pickup location:", error);
      alert("Failed to delete pickup location");
    } finally {
      setDeleting(null);
    }
  };

  const toggleStatus = async (location: PickupLocationRow) => {
    try {
      const response = await fetch("/api/admin/pickup-locations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: location.id,
          updates: {
            is_active: !location.is_active,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to update pickup location");

      await fetchLocations();
    } catch (error) {
      console.error("Error updating pickup location:", error);
      alert("Failed to update pickup location");
    }
  };

  const moveLocation = async (locationId: string, direction: "up" | "down") => {
    const currentIndex = locations.findIndex((l) => l.id === locationId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= locations.length) return;

    try {
      // Swap display_order values
      const updates = [
        {
          id: locations[currentIndex].id,
          display_order: locations[newIndex].display_order,
        },
        {
          id: locations[newIndex].id,
          display_order: locations[currentIndex].display_order,
        },
      ];

      const response = await fetch("/api/admin/pickup-locations/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) throw new Error("Failed to reorder pickup locations");

      await fetchLocations();
    } catch (error) {
      console.error("Error reordering pickup locations:", error);
      alert("Failed to reorder pickup locations");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-xl font-display text-ink">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading pickup locations...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/routes"
            className="p-2 hover:bg-lake/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-display text-ink">Pickup Locations</h1>
            <p className="text-ink/60 font-body mt-1">
              Manage pickup points used across routes and the booking widget
            </p>
          </div>
        </div>
        <Link
          href="/admin/routes/pickup-locations/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-whatsapp text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add New Location
        </Link>
      </div>

      {/* Locations List */}
      {locations.length === 0 ? (
        <div className="bg-white rounded-2xl border-3 border-ink p-12 text-center shadow-retro">
          <MapPin className="w-16 h-16 text-ink/20 mx-auto mb-4" />
          <h3 className="text-xl font-display text-ink mb-2">
            No pickup locations yet
          </h3>
          <p className="text-ink/60 font-body mb-6">
            Add your first pickup location to get started
          </p>
          <Link
            href="/admin/routes/pickup-locations/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sunshine text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Location
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {locations.map((location, index) => (
            <div
              key={location.id}
              className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro hover:shadow-retro-lg transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-6 h-6 text-coral" />
                    <h3 className="text-xl font-display text-ink">
                      {location.name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-ink/60 font-body">
                    <span>Order: {location.display_order}</span>
                    {location.aliases && location.aliases.length > 0 && (
                      <>
                        <span>•</span>
                        <span>Also matches: {location.aliases.join(", ")}</span>
                      </>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => toggleStatus(location)}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-body font-semibold rounded-full border-2 transition-colors ${
                        location.is_active
                          ? "bg-whatsapp/10 border-whatsapp text-whatsapp"
                          : "bg-gray-100 border-gray-300 text-gray-500"
                      }`}
                    >
                      {location.is_active ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                      {location.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 border-2 border-ink rounded-lg p-1">
                    <button
                      onClick={() => moveLocation(location.id, "up")}
                      disabled={index === 0}
                      className="p-1 hover:bg-lake/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveLocation(location.id, "down")}
                      disabled={index === locations.length - 1}
                      className="p-1 hover:bg-lake/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    href={`/admin/routes/pickup-locations/${location.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sunshine text-ink font-body font-semibold rounded-xl border-2 border-ink hover:bg-sunshine/80 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(location.id, location.name)}
                    disabled={deleting === location.id}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-coral text-white font-body font-semibold rounded-xl border-2 border-ink hover:bg-coral/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === location.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
