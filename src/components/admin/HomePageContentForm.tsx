"use client";

import React, { useEffect, useState } from "react";
import { Save, Loader2, Eye, EyeOff } from "lucide-react";
import { PageContent, PageSection } from "@/lib/supabase/types";
import ImageUploader from "./ImageUploader";

// Fixed list of sections that actually render on the homepage today.
// Adding a new entry here only makes sense once matching JSX exists in
// src/app/page.tsx to read it.
const KNOWN_SECTIONS: { key: string; label: string }[] = [
  { key: "tours", label: "Day Tours & Packages" },
  { key: "rentals", label: "Multi-Day Rentals" },
  { key: "transfers", label: "Fixed-Fare Transfers" },
  { key: "destinations", label: "Where We Go (Destinations)" },
  { key: "testimonials", label: "Guest Testimonials" },
];

function withKnownSections(sections: PageSection[]): PageSection[] {
  const byKey = Object.fromEntries(sections.map((s) => [s.key, s]));
  return KNOWN_SECTIONS.map(({ key }) => byKey[key] || { key, heading: "", subheading: "" });
}

export default function HomePageContentForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [data, setData] = useState<Partial<PageContent> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/admin/pages/home");
        if (!response.ok) throw new Error("Failed to load home page content");
        const content: PageContent = await response.json();
        setData({ ...content, sections: withKnownSections(content.sections || []) });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load home page content");
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
      const response = await fetch("/api/admin/pages/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save home page content");
      }

      const content: PageContent = await response.json();
      setData({ ...content, sections: withKnownSections(content.sections || []) });
      setSuccess("Home page content saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save home page content");
    } finally {
      setSaving(false);
    }
  };

  const sections = data?.sections || [];

  const updateSection = (index: number, field: keyof PageSection, value: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setData({ ...data, sections: updated });
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
        <h1 className="text-3xl font-display text-ink">Home Page</h1>
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

      {/* SEO Settings */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4 shadow-retro">
        <h2 className="font-display text-xl text-ink border-b-2 border-ink/10 pb-2">
          SEO Settings
        </h2>
        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">SEO Title</label>
          <input
            type="text"
            value={data?.seo_title || ""}
            onChange={(e) => setData({ ...data, seo_title: e.target.value })}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none font-body"
            placeholder="Nainital Taxi - Premium Taxi & Tour Services in Nainital"
          />
          <p className="text-xs text-ink/50 font-body mt-1">
            Leave blank to keep the site&apos;s default title.
          </p>
        </div>
        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">SEO Description</label>
          <textarea
            value={data?.seo_description || ""}
            onChange={(e) => setData({ ...data, seo_description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none font-body"
            placeholder="Book premium taxi services in Nainital..."
          />
          <p className="text-xs text-ink/50 font-body mt-1">
            Leave blank to keep the site&apos;s default description.
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4 shadow-retro">
        <h2 className="font-display text-xl text-ink border-b-2 border-ink/10 pb-2">
          Hero / Header Section
        </h2>
        <p className="text-xs text-ink/50 font-body -mt-2">
          The homepage hero normally rotates automatically by season. Filling in any field below
          overrides that field with your custom value; leaving a field blank keeps the automatic
          seasonal behavior for it.
        </p>
        <ImageUploader
          value={data?.hero_image_url || ""}
          onChange={(url) => setData({ ...data, hero_image_url: url || null })}
          folder="pages/home"
          label="Header Image (optional override)"
          recommendedSize="1920 x 1080"
          aspectRatio="21:9"
        />
        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">
            Header Title (optional override)
          </label>
          <input
            type="text"
            value={data?.hero_title || ""}
            onChange={(e) => setData({ ...data, hero_title: e.target.value || null })}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none font-body"
            placeholder="e.g., Escape to Snow-Kissed Hills"
          />
        </div>
        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">
            Header Subtitle (optional override)
          </label>
          <input
            type="text"
            value={data?.hero_subtitle || ""}
            onChange={(e) => setData({ ...data, hero_subtitle: e.target.value || null })}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none font-body"
            placeholder="e.g., Experience the magic of winter in the mountains"
          />
        </div>
      </div>

      {/* Section Headings */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4 shadow-retro">
        <h2 className="font-display text-xl text-ink border-b-2 border-ink/10 pb-2">
          Layout Headings
        </h2>
        {KNOWN_SECTIONS.map(({ key, label }, index) => (
          <div key={key} className="p-4 border-2 border-ink/10 rounded-lg space-y-3">
            <p className="text-sm font-body font-semibold text-ink/70">{label}</p>
            <div>
              <label className="block font-body text-xs text-ink/70 mb-1">Heading</label>
              <input
                type="text"
                value={sections[index]?.heading || ""}
                onChange={(e) => updateSection(index, "heading", e.target.value)}
                className="w-full px-3 py-2 border border-ink/20 rounded focus:border-teal focus:outline-none text-sm font-body"
              />
            </div>
            <div>
              <label className="block font-body text-xs text-ink/70 mb-1">Subheading</label>
              <input
                type="text"
                value={sections[index]?.subheading || ""}
                onChange={(e) => updateSection(index, "subheading", e.target.value)}
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
