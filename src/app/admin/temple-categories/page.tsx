"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Save, X } from "lucide-react";
import { TempleCategory } from "@/lib/supabase/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

const ICON_OPTIONS = [
  "temple",
  "om",
  "shiva",
  "shakti",
  "lotus",
  "mountain",
  "star",
  "heritage",
  "custom",
];

export default function TempleCategoriesPage() {
  const [categories, setCategories] = useState<TempleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    category_name: "",
    category_slug: "",
    category_description: "",
    icon: "temple",
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/temple-categories", {
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
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/temple-categories?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete category");
      }

      await fetchCategories();
      alert("Category deleted successfully");
    } catch (error: any) {
      console.error("Error deleting category:", error);
      alert(error.message || "Failed to delete category");
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (category: TempleCategory) => {
    setEditingId(category.id);
    setFormData({
      category_name: category.category_name,
      category_slug: category.category_slug,
      category_description: category.category_description || "",
      icon: category.icon,
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      category_name: "",
      category_slug: "",
      category_description: "",
      icon: "temple",
      display_order: 0,
      is_active: true,
    });
  };

  const handleAddNew = () => {
    setShowAddForm(true);
    setEditingId(null);
    setFormData({
      category_name: "",
      category_slug: "",
      category_description: "",
      icon: "temple",
      display_order: categories.length,
      is_active: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_name) {
      alert("Category name is required");
      return;
    }

    try {
      if (editingId) {
        // Update existing
        const response = await fetch("/api/admin/temple-categories", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-auth": ADMIN_PASSWORD,
          },
          body: JSON.stringify({
            id: editingId,
            ...formData,
          }),
        });

        if (!response.ok) throw new Error("Failed to update category");
        alert("Category updated successfully");
      } else {
        // Create new
        const response = await fetch("/api/admin/temple-categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-auth": ADMIN_PASSWORD,
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error("Failed to create category");
        alert("Category created successfully");
      }

      await fetchCategories();
      handleCancelEdit();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Failed to save category");
    }
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
        <div className="flex items-center gap-4">
          <Link
            href="/admin/temples"
            className="p-2 hover:bg-sunrise/50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-ink" />
          </Link>
          <div>
            <h1 className="text-3xl font-display text-ink">Temple Categories</h1>
            <p className="text-ink/60 font-body mt-1">
              Organize temples into spiritual categories
            </p>
          </div>
        </div>
        {!showAddForm && !editingId && (
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-6 py-3 bg-whatsapp text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Category
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display text-ink">
              {editingId ? "Edit Category" : "Add New Category"}
            </h2>
            <button
              type="button"
              onClick={() => {
                handleCancelEdit();
                setShowAddForm(false);
              }}
              className="p-2 hover:bg-coral/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-coral" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-sm text-ink/60 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.category_name}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      category_name: e.target.value,
                      category_slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .replace(/\s+/g, "-")
                        .trim(),
                    });
                  }}
                  className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-body text-sm text-ink/60 mb-2">
                  Category Slug
                </label>
                <input
                  type="text"
                  value={formData.category_slug}
                  onChange={(e) => setFormData({ ...formData, category_slug: e.target.value })}
                  className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                  placeholder="auto-generated"
                />
              </div>
            </div>

            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Description
              </label>
              <textarea
                value={formData.category_description}
                onChange={(e) => setFormData({ ...formData, category_description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                placeholder="Brief description of this category..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-sm text-ink/60 mb-2">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                >
                  {ICON_OPTIONS.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-body text-sm text-ink/60 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                  className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:ring-2 focus:ring-sunshine focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-3 border-ink"
              />
              <label htmlFor="is_active" className="font-body text-ink">
                Active
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-whatsapp text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <Save className="w-5 h-5" />
                {editingId ? "Update Category" : "Create Category"}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleCancelEdit();
                  setShowAddForm(false);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border-3 border-ink p-12 text-center shadow-retro">
          <h3 className="text-xl font-display text-ink mb-2">
            No categories yet
          </h3>
          <p className="text-ink/60 font-body mb-6">
            Create your first temple category to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro hover:shadow-retro-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-sunshine/20 border-2 border-sunshine text-sunshine rounded-full text-sm font-display">
                      {category.icon}
                    </span>
                    <h3 className="text-xl font-display text-ink">
                      {category.category_name}
                    </h3>
                    {!category.is_active && (
                      <span className="px-2 py-1 bg-gray-200 border border-gray-400 text-gray-600 rounded-full text-xs font-body">
                        Inactive
                      </span>
                    )}
                  </div>

                  {category.category_description && (
                    <p className="text-sm text-ink/60 font-body mb-2">
                      {category.category_description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-sm text-ink/40 font-body">
                    <span>Slug: /{category.category_slug}</span>
                    <span>•</span>
                    <span>Order: {category.display_order}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-lake text-white font-body rounded-xl border-3 border-ink shadow-retro-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id, category.category_name)}
                    disabled={deleting === category.id}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-coral text-white font-body rounded-xl border-3 border-ink shadow-retro-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === category.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </>
                    )}
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
