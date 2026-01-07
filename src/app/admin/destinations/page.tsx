"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  ChevronUp,
  ChevronDown,
  MapPin,
  Star,
  Grid3X3,
  List,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Destination } from "@/lib/supabase/types";

export default function DestinationsAdminPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filter, setFilter] = useState<"all" | "active" | "popular">("all");

  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/destinations");
      if (response.ok) {
        const data = await response.json();
        setDestinations(data);
      }
    } catch (error) {
      console.error("Error fetching destinations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const handleToggleActive = async (dest: Destination) => {
    const adminPassword = localStorage.getItem("admin_password") || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

    try {
      const response = await fetch("/api/admin/destinations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": adminPassword,
        },
        body: JSON.stringify({
          id: dest.id,
          is_active: !dest.is_active,
        }),
      });

      if (response.ok) {
        setDestinations((prev) =>
          prev.map((d) => (d.id === dest.id ? { ...d, is_active: !d.is_active } : d))
        );
      }
    } catch (error) {
      console.error("Error toggling destination status:", error);
    }
  };

  const handleTogglePopular = async (dest: Destination) => {
    const adminPassword = localStorage.getItem("admin_password") || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

    try {
      const response = await fetch("/api/admin/destinations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": adminPassword,
        },
        body: JSON.stringify({
          id: dest.id,
          is_popular: !dest.is_popular,
        }),
      });

      if (response.ok) {
        setDestinations((prev) =>
          prev.map((d) => (d.id === dest.id ? { ...d, is_popular: !d.is_popular } : d))
        );
      }
    } catch (error) {
      console.error("Error toggling destination popularity:", error);
    }
  };

  const handleDelete = async (dest: Destination) => {
    if (!confirm(`Are you sure you want to delete "${dest.name}"?`)) return;

    const adminPassword = localStorage.getItem("admin_password") || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

    try {
      const response = await fetch(`/api/admin/destinations?id=${dest.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-auth": adminPassword,
        },
      });

      if (response.ok) {
        setDestinations((prev) => prev.filter((d) => d.id !== dest.id));
      }
    } catch (error) {
      console.error("Error deleting destination:", error);
    }
  };

  const handleReorder = async (destId: string, direction: "up" | "down") => {
    const adminPassword = localStorage.getItem("admin_password") || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";
    const currentIndex = destinations.findIndex((d) => d.id === destId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= destinations.length) return;

    const reordered = [...destinations];
    [reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]];

    // Update display orders
    const updates = reordered.map((d, idx) => ({
      id: d.id,
      display_order: idx,
    }));

    setDestinations(reordered.map((d, idx) => ({ ...d, display_order: idx })));

    // Save to database
    for (const update of updates) {
      await fetch("/api/admin/destinations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": adminPassword,
        },
        body: JSON.stringify(update),
      });
    }
  };

  // Filter and search
  const filteredDestinations = destinations
    .filter((dest) => {
      if (filter === "active") return dest.is_active;
      if (filter === "popular") return dest.is_popular;
      return true;
    })
    .filter((dest) =>
      dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const stats = {
    total: destinations.length,
    active: destinations.filter((d) => d.is_active).length,
    popular: destinations.filter((d) => d.is_popular).length,
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
          <h1 className="text-2xl md:text-3xl font-display text-ink">Destinations</h1>
          <p className="text-ink/60 font-body">Manage taxi destinations</p>
        </div>
        <Link
          href="/admin/destinations/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-sunshine text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Destination
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border-3 border-ink p-4 text-center">
          <div className="text-2xl font-display text-ink">{stats.total}</div>
          <div className="text-sm text-ink/60 font-body">Total</div>
        </div>
        <div className="bg-white rounded-xl border-3 border-ink p-4 text-center">
          <div className="text-2xl font-display text-teal">{stats.active}</div>
          <div className="text-sm text-ink/60 font-body">Active</div>
        </div>
        <div className="bg-white rounded-xl border-3 border-ink p-4 text-center">
          <div className="text-2xl font-display text-coral">{stats.popular}</div>
          <div className="text-sm text-ink/60 font-body">Popular</div>
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
            placeholder="Search destinations..."
            className="w-full pl-10 pr-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "active", "popular"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl font-body text-sm border-2 transition-all capitalize",
                filter === f
                  ? "bg-sunshine border-ink text-ink font-semibold"
                  : "bg-white border-ink/20 text-ink/60 hover:border-ink/40"
              )}
            >
              {f}
            </button>
          ))}
        </div>

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

      {/* Destinations List/Grid */}
      {filteredDestinations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-3 border-ink">
          <MapPin className="w-12 h-12 text-ink/20 mx-auto mb-4" />
          <p className="text-ink/60 font-body">No destinations found</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-xl border-3 border-ink overflow-hidden">
          <table className="w-full">
            <thead className="bg-sunrise/50 border-b-3 border-ink">
              <tr>
                <th className="px-4 py-3 text-left font-display text-ink">Destination</th>
                <th className="px-4 py-3 text-left font-display text-ink hidden md:table-cell">Distance</th>
                <th className="px-4 py-3 text-center font-display text-ink">Status</th>
                <th className="px-4 py-3 text-center font-display text-ink">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDestinations.map((dest, index) => (
                <tr key={dest.id} className="border-b border-ink/10 hover:bg-sunrise/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{dest.emoji || "🏔️"}</span>
                      <div>
                        <div className="font-display text-ink">{dest.name}</div>
                        <div className="text-sm text-ink/60 font-body">/{dest.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-ink/70 font-body">
                      {dest.distance_from_nainital ? `${dest.distance_from_nainital} km` : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleActive(dest)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-xs font-body font-semibold transition-colors",
                          dest.is_active
                            ? "bg-teal/20 text-teal"
                            : "bg-ink/10 text-ink/50"
                        )}
                      >
                        {dest.is_active ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => handleTogglePopular(dest)}
                        className={cn(
                          "p-1 rounded-lg transition-colors",
                          dest.is_popular
                            ? "bg-sunshine text-ink"
                            : "bg-ink/10 text-ink/30 hover:text-ink/60"
                        )}
                        title={dest.is_popular ? "Remove from popular" : "Mark as popular"}
                      >
                        <Star className="w-4 h-4" fill={dest.is_popular ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {/* Reorder */}
                      <button
                        onClick={() => handleReorder(dest.id, "up")}
                        disabled={index === 0}
                        className="p-1 hover:bg-ink/10 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorder(dest.id, "down")}
                        disabled={index === filteredDestinations.length - 1}
                        className="p-1 hover:bg-ink/10 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* View */}
                      <Link
                        href={`/destinations/${dest.slug}`}
                        target="_blank"
                        className="p-2 hover:bg-lake/20 rounded-lg transition-colors"
                        title="View public page"
                      >
                        <Eye className="w-4 h-4 text-teal" />
                      </Link>

                      {/* Edit */}
                      <Link
                        href={`/admin/destinations/${dest.id}`}
                        className="p-2 hover:bg-sunshine/30 rounded-lg transition-colors"
                        title="Edit destination"
                      >
                        <Edit2 className="w-4 h-4 text-ink" />
                      </Link>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(dest)}
                        className="p-2 hover:bg-coral/20 rounded-lg transition-colors"
                        title="Delete destination"
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
          {filteredDestinations.map((dest) => (
            <div
              key={dest.id}
              className="bg-white rounded-xl border-3 border-ink overflow-hidden hover:shadow-retro transition-shadow"
            >
              <div className="h-32 bg-gradient-to-br from-teal/20 to-lake/20 flex items-center justify-center">
                <span className="text-5xl">{dest.emoji || "🏔️"}</span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-display text-lg text-ink">{dest.name}</h3>
                  <div className="flex gap-1">
                    {dest.is_popular && (
                      <Star className="w-4 h-4 text-sunshine" fill="currentColor" />
                    )}
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full mt-1",
                        dest.is_active ? "bg-teal" : "bg-ink/30"
                      )}
                    />
                  </div>
                </div>
                <p className="text-sm text-ink/60 font-body mb-3 line-clamp-2">
                  {dest.tagline || dest.description || "No description"}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink/50 font-body">
                    {dest.distance_from_nainital ? `${dest.distance_from_nainital} km` : "-"}
                  </span>
                  <div className="flex gap-1">
                    <Link
                      href={`/destinations/${dest.slug}`}
                      target="_blank"
                      className="p-1.5 hover:bg-lake/20 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 text-teal" />
                    </Link>
                    <Link
                      href={`/admin/destinations/${dest.id}`}
                      className="p-1.5 hover:bg-sunshine/30 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-ink" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-ink/50 font-body">
        Showing {filteredDestinations.length} of {destinations.length} destinations
      </div>
    </div>
  );
}
