import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { Booking } from "@/lib/supabase/types";
import BookingsListClient from "./BookingsListClient";

export default async function BookingsPage() {
  // Middleware already redirects unauthenticated requests away from this
  // path, but the check is cheap and keeps this page correct on its own.
  const authenticated = await verifyAdminSession();
  if (!authenticated) {
    redirect("/admin");
  }

  const supabase = getAdminSupabaseClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bookings:", error);
  }

  return <BookingsListClient initialBookings={(data as Booking[]) || []} />;
}
