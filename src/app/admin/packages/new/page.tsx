"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PackageForm from "@/components/admin/PackageForm";
import { Package } from "@/lib/supabase/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

export default function NewPackagePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Partial<Package>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/packages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create package");
      }

      const { data: newPackage } = await response.json();
      router.push(`/admin/packages/${newPackage.id}`);
    } catch (error) {
      console.error("Error creating package:", error);
      alert("Failed to create package. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/packages"
          className="p-2 hover:bg-sunrise/50 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-display text-ink">Create New Package</h1>
          <p className="text-ink/60 font-body mt-1">
            Add a new tour package or transfer route
          </p>
        </div>
      </div>

      {/* Package Form */}
      <PackageForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
