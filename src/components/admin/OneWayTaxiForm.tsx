"use client";

import React, { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import type { OneWayTaxiSettings } from "@/lib/supabase/types";

const inputClass =
  "w-full px-4 py-2 border-2 border-ink/20 rounded-lg focus:border-teal focus:outline-none font-body";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border-3 border-ink p-6 space-y-4 shadow-retro">
      <h2 className="font-display text-xl text-ink border-b-2 border-ink/10 pb-2">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-body text-sm text-ink/70 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-ink/50 font-body mt-1">{hint}</p>}
    </div>
  );
}

export default function OneWayTaxiForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [data, setData] = useState<OneWayTaxiSettings | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/admin/one-way-taxi");
        if (!response.ok) {
          // Prefer the server's own wording — it distinguishes "the migration
          // hasn't been run" from a genuine fault, which a generic string hides.
          const body = await response.json().catch(() => null);
          throw new Error(body?.error || "Failed to load one-way taxi settings");
        }
        const settings: OneWayTaxiSettings = await response.json();
        setData(settings);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load one-way taxi settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = <K extends keyof OneWayTaxiSettings>(key: K, value: OneWayTaxiSettings[K]) => {
    setData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/admin/one-way-taxi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save one-way taxi settings");
      }

      const settings: OneWayTaxiSettings = await response.json();
      setData(settings);
      setSuccess("One-way taxi page settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save one-way taxi settings");
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

  if (!data) {
    return (
      <div className="bg-coral/10 border-3 border-coral rounded-xl p-4 text-coral font-body">
        {error || "One-way taxi settings are unavailable."}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-ink">One-Way Taxi Page</h1>
          <p className="text-ink/60 font-body mt-1">
            Controls the hero heading, subheading and stat blocks on{" "}
            <a href="/rates" target="_blank" rel="noreferrer" className="underline">
              /rates
            </a>
            .
          </p>
        </div>
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

      {/* Hero */}
      <Panel title="Hero">
        <Field label="Heading" hint="The main h1 shown at the top of /rates.">
          <input
            type="text"
            value={data.hero_heading}
            onChange={(e) => set("hero_heading", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Subheading">
          <textarea
            value={data.hero_subheading}
            onChange={(e) => set("hero_subheading", e.target.value)}
            rows={2}
            className={inputClass}
          />
        </Field>
      </Panel>

      {/* Stats */}
      <Panel title="Statistics">
        <p className="text-sm text-ink/60 font-body -mt-2">
          Shown as three blocks under the hero. Leave a pair blank to hide it.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {(
            [
              { valueKey: "stat_1_value", labelKey: "stat_1_label", title: "Stat 1" },
              { valueKey: "stat_2_value", labelKey: "stat_2_label", title: "Stat 2" },
              { valueKey: "stat_3_value", labelKey: "stat_3_label", title: "Stat 3" },
            ] as const
          ).map(({ valueKey, labelKey, title }) => (
            <div key={valueKey} className="space-y-2 border-2 border-ink/10 rounded-lg p-3">
              <p className="text-xs font-body font-semibold text-ink/50 uppercase tracking-wide">
                {title}
              </p>
              <Field label="Value">
                <input
                  type="text"
                  value={data[valueKey]}
                  onChange={(e) => set(valueKey, e.target.value)}
                  placeholder="500+"
                  className={inputClass}
                />
              </Field>
              <Field label="Label">
                <input
                  type="text"
                  value={data[labelKey]}
                  onChange={(e) => set(labelKey, e.target.value)}
                  placeholder="Happy Travelers"
                  className={inputClass}
                />
              </Field>
            </div>
          ))}
        </div>
      </Panel>

      {/* SEO */}
      <Panel title="SEO Settings">
        <Field label="SEO Title" hint="Used as the page <title>.">
          <input
            type="text"
            value={data.seo_title}
            onChange={(e) => set("seo_title", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="SEO Description" hint="Used as the meta description.">
          <textarea
            value={data.seo_description}
            onChange={(e) => set("seo_description", e.target.value)}
            rows={2}
            className={inputClass}
          />
        </Field>
      </Panel>
    </form>
  );
}
