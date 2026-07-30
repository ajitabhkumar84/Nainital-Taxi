import Link from "next/link";
import {
  Calendar,
  BookOpen,
  Car,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

interface RecentBooking {
  id: string;
  customer_name: string;
  package_name: string;
  booking_date: string;
  status: string;
  final_price: number;
  created_at: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-whatsapp/20 text-whatsapp";
    case "pending":
    case "payment_pending":
      return "bg-sunshine/30 text-ink";
    case "completed":
      return "bg-teal/20 text-teal";
    case "cancelled":
      return "bg-coral/20 text-coral";
    default:
      return "bg-ink/10 text-ink";
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export default async function AdminDashboard() {
  // Defense in depth: middleware lets unauthenticated requests through to the
  // exact "/admin" path so the client-side password gate in layout.tsx can
  // render, so this Server Component must never fetch/render real data for
  // an unauthenticated request itself, or that data leaks in the RSC payload
  // regardless of what the client chooses to display.
  const authenticated = await verifyAdminSession();
  if (!authenticated) {
    return null;
  }

  const supabase = getAdminSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, status, booking_date, customer_name, package_name, final_price, created_at")
    .order("created_at", { ascending: false });

  if (bookingsError) {
    console.error("Error fetching dashboard bookings:", bookingsError);
  }

  const allBookings = (bookings as RecentBooking[]) || [];

  const { count: vehicleCount } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { data: availabilityRow } = (await supabase
    .from("availability")
    .select("cars_available")
    .eq("date", today)
    .single()) as { data: { cars_available: number } | null };

  const pendingCount = allBookings.filter((b) => b.status === "pending" || b.status === "payment_pending").length;
  const confirmedCount = allBookings.filter((b) => b.status === "confirmed").length;
  const todayCount = allBookings.filter((b) => b.booking_date === today).length;
  const upcomingCount = allBookings.filter((b) => b.booking_date > today && b.status === "confirmed").length;
  const availableCarsToday = availabilityRow?.cars_available ?? 10;
  const recentBookings = allBookings.slice(0, 5);

  const statCards = [
    {
      label: "Total Bookings",
      value: allBookings.length,
      icon: <BookOpen className="w-6 h-6" />,
      color: "bg-teal",
      href: "/admin/bookings",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: <Clock className="w-6 h-6" />,
      color: "bg-sunshine",
      href: "/admin/bookings?status=pending",
    },
    {
      label: "Confirmed",
      value: confirmedCount,
      icon: <CheckCircle className="w-6 h-6" />,
      color: "bg-whatsapp",
      href: "/admin/bookings?status=confirmed",
    },
    {
      label: "Today",
      value: todayCount,
      icon: <Calendar className="w-6 h-6" />,
      color: "bg-coral",
      href: "/admin/bookings?date=today",
    },
    {
      label: "Upcoming",
      value: upcomingCount,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-teal",
      href: "/admin/bookings?status=upcoming",
    },
    {
      label: "Cars Available Today",
      value: availableCarsToday,
      icon: <Car className="w-6 h-6" />,
      color: "bg-sunshine",
      href: "/admin/availability",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink">Dashboard</h1>
          <p className="text-ink/60 font-body mt-1">
            Welcome back! Here&apos;s your business overview.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/availability"
            className="px-4 py-2 bg-sunshine border-3 border-ink rounded-xl font-body font-semibold shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Manage Availability
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-white mb-3",
                stat.color
              )}
            >
              {stat.icon}
            </div>
            <div className="text-2xl font-display text-ink">{stat.value}</div>
            <div className="text-sm font-body text-ink/60">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions & Recent Bookings */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
          <h2 className="text-xl font-display text-ink mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/admin/availability"
              className="flex items-center justify-between p-4 bg-sunrise/50 rounded-xl hover:bg-sunrise transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-ink" />
                <span className="font-body font-semibold text-ink">
                  Update Availability
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-ink group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin/bookings"
              className="flex items-center justify-between p-4 bg-lake/30 rounded-xl hover:bg-lake/50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <BookOpen className="w-5 h-5 text-ink" />
                <span className="font-body font-semibold text-ink">
                  View All Bookings
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-ink group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin/pricing"
              className="flex items-center justify-between p-4 bg-sunshine/30 rounded-xl hover:bg-sunshine/50 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-ink" />
                <span className="font-body font-semibold text-ink">
                  Update Prices
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-ink group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/admin/settings"
              className="flex items-center justify-between p-4 bg-coral/20 rounded-xl hover:bg-coral/30 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-ink" />
                <span className="font-body font-semibold text-ink">
                  Business Settings
                </span>
              </div>
              <ArrowRight className="w-5 h-5 text-ink group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display text-ink">Recent Bookings</h2>
            <Link
              href="/admin/bookings"
              className="text-teal font-body text-sm hover:underline"
            >
              View all →
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-8 text-ink/60 font-body">
              No bookings yet. They will appear here once customers start booking.
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="block p-4 bg-sunrise/30 rounded-xl hover:bg-sunrise/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-body font-semibold text-ink">
                        {booking.customer_name}
                      </div>
                      <div className="text-sm text-ink/60">
                        {booking.package_name}
                      </div>
                      <div className="text-sm text-ink/60">
                        {formatDate(booking.booking_date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-ink">
                        {formatPrice(booking.final_price)}
                      </div>
                      <span
                        className={cn(
                          "inline-block px-2 py-1 rounded-lg text-xs font-body font-semibold mt-1",
                          getStatusColor(booking.status)
                        )}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Today's Summary */}
      <div className="bg-gradient-to-r from-sunshine to-coral rounded-2xl border-3 border-ink p-6 shadow-retro">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display text-ink">
              Today: {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            <p className="text-ink/80 font-body mt-1">
              {todayCount} booking{todayCount !== 1 ? "s" : ""} scheduled
              {" • "}
              {availableCarsToday} car{availableCarsToday !== 1 ? "s" : ""} available
            </p>
          </div>
          <Link
            href="/admin/availability"
            className="px-6 py-3 bg-white border-3 border-ink rounded-xl font-display shadow-retro-sm hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            View Calendar
          </Link>
        </div>
      </div>
    </div>
  );
}
