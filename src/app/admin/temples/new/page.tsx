"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TempleForm from "@/components/admin/TempleForm";
import { Temple, TemplePricing, TempleFAQ } from "@/lib/supabase/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

export default function NewTemplePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; category_name: string }>>([]);

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
    }
  };

  const handleSubmit = async (data: Partial<Temple & { pricing: Partial<TemplePricing>[]; faqs: Partial<TempleFAQ>[] }>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/temples", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create temple");
      }

      alert("Temple created successfully!");
      router.push("/admin/temples");
    } catch (error) {
      console.error("Error creating temple:", error);
      alert("Failed to create temple. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/temples"
          className="p-2 hover:bg-sunrise/50 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-ink" />
        </Link>
        <div>
          <h1 className="text-3xl font-display text-ink">Create New Temple</h1>
          <p className="text-ink/60 font-body mt-1">
            Add a new sacred temple with complete information
          </p>
        </div>
      </div>

      {/* Form */}
      <TempleForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        categories={categories}
      />
    </div>
  );
}
