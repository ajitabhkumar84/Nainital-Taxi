import Link from "next/link";
import { Button } from "@/components/ui";
import { getRoutesForDestinationSlug } from "@/lib/supabase/queries_enhanced";
import { VEHICLE_ORDER, getVehicleTypeName } from "@/lib/pricing";
import { buildBookingUrl } from "@/lib/bookingLink";
import type { VehicleType } from "@/store/bookingStore";
import type { Route, RoutePricing } from "@/lib/supabase/types";

type RouteWithPricing = Route & { pricing: RoutePricing[] };

function lowestPrice(route: RouteWithPricing, vehicle: VehicleType): number | null {
  const prices = route.pricing
    .filter((p) => p.vehicle_type === vehicle)
    .map((p) => p.price);
  return prices.length > 0 ? Math.min(...prices) : null;
}

/**
 * "Taxi Fares to [Destination]" — server component, self-contained data
 * fetch, dropped directly into /destinations/[slug]/page.tsx.
 *
 * Independent of the page's existing "Transparent Pricing" section
 * (PricingGridForDestination), which only renders when a transferPackage is
 * linked to the destination. This reads routes/route_pricing directly (the
 * same tables /rates uses), so any destination with linked routes shows real
 * fares even when no transfer package has been configured.
 */
export default async function DestinationPricingTable({
  destinationSlug,
  destinationName,
}: {
  destinationSlug: string;
  destinationName: string;
}) {
  const allRoutes = await getRoutesForDestinationSlug(destinationSlug);
  // Drop routes with no active pricing configured yet — a row that's
  // entirely "—" isn't useful to a customer, and likely means the admin
  // hasn't finished pricing that route.
  const routes = allRoutes.filter((route) => route.pricing.length > 0);
  if (routes.length === 0) return null;

  return (
    <section className="bg-white py-12 md:py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-display text-ink text-center mb-8">
          Taxi Fares to {destinationName}
        </h2>
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b-2 border-ink/10">
                <th className="text-left py-3 px-4 font-body text-sm text-ink/60">
                  Route
                </th>
                {VEHICLE_ORDER.map((vehicle) => (
                  <th
                    key={vehicle}
                    className="text-left py-3 px-4 font-body text-sm text-ink/60 whitespace-nowrap"
                  >
                    {getVehicleTypeName(vehicle)}
                  </th>
                ))}
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id} className="border-b border-ink/5">
                  <td className="py-4 px-4 font-body font-semibold text-ink whitespace-nowrap">
                    {route.pickup_location} → {route.drop_location}
                  </td>
                  {VEHICLE_ORDER.map((vehicle) => {
                    const price = lowestPrice(route, vehicle);
                    return (
                      <td
                        key={vehicle}
                        className="py-4 px-4 font-body text-ink/80 whitespace-nowrap"
                      >
                        {price != null ? `Starting ₹${price.toLocaleString("en-IN")}` : "—"}
                      </td>
                    );
                  })}
                  <td className="py-4 px-4">
                    <Button asChild size="sm" className="min-h-[44px] whitespace-nowrap">
                      <Link
                        href={buildBookingUrl({
                          routeId: route.id,
                          packageType: "transfer",
                          packageTitle: `${route.pickup_location} to ${route.drop_location}`,
                          pickup: route.pickup_location,
                          dropoff: route.drop_location,
                        })}
                      >
                        Book Now
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
