"use client";

import React, { useEffect, useState } from "react";
import {
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Loader2,
  ExternalLink,
  Megaphone,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import {
  DEFAULT_LANDING_PAGE_CONFIG,
  LandingPageConfig,
  LandingPricingLine,
  LandingThemeMode,
} from "@/lib/supabase/types";
import { LANDING_THEMES, resolveTheme } from "@/components/landing/themes";

interface PackageOption {
  id: string;
  slug: string;
  title: string;
}

const THEME_OPTIONS: { value: LandingThemeMode; label: string }[] = [
  { value: "auto", label: "Auto (by month)" },
  { value: "rainy", label: `${LANDING_THEMES.rainy.emoji} Rainy` },
  { value: "autumn", label: `${LANDING_THEMES.autumn.emoji} Autumn` },
  { value: "winter", label: `${LANDING_THEMES.winter.emoji} Winter` },
];

export default function LandingPageAdmin() {
  const [config, setConfig] = useState<LandingPageConfig>(DEFAULT_LANDING_PAGE_CONFIG);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      const [configRes, packagesRes] = await Promise.all([
        fetch("/api/admin/landing-page").then((r) => r.json()),
        supabase
          .from("packages")
          .select("id, slug, title")
          .eq("is_active", true)
          .eq("type", "tour")
          .order("display_order"),
      ]);
      setConfig(configRes);
      setPackages((packagesRes.data as PackageOption[]) || []);
      setIsLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Save failed");
      const updated = await res.json();
      setConfig(updated);
      setMessage({ type: "success", text: "Landing page configuration saved." });
    } catch {
      setMessage({ type: "error", text: "Failed to save. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const updateHero = (field: keyof LandingPageConfig["hero"], value: string) => {
    setConfig({ ...config, hero: { ...config.hero, [field]: value } });
  };

  const updateLine = (index: number, field: keyof LandingPricingLine, value: string | boolean) => {
    const lines = [...config.pricingLines];
    lines[index] = { ...lines[index], [field]: value };
    setConfig({ ...config, pricingLines: lines });
  };

  const addLine = () => {
    const newLine: LandingPricingLine = {
      id: crypto.randomUUID(),
      label: "New Vehicle",
      priceText: "₹0/day",
      note: "",
      isActive: true,
      displayOrder: config.pricingLines.length,
    };
    setConfig({ ...config, pricingLines: [...config.pricingLines, newLine] });
  };

  const removeLine = (index: number) => {
    setConfig({ ...config, pricingLines: config.pricingLines.filter((_, i) => i !== index) });
  };

  const moveLine = (index: number, direction: "up" | "down") => {
    const lines = [...config.pricingLines];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= lines.length) return;
    [lines[index], lines[newIndex]] = [lines[newIndex], lines[index]];
    lines.forEach((l, i) => (l.displayOrder = i));
    setConfig({ ...config, pricingLines: lines });
  };

  const toggleFeaturedSlug = (slug: string) => {
    const slugs = config.featuredPackageSlugs.includes(slug)
      ? config.featuredPackageSlugs.filter((s) => s !== slug)
      : [...config.featuredPackageSlugs, slug];
    setConfig({ ...config, featuredPackageSlugs: slugs });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const resolvedAuto = resolveTheme("auto");
  const whatsappPreviewLen = config.whatsappMessageTemplate.length;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-ink" />
          <h1 className="text-2xl font-bold text-ink">PPC Landing Page</h1>
        </div>
        <a
          href="/lp/taxi"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-semibold text-sunshine hover:underline"
        >
          View Landing Page <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Theme */}
      <section className="mb-8 rounded-xl border border-slate-200 p-4">
        <h2 className="mb-3 font-bold text-ink">Seasonal Theme</h2>
        <select
          value={config.themeMode}
          onChange={(e) => setConfig({ ...config, themeMode: e.target.value as LandingThemeMode })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          {THEME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500">
          Auto currently resolves to: <strong>{LANDING_THEMES[resolvedAuto].label}</strong>
        </p>
        <div className="mt-3 flex gap-2">
          {(Object.keys(LANDING_THEMES) as (keyof typeof LANDING_THEMES)[]).map((key) => (
            <div key={key} className={`flex-1 rounded-lg p-3 text-center text-xs font-semibold ${LANDING_THEMES[key].badge}`}>
              {LANDING_THEMES[key].emoji} {LANDING_THEMES[key].label}
            </div>
          ))}
        </div>
      </section>

      {/* Hero copy */}
      <section className="mb-8 rounded-xl border border-slate-200 p-4">
        <h2 className="mb-3 font-bold text-ink">Hero Copy</h2>
        <label className="mb-1 block text-sm font-medium text-slate-600">Badge text</label>
        <input
          value={config.hero.badgeText}
          onChange={(e) => updateHero("badgeText", e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <label className="mb-1 block text-sm font-medium text-slate-600">Headline</label>
        <input
          value={config.hero.headline}
          onChange={(e) => updateHero("headline", e.target.value)}
          className="mb-3 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <label className="mb-1 block text-sm font-medium text-slate-600">Subheadline</label>
        <textarea
          value={config.hero.subheadline}
          onChange={(e) => updateHero("subheadline", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </section>

      {/* WhatsApp template */}
      <section className="mb-8 rounded-xl border border-slate-200 p-4">
        <h2 className="mb-3 font-bold text-ink">WhatsApp Pre-Filled Message</h2>
        <textarea
          value={config.whatsappMessageTemplate}
          onChange={(e) => setConfig({ ...config, whatsappMessageTemplate: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-slate-500">
          {whatsappPreviewLen} characters — keep it to 1–2 short lines. Long messages create friction; the
          customer should be able to hit Send immediately.
        </p>
        <a
          href={`https://wa.me/918445206116?text=${encodeURIComponent(config.whatsappMessageTemplate)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs font-semibold text-whatsapp hover:underline"
        >
          Preview on WhatsApp →
        </a>
      </section>

      {/* Pricing lines */}
      <section className="mb-8 rounded-xl border border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-ink">Pricing Lines</h2>
          <button
            onClick={addLine}
            className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
        <div className="space-y-3">
          {config.pricingLines.map((line, i) => (
            <div key={line.id} className="rounded-lg border border-slate-200 p-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={line.label}
                  onChange={(e) => updateLine(i, "label", e.target.value)}
                  placeholder="Label (e.g. Sedan)"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={line.priceText}
                  onChange={(e) => updateLine(i, "priceText", e.target.value)}
                  placeholder="Price text (e.g. ₹2,500/day)"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <input
                value={line.note || ""}
                onChange={(e) => updateLine(i, "note", e.target.value)}
                placeholder="Note (e.g. Seats 4 · AC)"
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="mt-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={line.isActive}
                    onChange={(e) => updateLine(i, "isActive", e.target.checked)}
                  />
                  Active
                </label>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveLine(i, "up")} className="rounded p-1 hover:bg-slate-100">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => moveLine(i, "down")} className="rounded p-1 hover:bg-slate-100">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button onClick={() => removeLine(i)} className="rounded p-1 text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured packages */}
      <section className="mb-8 rounded-xl border border-slate-200 p-4">
        <h2 className="mb-3 font-bold text-ink">Featured Tour Packages</h2>
        <div className="space-y-2">
          {packages.map((pkg) => (
            <label key={pkg.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={config.featuredPackageSlugs.includes(pkg.slug)}
                onChange={() => toggleFeaturedSlug(pkg.slug)}
              />
              {pkg.title}
            </label>
          ))}
        </div>
      </section>

      {/* Booking widget toggle */}
      <section className="mb-8 rounded-xl border border-slate-200 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={config.showBookingWidget}
            onChange={(e) => setConfig({ ...config, showBookingWidget: e.target.checked })}
          />
          Show booking widget on landing page
        </label>
      </section>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="flex items-center gap-2 rounded-lg bg-ink px-6 py-3 font-bold text-white hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        Save Changes
      </button>
    </div>
  );
}
