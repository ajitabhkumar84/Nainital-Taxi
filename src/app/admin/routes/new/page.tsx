"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RouteForm from "@/components/admin/RouteForm";
import { Route, RoutePricing } from "@/lib/supabase/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

export default function NewRoutePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Partial<Route & { pricing: Partial<RoutePricing>[] }>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create route");
      }

      alert("Route created successfully!");
      router.push("/admin/routes");
    } catch (error) {
      console.error("Error creating route:", error);
      alert("Failed to create route. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-3xl font-display text-ink">Create New Route</h1>
          <p className="text-ink/60 font-body mt-1">
            Add a new transfer route with pricing
          </p>
        </div>
      </div>

      {/* Form */}
      <RouteForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
