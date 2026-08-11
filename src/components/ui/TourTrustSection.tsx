import { Shield, UserCheck, Heart, Award, Car, Phone, Star, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TourTrustSection as TourTrustSectionData } from "@/lib/supabase/types";

// Icon and accent color are both keyed by icon_name so reordering/adding/removing
// pillars in the admin never shifts a card's color out of sync with its icon.
const TRUST_PILLAR_ICONS: Record<string, LucideIcon> = {
  shield: Shield,
  "user-check": UserCheck,
  heart: Heart,
  award: Award,
  car: Car,
  phone: Phone,
  star: Star,
  "map-pin": MapPin,
};

const TRUST_PILLAR_COLORS: Record<string, string> = {
  shield: "text-teal",
  "user-check": "text-coral",
  heart: "text-whatsapp",
  award: "text-sunshine",
  car: "text-teal",
  phone: "text-coral",
  star: "text-sunshine",
  "map-pin": "text-whatsapp",
};

interface TourTrustSectionProps {
  /** Result of getTourTrustSection() — the admin-managed singleton row. */
  data: TourTrustSectionData;
  /**
   * Replaces the admin-set heading. Destination pages use this to say
   * "Why Book Bhimtal Taxi With Us?" while still rendering the shared pillars.
   */
  headingOverride?: string;
  /** Overrides the section background (defaults to the tour page's gradient). */
  className?: string;
}

/**
 * Admin-controlled "why trust us" pillar row, editable at
 * /admin/tour-trust-section. Shared by the tour detail and destination detail
 * pages so the copy only has to be maintained in one place.
 *
 * Renders nothing when unpublished or when no pillar is active, so callers can
 * drop it in unconditionally.
 */
export default function TourTrustSection({
  data,
  headingOverride,
  className = "py-12 md:py-16 bg-gradient-to-b from-lake/10 to-white",
}: TourTrustSectionProps) {
  const trustPillars = (data.trust_pillars || [])
    .filter((p) => p.is_active)
    .sort((a, b) => a.display_order - b.display_order);

  if (!data.is_published || trustPillars.length === 0) return null;

  return (
    <section className={className}>
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-3xl font-display text-ink text-center mb-3">
          {headingOverride || data.heading}
        </h2>
        <p className="text-ink/60 font-body text-center mb-8 max-w-xl mx-auto">
          {data.description}
        </p>
        <div className="grid md:grid-cols-4 gap-6">
          {trustPillars.map((pillar) => {
            const Icon = TRUST_PILLAR_ICONS[pillar.icon_name] || Shield;
            const colorClass = TRUST_PILLAR_COLORS[pillar.icon_name] || "text-teal";
            return (
              <div
                key={pillar.title}
                className="text-center p-6 bg-white rounded-2xl border-3 border-ink shadow-retro-sm"
              >
                <Icon className={`w-12 h-12 ${colorClass} mx-auto mb-4`} />
                <h3 className="font-display text-lg text-ink mb-2">{pillar.title}</h3>
                <p className="text-ink/60 font-body text-sm">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
