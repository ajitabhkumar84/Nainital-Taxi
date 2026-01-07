"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import RouteForm from "@/components/admin/RouteForm";
import { Route, RoutePricing } from "@/lib/supabase/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

export default function EditRoutePage() {
  const router = useRouter();
  const params = useParams();
  const routeId = params.id as string;

  const [route, setRoute] = useState<(Route & { pricing?: RoutePricing[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoute = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/routes?id=${routeId}&withPricing=true`, {
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch route");

      const { data } = await response.json();
      setRoute(data);
    } catch (error) {
      console.error("Error fetching route:", error);
      alert("Failed to load route");
      router.push("/admin/routes");
    } finally {
      setLoading(false);
    }
  }, [routeId, router]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  const handleSubmit = async (data: Partial<Route & { pricing: Partial<RoutePricing>[] }>) => {
    setIsSubmitting(true);
    try {
      // Separate pricing from route data
      const { pricing, ...routeUpdates } = data;

      const response = await fetch("/api/admin/routes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          id: routeId,
          updates: routeUpdates,
          pricing: pricing,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update route");
      }

      alert("Route updated successfully!");
      router.push("/admin/routes");
    } catch (error) {
      console.error("Error updating route:", error);
      alert("Failed to update route. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-xl font-display text-ink">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading route...
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl font-display text-ink">Route not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/routes"
          className="p-2 hover:bg-sunrise/50 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-ink" />
        </Link>
        <div>
          <h1 className="text-3xl font-display text-ink">Edit Route</h1>
          <p className="text-ink/60 font-body mt-1">
            {route.pickup_location} → {route.drop_location}
          </p>
        </div>
      </div>

      {/* Form */}
      <RouteForm initialData={route} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
