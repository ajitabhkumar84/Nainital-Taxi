"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, Star, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Review } from "@/lib/supabase/types";
import TestimonialForm from "@/components/admin/TestimonialForm";

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/testimonials");

      if (!response.ok) throw new Error("Failed to fetch testimonials");

      const result = await response.json();
      setTestimonials(result.data || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleCreateNew = () => {
    setEditingTestimonial(null);
    setShowForm(true);
  };

  const handleEdit = (testimonial: Review) => {
    setEditingTestimonial(testimonial);
    setShowForm(true);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const url = "/api/admin/testimonials";
      const method = editingTestimonial ? "PATCH" : "POST";
      const body = editingTestimonial
        ? { id: editingTestimonial.id, updates: data }
        : data;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save testimonial");
      }

      await fetchTestimonials();
      setShowForm(false);
      setEditingTestimonial(null);
    } catch (error) {
      console.error("Error saving testimonial:", error);
      alert(error instanceof Error ? error.message : "Failed to save testimonial");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFlag = async (testimonial: Review, flag: "is_featured" | "is_approved") => {
    setSaving(testimonial.id);
    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: testimonial.id,
          updates: { [flag]: !testimonial[flag] },
        }),
      });

      if (!response.ok) throw new Error(`Failed to toggle ${flag}`);

      setTestimonials((prev) =>
        prev.map((t) => (t.id === testimonial.id ? { ...t, [flag]: !t[flag] } : t))
      );
    } catch (error) {
      console.error(`Error toggling ${flag}:`, error);
    } finally {
      setSaving(null);
    }
  };

  const deleteTestimonial = async (testimonial: Review) => {
    if (!confirm(`Permanently delete the testimonial from "${testimonial.customer_name}"? This cannot be undone — to just hide it without deleting, uncheck "Approved" instead.`)) return;

    setSaving(testimonial.id);
    try {
      const response = await fetch(`/api/admin/testimonials?id=${testimonial.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      setTestimonials((prev) => prev.filter((t) => t.id !== testimonial.id));
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      alert("Failed to delete testimonial.");
    } finally {
      setSaving(null);
    }
  };

  const filteredTestimonials = testimonials.filter(
    (t) =>
      t.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.customer_location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.review_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredCount = testimonials.filter((t) => t.is_featured).length;
  const approvedCount = testimonials.filter((t) => t.is_approved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl font-display text-ink animate-pulse">
          Loading testimonials...
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <TestimonialForm
          initialData={editingTestimonial}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => {
            setShowForm(false);
            setEditingTestimonial(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink flex items-center gap-2">
            <MessageSquareQuote className="w-8 h-8" />
            Testimonials
          </h1>
          <p className="text-ink/60 font-body mt-1">
            Manage guest reviews shown in the &quot;What guests say&quot; homepage section
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-sunshine border-3 border-ink rounded-xl font-body font-semibold shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Testimonial
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border-3 border-ink p-4 shadow-retro-sm">
          <div className="text-2xl font-display text-ink">{testimonials.length}</div>
          <div className="text-sm font-body text-ink/60">Total</div>
        </div>
        <div className="bg-teal/20 rounded-xl border-3 border-ink p-4 shadow-retro-sm">
          <div className="text-2xl font-display text-ink">{approvedCount}</div>
          <div className="text-sm font-body text-ink/60">Approved</div>
        </div>
        <div className="bg-sunshine/40 rounded-xl border-3 border-ink p-4 shadow-retro-sm">
          <div className="text-2xl font-display text-ink">{featuredCount}</div>
          <div className="text-sm font-body text-ink/60">Featured</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search testimonials..."
            className="w-full pl-10 pr-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
          />
        </div>
      </div>

      {/* Testimonials List */}
      <div className="bg-white rounded-2xl border-3 border-ink shadow-retro overflow-hidden">
        {filteredTestimonials.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquareQuote className="w-16 h-16 mx-auto text-ink/20 mb-4" />
            <p className="text-lg font-display text-ink/60">
              {searchQuery ? "No testimonials found" : "No testimonials yet"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateNew}
                className="mt-4 text-teal font-body hover:underline"
              >
                Add your first testimonial
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sunrise/30 border-b-3 border-ink">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-display text-ink">Guest</th>
                  <th className="px-4 py-3 text-left text-sm font-display text-ink">Quote</th>
                  <th className="px-4 py-3 text-left text-sm font-display text-ink">Rating</th>
                  <th className="px-4 py-3 text-left text-sm font-display text-ink">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-display text-ink">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink/10">
                {filteredTestimonials.map((t) => (
                  <tr
                    key={t.id}
                    className={cn(
                      "hover:bg-sunrise/10 transition-colors",
                      !t.is_approved && "opacity-50"
                    )}
                  >
                    {/* Guest */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {t.photos?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={t.photos[0]}
                            alt={t.customer_name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-ink"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-lake border-2 border-ink flex items-center justify-center text-sm font-display">
                            {t.customer_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-body font-semibold text-ink">{t.customer_name}</div>
                          {t.customer_location && (
                            <div className="text-xs text-ink/60">{t.customer_location}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Quote */}
                    <td className="px-4 py-3 max-w-sm">
                      <p className="text-sm text-ink/80 line-clamp-2">{t.review_text}</p>
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={
                              i < t.rating
                                ? "w-4 h-4 fill-sunshine text-sunshine"
                                : "w-4 h-4 text-ink/20"
                            }
                          />
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => toggleFlag(t, "is_approved")}
                          disabled={saving === t.id}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-semibold border-2 transition-colors",
                            t.is_approved
                              ? "bg-teal/20 border-teal text-teal"
                              : "bg-gray-100 border-gray-300 text-gray-600"
                          )}
                        >
                          {t.is_approved ? "Approved" : "Rejected"}
                        </button>
                        <button
                          onClick={() => toggleFlag(t, "is_featured")}
                          disabled={saving === t.id}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-semibold border-2 transition-colors",
                            t.is_featured
                              ? "bg-sunshine/40 border-sunshine text-ink"
                              : "bg-gray-100 border-gray-300 text-gray-600"
                          )}
                        >
                          {t.is_featured ? "Featured" : "Normal"}
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(t)}
                          disabled={saving === t.id}
                          className="p-2 rounded-lg hover:bg-teal/20 text-teal transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTestimonial(t)}
                          disabled={saving === t.id}
                          className="p-2 rounded-lg hover:bg-coral/20 text-coral transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
