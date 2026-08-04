"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Save, Loader2, Plus, X, Eye, EyeOff } from "lucide-react";
import {
  MultiDayRentalPage,
  MultiDayCarCategory,
  TourDurationPackage,
  InclusionExclusionItem,
  MultiDayRentalFAQ,
  CTAFeature,
  SafetyPillar,
  MonthDayRange,
  SeasonOverride,
} from "@/lib/supabase/types";
import ImageUploader from "@/components/admin/ImageUploader";
import TagListInput from "@/components/admin/TagListInput";
import MonthDayRangeInput from "@/components/admin/MonthDayRangeInput";
import { slugify, validatePageSlug } from "@/lib/slug";
import { SAFETY_ICON_OPTIONS } from "@/lib/pillarIcons";
import { detectActiveSeasonTier } from "@/lib/seasonality";

// TipTap is a real chunk of JS — only fetch it once the SEO section of this
// (already large) admin form is reached, not on initial page load.
const SeoRichTextEditor = dynamic(() => import("@/components/admin/SeoRichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-[196px] border-2 border-ink/10 rounded-lg animate-pulse bg-ink/5" />
  ),
});

const SEASON_OVERRIDE_OPTIONS: { value: SeasonOverride; label: string }[] = [
  { value: "auto", label: "Auto (detect from date ranges)" },
  { value: "force_season", label: "Force Peak Season" },
  { value: "force_mid_season", label: "Force Mid Season" },
  { value: "force_off_season", label: "Force Off-Season" },
];

const SEASON_TIER_LABELS: Record<string, string> = {
  season: "Peak Season",
  mid_season: "Mid Season",
  off_season: "Off-Season",
};

export default function MultiDayRentalForm() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pageData, setPageData] = useState<Partial<MultiDayRentalPage> | null>(null);

  // Load existing data on mount
  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/multi-day-rental");
      if (!response.ok) throw new Error("Failed to load page data");
      const data = await response.json();
      setPageData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load page data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/admin/multi-day-rental", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save configuration");
      }

      const savedData = await response.json();
      setPageData(savedData);
      setSuccess("Configuration saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async () => {
    try {
      const response = await fetch("/api/admin/multi-day-rental", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_published: !pageData?.is_published }),
      });

      if (!response.ok) throw new Error("Failed to toggle published status");
      const updated = await response.json();
      setPageData(updated);
      setSuccess(`Page ${updated.is_published ? 'published' : 'unpublished'} successfully!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle published status");
    }
  };

  // Helper functions for managing arrays
  const addCarCategory = () => {
    const newCategory: MultiDayCarCategory = {
      name: "",
      vehicles: "",
      season_price: 0,
      mid_season_price: 0,
      off_season_price: 0,
      is_popular: false,
      order: (pageData?.car_categories?.length || 0),
      capacity: "",
      tagline: "",
      whatsapp_message: "Hi! 👋 Need a quick quote for a multi-day {category} rental in Nainital. 🚕",
    };
    setPageData({
      ...pageData,
      car_categories: [...(pageData?.car_categories || []), newCategory],
    });
  };

  const updateCarCategory = (index: number, field: keyof MultiDayCarCategory, value: any) => {
    const updated = [...(pageData?.car_categories || [])];
    updated[index] = { ...updated[index], [field]: value };
    setPageData({ ...pageData, car_categories: updated });
  };

  const removeCarCategory = (index: number) => {
    setPageData({
      ...pageData,
      car_categories: pageData?.car_categories?.filter((_, i) => i !== index) || [],
    });
  };

  const addIncludedItem = () => {
    setPageData({
      ...pageData,
      items_included: [...(pageData?.items_included || []), { title: "", description: "" }],
    });
  };

  const updateIncludedItem = (index: number, field: keyof InclusionExclusionItem, value: string) => {
    const updated = [...(pageData?.items_included || [])];
    updated[index] = { ...updated[index], [field]: value };
    setPageData({ ...pageData, items_included: updated });
  };

  const removeIncludedItem = (index: number) => {
    setPageData({
      ...pageData,
      items_included: pageData?.items_included?.filter((_, i) => i !== index) || [],
    });
  };

  const addExcludedItem = () => {
    setPageData({
      ...pageData,
      items_excluded: [...(pageData?.items_excluded || []), { title: "", description: "" }],
    });
  };

  const updateExcludedItem = (index: number, field: keyof InclusionExclusionItem, value: string) => {
    const updated = [...(pageData?.items_excluded || [])];
    updated[index] = { ...updated[index], [field]: value };
    setPageData({ ...pageData, items_excluded: updated });
  };

  const removeExcludedItem = (index: number) => {
    setPageData({
      ...pageData,
      items_excluded: pageData?.items_excluded?.filter((_, i) => i !== index) || [],
    });
  };

  const addFAQ = () => {
    setPageData({
      ...pageData,
      faqs: [...(pageData?.faqs || []), { question: "", answer: "" }],
    });
  };

  const updateFAQ = (index: number, field: keyof MultiDayRentalFAQ, value: string) => {
    const updated = [...(pageData?.faqs || [])];
    updated[index] = { ...updated[index], [field]: value };
    setPageData({ ...pageData, faqs: updated });
  };

  const removeFAQ = (index: number) => {
    setPageData({
      ...pageData,
      faqs: pageData?.faqs?.filter((_, i) => i !== index) || [],
    });
  };

  const addCTAFeature = () => {
    setPageData({
      ...pageData,
      cta_features: [...(pageData?.cta_features || []), { text: "" }],
    });
  };

  const updateCTAFeature = (index: number, value: string) => {
    const updated = [...(pageData?.cta_features || [])];
    updated[index] = { text: value };
    setPageData({ ...pageData, cta_features: updated });
  };

  const removeCTAFeature = (index: number) => {
    setPageData({
      ...pageData,
      cta_features: pageData?.cta_features?.filter((_, i) => i !== index) || [],
    });
  };

  const MAX_SAFETY_PILLARS = 4;

  const addSafetyPillar = () => {
    if ((pageData?.safety_pillars?.length || 0) >= MAX_SAFETY_PILLARS) return;
    const newPillar: SafetyPillar = { icon: "shield", title: "", description: "" };
    setPageData({
      ...pageData,
      safety_pillars: [...(pageData?.safety_pillars || []), newPillar],
    });
  };

  const updateSafetyPillar = (index: number, field: keyof SafetyPillar, value: string) => {
    const updated = [...(pageData?.safety_pillars || [])];
    updated[index] = { ...updated[index], [field]: value };
    setPageData({ ...pageData, safety_pillars: updated });
  };

  const removeSafetyPillar = (index: number) => {
    setPageData({
      ...pageData,
      safety_pillars: pageData?.safety_pillars?.filter((_, i) => i !== index) || [],
    });
  };

  const setSeasonRanges = (
    field: "pricing_season_ranges" | "pricing_mid_season_ranges" | "pricing_off_season_ranges",
    ranges: MonthDayRange[]
  ) => {
    setPageData({ ...pageData, [field]: ranges });
  };

  const activeSeasonTier =
    pageData?.season_override &&
    pageData?.pricing_season_ranges &&
    pageData?.pricing_mid_season_ranges &&
    pageData?.pricing_off_season_ranges
      ? detectActiveSeasonTier({
          season_override: pageData.season_override,
          pricing_season_ranges: pageData.pricing_season_ranges,
          pricing_mid_season_ranges: pageData.pricing_mid_season_ranges,
          pricing_off_season_ranges: pageData.pricing_off_season_ranges,
        })
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display text-ink">Multi-Day Rental Page Configuration</h1>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={togglePublished}
            className={`inline-flex items-center gap-2 px-4 py-2 font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all ${
              pageData?.is_published
                ? "bg-green-500 text-white"
                : "bg-gray-300 text-ink"
            }`}
          >
            {pageData?.is_published ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            {pageData?.is_published ? "Published" : "Unpublished"}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-teal text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all disabled:opacity-50"
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
        <div className="bg-green-100 border-3 border-green-500 rounded-xl p-4 text-green-700 font-body">
          {success}
        </div>
      )}

      {/* Page URL Section */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-2">
        <h2 className="font-display text-xl text-ink border-b-2 border-ink/10 pb-2">Page URL</h2>
        <label className="block font-body text-sm text-ink/70 mb-1">Slug *</label>
        <input
          type="text"
          value={pageData?.page_slug ?? ""}
          onChange={(e) =>
            setPageData({ ...pageData, page_slug: slugify(e.target.value) })
          }
          className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none font-mono"
          placeholder="multi-day-rental"
        />
        <p className="text-xs text-ink/50 font-body">
          Live at:{" "}
          <span className="font-mono">
            {typeof window !== "undefined" ? window.location.origin : ""}/
            {pageData?.page_slug || "multi-day-rental"}
          </span>
        </p>
        {pageData?.page_slug && validatePageSlug(pageData.page_slug) && (
          <p className="text-xs text-coral font-body">
            {validatePageSlug(pageData.page_slug)}
          </p>
        )}
      </div>

      {/* SEO Section */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-xl text-ink border-b-2 border-ink/10 pb-2">SEO & Meta Data</h2>

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Page Title *</label>
          <input
            type="text"
            value={pageData?.seo_title || ""}
            onChange={(e) => setPageData({ ...pageData, seo_title: e.target.value })}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Meta Description *</label>
          <textarea
            value={pageData?.seo_description || ""}
            onChange={(e) => setPageData({ ...pageData, seo_description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Meta Keywords</label>
          <input
            type="text"
            value={pageData?.seo_keywords || ""}
            onChange={(e) => setPageData({ ...pageData, seo_keywords: e.target.value })}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none"
            placeholder="Comma-separated keywords"
          />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-xl text-ink border-b-2 border-ink/10 pb-2">Hero Section</h2>

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Trust Badge *</label>
          <input
            type="text"
            value={pageData?.hero_badge || ""}
            onChange={(e) => setPageData({ ...pageData, hero_badge: e.target.value })}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none"
            placeholder="e.g., Trusted by 500+ Happy Travelers"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Headline Line 1 *</label>
            <input
              type="text"
              value={pageData?.hero_headline_line1 || ""}
              onChange={(e) => setPageData({ ...pageData, hero_headline_line1: e.target.value })}
              className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Headline Line 2 (Highlighted) *</label>
            <input
              type="text"
              value={pageData?.hero_headline_line2 || ""}
              onChange={(e) => setPageData({ ...pageData, hero_headline_line2: e.target.value })}
              className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Headline Line 3 *</label>
            <input
              type="text"
              value={pageData?.hero_headline_line3 || ""}
              onChange={(e) => setPageData({ ...pageData, hero_headline_line3: e.target.value })}
              className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Subheadline *</label>
          <textarea
            value={pageData?.hero_subheadline || ""}
            onChange={(e) => setPageData({ ...pageData, hero_subheadline: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none"
          />
        </div>

        <ImageUploader
          value={pageData?.hero_image_url || ""}
          onChange={(url) => setPageData({ ...pageData, hero_image_url: url })}
          folder="multi-day-rental"
          label="Hero Image"
          recommendedSize="1920 x 1080"
          aspectRatio="16:9"
        />

        <TagListInput
          label="Trust Badges"
          value={pageData?.hero_trust_badges || []}
          onChange={(tags) => setPageData({ ...pageData, hero_trust_badges: tags })}
          placeholder="e.g., Verified Drivers"
        />
      </div>

      {/* Safety Promise Section */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-xl text-ink border-b-2 border-ink/10 pb-2">Safety Promise</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Section Heading</label>
            <input
              type="text"
              value={pageData?.safety_heading || ""}
              onChange={(e) => setPageData({ ...pageData, safety_heading: e.target.value })}
              className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none"
              placeholder="Your Safety, Our Promise"
            />
          </div>
          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Section Subheading</label>
            <input
              type="text"
              value={pageData?.safety_subheading || ""}
              onChange={(e) => setPageData({ ...pageData, safety_subheading: e.target.value })}
              className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="block font-body text-sm text-ink/70">
            Safety Pillars ({pageData?.safety_pillars?.length || 0}/{MAX_SAFETY_PILLARS})
          </label>
          <button
            type="button"
            onClick={addSafetyPillar}
            disabled={(pageData?.safety_pillars?.length || 0) >= MAX_SAFETY_PILLARS}
            className="inline-flex items-center gap-1 text-xs text-teal hover:underline font-body disabled:opacity-40 disabled:no-underline"
          >
            <Plus className="w-3 h-3" /> Add Pillar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pageData?.safety_pillars?.map((pillar, index) => (
            <div key={index} className="p-4 border-2 border-ink/10 rounded-lg space-y-2 relative">
              <button
                type="button"
                onClick={() => removeSafetyPillar(index)}
                className="absolute top-2 right-2 p-1 text-coral hover:bg-coral/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
              <select
                value={pillar.icon}
                onChange={(e) => updateSafetyPillar(index, "icon", e.target.value)}
                className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm"
              >
                {SAFETY_ICON_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={pillar.title}
                onChange={(e) => updateSafetyPillar(index, "title", e.target.value)}
                placeholder="Title, e.g. Verified Drivers"
                className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm"
              />
              <textarea
                value={pillar.description}
                onChange={(e) => updateSafetyPillar(index, "description", e.target.value)}
                placeholder="Short description"
                rows={2}
                className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Seasonality & Pricing Engine */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-5">
        <h2 className="font-display text-xl text-ink border-b-2 border-ink/10 pb-2">Seasonality & Pricing Engine</h2>

        <MonthDayRangeInput
          label="Peak Season Dates"
          ranges={pageData?.pricing_season_ranges || []}
          onChange={(ranges) => setSeasonRanges("pricing_season_ranges", ranges)}
          legacyHint={pageData?.legacy_pricing_season_date_ranges}
        />
        <MonthDayRangeInput
          label="Mid Season Dates"
          ranges={pageData?.pricing_mid_season_ranges || []}
          onChange={(ranges) => setSeasonRanges("pricing_mid_season_ranges", ranges)}
          legacyHint={pageData?.legacy_pricing_mid_season_date_ranges}
        />
        <MonthDayRangeInput
          label="Off-Season Dates"
          ranges={pageData?.pricing_off_season_ranges || []}
          onChange={(ranges) => setSeasonRanges("pricing_off_season_ranges", ranges)}
          legacyHint={pageData?.legacy_pricing_off_season_date_ranges}
        />

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Season Override</label>
          <select
            value={pageData?.season_override || "auto"}
            onChange={(e) => setPageData({ ...pageData, season_override: e.target.value as SeasonOverride })}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none"
          >
            {SEASON_OVERRIDE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {activeSeasonTier && (
            <p className="text-xs text-ink/50 font-body mt-1">
              Currently active on the public page: <strong>{SEASON_TIER_LABELS[activeSeasonTier]}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Pricing Section - This would continue with car categories, season dates, etc. */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-ink/10 pb-2">
          <h2 className="font-display text-xl text-ink">Pricing Section - Car Categories</h2>
          <button
            type="button"
            onClick={addCarCategory}
            className="inline-flex items-center gap-2 px-3 py-1 bg-yellow text-ink font-body font-semibold rounded-lg border-2 border-ink shadow-retro-sm hover:shadow-retro transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        {pageData?.car_categories?.map((category, index) => (
          <div key={index} className="p-4 border-2 border-ink/10 rounded-lg space-y-3 relative">
            <button
              type="button"
              onClick={() => removeCarCategory(index)}
              className="absolute top-2 right-2 p-1 text-coral hover:bg-coral/10 rounded"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">Category Name</label>
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => updateCarCategory(index, "name", e.target.value)}
                  className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm"
                  placeholder="e.g., Sedan Cars"
                />
              </div>
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">Vehicle Models</label>
                <input
                  type="text"
                  value={category.vehicles}
                  onChange={(e) => updateCarCategory(index, "vehicles", e.target.value)}
                  className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm"
                  placeholder="e.g., Dzire, Amaze"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">Capacity</label>
                <input
                  type="text"
                  value={category.capacity || ""}
                  onChange={(e) => updateCarCategory(index, "capacity", e.target.value)}
                  className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm"
                  placeholder="e.g., 4+1 Seater"
                />
              </div>
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">Tagline</label>
                <input
                  type="text"
                  value={category.tagline || ""}
                  onChange={(e) => updateCarCategory(index, "tagline", e.target.value)}
                  className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm"
                  placeholder="e.g., Comfortable & Reliable"
                />
              </div>
            </div>

            <ImageUploader
              value={category.image_url || ""}
              onChange={(url) => updateCarCategory(index, "image_url", url)}
              folder="fleet"
              label="Vehicle Photo"
              recommendedSize="800 x 600"
              aspectRatio="4:3"
            />

            <div>
              <label className="block font-body text-xs text-ink/70 mb-1">WhatsApp Message Template</label>
              <textarea
                value={category.whatsapp_message || ""}
                onChange={(e) => updateCarCategory(index, "whatsapp_message", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm"
                placeholder="Hi! 👋 Need a quick quote for a multi-day {category} rental in Nainital. 🚕"
              />
              <p className="text-xs text-ink/40 font-body mt-1">
                Use <code>{"{category}"}</code> — replaced with this vehicle&apos;s name when the WhatsApp link opens.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">Season Price (₹/day)</label>
                <input
                  type="number"
                  value={category.season_price}
                  onChange={(e) => updateCarCategory(index, "season_price", parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">Mid Season Price (₹/day)</label>
                <input
                  type="number"
                  value={category.mid_season_price}
                  onChange={(e) => updateCarCategory(index, "mid_season_price", parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block font-body text-xs text-ink/70 mb-1">Off Season Price (₹/day)</label>
                <input
                  type="number"
                  value={category.off_season_price}
                  onChange={(e) => updateCarCategory(index, "off_season_price", parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={category.is_popular}
                  onChange={(e) => updateCarCategory(index, "is_popular", e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-body">Mark as Popular</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {/* SEO Content & FAQs */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-xl text-ink border-b-2 border-ink/10 pb-2">SEO Content & FAQs</h2>

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Content Block Heading</label>
          <input
            type="text"
            value={pageData?.seo_content_heading || ""}
            onChange={(e) => setPageData({ ...pageData, seo_content_heading: e.target.value })}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none"
            placeholder="Why Choose Our Multi-Day Rentals"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">
            Content Body (renders in a 2-column layout with the highlights below)
          </label>
          <SeoRichTextEditor
            value={pageData?.seo_content_body || ""}
            onChange={(html) => setPageData({ ...pageData, seo_content_body: html })}
          />
        </div>

        <TagListInput
          label="Highlights (bullet checkmarks, right column)"
          value={pageData?.seo_content_highlights || []}
          onChange={(tags) => setPageData({ ...pageData, seo_content_highlights: tags })}
          placeholder="e.g., Fixed pricing, no hidden charges"
        />

        <div className="pt-2 border-t-2 border-ink/10">
          <div className="flex items-center justify-between mb-2">
            <label className="block font-body text-sm text-ink/70">FAQs</label>
            <button
              type="button"
              onClick={addFAQ}
              className="inline-flex items-center gap-1 text-xs text-teal hover:underline font-body"
            >
              <Plus className="w-3 h-3" /> Add FAQ
            </button>
          </div>
          <div className="space-y-3">
            {pageData?.faqs?.map((faq, index) => (
              <div key={index} className="p-4 border-2 border-ink/10 rounded-lg space-y-2 relative">
                <button
                  type="button"
                  onClick={() => removeFAQ(index)}
                  className="absolute top-2 right-2 p-1 text-coral hover:bg-coral/10 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => updateFAQ(index, "question", e.target.value)}
                  placeholder="Question"
                  className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm font-semibold"
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                  placeholder="Answer"
                  rows={2}
                  className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm"
                />
              </div>
            ))}
            {(!pageData?.faqs || pageData.faqs.length === 0) && (
              <p className="text-xs text-ink/40 font-body">No FAQs yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Note: Inclusion/Exclusion items, tour duration packages, and CTA
          features are still admin-edited via defaults/DB only — out of
          scope for this pass. */}

      {/* Save Button at Bottom */}
      <div className="flex justify-end sticky bottom-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-3 bg-teal text-white font-body font-bold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-lg transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </form>
  );
}
