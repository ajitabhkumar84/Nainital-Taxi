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
 * Wrapped in try/catch so a revalidation failure never masks a successful DB
 * write (same pattern as /api/admin/pricing).
 *
 * Shared by every admin endpoint that mutates routes *or* route categories —
 * getRoutesWithCategories() joins the two, so a category rename or reorder
 * goes stale on exactly the same set of pages a route change does.
 */
export function revalidateRoutePages() {
  try {
    revalidatePath("/rates", "page");
    revalidatePath("/", "page");
    revalidatePath("/api/routes-with-categories");
    revalidatePath("/quote", "page");
  } catch (error) {
    console.error("Revalidation failed (DB write succeeded):", error);
  }
}
