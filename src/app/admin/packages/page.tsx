"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  Eye,
  Edit2,
  Trash2,
  Star,
  MapPin,
  Clock,
  LayoutGrid,
  List,
  Filter,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Package as PackageType } from "@/lib/supabase/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

type ViewMode = "grid" | "list";
type TypeFilter = "all" | "tour" | "transfer";

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const fetchPackages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPackages((data as PackageType[]) || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const toggleActive = async (pkg: PackageType) => {
    setSaving(pkg.id);
    try {
      const response = await fetch("/api/admin/packages", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          id: pkg.id,
          updates: { is_active: !pkg.is_active },
        }),
      });

      if (!response.ok) throw new Error("Failed to toggle active");

      setPackages((prev) =>
        prev.map((p) =>
          p.id === pkg.id ? { ...p, is_active: !p.is_active } : p
        )
      );
    } catch (error) {
      console.error("Error toggling active:", error);
    } finally {
      setSaving(null);
    }
  };

  const togglePopular = async (pkg: PackageType) => {
    setSaving(pkg.id);
    try {
      const response = await fetch("/api/admin/packages", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          id: pkg.id,
          updates: { is_popular: !pkg.is_popular },
        }),
      });

      if (!response.ok) throw new Error("Failed to toggle popular");

      setPackages((prev) =>
        prev.map((p) =>
          p.id === pkg.id ? { ...p, is_popular: !p.is_popular } : p
        )
      );
    } catch (error) {
      console.error("Error toggling popular:", error);
    } finally {
      setSaving(null);
    }
  };

  const movePackage = async (pkg: PackageType, direction: "up" | "down") => {
    const currentIndex = packages.findIndex((p) => p.id === pkg.id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= packages.length) return;

    setSaving(pkg.id);
    try {
      const newPackages = [...packages];
      const temp = newPackages[currentIndex];
      newPackages[currentIndex] = newPackages[targetIndex];
      newPackages[targetIndex] = temp;

      // Update display_order for both packages
      const orders = newPackages.map((p, index) => ({
        id: p.id,
        display_order: index,
      }));

      const response = await fetch("/api/admin/packages/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({ orders }),
      });

      if (!response.ok) throw new Error("Failed to reorder");

      setPackages(newPackages.map((p, index) => ({ ...p, display_order: index })));
    } catch (error) {
      console.error("Error reordering packages:", error);
    } finally {
      setSaving(null);
    }
  };

  const deletePackage = async (pkg: PackageType) => {
    if (!confirm(`Are you sure you want to delete "${pkg.title}"?`)) return;

    setSaving(pkg.id);
    try {
      const response = await fetch(`/api/admin/packages?id=${pkg.id}`, {
        method: "DELETE",
        headers: { "x-admin-auth": ADMIN_PASSWORD },
      });

      if (!response.ok) throw new Error("Failed to delete");

      setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
    } catch (error) {
      console.error("Error deleting package:", error);
      alert("Failed to delete package.");
    } finally {
      setSaving(null);
    }
  };

  // Filter packages
  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || pkg.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const tourCount = packages.filter((p) => p.type === "tour").length;
  const transferCount = packages.filter((p) => p.type === "transfer").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl font-display text-ink animate-pulse">
          Loading packages...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink">Package Manager</h1>
          <p className="text-ink/60 font-body mt-1">
            Manage tour packages and transfer routes
          </p>
        </div>
        <Link
          href="/admin/packages/new"
          className="flex items-center gap-2 px-4 py-2 bg-sunshine border-3 border-ink rounded-xl font-body font-semibold shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Package
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border-3 border-ink p-4 shadow-retro-sm">
          <div className="text-2xl font-display text-ink">{packages.length}</div>
          <div className="text-sm font-body text-ink/60">Total Packages</div>
        </div>
        <div className="bg-teal/20 rounded-xl border-3 border-ink p-4 shadow-retro-sm">
          <div className="text-2xl font-display text-ink">{tourCount}</div>
          <div className="text-sm font-body text-ink/60">Tour Packages</div>
        </div>
        <div className="bg-coral/20 rounded-xl border-3 border-ink p-4 shadow-retro-sm">
          <div className="text-2xl font-display text-ink">{transferCount}</div>
          <div className="text-sm font-body text-ink/60">Transfer Routes</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search packages..."
              className="w-full pl-10 pr-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-ink/40" />
            <div className="flex bg-sunrise/30 rounded-xl border-2 border-ink overflow-hidden">
              {(["all", "tour", "transfer"] as TypeFilter[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "px-4 py-2 font-body text-sm capitalize transition-colors",
                    typeFilter === type
                      ? "bg-sunshine font-semibold"
                      : "hover:bg-sunshine/50"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex bg-sunrise/30 rounded-xl border-2 border-ink overflow-hidden">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "list" ? "bg-sunshine" : "hover:bg-sunshine/50"
              )}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid" ? "bg-sunshine" : "hover:bg-sunshine/50"
              )}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Packages List/Grid */}
      {filteredPackages.length === 0 ? (
        <div className="bg-white rounded-2xl border-3 border-ink p-8 text-center shadow-retro">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-xl font-display text-ink mb-2">No packages found</h3>
          <p className="text-ink/60 font-body">
            {searchQuery || typeFilter !== "all"
              ? "Try adjusting your filters"
              : "Create your first package to get started"}
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {filteredPackages.map((pkg, index) => (
            <div
              key={pkg.id}
              className={cn(
                "bg-white rounded-2xl border-3 border-ink shadow-retro overflow-hidden",
                !pkg.is_active && "opacity-60"
              )}
            >
              <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Reorder Buttons */}
                  <div className="flex md:flex-col gap-1">
                    <button
                      onClick={() => movePackage(pkg, "up")}
                      disabled={index === 0 || saving === pkg.id}
                      className="p-1 hover:bg-sunrise/50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => movePackage(pkg, "down")}
                      disabled={index === filteredPackages.length - 1 || saving === pkg.id}
                      className="p-1 hover:bg-sunrise/50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Image */}
                  {pkg.image_url && (
                    <div className="w-24 h-16 rounded-lg overflow-hidden border-2 border-ink flex-shrink-0">
                      <img
                        src={pkg.image_url}
                        alt={pkg.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-lg text-ink truncate">
                        {pkg.title}
                      </h3>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-body font-semibold rounded-full border",
                          pkg.type === "tour"
                            ? "bg-teal/20 border-teal text-teal"
                            : "bg-coral/20 border-coral text-coral"
                        )}
                      >
                        {pkg.type}
                      </span>
                      {pkg.is_popular && (
                        <span className="px-2 py-0.5 text-xs font-body font-semibold rounded-full bg-sunshine border border-ink">
                          Popular
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-ink/60 font-body">
                      {pkg.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {pkg.duration}
                        </span>
                      )}
                      {pkg.places_covered && pkg.places_covered.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {pkg.places_covered.length} places
                        </span>
                      )}
                      <span className="text-ink/40">/{pkg.slug}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Popular Toggle */}
                    <button
                      onClick={() => togglePopular(pkg)}
                      disabled={saving === pkg.id}
                      className={cn(
                        "p-2 rounded-lg border-2 transition-colors",
                        pkg.is_popular
                          ? "bg-sunshine border-ink"
                          : "border-ink/20 hover:bg-sunrise/30"
                      )}
                      title={pkg.is_popular ? "Remove from popular" : "Mark as popular"}
                    >
                      <Star
                        className={cn(
                          "w-4 h-4",
                          pkg.is_popular ? "fill-ink" : "text-ink/40"
                        )}
                      />
                    </button>

                    {/* Active Toggle */}
                    <button
                      onClick={() => toggleActive(pkg)}
                      disabled={saving === pkg.id}
                      className={cn(
                        "px-3 py-2 rounded-lg font-body text-sm border-2 transition-colors",
                        pkg.is_active
                          ? "bg-whatsapp/20 border-whatsapp text-whatsapp"
                          : "bg-ink/10 border-ink/20 text-ink/60"
                      )}
                    >
                      {pkg.is_active ? "Active" : "Inactive"}
                    </button>

                    {/* View */}
                    <Link
                      href={pkg.type === "tour" ? `/tour/${pkg.slug}` : `/destinations/${pkg.slug}`}
                      target="_blank"
                      className="p-2 hover:bg-lake/20 rounded-lg transition-colors"
                      title="View public page"
                    >
                      <Eye className="w-4 h-4 text-teal" />
                    </Link>

                    {/* Edit */}
                    <Link
                      href={`/admin/packages/${pkg.id}`}
                      className="p-2 hover:bg-sunshine/30 rounded-lg transition-colors"
                      title="Edit package"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>

                    {/* Delete */}
                    <button
                      onClick={() => deletePackage(pkg)}
                      disabled={saving === pkg.id}
                      className="p-2 hover:bg-coral/20 rounded-lg transition-colors"
                      title="Delete package"
                    >
                      <Trash2 className="w-4 h-4 text-coral" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Grid View
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={cn(
                "bg-white rounded-2xl border-3 border-ink shadow-retro overflow-hidden",
                !pkg.is_active && "opacity-60"
              )}
            >
              {/* Image */}
              {pkg.image_url && (
                <div className="h-32 overflow-hidden border-b-3 border-ink">
                  <img
                    src={pkg.image_url}
                    alt={pkg.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-4">
                {/* Type Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs font-body font-semibold rounded-full border",
                      pkg.type === "tour"
                        ? "bg-teal/20 border-teal text-teal"
                        : "bg-coral/20 border-coral text-coral"
                    )}
                  >
                    {pkg.type}
                  </span>
                  {pkg.is_popular && (
                    <Star className="w-4 h-4 fill-sunshine text-sunshine" />
                  )}
                </div>

                {/* Title */}
                <h3 className="font-display text-lg text-ink truncate mb-1">
                  {pkg.title}
                </h3>

                {/* Meta */}
                <div className="flex items-center gap-3 text-sm text-ink/60 font-body mb-4">
                  {pkg.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {pkg.duration}
                    </span>
                  )}
                  {pkg.places_covered && (
                    <span>{pkg.places_covered.length} places</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/packages/${pkg.id}`}
                    className="flex-1 py-2 text-center bg-sunshine border-2 border-ink rounded-lg font-body text-sm font-semibold hover:bg-sunshine/80 transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => toggleActive(pkg)}
                    disabled={saving === pkg.id}
                    className={cn(
                      "p-2 rounded-lg border-2 transition-colors",
                      pkg.is_active
                        ? "border-whatsapp text-whatsapp"
                        : "border-ink/20 text-ink/40"
                    )}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deletePackage(pkg)}
                    disabled={saving === pkg.id}
                    className="p-2 hover:bg-coral/20 rounded-lg border-2 border-transparent transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-coral" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      <div className="bg-lake/20 rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="flex items-center justify-between font-body text-sm text-ink">
          <span>
            Showing {filteredPackages.length} of {packages.length} packages
          </span>
          <span>
            {packages.filter((p) => p.is_active).length} active,{" "}
            {packages.filter((p) => p.is_popular).length} popular
          </span>
        </div>
      </div>
    </div>
  );
}
