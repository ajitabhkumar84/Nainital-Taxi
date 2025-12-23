"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Filter,
  Phone,
  Calendar,
  MapPin,
  Users,
  Car,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Check,
  X,
  Clock,
  IndianRupee,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Booking, BookingStatus, VehicleTypeDisplayNames } from "@/lib/supabase/types";

const STATUS_OPTIONS: { value: BookingStatus | "all"; label: string }[] = [
  { value: "all", label: "All Bookings" },
  { value: "pending", label: "Pending" },
  { value: "payment_pending", label: "Payment Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    try {
      let query = supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings((data as Booking[]) || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const updateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    setUpdatingStatus(bookingId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("bookings") as any)
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const updatePaymentStatus = async (bookingId: string, paymentStatus: "received" | "verified") => {
    setUpdatingStatus(bookingId);
    try {
      const updates: Record<string, unknown> = { payment_status: paymentStatus };

      if (paymentStatus === "received") {
        updates.payment_received_at = new Date().toISOString();
      } else if (paymentStatus === "verified") {
        updates.payment_verified_at = new Date().toISOString();
        updates.status = "confirmed";
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("bookings") as any)
        .update(updates)
        .eq("id", bookingId);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, payment_status: paymentStatus, status: paymentStatus === "verified" ? "confirmed" : b.status }
            : b
        )
      );
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Failed to update payment status. Please try again.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.customer_name.toLowerCase().includes(query) ||
      booking.customer_phone.includes(query) ||
      booking.package_name.toLowerCase().includes(query) ||
      booking.booking_date.includes(query)
    );
  });

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "confirmed":
        return "bg-whatsapp/20 text-whatsapp border-whatsapp";
      case "pending":
      case "payment_pending":
        return "bg-sunshine/30 text-ink border-sunshine";
      case "in_progress":
        return "bg-teal/20 text-teal border-teal";
      case "completed":
        return "bg-teal/30 text-teal border-teal";
      case "cancelled":
      case "refunded":
        return "bg-coral/20 text-coral border-coral";
      default:
        return "bg-ink/10 text-ink border-ink/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const generateWhatsAppLink = (booking: Booking, message: string) => {
    const phone = booking.customer_whatsapp || booking.customer_phone;
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl font-display text-ink animate-pulse">
          Loading bookings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink">Bookings</h1>
          <p className="text-ink/60 font-body mt-1">
            Manage all your customer bookings
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
            <input
              type="text"
              placeholder="Search by name, phone, or package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "all")}
              className="pl-10 pr-8 py-3 border-3 border-ink rounded-xl font-body bg-white focus:outline-none focus:ring-2 focus:ring-sunshine appearance-none cursor-pointer min-w-[180px]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border-3 border-ink p-8 text-center shadow-retro">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-xl font-display text-ink mb-2">No bookings found</h3>
            <p className="text-ink/60 font-body">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Bookings will appear here once customers start booking"}
            </p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border-3 border-ink shadow-retro overflow-hidden"
            >
              {/* Booking Header */}
              <div
                className="p-4 cursor-pointer hover:bg-sunrise/20 transition-colors"
                onClick={() =>
                  setExpandedBooking(expandedBooking === booking.id ? null : booking.id)
                }
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sunshine flex items-center justify-center text-2xl">
                      🚕
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-ink">
                        {booking.customer_name}
                      </h3>
                      <p className="text-ink/60 font-body text-sm">
                        {booking.package_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-ink/40" />
                        <span className="text-sm font-body text-ink/60">
                          {formatDate(booking.booking_date)}
                        </span>
                        <Clock className="w-4 h-4 text-ink/40 ml-2" />
                        <span className="text-sm font-body text-ink/60">
                          {booking.pickup_time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-display text-xl text-ink">
                        {formatPrice(booking.final_price)}
                      </div>
                      <span
                        className={cn(
                          "inline-block px-3 py-1 rounded-lg text-xs font-body font-semibold border-2",
                          getStatusColor(booking.status)
                        )}
                      >
                        {booking.status.replace("_", " ")}
                      </span>
                    </div>
                    {expandedBooking === booking.id ? (
                      <ChevronUp className="w-5 h-5 text-ink" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-ink" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedBooking === booking.id && (
                <div className="border-t-3 border-ink p-4 bg-sunrise/10">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div className="space-y-3">
                      <h4 className="font-display text-ink">Customer Details</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-ink/40" />
                          <a
                            href={`tel:${booking.customer_phone}`}
                            className="text-teal font-body hover:underline"
                          >
                            {booking.customer_phone}
                          </a>
                        </div>
                        {booking.customer_email && (
                          <div className="flex items-center gap-2">
                            <span className="text-ink/40">📧</span>
                            <span className="font-body text-ink">
                              {booking.customer_email}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 pt-2">
                        <a
                          href={generateWhatsAppLink(
                            booking,
                            `Hi ${booking.customer_name}! Your booking for ${booking.package_name} on ${formatDate(booking.booking_date)} is confirmed. Thank you for choosing Nainital Taxi!`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-whatsapp text-white rounded-xl font-body text-sm hover:opacity-90 transition-opacity"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </a>
                        <a
                          href={`tel:${booking.customer_phone}`}
                          className="flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-xl font-body text-sm hover:opacity-90 transition-opacity"
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </a>
                      </div>
                    </div>

                    {/* Trip Info */}
                    <div className="space-y-3">
                      <h4 className="font-display text-ink">Trip Details</h4>
                      <div className="space-y-2 font-body text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-ink/40 mt-1" />
                          <div>
                            <span className="text-ink/60">Pickup:</span>{" "}
                            <span className="text-ink">{booking.pickup_location}</span>
                          </div>
                        </div>
                        {booking.dropoff_location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-ink/40 mt-1" />
                            <div>
                              <span className="text-ink/60">Drop:</span>{" "}
                              <span className="text-ink">{booking.dropoff_location}</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-ink/40" />
                          <span className="text-ink">{booking.passengers} passengers</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-ink/40" />
                          <span className="text-ink">
                            {VehicleTypeDisplayNames[booking.vehicle_type]}
                          </span>
                        </div>
                        {booking.special_requests && (
                          <div className="p-2 bg-sunshine/30 rounded-lg mt-2">
                            <span className="text-ink/60">Special requests:</span>{" "}
                            <span className="text-ink">{booking.special_requests}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment & Status Actions */}
                  <div className="mt-6 pt-4 border-t-2 border-ink/10">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Payment Status */}
                      <div className="flex-1">
                        <h4 className="font-display text-ink mb-2">Payment</h4>
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-4 h-4 text-ink/40" />
                          <span className="font-body text-ink">
                            {booking.payment_status === "verified"
                              ? "✅ Payment Verified"
                              : booking.payment_status === "received"
                              ? "📥 Payment Received"
                              : "⏳ Payment Pending"}
                          </span>
                        </div>
                        {booking.payment_status !== "verified" && (
                          <div className="flex gap-2 mt-2">
                            {booking.payment_status === "pending" && (
                              <button
                                onClick={() => updatePaymentStatus(booking.id, "received")}
                                disabled={updatingStatus === booking.id}
                                className="px-3 py-1 bg-sunshine border-2 border-ink rounded-lg text-sm font-body hover:bg-sunshine/80 transition-colors disabled:opacity-50"
                              >
                                Mark as Received
                              </button>
                            )}
                            <button
                              onClick={() => updatePaymentStatus(booking.id, "verified")}
                              disabled={updatingStatus === booking.id}
                              className="px-3 py-1 bg-whatsapp text-white border-2 border-ink rounded-lg text-sm font-body hover:opacity-90 transition-colors disabled:opacity-50"
                            >
                              Verify & Confirm
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Status Actions */}
                      <div className="flex-1">
                        <h4 className="font-display text-ink mb-2">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          {booking.status !== "confirmed" && booking.status !== "completed" && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, "confirmed")}
                              disabled={updatingStatus === booking.id}
                              className="flex items-center gap-1 px-3 py-1 bg-whatsapp/20 text-whatsapp border-2 border-whatsapp rounded-lg text-sm font-body hover:bg-whatsapp/30 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3 h-3" /> Confirm
                            </button>
                          )}
                          {booking.status === "confirmed" && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, "in_progress")}
                              disabled={updatingStatus === booking.id}
                              className="flex items-center gap-1 px-3 py-1 bg-teal/20 text-teal border-2 border-teal rounded-lg text-sm font-body hover:bg-teal/30 transition-colors disabled:opacity-50"
                            >
                              🚗 Start Trip
                            </button>
                          )}
                          {booking.status === "in_progress" && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, "completed")}
                              disabled={updatingStatus === booking.id}
                              className="flex items-center gap-1 px-3 py-1 bg-teal/20 text-teal border-2 border-teal rounded-lg text-sm font-body hover:bg-teal/30 transition-colors disabled:opacity-50"
                            >
                              ✅ Complete Trip
                            </button>
                          )}
                          {booking.status !== "cancelled" && booking.status !== "completed" && (
                            <button
                              onClick={() => {
                                if (confirm("Are you sure you want to cancel this booking?")) {
                                  updateBookingStatus(booking.id, "cancelled");
                                }
                              }}
                              disabled={updatingStatus === booking.id}
                              className="flex items-center gap-1 px-3 py-1 bg-coral/20 text-coral border-2 border-coral rounded-lg text-sm font-body hover:bg-coral/30 transition-colors disabled:opacity-50"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Meta */}
                  <div className="mt-4 pt-4 border-t-2 border-ink/10 flex flex-wrap gap-4 text-xs font-body text-ink/40">
                    <span>ID: {booking.id.slice(0, 8)}...</span>
                    <span>Source: {booking.booking_source}</span>
                    <span>Created: {new Date(booking.created_at).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-teal to-lake rounded-2xl border-3 border-ink p-4 text-white shadow-retro">
        <div className="flex flex-wrap gap-6 justify-center text-center">
          <div>
            <div className="text-3xl font-display">{bookings.length}</div>
            <div className="text-sm font-body opacity-80">Total Bookings</div>
          </div>
          <div>
            <div className="text-3xl font-display">
              {bookings.filter((b) => b.status === "pending" || b.status === "payment_pending").length}
            </div>
            <div className="text-sm font-body opacity-80">Pending</div>
          </div>
          <div>
            <div className="text-3xl font-display">
              {bookings.filter((b) => b.status === "confirmed").length}
            </div>
            <div className="text-sm font-body opacity-80">Confirmed</div>
          </div>
          <div>
            <div className="text-3xl font-display">
              {formatPrice(
                bookings
                  .filter((b) => b.status === "confirmed" || b.status === "completed")
                  .reduce((sum, b) => sum + b.final_price, 0)
              )}
            </div>
            <div className="text-sm font-body opacity-80">Revenue</div>
          </div>
        </div>
      </div>
    </div>
  );
}
