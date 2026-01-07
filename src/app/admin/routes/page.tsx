"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, MapPin, ArrowRight, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { Route } from "@/lib/supabase/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

interface RouteWithPricing extends Route {
  pricing?: Array<{
    vehicle_type: string;
    season_name: string;
    price: number;
  }>;
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<RouteWithPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await fetch("/api/admin/routes?withPricing=true", {
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch routes");

      const { data } = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error("Error fetching routes:", error);
      alert("Failed to load routes");
    } finally {
      setLoading(false);
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
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
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
          "x-admin-auth": ADMIN_PASSWORD,
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
        <Link
          href="/admin/routes/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-whatsapp text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add New Route
        </Link>
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
        <div className="grid gap-4">
          {routes.map((route) => (
            <div
              key={route.id}
              className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro hover:shadow-retro-lg transition-shadow"
            >
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
                    <button
                      onClick={() => toggleStatus(route, "is_active")}
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
                      onClick={() => toggleStatus(route, "enable_online_booking")}
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

                    {route.has_hotel_option && (
                      <span className="px-3 py-1 text-xs font-body font-semibold rounded-full border-2 bg-coral/10 border-coral text-coral">
                        With Hotel Option
                      </span>
                    )}
                  </div>

                  {/* Vehicle Availability */}
                  {(() => {
                    const availableVehicles = route.pricing
                      ? Array.from(new Set(route.pricing.filter(p => p.price > 0).map(p => p.vehicle_type)))
                      : [];

                    if (availableVehicles.length > 0) {
                      return (
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
                      );
                    } else {
                      return (
                        <div className="mt-3">
                          <p className="text-xs text-coral font-body">⚠️ No pricing configured</p>
                        </div>
                      );
                    }
                  })()}
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
                    onClick={() => handleDelete(route.id, route.slug)}
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
          ))}
        </div>
      )}
    </div>
  );
}
