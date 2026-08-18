import { revalidatePath } from "next/cache";
import { revalidateContent } from "@/lib/revalidateContent";
import { CACHE_TAGS } from "@/lib/cacheTags";

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
 *
 * A route with show_as_route_page=true also has its own /routes/[slug] SEO
 * landing page (getRouteBySlug()) — same dynamic-segment revalidation as
 * destinations, for the same reason.
 */
export function revalidateRoutePages() {
  try {
    revalidatePath("/rates", "page");
    revalidatePath("/", "page");
    revalidatePath("/api/routes-with-categories");
    revalidatePath("/quote", "page");
    revalidatePath("/booking", "page");
    revalidatePath("/destinations/[slug]", "page");
    revalidatePath("/routes/[slug]", "page");
  } catch (error) {
    console.error("Revalidation failed (DB write succeeded):", error);
  }

  // The paths above are now only half the job. getRoutesWithCategories(),
  // getTransferRoutes() and getRoutesForDestinationSlug() are all cached
  // across requests, so revalidating the routes without busting these tags
  // would re-render every page listed above against the pre-edit route set —
  // the exact "I saved it and nothing changed" symptom.
  //
  // routeCategories is included because getRoutesWithCategories() joins the
  // two tables into one cache entry, so a category rename invalidates the same
  // entry a route edit does.
  revalidateContent(CACHE_TAGS.routes, CACHE_TAGS.routeCategories, CACHE_TAGS.pricing);
}
