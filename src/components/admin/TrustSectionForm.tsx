"use client";

import React, { useEffect, useState } from "react";
import { Save, Loader2, Plus, X, Eye, EyeOff, GripVertical } from "lucide-react";
import { TrustSection, TrustPillar } from "@/lib/supabase/types";
import ImageUploader from "./ImageUploader";

const ICON_OPTIONS = [
  { value: "user-check", label: "Verified / Checkmark" },
  { value: "shield", label: "Shield" },
  { value: "award", label: "Award" },
  { value: "heart", label: "Heart" },
  { value: "car", label: "Car" },
  { value: "phone", label: "Phone" },
  { value: "star", label: "Star" },
  { value: "map-pin", label: "Map Pin" },
];

export default function TrustSectionForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [data, setData] = useState<Partial<TrustSection> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/admin/trust-section");
        if (!response.ok) throw new Error("Failed to load trust section");
        setData(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trust section");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/admin/trust-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save trust section");
      }

      setData(await response.json());
      setSuccess("Trust section saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trust section");
    } finally {
      setSaving(false);
    }
  };

  const pillars = data?.trust_pillars || [];

  const addPillar = () => {
    const newPillar: TrustPillar = {
      icon_name: "shield",
      title: "",
      description: "",
      display_order: pillars.length + 1,
      is_active: true,
    };
    setData({ ...data, trust_pillars: [...pillars, newPillar] });
  };

  const updatePillar = (index: number, field: keyof TrustPillar, value: any) => {
    const updated = [...pillars];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, trust_pillars: updated });
  };

  const removePillar = (index: number) => {
    setData({ ...data, trust_pillars: pillars.filter((_, i) => i !== index) });
  };

  const movePillar = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= pillars.length) return;
    const updated = [...pillars];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    updated.forEach((p, i) => (p.display_order = i + 1));
    setData({ ...data, trust_pillars: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display text-ink">Trust & Safety Section</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setData({ ...data, is_published: !data?.is_published })}
            className={`inline-flex items-center gap-2 px-4 py-2 font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all ${
              data?.is_published ? "bg-teal/20 text-teal" : "bg-gray-100 text-gray-600"
            }`}
          >
            {data?.is_published ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            {data?.is_published ? "Published" : "Unpublished"}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-sunshine text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-coral/10 border-3 border-coral rounded-xl p-4 text-coral font-body">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-teal/10 border-3 border-teal rounded-xl p-4 text-teal font-body">
          {success}
        </div>
      )}

      {/* Heading + Description */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4 shadow-retro">
        <h2 className="font-display text-xl text-ink border-b-2 border-ink/10 pb-2">
          Core Thesis
        </h2>
        <ImageUploader
          value={data?.image_url || ""}
          onChange={(url) => setData({ ...data, image_url: url || null })}
          folder="trust-section"
          label="Section Photo"
          recommendedSize="1000 x 1250"
          aspectRatio="4:5"
        />
        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Heading *</label>
          <input
            type="text"
            value={data?.heading || ""}
            onChange={(e) => setData({ ...data, heading: e.target.value })}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none font-body"
            placeholder="e.g., Why families trust us"
            required
          />
        </div>
        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Description *</label>
          <textarea
            value={data?.description || ""}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none font-body"
            placeholder="The main descriptive paragraph shown under the heading"
            required
          />
        </div>
      </div>

      {/* Trust Pillars */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4 shadow-retro">
        <div className="flex items-center justify-between border-b-2 border-ink/10 pb-2">
          <h2 className="font-display text-xl text-ink">Trust Pillars</h2>
          <button
            type="button"
            onClick={addPillar}
            className="inline-flex items-center gap-2 px-3 py-1 bg-sunshine text-ink font-body font-semibold rounded-lg border-2 border-ink shadow-retro-sm hover:shadow-retro transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Pillar
          </button>
        </div>

        {pillars.length === 0 && (
          <p className="text-sm text-ink/50 font-body">No trust pillars yet. Add one above.</p>
        )}

        {pillars.map((pillar, index) => (
          <div key={index} className="p-4 border-2 border-ink/10 rounded-lg space-y-3 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-ink/40">
                <GripVertical className="w-4 h-4" />
                <button
                  type="button"
                  onClick={() => movePillar(index, -1)}
                  disabled={index === 0}
                  className="text-xs font-body hover:text-ink disabled:opacity-30"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => movePillar(index, 1)}
                  disabled={index === pillars.length - 1}
                  className="text-xs font-body hover:text-ink disabled:opacity-30"
                >
                  Down
                </button>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-body">
                  <input
                    type="checkbox"
                    checked={pillar.is_active}
                    onChange={(e) => updatePillar(index, "is_active", e.target.checked)}
                    className="w-4 h-4"
                  />
                  Active
                </label>
                <button
                  type="button"
                  onClick={() => removePillar(index)}
                  className="p-1 text-coral hover:bg-coral/10 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">Icon</label>
                <select
                  value={pillar.icon_name}
                  onChange={(e) => updatePillar(index, "icon_name", e.target.value)}
                  className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm font-body"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block font-body text-xs text-ink/70 mb-1">Title</label>
                <input
                  type="text"
                  value={pillar.title}
                  onChange={(e) => updatePillar(index, "title", e.target.value)}
                  className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm font-body"
                  placeholder="e.g., Verified drivers"
                />
              </div>
            </div>

            <div>
              <label className="block font-body text-xs text-ink/70 mb-1">Description</label>
              <textarea
                value={pillar.description}
                onChange={(e) => updatePillar(index, "description", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm font-body"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end sticky bottom-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-3 bg-sunshine text-ink font-body font-bold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-lg transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </form>
  );
}
