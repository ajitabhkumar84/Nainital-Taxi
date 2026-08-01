export const PICKUP_LOCATIONS = ["Delhi", "Kathgodam Station", "Nainital"] as const;
export type PickupLocation = (typeof PICKUP_LOCATIONS)[number];

// Raw pickup_location / drop_location strings already present in the routes
// table that should be treated as the same physical origin as the canonical
// option. "Kathgodam" and "Kathgodam Railway Station" are legacy variants of
// the same hub (see admin RouteForm, previously freeform text).
export const PICKUP_LOCATION_ALIASES: Record<PickupLocation, string[]> = {
  Delhi: ["Delhi"],
  "Kathgodam Station": ["Kathgodam", "Kathgodam Railway Station", "Kathgodam Station"],
  Nainital: ["Nainital"],
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function resolvePickupAliases(location: string): string[] {
  if (location in PICKUP_LOCATION_ALIASES) {
    return PICKUP_LOCATION_ALIASES[location as PickupLocation];
  }
  return [location];
}

// Case/whitespace-insensitive so admin free-text typos ("kathgodam railway station")
// still normalize correctly.
export function toCanonicalPickupLocation(raw: string): string {
  const target = normalize(raw);
  const entry = (Object.entries(PICKUP_LOCATION_ALIASES) as [PickupLocation, string[]][]).find(
    ([, aliases]) => aliases.some((alias) => normalize(alias) === target)
  );
  return entry ? entry[0] : raw;
}
