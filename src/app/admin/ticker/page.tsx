"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, Radio, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TickerBooking } from "@/lib/supabase/types";
import TickerForm from "@/components/admin/TickerForm";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  transfer: "Fixed-fare transfer",
  day_tour: "Day tour / package",
  multi_day_rental: "Multi-day rental",
  temple_trip: "Temple trip",
};

function formatLastShown(value: string | null | undefined) {
  if (!value) return "Never shown";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Shown <1h ago";
  if (diffHours < 24) return `Shown ${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `Shown ${diffDays}d ago`;
}

export default function TickerPage() {
  const [bookings, setBookings] = useState<TickerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState<TickerBooking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/ticker");

      if (!response.ok) throw new Error("Failed to fetch ticker bookings");

      const result = await response.json();
      setBookings(result.data || []);
    } catch (error) {
      console.error("Error fetching ticker bookings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCreateNew = () => {
    setEditingBooking(null);
    setShowForm(true);
  };

  const handleEdit = (booking: TickerBooking) => {
    setEditingBooking(booking);
    setShowForm(true);
  };

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const url = "/api/admin/ticker";
      const method = editingBooking ? "PATCH" : "POST";
      const body = editingBooking ? { id: editingBooking.id, updates: data } : data;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save ticker booking");
      }

      await fetchBookings();
      setShowForm(false);
      setEditingBooking(null);
    } catch (error) {
      console.error("Error saving ticker booking:", error);
      alert(error instanceof Error ? error.message : "Failed to save ticker booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (booking: TickerBooking) => {
    setSaving(booking.id);
    try {
      const response = await fetch("/api/admin/ticker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: booking.id,
          updates: { is_active: !booking.is_active },
        }),
      });

      if (!response.ok) throw new Error("Failed to toggle active state");

      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, is_active: !b.is_active } : b))
      );
    } catch (error) {
      console.error("Error toggling active state:", error);
    } finally {
      setSaving(null);
    }
  };

  const deleteBooking = async (booking: TickerBooking) => {
    if (
      !confirm(
        `Permanently delete the ticker entry for "${booking.guest_first_name}" (${booking.guest_city})? This cannot be undone — to just pull it from rotation without deleting, toggle "Active" off instead.`
      )
    )
      return;

    setSaving(booking.id);
    try {
      const response = await fetch(`/api/admin/ticker?id=${booking.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    } catch (error) {
      console.error("Error deleting ticker booking:", error);
      alert("Failed to delete ticker booking.");
    } finally {
      setSaving(null);
    }
  };

  const parseBulkText = (text: string) => {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const cols = line.split("\t").map((c) => c.trim());
        const [guest_first_name, guest_city, service_label, service_type, real_booking_date] = cols;
        return { guest_first_name, guest_city, service_label, service_type, real_booking_date };
      });
  };

  const handleBulkImport = async () => {
    const rows = parseBulkText(bulkText);
    if (rows.length === 0) {
      setImportResult("Paste at least one row first.");
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    try {
      const response = await fetch("/api/admin/ticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to import");

      setImportResult(`Imported ${result.imported} of ${rows.length} rows.`);
      setBulkText("");
      await fetchBookings();
    } catch (error) {
      console.error("Error bulk importing:", error);
      setImportResult(error instanceof Error ? error.message : "Failed to import");
    } finally {
      setIsImporting(false);
    }
  };

  const filteredBookings = bookings.filter(
    (b) =>
      b.guest_first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.guest_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.service_label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = bookings.filter((b) => b.is_active).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl font-display text-ink animate-pulse">
          Loading ticker bookings...
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="max-w-4xl mx-auto">
        <TickerForm
          initialData={editingBooking}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onCancel={() => {
            setShowForm(false);
            setEditingBooking(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink flex items-center gap-2">
            <Radio className="w-8 h-8" />
            Booking Ticker
          </h1>
          <p className="text-ink/60 font-body mt-1">
            Curate the pool of real past bookings that rotate through the homepage corner-popup ticker
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkImport((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-white border-3 border-ink rounded-xl font-body font-semibold shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Upload className="w-5 h-5" />
            Bulk Import
          </button>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-sunshine border-3 border-ink rounded-xl font-body font-semibold shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Booking
          </button>
        </div>
      </div>

      {/* Bulk Import Panel */}
      {showBulkImport && (
        <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display text-ink">Bulk Import from Spreadsheet</h3>
            <button
              onClick={() => setShowBulkImport(false)}
              className="p-2 rounded-lg hover:bg-coral/10 transition-colors"
            >
              <X className="w-5 h-5 text-coral" />
            </button>
          </div>
          <p className="text-sm text-ink/60 font-body">
            Prepare rows in Excel/Google Sheets with columns in this order: Guest First Name,
            City, Service Label, Service Type, Real Booking Date. Copy the selection and paste it
            below — tab-separated values from a spreadsheet paste directly. Service Type must be
            one of: {Object.keys(SERVICE_TYPE_LABELS).join(", ")}. Real Booking Date is optional
            (YYYY-MM-DD).
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={"Priya S.\tDelhi\tNainital → Kathgodam transfer\ttransfer\t2026-06-12"}
            rows={8}
            className="w-full px-4 py-3 border-3 border-ink rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sunshine"
          />
          {importResult && <p className="text-sm font-body text-ink">{importResult}</p>}
          <div className="flex justify-end">
            <button
              onClick={handleBulkImport}
              disabled={isImporting}
              className="px-6 py-3 rounded-xl border-3 border-ink font-display bg-sunshine text-ink shadow-retro hover:shadow-retro-sm hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
            >
              {isImporting ? "Importing..." : "Import Rows"}
            </button>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border-3 border-ink p-4 shadow-retro-sm">
          <div className="text-2xl font-display text-ink">{bookings.length}</div>
          <div className="text-sm font-body text-ink/60">Total</div>
        </div>
        <div className="bg-teal/20 rounded-xl border-3 border-ink p-4 shadow-retro-sm">
          <div className="text-2xl font-display text-ink">{activeCount}</div>
          <div className="text-sm font-body text-ink/60">Active (eligible for rotation)</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticker bookings..."
            className="w-full pl-10 pr-4 py-2 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
          />
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-2xl border-3 border-ink shadow-retro overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <Radio className="w-16 h-16 mx-auto text-ink/20 mb-4" />
            <p className="text-lg font-display text-ink/60">
              {searchQuery ? "No ticker bookings found" : "No ticker bookings yet"}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateNew}
                className="mt-4 text-teal font-body hover:underline"
              >
                Add your first booking
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-sunrise/30 border-b-3 border-ink">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-display text-ink">Guest</th>
                  <th className="px-4 py-3 text-left text-sm font-display text-ink">Service</th>
                  <th className="px-4 py-3 text-left text-sm font-display text-ink">Rotation</th>
                  <th className="px-4 py-3 text-left text-sm font-display text-ink">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-display text-ink">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink/10">
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className={cn(
                      "hover:bg-sunrise/10 transition-colors",
                      !b.is_active && "opacity-50"
                    )}
                  >
                    {/* Guest */}
                    <td className="px-4 py-3">
                      <div className="font-body font-semibold text-ink">{b.guest_first_name}</div>
                      <div className="text-xs text-ink/60">{b.guest_city}</div>
                    </td>

                    {/* Service */}
                    <td className="px-4 py-3 max-w-sm">
                      <p className="text-sm text-ink/80">{b.service_label}</p>
                      {b.service_type && (
                        <p className="text-xs text-ink/50">
                          {SERVICE_TYPE_LABELS[b.service_type] || b.service_type}
                        </p>
                      )}
                    </td>

                    {/* Rotation */}
                    <td className="px-4 py-3">
                      <p className="text-xs text-ink/60 font-body">
                        {formatLastShown(b.last_shown_at)}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(b)}
                        disabled={saving === b.id}
                        className={cn(
                          "px-3 py-1 rounded-lg text-xs font-semibold border-2 transition-colors",
                          b.is_active
                            ? "bg-teal/20 border-teal text-teal"
                            : "bg-gray-100 border-gray-300 text-gray-600"
                        )}
                      >
                        {b.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(b)}
                          disabled={saving === b.id}
                          className="p-2 rounded-lg hover:bg-teal/20 text-teal transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBooking(b)}
                          disabled={saving === b.id}
                          className="p-2 rounded-lg hover:bg-coral/20 text-coral transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
