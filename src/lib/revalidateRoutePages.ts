import { revalidatePath } from "next/cache";

/**
 * Route changes affect the /rates browser and the homepage's "Fixed-fare
 * transfers" table — both read routes server-side via getRoutesWithCategories()
 * / getTransferRoutes(), so revalidating their own paths is enough for them.
 *
 * /api/routes-with-categories is a *separate* cache entry (it has no dynamic
 * function, so Next prerenders it as a static Route Handler — confirmed by
 * "○ /api/routes-with-categories" in the build output) consumed by /quote's
 * client-side fetch. revalidatePath('/rates') does not touch it, so without
 * revalidating it explicitly here, /quote would keep serving routes as they
 * were at the last build/revalidation indefinitely.
 *
 * /booking is server-rendered too: its page component fetches routes + pickup
 * locations and passes them to Step 1's transfer picker as props (that is what
 * keeps the A-to-B dropdowns flicker-free on first paint). It currently builds
 * as a dynamic route and its two queries invalidate themselves —
 * getRoutesWithCategories() is a per-request React cache(), and
 * getPickupLocations() is tag-busted by /api/admin/pickup-locations — so this
 * line is belt-and-braces rather than load-bearing today. It's kept so the page
 * can't go stale if it ever becomes statically renderable or picks up a cached
 * fetch, which would otherwise be an invisible regression.
 *
 * Wrapped in try/catch so a revalidation failure never masks a successful DB
 * write (same pattern as /api/admin/pricing).
 *
 * Shared by every admin endpoint that mutates routes *or* route categories —
 * getRoutesWithCategories() joins the two, so a category rename or reorder
 * goes stale on exactly the same set of pages a route change does.
 *
 * A route can also be linked to a /destinations/[slug] page via
 * destination_slug and rendered there by DestinationPricingTable
 * (getRoutesForDestinationSlug()) — revalidating the dynamic segment pattern
 * busts every destination page's Full Route Cache entry, not just one slug.
 */
export function revalidateRoutePages() {
  try {
    revalidatePath("/rates", "page");
    revalidatePath("/", "page");
    revalidatePath("/api/routes-with-categories");
    revalidatePath("/quote", "page");
    revalidatePath("/booking", "page");
    revalidatePath("/destinations/[slug]", "page");
  } catch (error) {
    console.error("Revalidation failed (DB write succeeded):", error);
  }
}
