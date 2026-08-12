import type { PickupLocationRow } from "@/lib/supabase/types";

// Pure, dependency-free matching helpers. No fetching lives here — callers
// pass whichever `locations` list they currently have:
//   - BookingWidget (public, homepage/lp-taxi): a server-fetched prop, so
//     the correct list is present on first render (see getPickupLocations()
//     in src/lib/supabase/queries_enhanced.ts). No fallback constant needed
//     here — the server always supplies the accurate list.
//   - RouteForm (admin, client-fetched): local state that starts as [] and
//     fills in after /api/admin/pickup-locations resolves, same pattern
//     already used there for categories/destinations.

function normalize(value?: string | null): string {
  // Defensive: callers may pass an in-progress form value or an incomplete
  // row where this is null/undefined — `.trim()` on that would throw and
  // crash the widget, not just fail to match.
  if (!value) return "";
  return value.trim().toLowerCase();
}

function findMatch(locations: PickupLocationRow[], target: string): PickupLocationRow | undefined {
  const normalizedTarget = normalize(target);
  return locations.find(
    (loc) =>
      normalize(loc.name) === normalizedTarget ||
      // Defensive: treat aliases as possibly null/undefined even though the
      // column is NOT NULL DEFAULT '{}' — a hand-edited row (e.g. via the
      // Supabase table editor) could still violate that, and this must
      // never throw for a public-facing dropdown.
      (loc.aliases || []).some((a) => normalize(a) === normalizedTarget)
  );
}

// Case/whitespace-insensitive so admin free-text typos ("kathgodam railway station")
// still normalize correctly.
export function resolvePickupAliases(locations: PickupLocationRow[], location: string): string[] {
  const match = findMatch(locations, location);
  return match ? [match.name, ...match.aliases] : [location];
}

export function toCanonicalPickupLocation(locations: PickupLocationRow[], raw: string): string {
  const match = findMatch(locations, raw);
  return match ? match.name : raw;
}
