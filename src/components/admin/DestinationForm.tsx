"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Plus, X, Loader2, Package as PackageIcon } from "lucide-react";
import Link from "next/link";
import { Destination } from "@/lib/supabase/types";
import ImageUploader from "@/components/admin/ImageUploader";

interface LinkablePackage {
  id: string;
  title: string;
  slug: string;
  type: string;
  is_active: boolean;
}

interface DestinationFormProps {
  destination?: Destination;
  isEditing?: boolean;
}

export default function DestinationForm({ destination, isEditing }: DestinationFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState(destination?.name || "");
  const [slug, setSlug] = useState(destination?.slug || "");
  const [tagline, setTagline] = useState(destination?.tagline || "");
  const [description, setDescription] = useState(destination?.description || "");
  const [emoji, setEmoji] = useState(destination?.emoji || "");
  const [distanceFromNainital, setDistanceFromNainital] = useState(destination?.distance_from_nainital?.toString() || "");
  const [duration, setDuration] = useState(destination?.duration || "");
  const [bestTimeToVisit, setBestTimeToVisit] = useState(destination?.best_time_to_visit || "");
  const [heroImageUrl, setHeroImageUrl] = useState(destination?.hero_image_url || "");
  const [highlights, setHighlights] = useState<string[]>(destination?.highlights || []);
  const [newHighlight, setNewHighlight] = useState("");
  const [metaTitle, setMetaTitle] = useState(destination?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(destination?.meta_description || "");
  const [isActive, setIsActive] = useState(destination?.is_active ?? true);
  const [isPopular, setIsPopular] = useState(destination?.is_popular ?? false);
  // Nullish means the row predates the show_faqs migration — default to showing.
  const [showFaqs, setShowFaqs] = useState(destination?.show_faqs ?? true);

  // Cross-sell packages
  const [selectedPackages, setSelectedPackages] = useState<string[]>(
    destination?.package_ids || []
  );
  const [packages, setPackages] = useState<LinkablePackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Only tours are worth cross-selling — a "transfer" package is this
    // destination's own point-to-point fare, not a trip to promote.
    fetch("/api/admin/packages?type=tour")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const rows: LinkablePackage[] = json?.data || [];
        setPackages(rows.filter((p) => p.is_active));
      })
      .catch(() => {
        // Non-fatal: the rest of the form still saves. The empty-state copy
        // below tells the admin the list didn't load.
        if (!cancelled) setPackages([]);
      })
      .finally(() => {
        if (!cancelled) setPackagesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const togglePackage = (packageId: string) => {
    setSelectedPackages((prev) =>
      prev.includes(packageId)
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId]
    );
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEditing || !slug) {
      setSlug(generateSlug(value));
    }
  };

  const addHighlight = () => {
    if (newHighlight.trim()) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight("");
    }
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const data = {
      name,
      slug,
      tagline: tagline || null,
      description: description || null,
      emoji: emoji || null,
      distance_from_nainital: distanceFromNainital ? parseInt(distanceFromNainital) : null,
      duration: duration || null,
      best_time_to_visit: bestTimeToVisit || null,
      hero_image_url: heroImageUrl || null,
      highlights,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      package_ids: selectedPackages,
      show_faqs: showFaqs,
      is_active: isActive,
      is_popular: isPopular,
    };

    try {
      const response = await fetch("/api/admin/destinations", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(isEditing ? { id: destination?.id, ...data } : data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save destination");
      }

      const savedDestination = await response.json();
      router.push(`/admin/destinations/${savedDestination.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save destination");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/destinations"
            className="p-2 hover:bg-ink/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-display text-ink">
            {isEditing ? "Edit Destination" : "Add Destination"}
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving || !name}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-retro-sm transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {error && (
        <div className="bg-coral/10 border-3 border-coral rounded-xl p-4 text-coral font-body">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">
              Name <span className="text-coral">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Bhimtal"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              required
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated"
              className="w-full px-4 py-2 border-3 border-ink/50 rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine bg-sunrise/30"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Emoji</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="e.g., 🏔️"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Distance from Nainital (km)</label>
            <input
              type="number"
              value={distanceFromNainital}
              onChange={(e) => setDistanceFromNainital(e.target.value)}
              placeholder="e.g., 22"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
        </div>

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Short catchy description"
            className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the destination"
            rows={4}
            className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
          />
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2">Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Duration</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 1-2 hours"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/70 mb-1">Best Time to Visit</label>
            <input
              type="text"
              value={bestTimeToVisit}
              onChange={(e) => setBestTimeToVisit(e.target.value)}
              placeholder="e.g., October to June"
              className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
        </div>

        {/* Uploads to Supabase Storage. Still accepts a pasted URL via the
            uploader's "Or enter image URL" toggle, so existing rows that hold
            an external link keep working. */}
        <ImageUploader
          value={heroImageUrl}
          onChange={setHeroImageUrl}
          folder="destinations/hero"
          label="Hero Image"
          recommendedSize="1920 x 1080"
          aspectRatio="16:9"
        />

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Highlights</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addHighlight())}
              placeholder="Add a highlight..."
              className="flex-1 px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <button
              type="button"
              onClick={addHighlight}
              className="px-4 py-2 bg-sunrise hover:bg-sunshine rounded-xl border-3 border-ink transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-lake/20 rounded-full text-sm font-body"
              >
                {highlight}
                <button
                  type="button"
                  onClick={() => removeHighlight(index)}
                  className="p-0.5 hover:bg-coral/20 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Linked Tour Packages */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2 flex items-center gap-2">
          <PackageIcon className="w-5 h-5 text-teal" />
          Linked Tour Packages
        </h2>
        <p className="font-body text-sm text-ink/60">
          Shown as &ldquo;Top Packages for {name || "this destination"}&rdquo; on the
          destination page. Leave empty to hide that section.
        </p>

        <div className="max-h-48 overflow-y-auto border-3 border-ink rounded-xl p-3 space-y-2">
          {packagesLoading ? (
            <p className="text-sm font-body text-ink/60">Loading packages...</p>
          ) : packages.length === 0 ? (
            <p className="text-sm font-body text-ink/60">
              No active tour packages found.
            </p>
          ) : (
            packages.map((pkg) => (
              <label
                key={pkg.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-sunrise/20 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedPackages.includes(pkg.id)}
                  onChange={() => togglePackage(pkg.id)}
                  className="w-4 h-4 border-2 border-ink rounded accent-teal"
                />
                <span className="text-sm font-body text-ink">{pkg.title}</span>
              </label>
            ))
          )}
        </div>
        <p className="text-xs text-ink/60">
          {selectedPackages.length} package{selectedPackages.length === 1 ? "" : "s"} selected
        </p>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2">SEO</h2>

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Meta Title</label>
          <input
            type="text"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="Custom page title for search engines"
            className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-ink/70 mb-1">Meta Description</label>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Custom description for search engines"
            rows={2}
            className="w-full px-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
          />
        </div>
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4">
        <h2 className="font-display text-lg text-ink border-b-2 border-ink/10 pb-2">Status</h2>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink"
            />
            <span className="font-body text-ink">Active (visible on website)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink"
            />
            <span className="font-body text-ink">Popular (featured badge)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showFaqs}
              onChange={(e) => setShowFaqs(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink"
            />
            <span className="font-body text-ink">Show FAQs section</span>
          </label>
        </div>
      </div>
    </form>
  );
}
