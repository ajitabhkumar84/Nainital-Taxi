"use client";

import React, { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { PageContent } from "@/lib/supabase/types";

interface PageSeoFormProps {
  slug: string;
  pageLabel: string; // e.g. "Destinations Page" — used in headings and messages
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
}

/**
 * Minimal SEO-only editor for a page_content row (see
 * src/app/api/admin/pages/[slug]/route.ts). For pages that only need a
 * custom title/description override — not the hero-image and
 * section-heading editing HomePageContentForm also exposes for '/'.
 */
export default function PageSeoForm({
  slug,
  pageLabel,
  titlePlaceholder,
  descriptionPlaceholder,
}: PageSeoFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/admin/pages/${slug}`);
        if (!response.ok) throw new Error(`Failed to load ${pageLabel} content`);
        const content: PageContent = await response.json();
        setSeoTitle(content.seo_title || "");
        setSeoDescription(content.seo_description || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to load ${pageLabel} content`);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, pageLabel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/pages/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seo_title: seoTitle,
          seo_description: seoDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save ${pageLabel} content`);
      }

      const content: PageContent = await response.json();
      setSeoTitle(content.seo_title || "");
      setSeoDescription(content.seo_description || "");
      setSuccess(`${pageLabel} SEO saved successfully!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to save ${pageLabel} content`);
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-3xl font-display text-ink">{pageLabel}</h1>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2 bg-sunshine text-ink font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
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

      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4 shadow-retro">
        <h2 className="font-display text-xl text-ink border-b-2 border-ink/10 pb-2">
          SEO Settings
        </h2>
        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">SEO Title</label>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none font-body"
            placeholder={titlePlaceholder}
          />
          <p className="text-xs text-ink/50 font-body mt-1">
            Leave blank to keep the page&apos;s default title.
          </p>
        </div>
        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">SEO Description</label>
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none font-body"
            placeholder={descriptionPlaceholder}
          />
          <p className="text-xs text-ink/50 font-body mt-1">
            Leave blank to keep the page&apos;s default description.
          </p>
        </div>
      </div>
    </form>
  );
}
