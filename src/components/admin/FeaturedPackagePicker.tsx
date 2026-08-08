"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Search, X } from "lucide-react";
import type { Package } from "@/lib/supabase/types";

interface FeaturedPackagePickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

/**
 * Picks which `packages` rows appear in the Featured Packages section of the
 * multi-day rental page. Order matters — the public section renders the ids in
 * exactly the order stored here — so selection and ordering are separate lists
 * rather than a single checkbox grid.
 */
export default function FeaturedPackagePicker({ selectedIds, onChange }: FeaturedPackagePickerProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/admin/packages");
        if (!response.ok) throw new Error("Failed to load packages");
        const body = await response.json();
        if (!cancelled) setPackages((body.data as Package[]) || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load packages");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const byId = useMemo(() => new Map(packages.map((pkg) => [pkg.id, pkg])), [packages]);

  // Ids whose package no longer exists (deleted since it was featured) are kept
  // in state but shown as unresolved rather than silently dropped, so the admin
  // can see why the count doesn't match the page.
  const selected = selectedIds.map((id) => ({ id, pkg: byId.get(id) }));

  const available = useMemo(() => {
    const term = search.trim().toLowerCase();
    return packages
      .filter((pkg) => !selectedIds.includes(pkg.id))
      .filter((pkg) => !term || pkg.title.toLowerCase().includes(term) || pkg.slug.toLowerCase().includes(term));
  }, [packages, selectedIds, search]);

  const add = (id: string) => onChange([...selectedIds, id]);
  const remove = (id: string) => onChange(selectedIds.filter((selectedId) => selectedId !== id));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-ink/60 font-body text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading packages…
      </div>
    );
  }

  if (error) {
    return <p className="font-body text-sm text-coral">{error}</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chosen, in display order */}
      <div>
        <p className="font-body text-sm text-ink/70 mb-2">
          Featured on the page ({selectedIds.length}) — shown in this order
        </p>
        <div className="space-y-2">
          {selected.map(({ id, pkg }, index) => (
            <div
              key={id}
              className="flex items-center gap-2 p-2 border-2 border-ink/10 rounded-lg bg-lake/40"
            >
              <span className="w-6 text-center font-display text-sm text-ink/50">{index + 1}</span>
              <div className="flex-1 min-w-0">
                {pkg ? (
                  <>
                    <p className="font-body text-sm text-ink truncate">{pkg.title}</p>
                    <p className="font-body text-xs text-ink/50 truncate">
                      /tour/{pkg.slug}
                      {pkg.duration ? ` · ${pkg.duration}` : ""}
                      {pkg.is_active === false ? " · inactive" : ""}
                    </p>
                  </>
                ) : (
                  <p className="font-body text-sm text-coral truncate">
                    Package no longer exists — remove it
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
                className="p-1 rounded text-ink/60 hover:bg-ink/5 disabled:opacity-30"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === selectedIds.length - 1}
                aria-label="Move down"
                className="p-1 rounded text-ink/60 hover:bg-ink/5 disabled:opacity-30"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => remove(id)}
                aria-label="Remove from featured"
                className="p-1 rounded text-coral hover:bg-coral/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {selectedIds.length === 0 && (
            <p className="font-body text-xs text-ink/40">
              None selected — the Featured Packages section is hidden on the live page.
            </p>
          )}
        </div>
      </div>

      {/* Everything else */}
      <div>
        <p className="font-body text-sm text-ink/70 mb-2">Add a package</p>
        <div className="relative mb-2">
          <Search className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or slug"
            className="w-full pl-9 pr-3 py-2 border-2 border-ink/20 rounded-lg text-sm font-body focus:border-teal focus:outline-none"
          />
        </div>
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {available.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              onClick={() => add(pkg.id)}
              className="w-full flex items-center gap-2 p-2 border-2 border-ink/10 rounded-lg text-left hover:border-teal hover:bg-teal/5 transition-colors"
            >
              <Plus className="w-4 h-4 text-teal flex-shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block font-body text-sm text-ink truncate">{pkg.title}</span>
                <span className="block font-body text-xs text-ink/50 truncate">
                  {pkg.type} · /tour/{pkg.slug}
                  {pkg.is_active === false ? " · inactive" : ""}
                </span>
              </span>
            </button>
          ))}
          {available.length === 0 && (
            <p className="font-body text-xs text-ink/40">
              {search ? "No packages match that search." : "All packages are already featured."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
