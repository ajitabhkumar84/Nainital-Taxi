"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Addon } from "@/lib/supabase/types";
import AddonForm from "@/components/admin/AddonForm";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

export default function AddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAddon, setEditingAddon] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAddons = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/addons", {
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch addons");

      const result = await response.json();
      setAddons(result.data || []);
    } catch (error) {
      console.error("Error fetching addons:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  const handleCreateNew = () => {
    setEditingAddon(null);
    setShowForm(true);
  };

  const handleEdit = async (addon: Addon) => {
    // Fetch full addon data with relationships
    try {
      const response = await fetch(`/api/admin/addons?id=${addon.id}`, {
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch addon");

      const result = await response.json();
      setEditingAddon(result.data);
      setShowForm(true);
    } catch (error) {
      console.error("Error fetching addon for edit:", error);
      alert("Failed to load addon data");
    }
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const url = "/api/admin/addons";
      const method = editingAddon ? "PATCH" : "POST";
      const body = editingAddon
        ? { id: editingAddon.id, updates: data, package_ids: data.package_ids, destination_ids: data.destination_ids }
        : data;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save addon");
      }

      await fetchAddons();
      setShowForm(false);
      setEditingAddon(null);
    } catch (error) {
      console.error("Error saving addon:", error);
      alert(error instanceof Error ? error.message : "Failed to save addon");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (addon: Addon) => {
    setSaving(addon.id);
    try {
      const response = await fetch("/api/admin/addons", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          id: addon.id,
          updates: { is_active: !addon.is_active },
        }),
      });

      if (!response.ok) throw new Error("Failed to toggle active");

      setAddons((prev) =>
        prev.map((a) =>
          a.id === addon.id ? { ...a, is_active: !a.is_active } : a
        )
      );
    } catch (error) {
      console.error("Error toggling active:", error);
    } finally {
      setSaving(null);
    }
  };

  const toggleFeatured = async (addon: Addon) => {
    setSaving(addon.id);
    try {
      const response = await fetch("/api/admin/addons", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          id: addon.id,
          updates: { is_featured: !addon.is_featured },
        }),
      });

      if (!response.ok) throw new Error("Failed to toggle featured");

      setAddons((prev) =>
        prev.map((a) =>
          a.id === addon.id ? { ...a, is_featured: !a.is_featured } : a
        )
      );
    } catch (error) {
      console.error("Error toggling featured:", error);
    } finally {
      setSaving(null);
    }
  };

  const moveAddon = async (addon: Addon, direction: "up" | "down") => {
    const currentIndex = addons.findIndex((a) => a.id === addon.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= addons.length) return;

    setSaving(addon.id);
    try {
      const newAddons = [...addons];
      const temp = newAddons[currentIndex];
      newAddons[currentIndex] = newAddons[targetIndex];
      newAddons[targetIndex] = temp;

      // Update display_order for both
      await Promise.all([
        fetch("/api/admin/addons", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-auth": ADMIN_PASSWORD,
          },
          body: JSON.stringify({
            id: newAddons[currentIndex].id,
            updates: { display_order: currentIndex },
          }),
        }),
        fetch("/api/admin/addons", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-auth": ADMIN_PASSWORD,
          },
          body: JSON.stringify({
            id: newAddons[targetIndex].id,
            updates: { display_order: targetIndex },
          }),
        }),
      ]);

      setAddons(newAddons.map((a, index) => ({ ...a, display_order: index })));
    } catch (error) {
      console.error("Error reordering addons:", error);
    } finally {
      setSaving(null);
    }
  };

  const deleteAddon = async (addon: Addon) => {
    if (!confirm(`Are you sure you want to delete "${addon.name}"?`)) return;

    setSaving(addon.id);
    try {
      const response = await fetch(`/api/admin/addons?id=${addon.id}`, {
        method: "DELETE",
        headers: { "x-admin-auth": ADMIN_PASSWORD },
      });

      if (!response.ok) throw new Error("Failed to delete");

      setAddons((prev) => prev.filter((a) => a.id !== addon.id));
    } catch (error) {
      console.error("Error deleting addon:", error);
      alert("Failed to delete addon.");
    } finally {
      setSaving(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Filter addons
  const filteredAddons = addons.filter((addon) =>
    addon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addon.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = addons.filter((a) => a.is_active).length;
  const featuredCount = addons.filter((a) => a.is_featured).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl font-display text-ink animate-pulse">
          Loading addons...
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <AddonForm
          initialData={editingAddon}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => {
            setShowForm(false);
            setEditingAddon(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink flex items-center gap-2">
            <Gift className="w-8 h-8" />
            Revenue Addons
          </h1>
          <p className="text-ink/60 font-body mt-1">
            Manage optional upsell addons for bookings
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-sunshine border-3 border-ink rounded-xl font-body font-semibold shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Addon
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border-3 border-ink p-4 shadow-retro-sm">
          <div className="text-2xl font-display text-ink">{addons.length}</div>
          <div className="text-sm font-body text-ink/60">Total Addons</div>
        </div>
        <div className="bg-teal/20 rounded-xl border-3 border-ink p-4 shadow-retro-sm">
          <div className="text-2xl font-display text-ink">{activeCount}</div>
          <div className="text-sm font-body text-ink/60">Active</div>
        </div>
        <div className="bg-sunshine/40 rounded-xl border-3 border-ink p-4 shadow-retro-sm">
          <div className="text-2xl font-display text-ink">{featuredCount}</div>
          <div className="text-sm font-body text-ink/60">Featured</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search addons..."
            className="w-full pl-10 pr-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
          />
        </div>
      </div>

      {/* Addons List */}
      <div className="bg-white rounded-2xl border-3 border-ink shadow-retro overflow-hidden">
        {filteredAddons.length === 0 ? (
          <div className="p-12 text-center">
            <Gift className="w-16 h-16 mx-auto text-ink/20 mb-4" />
            <p className="text-lg font-display text-ink/60">
              {searchQuery ? "No addons found" : "No addons yet"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateNew}
                className="mt-4 text-teal font-body hover:underline"
              >
                Create your first addon
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sunrise/30 border-b-3 border-ink">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-display text-ink">Order</th>
                  <th className="px-4 py-3 text-left text-sm font-display text-ink">Addon</th>
                  <th className="px-4 py-3 text-left text-sm font-display text-ink">Pricing</th>
                  <th className="px-4 py-3 text-left text-sm font-display text-ink">Visibility</th>
                  <th className="px-4 py-3 text-left text-sm font-display text-ink">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-display text-ink">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink/10">
                {filteredAddons.map((addon, index) => (
                  <tr
                    key={addon.id}
                    className={cn(
                      "hover:bg-sunrise/10 transition-colors",
                      !addon.is_active && "opacity-50"
                    )}
                  >
                    {/* Order */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveAddon(addon, "up")}
                          disabled={index === 0 || saving === addon.id}
                          className="p-1 rounded hover:bg-teal/20 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveAddon(addon, "down")}
                          disabled={index === filteredAddons.length - 1 || saving === addon.id}
                          className="p-1 rounded hover:bg-teal/20 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-mono text-ink/60 ml-1">
                          {addon.display_order}
                        </span>
                      </div>
                    </td>

                    {/* Addon Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{addon.icon_emoji || '🎁'}</div>
                        <div>
                          <div className="font-body font-semibold text-ink flex items-center gap-2">
                            {addon.name}
                            {addon.is_featured && (
                              <Star className="w-4 h-4 fill-sunshine text-sunshine" />
                            )}
                          </div>
                          <div className="text-xs text-ink/60 font-mono">{addon.slug}</div>
                          {addon.short_description && (
                            <div className="text-sm text-ink/70 mt-1 max-w-md">
                              {addon.short_description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Pricing */}
                    <td className="px-4 py-3">
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-ink/60">Off-Season:</span>{" "}
                          <span className="font-semibold">{formatPrice(addon.off_season_price)}</span>
                        </div>
                        <div>
                          <span className="text-ink/60">Season:</span>{" "}
                          <span className="font-semibold">{formatPrice(addon.season_price)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Visibility */}
                    <td className="px-4 py-3">
                      <div className="space-y-1 text-xs">
                        {addon.show_before_booking && (
                          <div className="px-2 py-1 bg-teal/20 rounded text-teal border border-teal">
                            Before Booking
                          </div>
                        )}
                        {addon.show_after_booking && (
                          <div className="px-2 py-1 bg-purple-100 rounded text-purple-700 border border-purple-300">
                            After Booking
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => toggleActive(addon)}
                          disabled={saving === addon.id}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-semibold border-2 transition-colors",
                            addon.is_active
                              ? "bg-teal/20 border-teal text-teal"
                              : "bg-gray-100 border-gray-300 text-gray-600"
                          )}
                        >
                          {addon.is_active ? "Active" : "Inactive"}
                        </button>
                        <button
                          onClick={() => toggleFeatured(addon)}
                          disabled={saving === addon.id}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-semibold border-2 transition-colors",
                            addon.is_featured
                              ? "bg-sunshine/40 border-sunshine text-ink"
                              : "bg-gray-100 border-gray-300 text-gray-600"
                          )}
                        >
                          {addon.is_featured ? "Featured" : "Normal"}
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(addon)}
                          disabled={saving === addon.id}
                          className="p-2 rounded-lg hover:bg-teal/20 text-teal transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteAddon(addon)}
                          disabled={saving === addon.id}
                          className="p-2 rounded-lg hover:bg-coral/20 text-coral transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
