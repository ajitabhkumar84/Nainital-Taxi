"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PickupLocationFormProps {
  locationId?: string;
}

export default function PickupLocationForm({ locationId }: PickupLocationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!locationId);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    aliasesText: "", // comma-separated free text; parsed to string[] on submit
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (locationId) {
      fetchLocation();
    }
  }, [locationId]);

  const fetchLocation = async () => {
    try {
      const response = await fetch(`/api/admin/pickup-locations?id=${locationId}`);

      if (!response.ok) throw new Error("Failed to fetch pickup location");

      const { data } = await response.json();
      setFormData({
        name: data.name,
        aliasesText: (data.aliases || []).join(", "),
        display_order: data.display_order,
        is_active: data.is_active,
      });
    } catch (error) {
      console.error("Error fetching pickup location:", error);
      alert("Failed to load pickup location");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const aliases = formData.aliasesText
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        aliases,
        display_order: formData.display_order,
        is_active: formData.is_active,
      };

      const url = "/api/admin/pickup-locations";
      const method = locationId ? "PATCH" : "POST";
      const body = locationId ? { id: locationId, updates: payload } : payload;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save pickup location");
      }

      alert(locationId ? "Pickup location updated successfully!" : "Pickup location created successfully!");
      router.push("/admin/routes/pickup-locations");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving pickup location:", error);
      alert(error.message || "Failed to save pickup location");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-xl font-display text-ink">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading pickup location...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/routes/pickup-locations"
          className="p-2 hover:bg-lake/10 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-display text-ink">
            {locationId ? "Edit Pickup Location" : "New Pickup Location"}
          </h1>
          <p className="text-ink/60 font-body mt-1">
            {locationId
              ? "Update this pickup location"
              : "Add a new pickup point for the routes form and booking widget"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border-3 border-ink p-8 shadow-retro">
          <h2 className="text-xl font-display text-ink mb-6">
            Location Information
          </h2>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-body font-semibold text-ink mb-2">
                Name <span className="text-coral">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-3 border-2 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-lake"
                placeholder="e.g., Pantnagar Airport"
              />
            </div>

            {/* Aliases */}
            <div>
              <label className="block text-sm font-body font-semibold text-ink mb-2">
                Aliases
              </label>
              <textarea
                value={formData.aliasesText}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, aliasesText: e.target.value }))
                }
                rows={2}
                className="w-full px-4 py-3 border-2 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-lake"
                placeholder="e.g., Kathgodam, Kathgodam Railway Station"
              />
              <p className="text-xs text-ink/50 mt-1">
                Alternate spellings this location should also match, comma separated.
                Rarely needed — leave blank unless an old route uses a different name
                for the same place. Renaming this location automatically keeps its
                previous name here, so existing routes never break.
              </p>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-body font-semibold text-ink mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    display_order: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full px-4 py-3 border-2 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-lake"
                placeholder="0"
              />
              <p className="text-xs text-ink/50 mt-1">
                Lower numbers appear first (e.g., 1, 2, 3...)
              </p>
            </div>

            {/* Is Active */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                className="w-5 h-5 border-2 border-ink rounded"
              />
              <label
                htmlFor="is_active"
                className="text-sm font-body font-semibold text-ink cursor-pointer"
              >
                Active (show in pickup dropdowns)
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 bg-whatsapp text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {locationId ? "Update Location" : "Create Location"}
              </>
            )}
          </button>
          <Link
            href="/admin/routes/pickup-locations"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-ink font-body font-semibold rounded-xl border-2 border-ink hover:bg-ink/5 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
