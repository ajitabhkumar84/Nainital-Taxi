"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Church, Loader2, ToggleLeft, ToggleRight, MapPin, Star } from "lucide-react";
import { Temple } from "@/lib/supabase/types";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

export default function TemplesPage() {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTemples();
  }, []);

  const fetchTemples = async () => {
    try {
      const response = await fetch("/api/admin/temples", {
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch temples");

      const { data } = await response.json();
      setTemples(data);
    } catch (error) {
      console.error("Error fetching temples:", error);
      alert("Failed to load temples");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/temples?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
      });

      if (!response.ok) throw new Error("Failed to delete temple");

      await fetchTemples();
      alert("Temple deleted successfully");
    } catch (error) {
      console.error("Error deleting temple:", error);
      alert("Failed to delete temple");
    } finally {
      setDeleting(null);
    }
  };

  const toggleStatus = async (temple: Temple, field: "is_active" | "is_featured" | "show_on_homepage") => {
    try {
      const response = await fetch("/api/admin/temples", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          id: temple.id,
          updates: {
            [field]: !temple[field],
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to update temple");

      await fetchTemples();
    } catch (error) {
      console.error("Error updating temple:", error);
      alert("Failed to update temple");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-xl font-display text-ink">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading temples...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink">Temples</h1>
          <p className="text-ink/60 font-body mt-1">
            Manage sacred temples of Kumaon region
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/temple-categories"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sunshine text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Manage Categories
          </Link>
          <Link
            href="/admin/temples/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-whatsapp text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Temple
          </Link>
        </div>
      </div>

      {/* Temples List */}
      {temples.length === 0 ? (
        <div className="bg-white rounded-2xl border-3 border-ink p-12 text-center shadow-retro">
          <Church className="w-16 h-16 text-ink/20 mx-auto mb-4" />
          <h3 className="text-xl font-display text-ink mb-2">
            No temples yet
          </h3>
          <p className="text-ink/60 font-body mb-6">
            Create your first temple to get started
          </p>
          <Link
            href="/admin/temples/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sunshine text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Temple
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {temples.map((temple) => (
            <div
              key={temple.id}
              className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro hover:shadow-retro-lg transition-shadow"
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Temple Image */}
                {temple.featured_image_url && (
                  <div className="lg:w-48 h-32 flex-shrink-0">
                    <img
                      src={temple.featured_image_url}
                      alt={temple.name}
                      className="w-full h-full object-cover rounded-xl border-2 border-ink"
                    />
                  </div>
                )}

                {/* Temple Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-xl font-display text-ink mb-1">
                        {temple.name}
                      </h3>
                      {temple.subtitle && (
                        <p className="text-sm text-ink/60 font-body mb-2">
                          {temple.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-ink/60 font-body mb-3">
                    <span className="inline-flex items-center gap-1">
                      <Church className="w-4 h-4" />
                      /{temple.slug}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-lake/10 border border-lake text-lake rounded-full text-xs font-semibold">
                      <MapPin className="w-3 h-3" />
                      {temple.district}
                    </span>
                    <span className="px-2 py-1 bg-coral/10 border border-coral text-coral rounded-full text-xs font-semibold">
                      {temple.temple_type}
                    </span>
                    {temple.distance_from_nainital && (
                      <span>{temple.distance_from_nainital} km from Nainital</span>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => toggleStatus(temple, "is_active")}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-body font-semibold rounded-full border-2 transition-colors ${
                        temple.is_active
                          ? "bg-whatsapp/10 border-whatsapp text-whatsapp"
                          : "bg-gray-100 border-gray-300 text-gray-500"
                      }`}
                    >
                      {temple.is_active ? (
                        <ToggleRight className="w-4 h-4" />
                      ) : (
                        <ToggleLeft className="w-4 h-4" />
                      )}
                      {temple.is_active ? "Active" : "Inactive"}
                    </button>

                    <button
                      onClick={() => toggleStatus(temple, "is_featured")}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-body font-semibold rounded-full border-2 transition-colors ${
                        temple.is_featured
                          ? "bg-sunshine/20 border-sunshine text-sunshine"
                          : "bg-gray-100 border-gray-300 text-gray-500"
                      }`}
                    >
                      <Star className="w-4 h-4" />
                      {temple.is_featured ? "Featured" : "Not Featured"}
                    </button>

                    <button
                      onClick={() => toggleStatus(temple, "show_on_homepage")}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-body font-semibold rounded-full border-2 transition-colors ${
                        temple.show_on_homepage
                          ? "bg-coral/10 border-coral text-coral"
                          : "bg-gray-100 border-gray-300 text-gray-500"
                      }`}
                    >
                      {temple.show_on_homepage ? "On Homepage" : "Not on Homepage"}
                    </button>

                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-body font-semibold rounded-full border-2 bg-lake/10 border-lake text-lake">
                      Popularity: {temple.popularity}
                    </span>
                  </div>

                  {/* Highlights */}
                  {temple.highlights && temple.highlights.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {temple.highlights.slice(0, 3).map((highlight, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-ink/5 text-ink/70 px-2 py-1 rounded font-body"
                          >
                            • {highlight}
                          </span>
                        ))}
                        {temple.highlights.length > 3 && (
                          <span className="text-xs text-ink/40 px-2 py-1 font-body">
                            +{temple.highlights.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/temples/${temple.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-lake text-white font-body rounded-xl border-3 border-ink shadow-retro-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(temple.id, temple.name)}
                      disabled={deleting === temple.id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-coral text-white font-body rounded-xl border-3 border-ink shadow-retro-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting === temple.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {temples.length > 0 && (
        <div className="bg-gradient-to-br from-sunshine/10 to-lake/10 rounded-2xl border-3 border-ink p-6 shadow-retro">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-display text-ink">{temples.length}</div>
              <div className="text-sm text-ink/60 font-body">Total Temples</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-whatsapp">
                {temples.filter((t) => t.is_active).length}
              </div>
              <div className="text-sm text-ink/60 font-body">Active</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-sunshine">
                {temples.filter((t) => t.is_featured).length}
              </div>
              <div className="text-sm text-ink/60 font-body">Featured</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-display text-coral">
                {temples.filter((t) => t.show_on_homepage).length}
              </div>
              <div className="text-sm text-ink/60 font-body">On Homepage</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
