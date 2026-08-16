"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  FolderTree,
  ToggleLeft,
  ToggleRight,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RouteCategory } from "@/lib/supabase/types";

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

const getIconEmoji = (iconValue: string) => {
  const icon = ICON_OPTIONS.find((opt) => opt.value === iconValue);
  return icon?.emoji || "📁";
};

interface SortableCategoryCardProps {
  category: RouteCategory;
  deleting: string | null;
  isSaving: boolean;
  onDelete: (id: string, name: string) => void;
  onToggle: (category: RouteCategory) => void;
}

function SortableCategoryCard({
  category,
  deleting,
  isSaving,
  onDelete,
  onToggle,
}: SortableCategoryCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    // DndContext has no `disabled` prop — this is the lever that freezes both
    // pointer and keyboard dragging while a reorder POST is in flight.
    disabled: isSaving,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // z-index has no effect on a statically-positioned element, so without
    // `position: relative` the lifted card still slides *under* the cards it
    // passes over.
    position: "relative",
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-2xl border-3 border-ink p-6 transition-shadow ${
        isDragging ? "shadow-retro-lg" : "shadow-retro hover:shadow-retro-lg"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Drag handle — listeners live here rather than on the whole card so
            the Edit/Delete buttons and status toggle stay clickable, and so
            the keyboard sensor has a real focusable target. `touch-none` is
            required for PointerSensor on touch devices; without it the browser
            scrolls instead of starting a drag. */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={isSaving}
          aria-label={`Reorder ${category.category_name}`}
          className={`mt-1 shrink-0 p-2 rounded-lg border-2 border-ink/10 text-ink/40 touch-none transition-colors ${
            isSaving
              ? "cursor-not-allowed opacity-40"
              : "cursor-grab active:cursor-grabbing hover:text-ink hover:border-ink/30"
          }`}
        >
          <GripVertical className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{getIconEmoji(category.icon)}</span>
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

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={() => onToggle(category)}
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
              <Link
                href={`/admin/route-categories/${category.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sunshine text-ink font-body font-semibold rounded-xl border-2 border-ink hover:bg-sunshine/80 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={() => onDelete(category.id, category.category_name)}
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
      </div>
    </div>
  );
}

export default function RouteCategoriesPage() {
  const [categories, setCategories] = useState<RouteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const sensors = useSensors(
    // The 8px threshold matters: without it, a pointer-down anywhere on a card
    // starts a drag and swallows clicks on the Edit/Delete/toggle controls
    // nested inside it.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/route-categories");

      if (!response.ok) throw new Error("Failed to fetch categories");

      const { data } = await response.json();
      // The API orders by display_order, matching the order categories
      // appear in on /rates — no client-side re-sort, so it can't fight the
      // optimistic order set by a drag.
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      alert("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Renumber the whole list rather than swapping a pair — normalises any
    // pre-existing gaps or duplicate orders in one pass.
    const previous = categories;
    const reordered = arrayMove(categories, oldIndex, newIndex).map((category, index) => ({
      ...category,
      display_order: index,
    }));

    setCategories(reordered);
    setSavingOrder(true);

    try {
      const response = await fetch("/api/admin/route-categories/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updates: reordered.map((category, index) => ({
            id: category.id,
            display_order: index,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to reorder categories");
    } catch (error) {
      console.error("Error reordering categories:", error);
      setCategories(previous);
      alert("Failed to save the new order");
      await fetchCategories();
    } finally {
      setSavingOrder(false);
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
        <>
          <div className="flex items-center gap-2 text-sm text-ink/60 font-body">
            <GripVertical className="w-4 h-4" />
            <span>
              Drag a category by its handle to reorder. This order is what
              visitors see as tabs on /rates.
            </span>
            {savingOrder && (
              <span className="inline-flex items-center gap-1 text-ink/80">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving order...
              </span>
            )}
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4">
                {categories.map((category) => (
                  <SortableCategoryCard
                    key={category.id}
                    category={category}
                    deleting={deleting}
                    isSaving={savingOrder}
                    onDelete={handleDelete}
                    onToggle={toggleStatus}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}
