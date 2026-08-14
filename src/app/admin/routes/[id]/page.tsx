"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import RouteForm, { RouteFormData } from "@/components/admin/RouteForm";
import { Route, RoutePricing, RoutePartner } from "@/lib/supabase/types";

type EditableRoute = Route & {
  pricing?: RoutePricing[];
  linkedReverse?: RoutePartner | null;
  reverseParent?: RoutePartner | null;
};

export default function EditRoutePage() {
  const router = useRouter();
  const params = useParams();
  const routeId = params.id as string;

  const [route, setRoute] = useState<EditableRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoute = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/routes?id=${routeId}&withPricing=true`);
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

  const handleSubmit = async (data: RouteFormData) => {
    setIsSubmitting(true);
    try {
      // Separate pricing and the reverse-route flags from the route columns —
      // the API takes those as siblings of `updates`, not inside it.
      const {
        pricing,
        create_reverse: createReverse,
        confirm_overwrite_reverse: confirmOverwriteReverse,
        ...routeUpdates
      } = data as RouteFormData & { confirm_overwrite_reverse?: boolean };

      const response = await fetch("/api/admin/routes", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: routeId,
          updates: routeUpdates,
          pricing: pricing,
          create_reverse: createReverse,
          confirm_overwrite_reverse: confirmOverwriteReverse,
        }),
      });

      // 409 = the linked return route's prices diverged. Reject with the
      // payload so RouteForm can render its confirmation panel; this is a
      // question, not a failure, so it must not fall through to the alert.
      if (response.status === 409) {
        throw await response.json();
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update route");
      }

      const result = await response.json();
      alert(result.warning || "Route updated successfully!");
      router.push("/admin/routes");
    } catch (error) {
      if ((error as { requiresReverseConfirmation?: boolean })?.requiresReverseConfirmation) {
        throw error;
      }
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
