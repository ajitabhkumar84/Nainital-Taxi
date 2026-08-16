"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  Car,
  MessageCircle,
  Trash2,
  Smartphone,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ContactEnquiry } from "@/lib/supabase/types";

export default function ContactEnquiriesListClient({
  initialEnquiries,
}: {
  initialEnquiries: ContactEnquiry[];
}) {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<ContactEnquiry[]>(initialEnquiries);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteEnquiry = async (id: string) => {
    if (!confirm("Delete this enquiry? This cannot be undone.")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/contact-enquiries/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete enquiry");
      }

      setEnquiries((prev) => prev.filter((e) => e.id !== id));
      // The page component that fetched `initialEnquiries` is a Server
      // Component; without this, navigating away and back ("Back" button)
      // can briefly re-render the stale pre-delete list from the router
      // cache before this client state took over.
      router.refresh();
    } catch (error) {
      console.error("Error deleting enquiry:", error);
      alert("Failed to delete enquiry. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredEnquiries = enquiries.filter((enquiry) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      enquiry.name.toLowerCase().includes(query) ||
      enquiry.phone.includes(query) ||
      (enquiry.email && enquiry.email.toLowerCase().includes(query))
    );
  });

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const generateWhatsAppLink = (enquiry: ContactEnquiry) => {
    const phone = enquiry.phone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("91") ? phone : `91${phone}`;
    return `https://wa.me/${fullPhone}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink">Contact Enquiries</h1>
          <p className="text-ink/60 font-body mt-1">
            Leads captured from the /contact page and the mobile quick-enquiry form
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border-3 border-ink p-4 shadow-retro">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
          />
        </div>
      </div>

      {/* Enquiries List */}
      <div className="space-y-4">
        {filteredEnquiries.length === 0 ? (
          <div className="bg-white rounded-2xl border-3 border-ink p-8 text-center shadow-retro">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-xl font-display text-ink mb-2">No enquiries found</h3>
            <p className="text-ink/60 font-body">
              {searchQuery
                ? "Try adjusting your search"
                : "Enquiries will appear here as visitors submit the contact form"}
            </p>
          </div>
        ) : (
          filteredEnquiries.map((enquiry) => (
            <div
              key={enquiry.id}
              className="bg-white rounded-2xl border-3 border-ink shadow-retro overflow-hidden p-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-sunshine flex items-center justify-center text-2xl shrink-0">
                    ✉️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display text-lg text-ink">{enquiry.name}</h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-body font-semibold rounded-md border-2",
                          enquiry.source === "mobile_quick_enquiry"
                            ? "bg-teal/20 text-teal border-teal"
                            : "bg-lake/20 text-lake border-lake"
                        )}
                      >
                        {enquiry.source === "mobile_quick_enquiry" ? (
                          <Smartphone className="w-3 h-3" />
                        ) : (
                          <Globe className="w-3 h-3" />
                        )}
                        {enquiry.source === "mobile_quick_enquiry" ? "Mobile Enquiry" : "Contact Page"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-body text-ink/70 mb-2">
                      <a href={`tel:+91${enquiry.phone}`} className="flex items-center gap-1 hover:text-teal">
                        <Phone className="w-3.5 h-3.5" /> {enquiry.phone}
                      </a>
                      {enquiry.email && (
                        <a href={`mailto:${enquiry.email}`} className="flex items-center gap-1 hover:text-teal">
                          <Mail className="w-3.5 h-3.5" /> {enquiry.email}
                        </a>
                      )}
                      <span className="flex items-center gap-1 text-ink/40">
                        <Calendar className="w-3.5 h-3.5" /> {formatDateTime(enquiry.created_at)}
                      </span>
                    </div>

                    {enquiry.message && (
                      <p className="text-sm font-body text-ink bg-sunrise/10 rounded-lg p-2 mb-2">
                        {enquiry.message}
                      </p>
                    )}

                    {(enquiry.pickup || enquiry.drop_location || enquiry.travel_date || enquiry.vehicle) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-body text-ink/60">
                        {enquiry.pickup && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-ink/40" /> {enquiry.pickup}
                            {enquiry.drop_location && ` → ${enquiry.drop_location}`}
                          </span>
                        )}
                        {enquiry.travel_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-ink/40" /> {enquiry.travel_date}
                            {enquiry.travel_time && ` at ${enquiry.travel_time}`}
                          </span>
                        )}
                        {enquiry.passengers && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-ink/40" /> {enquiry.passengers}
                          </span>
                        )}
                        {enquiry.vehicle && (
                          <span className="flex items-center gap-1">
                            <Car className="w-3.5 h-3.5 text-ink/40" /> {enquiry.vehicle}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={generateWhatsAppLink(enquiry)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 bg-whatsapp text-white rounded-xl font-body text-sm hover:opacity-90 transition-opacity"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => deleteEnquiry(enquiry.id)}
                    disabled={deletingId === enquiry.id}
                    title="Delete enquiry"
                    className="flex items-center gap-1 px-3 py-2 bg-coral/10 text-coral border-2 border-coral rounded-xl font-body text-sm hover:bg-coral/20 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-teal to-lake rounded-2xl border-3 border-ink p-4 text-white shadow-retro">
        <div className="flex flex-wrap gap-6 justify-center text-center">
          <div>
            <div className="text-3xl font-display">{enquiries.length}</div>
            <div className="text-sm font-body opacity-80">Total Enquiries</div>
          </div>
          <div>
            <div className="text-3xl font-display">
              {enquiries.filter((e) => e.source === "contact_page").length}
            </div>
            <div className="text-sm font-body opacity-80">Contact Page</div>
          </div>
          <div>
            <div className="text-3xl font-display">
              {enquiries.filter((e) => e.source === "mobile_quick_enquiry").length}
            </div>
            <div className="text-sm font-body opacity-80">Mobile Enquiry</div>
          </div>
        </div>
      </div>
    </div>
  );
}
