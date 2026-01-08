"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import TempleForm from "@/components/admin/TempleForm";
import { Temple, TemplePricing, TempleFAQ } from "@/lib/supabase/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

export default function EditTemplePage() {
  const router = useRouter();
  const params = useParams();
  const templeId = params.id as string;

  const [temple, setTemple] = useState<(Temple & { pricing?: TemplePricing[]; faqs?: TempleFAQ[] }) | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; category_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTemple();
    fetchCategories();
  }, [templeId]);

  const fetchTemple = async () => {
    try {
      const response = await fetch(`/api/admin/temples?id=${templeId}&withPricing=true&withRelations=true`, {
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch temple");

      const { data } = await response.json();
      setTemple(data);
    } catch (error) {
      console.error("Error fetching temple:", error);
      alert("Failed to load temple");
      router.push("/admin/temples");
    } finally {
      setLoading(false);
    }
  };

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
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          id: templeId,
          updates: data,
          pricing: data.pricing,
          faqs: data.faqs,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update temple");
      }

      alert("Temple updated successfully!");
      router.push("/admin/temples");
    } catch (error) {
      console.error("Error updating temple:", error);
      alert("Failed to update temple. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-xl font-display text-ink">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading temple...
        </div>
      </div>
    );
  }

  if (!temple) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-display text-ink mb-2">Temple not found</h2>
          <Link
            href="/admin/temples"
            className="inline-flex items-center gap-2 px-6 py-3 bg-lake text-white font-body rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Temples
          </Link>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-display text-ink">Edit Temple</h1>
          <p className="text-ink/60 font-body mt-1">
            Update information for {temple.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <TempleForm
        initialData={temple}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        categories={categories}
      />
    </div>
  );
}
