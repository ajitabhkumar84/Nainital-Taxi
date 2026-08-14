"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, MapPin, ArrowRight, Loader2, ToggleLeft, ToggleRight, GripVertical } from "lucide-react";
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
import { Route } from "@/lib/supabase/types";

interface RoutePricing {
  vehicle_type: string;
  season_name: string;
  price: number;
  is_active?: boolean;
}

interface RouteWithPricing extends Route {
  // Nullable on purpose: the key is absent when the list is fetched without
  // ?withPricing=true, and an embedded PostgREST relation can come back null
  // rather than []. Typing it this way makes TypeScript force the `|| []`
  // guard at every use site instead of leaving it to discipline — a bare
  // .filter() here would crash on exactly the routes the "no pricing" warning
  // exists to flag.
  pricing?: RoutePricing[] | null;
}

interface SortableRouteCardProps {
  route: RouteWithPricing;
  deleting: string | null;
  isSaving: boolean;
  onDelete: (id: string, slug: string) => void;
  onToggle: (route: Route, field: "is_active" | "enable_online_booking") => void;
}

function SortableRouteCard({
  route,
  deleting,
  isSaving,
  onDelete,
  onToggle,
}: SortableRouteCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: route.id,
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

  const availableVehicles = Array.from(
    new Set(
      (route.pricing || [])
        .filter((p) => p.is_active !== false && p.price > 0)
        .map((p) => p.vehicle_type)
    )
  );

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
            the Edit/Delete buttons and status toggles stay clickable, and so
            the keyboard sensor has a real focusable target. `touch-none` is
            required for PointerSensor on touch devices; without it the browser
            scrolls instead of starting a drag. */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={isSaving}
          aria-label={`Reorder ${route.pickup_location} to ${route.drop_location}`}
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
                <h3 className="text-xl font-display text-ink">
                  {route.pickup_location}
                </h3>
                <ArrowRight className="w-5 h-5 text-coral" />
                <h3 className="text-xl font-display text-ink">
                  {route.drop_location}
                </h3>
                {/* Explains why the list holds paired entries, and warns that
                    this row's prices are mirrored from its primary. */}
                {route.reverse_of_route_id && (
                  <span
                    className="px-2 py-0.5 text-xs font-body font-semibold bg-lake/15 text-lake border-2 border-lake rounded-lg whitespace-nowrap"
                    title="Auto-generated return route — its prices follow the primary route"
                  >
                    ↩ auto return
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-ink/60 font-body">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  /{route.slug}
                </span>
                {route.distance && (
                  <span>{route.distance} km</span>
                )}
                {route.duration && (
                  <span>{route.duration}</span>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-body font-semibold rounded-full border-2 bg-gray-100 border-gray-300 text-gray-600">
                  Order: {route.display_order}
                </span>

                <button
                  onClick={() => onToggle(route, "is_active")}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-body font-semibold rounded-full border-2 transition-colors ${
                    route.is_active
                      ? "bg-whatsapp/10 border-whatsapp text-whatsapp"
                      : "bg-gray-100 border-gray-300 text-gray-500"
                  }`}
                >
                  {route.is_active ? (
                    <ToggleRight className="w-4 h-4" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                  {route.is_active ? "Active" : "Inactive"}
                </button>

                <button
                  onClick={() => onToggle(route, "enable_online_booking")}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-body font-semibold rounded-full border-2 transition-colors ${
                    route.enable_online_booking
                      ? "bg-teal/10 border-teal text-teal"
                      : "bg-gray-100 border-gray-300 text-gray-500"
                  }`}
                >
                  {route.enable_online_booking ? (
                    <ToggleRight className="w-4 h-4" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                  {route.enable_online_booking ? "Online Booking ON" : "Online Booking OFF"}
                </button>

                {route.show_on_destination_page && (
                  <span className="px-3 py-1 text-xs font-body font-semibold rounded-full border-2 bg-lake/10 border-lake text-lake">
                    Show on Destination Page
                  </span>
                )}

                {route.destination_slug ? (
                  <span className="px-3 py-1 text-xs font-body font-semibold rounded-full border-2 bg-sunshine/10 border-sunshine text-ink">
                    Links to /destinations/{route.destination_slug}
                  </span>
                ) : (
                  <span className="px-3 py-1 text-xs font-body font-semibold rounded-full border-2 bg-gray-100 border-gray-300 text-gray-500">
                    Direct booking only
                  </span>
                )}

                {route.has_hotel_option && (
                  <span className="px-3 py-1 text-xs font-body font-semibold rounded-full border-2 bg-coral/10 border-coral text-coral">
                    With Hotel Option
                  </span>
                )}
              </div>

              {/* Vehicle Availability */}
              {availableVehicles.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs text-ink/50 font-body mb-1">Available Vehicles:</p>
                  <div className="flex flex-wrap gap-1">
                    {availableVehicles.map((vehicleType) => (
                      <span
                        key={vehicleType}
                        className="px-2 py-1 text-xs font-body rounded-md bg-lake/10 text-lake border border-lake/30"
                      >
                        {vehicleType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-xs text-coral font-body">⚠️ No pricing configured</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/routes/${route.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sunshine text-ink font-body font-semibold rounded-xl border-2 border-ink hover:bg-sunshine/80 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={() => onDelete(route.id, route.slug)}
                disabled={deleting === route.id}
                className="inline-flex items-center gap-2 px-4 py-2 bg-coral text-white font-body font-semibold rounded-xl border-2 border-ink hover:bg-coral/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting === route.id ? (
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

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteWithPricing[]>([]);
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
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch("/api/admin/routes?withPricing=true");

      if (!response.ok) throw new Error("Failed to fetch routes");

      const { data } = await response.json();
      // The API now orders by display_order, matching the order routes appear
      // in on / and /rates — no client-side re-sort, so it can't fight the
      // optimistic order set by a drag.
      setRoutes(data || []);
    } catch (error) {
      console.error("Error fetching routes:", error);
      alert("Failed to load routes");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = routes.findIndex((r) => r.id === active.id);
    const newIndex = routes.findIndex((r) => r.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Renumber the whole list rather than swapping a pair. This is what removes
    // the old "change one, hand-adjust several others to make room" problem,
    // and it normalises any pre-existing gaps or duplicate orders.
    const previous = routes;
    const reordered = arrayMove(routes, oldIndex, newIndex).map((route, index) => ({
      ...route,
      display_order: index,
    }));

    setRoutes(reordered);
    setSavingOrder(true);

    try {
      const response = await fetch("/api/admin/routes/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updates: reordered.map((route, index) => ({
            id: route.id,
            display_order: index,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to reorder routes");
    } catch (error) {
      console.error("Error reordering routes:", error);
      setRoutes(previous);
      alert("Failed to save the new order");
      await fetchRoutes();
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDelete = async (id: string, slug: string) => {
    if (!confirm(`Are you sure you want to delete the route "${slug}"?`)) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/routes?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete route");

      await fetchRoutes();
      alert("Route deleted successfully");
    } catch (error) {
      console.error("Error deleting route:", error);
      alert("Failed to delete route");
    } finally {
      setDeleting(null);
    }
  };

  const toggleStatus = async (route: Route, field: "is_active" | "enable_online_booking") => {
    try {
      const response = await fetch("/api/admin/routes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: route.id,
          updates: {
            [field]: !route[field],
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to update route");

      await fetchRoutes();
    } catch (error) {
      console.error("Error updating route:", error);
      alert("Failed to update route");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-xl font-display text-ink">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading routes...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink">Transfer Routes</h1>
          <p className="text-ink/60 font-body mt-1">
            Manage pickup to drop location routes
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/routes/pickup-locations"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-ink font-body font-semibold rounded-xl border-3 border-ink hover:bg-ink/5 transition-colors"
          >
            <MapPin className="w-5 h-5" />
            Manage Pickup Locations
          </Link>
          <Link
            href="/admin/routes/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-whatsapp text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Route
          </Link>
        </div>
      </div>

      {/* Routes List */}
      {routes.length === 0 ? (
        <div className="bg-white rounded-2xl border-3 border-ink p-12 text-center shadow-retro">
          <MapPin className="w-16 h-16 text-ink/20 mx-auto mb-4" />
          <h3 className="text-xl font-display text-ink mb-2">
            No routes yet
          </h3>
          <p className="text-ink/60 font-body mb-6">
            Create your first transfer route to get started
          </p>
          <Link
            href="/admin/routes/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sunshine text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Route
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-ink/60 font-body">
            <GripVertical className="w-4 h-4" />
            <span>
              Drag a route by its handle to reorder. This order is what visitors
              see on the homepage and /rates.
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
              items={routes.map((r) => r.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4">
                {routes.map((route) => (
                  <SortableRouteCard
                    key={route.id}
                    route={route}
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
