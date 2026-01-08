"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  FolderTree,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { RouteCategory } from "@/lib/supabase/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

const ICON_OPTIONS = [
  { value: "car", label: "🚗 Car", emoji: "🚗" },
  { value: "mountain", label: "⛰️ Mountain", emoji: "⛰️" },
  { value: "temple", label: "🛕 Temple", emoji: "🛕" },
  { value: "city", label: "🏙️ City", emoji: "🏙️" },
  { value: "lake", label: "🏞️ Lake", emoji: "🏞️" },
  { value: "nature", label: "🌲 Nature", emoji: "🌲" },
  { value: "road", label: "🛣️ Road", emoji: "🛣️" },
  { value: "custom", label: "✨ Custom", emoji: "✨" },
];

export default function RouteCategoriesPage() {
  const [categories, setCategories] = useState<RouteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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
      alert("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/route-categories?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
      });

      if (!response.ok) throw new Error("Failed to delete category");

      await fetchCategories();
      alert("Category deleted successfully");
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category");
    } finally {
      setDeleting(null);
    }
  };

  const toggleStatus = async (category: RouteCategory) => {
    try {
      const response = await fetch("/api/admin/route-categories", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          id: category.id,
          updates: {
            is_active: !category.is_active,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to update category");

      await fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Failed to update category");
    }
  };

  const moveCategory = async (categoryId: string, direction: "up" | "down") => {
    const currentIndex = categories.findIndex((c) => c.id === categoryId);
    if (currentIndex === -1) return;

    const newIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= categories.length) return;

    try {
      // Swap display_order values
      const updates = [
        {
          id: categories[currentIndex].id,
          display_order: categories[newIndex].display_order,
        },
        {
          id: categories[newIndex].id,
          display_order: categories[currentIndex].display_order,
        },
      ];

      const response = await fetch("/api/admin/route-categories/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) throw new Error("Failed to reorder categories");

      await fetchCategories();
    } catch (error) {
      console.error("Error reordering categories:", error);
      alert("Failed to reorder categories");
    }
  };

  const getIconEmoji = (iconValue: string) => {
    const icon = ICON_OPTIONS.find((opt) => opt.value === iconValue);
    return icon?.emoji || "📁";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-xl font-display text-ink">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading categories...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink">Route Categories</h1>
          <p className="text-ink/60 font-body mt-1">
            Organize routes into categories for the rates page
          </p>
        </div>
        <Link
          href="/admin/route-categories/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-whatsapp text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add New Category
        </Link>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border-3 border-ink p-12 text-center shadow-retro">
          <FolderTree className="w-16 h-16 text-ink/20 mx-auto mb-4" />
          <h3 className="text-xl font-display text-ink mb-2">
            No categories yet
          </h3>
          <p className="text-ink/60 font-body mb-6">
            Create your first category to organize routes
          </p>
          <Link
            href="/admin/route-categories/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sunshine text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Category
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro hover:shadow-retro-lg transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">
                      {getIconEmoji(category.icon)}
                    </span>
                    <h3 className="text-xl font-display text-ink">
                      {category.category_name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-ink/60 font-body">
                    <span>/{category.category_slug}</span>
                    <span>•</span>
                    <span>Order: {category.display_order}</span>
                  </div>

                  {category.category_description && (
                    <p className="text-sm text-ink/60 font-body mt-2">
                      {category.category_description}
                    </p>
                  )}

                  {/* Status Badge */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => toggleStatus(category)}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-body font-semibold rounded-full border-2 transition-colors ${
                        category.is_active
                          ? "bg-whatsapp/10 border-whatsapp text-whatsapp"
                          : "bg-gray-100 border-gray-300 text-gray-500"
                      }`}
                    >
                      {category.is_active ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                      {category.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 border-2 border-ink rounded-lg p-1">
                    <button
                      onClick={() => moveCategory(category.id, "up")}
                      disabled={index === 0}
                      className="p-1 hover:bg-lake/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveCategory(category.id, "down")}
                      disabled={index === categories.length - 1}
                      className="p-1 hover:bg-lake/10 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    href={`/admin/route-categories/${category.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sunshine text-ink font-body font-semibold rounded-xl border-2 border-ink hover:bg-sunshine/80 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    onClick={() =>
                      handleDelete(category.id, category.category_name)
                    }
                    disabled={deleting === category.id}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-coral text-white font-body font-semibold rounded-xl border-2 border-ink hover:bg-coral/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === category.id ? (
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
