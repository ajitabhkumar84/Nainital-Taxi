"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Loader2 } from "lucide-react";
import PackageForm from "@/components/admin/PackageForm";
import { Package } from "@/lib/supabase/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

export default function EditPackagePage() {
  const router = useRouter();
  const params = useParams();
  const packageId = params.id as string;

  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPackage = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/packages?id=${packageId}`);
      if (!response.ok) throw new Error("Failed to fetch package");

      const { data } = await response.json();
      setPkg(data);
    } catch (error) {
      console.error("Error fetching package:", error);
      alert("Failed to load package");
      router.push("/admin/packages");
    } finally {
      setLoading(false);
    }
  }, [packageId, router]);

  useEffect(() => {
    fetchPackage();
  }, [fetchPackage]);

  const handleSubmit = async (data: Partial<Package>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/packages", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          id: packageId,
          updates: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update package");
      }

      const { data: updatedPackage } = await response.json();
      setPkg(updatedPackage);
      alert("Package updated successfully!");
    } catch (error) {
      console.error("Error updating package:", error);
      alert("Failed to update package. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-xl font-display text-ink">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading package...
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl font-display text-ink">Package not found</div>
      </div>
    );
  }

  const publicUrl = pkg.type === "tour" ? `/tour/${pkg.slug}` : `/destinations/${pkg.slug}`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/packages"
            className="p-2 hover:bg-sunrise/50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-display text-ink">Edit Package</h1>
            <p className="text-ink/60 font-body mt-1">{pkg.title}</p>
          </div>
        </div>

        <Link
          href={publicUrl}
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-lake/20 border-3 border-ink rounded-xl font-body font-semibold shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Eye className="w-5 h-5" />
          View Public Page
        </Link>
      </div>

      {/* Package Info Card */}
      <div className="bg-gradient-to-r from-teal/20 to-lake/20 rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`px-3 py-1 text-sm font-body font-semibold rounded-full border-2 ${
              pkg.type === "tour"
                ? "bg-teal/30 border-teal text-teal"
                : "bg-coral/30 border-coral text-coral"
            }`}
          >
            {pkg.type}
          </span>
          <span className="text-ink/60 font-body">Slug: /{pkg.slug}</span>
          {pkg.is_active ? (
            <span className="px-2 py-1 bg-whatsapp/20 text-whatsapp text-xs font-body font-semibold rounded-lg">
              Active
            </span>
          ) : (
            <span className="px-2 py-1 bg-ink/10 text-ink/60 text-xs font-body rounded-lg">
              Inactive
            </span>
          )}
          {pkg.is_popular && (
            <span className="px-2 py-1 bg-sunshine text-ink text-xs font-body font-semibold rounded-lg">
              Popular
            </span>
          )}
        </div>
      </div>

      {/* Package Form */}
      <PackageForm initialData={pkg} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
