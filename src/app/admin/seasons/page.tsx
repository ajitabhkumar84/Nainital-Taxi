"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Sun,
  Snowflake,
  Calendar,
  Plus,
  Trash2,
  Save,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Season {
  id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_recurring: boolean;
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "nainital2024";

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [newSeason, setNewSeason] = useState({
    name: "Season" as "Season" | "Off-Season",
    description: "",
    start_date: "",
    end_date: "",
    is_recurring: true,
  });

  const fetchSeasons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("start_date");

      if (error) throw error;
      setSeasons((data as Season[]) || []);
    } catch (error) {
      console.error("Error fetching seasons:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  const saveSeason = async (season: Season) => {
    setSaving(season.id);
    try {
      const response = await fetch("/api/admin/seasons", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          id: season.id,
          updates: {
            name: season.name,
            description: season.description,
            start_date: season.start_date,
            end_date: season.end_date,
            is_active: season.is_active,
            is_recurring: season.is_recurring,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save season");
      }

      setSeasons((prev) =>
        prev.map((s) => (s.id === season.id ? season : s))
      );
      setEditingSeason(null);
    } catch (error) {
      console.error("Error saving season:", error);
      alert("Failed to save season. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  const addSeason = async () => {
    if (!newSeason.start_date || !newSeason.end_date) {
      alert("Please select start and end dates");
      return;
    }

    setSaving("new");
    try {
      const response = await fetch("/api/admin/seasons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          name: newSeason.name,
          description: newSeason.description || null,
          start_date: newSeason.start_date,
          end_date: newSeason.end_date,
          is_recurring: newSeason.is_recurring,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add season");
      }

      const { data } = await response.json();

      if (data) {
        setSeasons((prev) => [...prev, data as Season]);
        setIsAddingNew(false);
        setNewSeason({
          name: "Season",
          description: "",
          start_date: "",
          end_date: "",
          is_recurring: true,
        });
      }
    } catch (error) {
      console.error("Error adding season:", error);
      alert("Failed to add season. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  const toggleSeasonActive = async (season: Season) => {
    setSaving(season.id);
    try {
      const response = await fetch("/api/admin/seasons", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-auth": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          id: season.id,
          updates: { is_active: !season.is_active },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to toggle season");
      }

      setSeasons((prev) =>
        prev.map((s) =>
          s.id === season.id ? { ...s, is_active: !s.is_active } : s
        )
      );
    } catch (error) {
      console.error("Error toggling season:", error);
    } finally {
      setSaving(null);
    }
  };

  const deleteSeason = async (seasonId: string) => {
    if (!confirm("Are you sure you want to delete this season? This may affect pricing.")) {
      return;
    }

    setSaving(seasonId);
    try {
      const response = await fetch(`/api/admin/seasons?id=${seasonId}`, {
        method: "DELETE",
        headers: {
          "x-admin-auth": ADMIN_PASSWORD,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete season");
      }

      setSeasons((prev) => prev.filter((s) => s.id !== seasonId));
    } catch (error) {
      console.error("Error deleting season:", error);
      alert("Failed to delete season. It may have associated pricing data.");
    } finally {
      setSaving(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getSeasonIcon = (name: string) => {
    if (name.toLowerCase().includes("off") || name.toLowerCase().includes("winter")) {
      return <Snowflake className="w-6 h-6 text-teal" />;
    }
    return <Sun className="w-6 h-6 text-sunshine" />;
  };

  const isDateInSeason = (season: Season) => {
    const today = new Date().toISOString().split("T")[0];
    return today >= season.start_date && today <= season.end_date;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl font-display text-ink animate-pulse">
          Loading seasons...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink">Season Manager</h1>
          <p className="text-ink/60 font-body mt-1">
            Configure peak and off-peak seasons for dynamic pricing
          </p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-sunshine border-3 border-ink rounded-xl font-body font-semibold shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Season Period
        </button>
      </div>

      {/* Current Season Indicator */}
      {seasons.filter((s) => s.is_active && isDateInSeason(s)).length > 0 && (
        <div className="bg-gradient-to-r from-sunshine to-coral rounded-2xl border-3 border-ink p-4 shadow-retro">
          <div className="flex items-center gap-3">
            <Sun className="w-8 h-8 text-ink" />
            <div>
              <div className="font-display text-xl text-ink">
                Current: {seasons.find((s) => s.is_active && isDateInSeason(s))?.name}
              </div>
              <div className="text-sm font-body text-ink/70">
                {seasons.find((s) => s.is_active && isDateInSeason(s))?.description ||
                  "Active pricing period"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Season Form */}
      {isAddingNew && (
        <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
          <h2 className="font-display text-xl text-ink mb-4">Add New Season Period</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Season Type
              </label>
              <select
                value={newSeason.name}
                onChange={(e) =>
                  setNewSeason({ ...newSeason, name: e.target.value as "Season" | "Off-Season" })
                }
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              >
                <option value="Season">Season (Peak)</option>
                <option value="Off-Season">Off-Season</option>
              </select>
            </div>
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Description (optional)
              </label>
              <input
                type="text"
                value={newSeason.description}
                onChange={(e) =>
                  setNewSeason({ ...newSeason, description: e.target.value })
                }
                placeholder="e.g., Summer holidays, Diwali rush"
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              />
            </div>
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={newSeason.start_date}
                onChange={(e) =>
                  setNewSeason({ ...newSeason, start_date: e.target.value })
                }
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              />
            </div>
            <div>
              <label className="block font-body text-sm text-ink/60 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={newSeason.end_date}
                onChange={(e) =>
                  setNewSeason({ ...newSeason, end_date: e.target.value })
                }
                className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="recurring"
              checked={newSeason.is_recurring}
              onChange={(e) =>
                setNewSeason({ ...newSeason, is_recurring: e.target.checked })
              }
              className="w-5 h-5 rounded border-2 border-ink"
            />
            <label htmlFor="recurring" className="font-body text-ink">
              Recurring annually
            </label>
          </div>
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 border-3 border-ink rounded-xl font-body hover:bg-sunrise/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addSeason}
              disabled={saving === "new"}
              className="flex items-center gap-2 px-4 py-2 bg-whatsapp text-white border-3 border-ink rounded-xl font-body font-semibold shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving === "new" ? "Saving..." : "Add Season"}
            </button>
          </div>
        </div>
      )}

      {/* Seasons List */}
      <div className="space-y-4">
        {seasons.length === 0 ? (
          <div className="bg-white rounded-2xl border-3 border-ink p-8 text-center shadow-retro">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-display text-ink mb-2">No seasons configured</h3>
            <p className="text-ink/60 font-body">
              Add season periods to enable dynamic pricing
            </p>
          </div>
        ) : (
          seasons.map((season) => (
            <div
              key={season.id}
              className={cn(
                "bg-white rounded-2xl border-3 border-ink shadow-retro overflow-hidden",
                !season.is_active && "opacity-60"
              )}
            >
              {editingSeason?.id === season.id ? (
                // Edit Mode
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-body text-sm text-ink/60 mb-2">
                        Season Type
                      </label>
                      <select
                        value={editingSeason.name}
                        onChange={(e) =>
                          setEditingSeason({ ...editingSeason, name: e.target.value })
                        }
                        className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                      >
                        <option value="Season">Season (Peak)</option>
                        <option value="Off-Season">Off-Season</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-body text-sm text-ink/60 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editingSeason.description || ""}
                        onChange={(e) =>
                          setEditingSeason({
                            ...editingSeason,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                    </div>
                    <div>
                      <label className="block font-body text-sm text-ink/60 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={editingSeason.start_date}
                        onChange={(e) =>
                          setEditingSeason({
                            ...editingSeason,
                            start_date: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                    </div>
                    <div>
                      <label className="block font-body text-sm text-ink/60 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={editingSeason.end_date}
                        onChange={(e) =>
                          setEditingSeason({
                            ...editingSeason,
                            end_date: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setEditingSeason(null)}
                      className="px-4 py-2 border-3 border-ink rounded-xl font-body hover:bg-sunrise/30 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveSeason(editingSeason)}
                      disabled={saving === season.id}
                      className="flex items-center gap-2 px-4 py-2 bg-sunshine border-3 border-ink rounded-xl font-body font-semibold shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving === season.id ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center",
                          season.name === "Season" ? "bg-sunshine/30" : "bg-lake/30"
                        )}
                      >
                        {getSeasonIcon(season.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-xl text-ink">
                            {season.name}
                          </h3>
                          {isDateInSeason(season) && season.is_active && (
                            <span className="px-2 py-1 bg-whatsapp/20 text-whatsapp text-xs font-body font-semibold rounded-lg">
                              Active Now
                            </span>
                          )}
                          {!season.is_active && (
                            <span className="px-2 py-1 bg-ink/10 text-ink/60 text-xs font-body rounded-lg">
                              Disabled
                            </span>
                          )}
                        </div>
                        {season.description && (
                          <p className="text-ink/60 font-body text-sm mt-1">
                            {season.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="w-4 h-4 text-ink/40" />
                          <span className="text-sm font-body text-ink/60">
                            {formatDate(season.start_date)} → {formatDate(season.end_date)}
                          </span>
                          {season.is_recurring && (
                            <span className="text-xs font-body text-teal">
                              (Recurring)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSeasonActive(season)}
                        disabled={saving === season.id}
                        className={cn(
                          "px-3 py-2 rounded-xl font-body text-sm border-2 transition-colors",
                          season.is_active
                            ? "bg-whatsapp/20 border-whatsapp text-whatsapp hover:bg-whatsapp/30"
                            : "bg-ink/10 border-ink/20 text-ink/60 hover:bg-ink/20"
                        )}
                      >
                        {season.is_active ? "Enabled" : "Disabled"}
                      </button>
                      <button
                        onClick={() => setEditingSeason(season)}
                        className="px-3 py-2 bg-sunshine/30 rounded-xl font-body text-sm hover:bg-sunshine/50 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteSeason(season.id)}
                        disabled={saving === season.id}
                        className="p-2 text-coral hover:bg-coral/10 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-lake/20 rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-teal mt-0.5" />
          <div className="font-body text-sm text-ink">
            <strong>How Seasons Work:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-ink/70">
              <li>Season prices are used when the booking date falls within a season period</li>
              <li>If no matching season is found, Off-Season pricing is used</li>
              <li>Multiple overlapping seasons use priority (Season &gt; Off-Season)</li>
              <li>Set prices for each season in the Pricing Manager</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
