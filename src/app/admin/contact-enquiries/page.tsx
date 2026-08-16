import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth/adminAuth";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { ContactEnquiry } from "@/lib/supabase/types";
import ContactEnquiriesListClient from "./ContactEnquiriesListClient";

// Server component pages are statically cached by default; without this, a
// new lead saved seconds ago could still show a stale fetch on refresh.
export const dynamic = "force-dynamic";

export default async function ContactEnquiriesPage() {
  // Middleware already redirects unauthenticated requests away from this
  // path, but the check is cheap and keeps this page correct on its own.
  const authenticated = await verifyAdminSession();
  if (!authenticated) {
    redirect("/admin");
  }

  const supabase = getAdminSupabaseClient();
  const { data, error } = await supabase
    .from("contact_enquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Error fetching contact enquiries:", error);
  }

  return <ContactEnquiriesListClient initialEnquiries={(data as ContactEnquiry[]) || []} />;
}
