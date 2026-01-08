"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
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

interface RouteCategoryFormProps {
  categoryId?: string;
}

export default function RouteCategoryForm({ categoryId }: RouteCategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!categoryId);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    category_name: "",
    category_slug: "",
    category_description: "",
    icon: "car",
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/admin/route-categories?id=${categoryId}`, {
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch category");

      const { data } = await response.json();
      setFormData({
        category_name: data.category_name,
        category_slug: data.category_slug,
        category_description: data.category_description || "",
        icon: data.icon,
        display_order: data.display_order,
        is_active: data.is_active,
      });
    } catch (error) {
      console.error("Error fetching category:", error);
      alert("Failed to load category");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category_name: value,
      category_slug: generateSlug(value),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = categoryId
        ? "/api/admin/route-categories"
        : "/api/admin/route-categories";

      const method = categoryId ? "PATCH" : "POST";

      const body = categoryId
        ? { id: categoryId, updates: formData }
        : formData;

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
        throw new Error(error.message || "Failed to save category");
      }

      alert(categoryId ? "Category updated successfully!" : "Category created successfully!");
      router.push("/admin/route-categories");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving category:", error);
      alert(error.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-xl font-display text-ink">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading category...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/route-categories"
          className="p-2 hover:bg-lake/10 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-display text-ink">
            {categoryId ? "Edit Category" : "New Category"}
          </h1>
          <p className="text-ink/60 font-body mt-1">
            {categoryId
              ? "Update category information"
              : "Create a new route category"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border-3 border-ink p-8 shadow-retro">
          <h2 className="text-xl font-display text-ink mb-6">
            Category Information
          </h2>

          <div className="space-y-6">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-body font-semibold text-ink mb-2">
                Category Name <span className="text-coral">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.category_name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-lake"
                placeholder="e.g., Popular Destinations"
              />
            </div>

            {/* Category Slug */}
            <div>
              <label className="block text-sm font-body font-semibold text-ink mb-2">
                Category Slug <span className="text-coral">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.category_slug}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category_slug: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border-2 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-lake"
                placeholder="e.g., popular-destinations"
              />
              <p className="text-xs text-ink/50 mt-1">
                URL-friendly identifier (auto-generated from name)
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-body font-semibold text-ink mb-2">
                Description
              </label>
              <textarea
                value={formData.category_description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category_description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-4 py-3 border-2 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-lake"
                placeholder="Brief description of this category"
              />
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-body font-semibold text-ink mb-2">
                Icon <span className="text-coral">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ICON_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, icon: option.value }))
                    }
                    className={`p-4 border-2 rounded-xl font-body text-center transition-all ${
                      formData.icon === option.value
                        ? "border-lake bg-lake/10 shadow-retro"
                        : "border-ink/20 hover:border-ink/50"
                    }`}
                  >
                    <div className="text-3xl mb-2">{option.emoji}</div>
                    <div className="text-sm font-semibold">
                      {option.label.replace(/[^ ]+ /, "")}
                    </div>
                  </button>
                ))}
              </div>
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
                Active (show on rates page)
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
                {categoryId ? "Update Category" : "Create Category"}
              </>
            )}
          </button>
          <Link
            href="/admin/route-categories"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-ink font-body font-semibold rounded-xl border-2 border-ink hover:bg-ink/5 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
