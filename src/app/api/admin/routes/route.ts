import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { revalidateRoutePages } from "@/lib/revalidateRoutePages";
import {
  buildReverseRouteInsert,
  buildReverseMirrorPatch,
  generateRouteSlug,
  pricingDiffers,
} from "@/lib/routeReverse";

const PARTNER_COLUMNS = "id, slug, pickup_location, drop_location";

// Strips the columns the DB owns so a pricing row can be re-inserted against a
// different route_id. Mirrors the inline logic the POST/PATCH pricing writes
// have always used.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPricingInsert(rows: any[], routeId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((p: any) => {
    const { id: _id, created_at, updated_at, route_id: _routeId, ...fields } = p;
    return { ...fields, route_id: routeId };
  });
}

async function replacePricing(
  supabase: SupabaseClient,
  routeId: string,
  pricing: unknown[]
) {
  const { error: deleteError } = await supabase
    .from("route_pricing")
    .delete()
    .eq("route_id", routeId);
  if (deleteError) throw deleteError;

  if (pricing.length > 0) {
    const { error } = await supabase
      .from("route_pricing")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(toPricingInsert(pricing as any[], routeId));
    if (error) throw error;
  }
}

/**
 * Finds the row that should act as `primary`'s return route, in priority
 * order:
 *   1. an already-linked reverse (the normal case on re-save),
 *   2. a route whose pickup/drop is exactly the swapped pair,
 *   3. a route already sitting on the slug we'd generate.
 *
 * (2) and (3) let the toggle be switched on for a pair whose return route the
 * admin built by hand: we adopt and link that row instead of failing on the
 * `slug UNIQUE` constraint or creating a near-duplicate.
 */
async function findExistingReverse(
  supabase: SupabaseClient,
  primary: {
    id: string;
    pickup_location: string;
    drop_location: string;
  }
) {
  const { data: linked, error: linkedError } = await supabase
    .from("routes")
    .select("*")
    .eq("reverse_of_route_id", primary.id)
    .maybeSingle();
  // A failed lookup must not be mistaken for "no existing reverse" — that
  // would fall through to inserting a brand-new reverse route, duplicating
  // one that may already exist.
  if (linkedError) throw linkedError;
  if (linked) return linked;

  // limit(1) rather than maybeSingle(): nothing stops an admin having created
  // two routes for the same pair by hand, and maybeSingle() errors outright on
  // more than one row. Adopting the first is better than failing the save.
  const { data: byPair, error: byPairError } = await supabase
    .from("routes")
    .select("*")
    .eq("pickup_location", primary.drop_location)
    .eq("drop_location", primary.pickup_location)
    .neq("id", primary.id)
    .limit(1);
  if (byPairError) throw byPairError;
  if (byPair && byPair.length > 0) return byPair[0];

  const { data: bySlug, error: bySlugError } = await supabase
    .from("routes")
    .select("*")
    .eq("slug", generateRouteSlug(primary.drop_location, primary.pickup_location))
    .neq("id", primary.id)
    .limit(1);
  if (bySlugError) throw bySlugError;
  return bySlug && bySlug.length > 0 ? bySlug[0] : null;
}

/**
 * Signals that the caller must confirm before an existing reverse route's
 * hand-edited prices get overwritten. Carried out of syncReverseRoute() as a
 * value rather than thrown, so the primary's own (already committed) write is
 * never mistaken for a failure.
 */
interface ReverseConfirmationRequired {
  requiresReverseConfirmation: true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reverse: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentPricing: any[];
}

interface ReverseSyncResult {
  confirmation?: ReverseConfirmationRequired;
  warning?: string;
}

/**
 * Creates or re-syncs `primary`'s return route.
 *
 * The asymmetry here is the whole point: a NEW reverse gets a full generated
 * payload (swapped pair, generated slug, city names swapped through its
 * description/meta copy), while an EXISTING one only receives the swapped
 * pickup/drop pair, is_active / enable_online_booking, and a fresh copy of the
 * pricing matrix. Anything editorial the admin has since written on the
 * reverse route — its slug, description and meta_* copy — survives.
 *
 * pickup/drop are mirrored (unlike the editorial fields) because they're the
 * route's structural identity, not copy: if the primary's endpoints are edited
 * and the reverse kept its old ones, the link would assert a relationship that
 * is no longer true, and the pair would resolve to two unrelated routes.
 */
async function syncReverseRoute(
  supabase: SupabaseClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  primary: any,
  pricing: unknown[] | null | undefined,
  { confirmOverwrite }: { confirmOverwrite: boolean }
): Promise<ReverseSyncResult> {
  const existing = await findExistingReverse(supabase, primary);

  if (!existing) {
    const { data: created, error } = await supabase
      .from("routes")
      .insert([buildReverseRouteInsert(primary)])
      .select()
      .single();
    if (error) throw error;

    if (pricing && pricing.length > 0) {
      await replacePricing(supabase, (created as { id: string }).id, pricing);
    }
    return {};
  }

  // Existing reverse: warn before discarding prices that no longer match.
  // Uphill and downhill fares differ often enough in hill-station transport
  // that silently overwriting would be the wrong default.
  if (pricing) {
    const { data: currentPricing, error: currentPricingError } = await supabase
      .from("route_pricing")
      .select("*")
      .eq("route_id", existing.id);
    // A failed fetch must not read as "no existing pricing" — that would
    // silently skip the overwrite-confirmation gate this block exists for.
    if (currentPricingError) throw currentPricingError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!confirmOverwrite && pricingDiffers(currentPricing as any[], pricing as any[])) {
      return {
        confirmation: {
          requiresReverseConfirmation: true,
          reverse: {
            id: existing.id,
            slug: existing.slug,
            pickup_location: existing.pickup_location,
            drop_location: existing.drop_location,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          currentPricing: (currentPricing as any[]) || [],
        },
      };
    }
  }

  const nextPickup = primary.drop_location;
  const nextDrop = primary.pickup_location;

  // The endpoints moved, so the reverse's hand-editable slug/meta may now
  // describe the wrong journey. We don't rewrite them (that's the admin's
  // copy), but we do say so rather than leave it to be discovered later.
  let warning: string | undefined;
  if (
    existing.pickup_location !== nextPickup ||
    existing.drop_location !== nextDrop
  ) {
    warning =
      `The return route now runs ${nextPickup} → ${nextDrop}. Its URL (/${existing.slug}) ` +
      `and SEO fields were left as they were — review them if they mention the old locations.`;
  }

  const { error: updateError } = await supabase
    .from("routes")
    .update({
      ...buildReverseMirrorPatch(primary),
      pickup_location: nextPickup,
      drop_location: nextDrop,
      reverse_of_route_id: primary.id,
    })
    .eq("id", existing.id);
  if (updateError) throw updateError;

  if (pricing) {
    await replacePricing(supabase, existing.id, pricing);
  }
  return { warning };
}

/**
 * GET /api/admin/routes
 * Fetch all routes (admin only)
 * Query params:
 *   - id: Get specific route by ID
 *   - withPricing: Include pricing data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const withPricing = searchParams.get("withPricing") === "true";

    if (id) {
      // Fetch single route
      const { data: route, error } = await supabase
        .from("routes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Resolve the route's partner in BOTH directions, so the edit form can
      // always name it and link to it:
      //   - linkedReverse: this route is a primary, and X is the return route
      //     it generated.
      //   - reverseParent: this route IS a generated return route, and X is
      //     the primary it came from. Without this lookup the "auto-generated
      //     as the return of X" notice has no X to render.
      // At most one is ever populated — the routes_reverse_not_self check and
      // the unique partial index rule out a row being both.
      // Non-fatal: these only drive an informational banner in the edit
      // form ("auto-generated as return of X" / "keeping X in sync"). Failing
      // the whole route fetch over a secondary lookup would make the route
      // un-editable exactly when something's wrong, so log and degrade
      // gracefully instead of throwing.
      const { data: linkedReverse, error: linkedReverseError } = await supabase
        .from("routes")
        .select(PARTNER_COLUMNS)
        .eq("reverse_of_route_id", id)
        .maybeSingle();
      if (linkedReverseError) {
        console.error("Error looking up linked reverse route:", linkedReverseError);
      }

      const parentId = (route as { reverse_of_route_id?: string | null })?.reverse_of_route_id;
      let reverseParent = null;
      if (parentId) {
        const { data, error: reverseParentError } = await supabase
          .from("routes")
          .select(PARTNER_COLUMNS)
          .eq("id", parentId)
          .maybeSingle();
        if (reverseParentError) {
          console.error("Error looking up reverse-route parent:", reverseParentError);
        }
        reverseParent = data || null;
      }

      if (withPricing) {
        const { data: pricing, error: pricingFetchError } = await supabase
          .from("route_pricing")
          .select("*")
          .eq("route_id", id);
        // Fatal, unlike the lookups above: a failed fetch would otherwise
        // render as "this route has no pricing" in the edit form — if
        // unnoticed and saved, that overwrites real prices with nothing.
        if (pricingFetchError) throw pricingFetchError;

        return NextResponse.json({
          success: true,
          data: {
            ...route,
            pricing: pricing || [],
            linkedReverse: linkedReverse || null,
            reverseParent,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: { ...route, linkedReverse: linkedReverse || null, reverseParent },
      });
    }

    // Fetch all routes. `withPricing` used to be honoured only on the
    // single-route branch above, so the admin list — which requests it — got
    // routes with no `pricing` key at all and flagged every route as having no
    // pricing configured. Embed the relation off the existing
    // route_pricing.route_id -> routes.id FK instead.
    //
    // Ordered by display_order to match the public read in
    // getRoutesWithCategories(), so the admin list shows routes in the same
    // order the site does (and the drag-to-reorder UI has a stable baseline).
    const { data: routes, error } = await supabase
      .from("routes")
      .select(
        withPricing
          ? "*, pricing:route_pricing(vehicle_type, season_name, price, is_active)"
          : "*"
      )
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: routes });
  } catch (error: any) {
    console.error("Error fetching routes:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch routes",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/routes
 * Create a new route
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminSupabaseClient();
    const body = await request.json();
    const { pricing, create_reverse: createReverse, ...routeData } = body;

    // Create route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .insert([routeData])
      .select()
      .single();

    if (routeError) throw routeError;

    // Create pricing if provided
    if (pricing && pricing.length > 0) {
      const pricingData = pricing.map((p: any) => {
        // Remove id, created_at, updated_at fields to let database generate new ones
        const { id: _id, created_at, updated_at, ...pricingFields } = p;
        return {
          ...pricingFields,
          route_id: route.id,
        };
      });

      const { error: pricingError } = await supabase
        .from("route_pricing")
        .insert(pricingData);

      if (pricingError) throw pricingError;
    }

    // Generate the return route. A failure here is reported as a warning
    // rather than an error: the primary route is already committed, and
    // surfacing this as a 500 would tell the admin their route wasn't saved
    // when it was — leading them to create it a second time.
    let warning: string | undefined;
    if (createReverse) {
      try {
        // confirmOverwrite stays false even on create. The normal path here
        // inserts a fresh return route, but findExistingReverse() may instead
        // adopt a matching route the admin built by hand — and silently
        // replacing that route's fares would be data loss with no undo. On
        // create there is no confirmation UI to fall back to (the route is
        // already committed), so we adopt it, leave its prices alone, and say so.
        const result = await syncReverseRoute(supabase, route, pricing, { confirmOverwrite: false });
        if (result.confirmation) {
          const { pickup_location, drop_location } = result.confirmation.reverse;
          warning =
            `Route created. A return route (${pickup_location} → ${drop_location}) already ` +
            `existed and is now linked, but it kept its own prices — open it to sync them.`;
        } else {
          warning = result.warning;
        }
      } catch (reverseError: any) {
        console.error("Error creating reverse route:", reverseError);
        warning =
          "Route saved, but the return route could not be created: " +
          (reverseError?.message || String(reverseError));
      }
    }

    revalidateRoutePages();

    return NextResponse.json({
      success: true,
      data: route,
      ...(warning ? { warning } : {}),
    });
  } catch (error: any) {
    console.error("Error creating route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create route",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/routes
 * Update a route
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getAdminSupabaseClient();
    const body = await request.json();
    const {
      id,
      updates,
      pricing,
      create_reverse: createReverse,
      confirm_overwrite_reverse: confirmOverwriteReverse,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Route ID is required" },
        { status: 400 }
      );
    }

    // A generated return route can't have a return route of its own — that
    // would be the primary, and the pair would sync in a loop.
    if (createReverse) {
      const { data: target, error: targetError } = await supabase
        .from("routes")
        .select("reverse_of_route_id")
        .eq("id", id)
        .maybeSingle();
      // A failed check must not be mistaken for "not a reverse route" — that
      // would silently bypass the guard below and could create a
      // reverse-of-reverse loop.
      if (targetError) throw targetError;

      if ((target as { reverse_of_route_id?: string | null })?.reverse_of_route_id) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This route is itself an auto-generated return route, so it can't generate one of its own.",
          },
          { status: 400 }
        );
      }
    }

    // Update route
    const { data: route, error: routeError } = await supabase
      .from("routes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (routeError) throw routeError;

    // Update pricing if provided
    if (pricing) {
      // Delete existing pricing. A failed delete must not be silently
      // ignored — stale prices could otherwise survive alongside (or
      // instead of) the new ones inserted below.
      const { error: deletePricingError } = await supabase
        .from("route_pricing")
        .delete()
        .eq("route_id", id);
      if (deletePricingError) throw deletePricingError;

      // Insert new pricing
      if (pricing.length > 0) {
        const pricingData = pricing.map((p: any) => {
          // Remove id, created_at, updated_at fields to let database generate new ones
          const { id: _id, created_at, updated_at, ...pricingFields } = p;
          return {
            ...pricingFields,
            route_id: id,
          };
        });

        const { error: pricingError } = await supabase
          .from("route_pricing")
          .insert(pricingData);

        if (pricingError) throw pricingError;
      }
    }

    let warning: string | undefined;

    if (createReverse) {
      const result = await syncReverseRoute(supabase, route, pricing, {
        confirmOverwrite: !!confirmOverwriteReverse,
      });

      if (result.confirmation) {
        // The primary's own update above is already committed and stands; only
        // the reverse sync is being held for confirmation. Revalidate before
        // returning so the primary's new values aren't left stale on the
        // public pages while the admin decides.
        revalidateRoutePages();
        return NextResponse.json({ success: false, ...result.confirmation }, { status: 409 });
      }
      warning = result.warning;
    } else {
      // Toggle switched off: unlink but keep the row. It stays live and
      // bookable as an independent route the admin can edit or delete — a
      // hard delete would fail anyway once bookings.route_id points at it.
      const { error: unlinkError } = await supabase
        .from("routes")
        .update({ reverse_of_route_id: null })
        .eq("reverse_of_route_id", id);

      if (unlinkError) {
        console.error("Error unlinking reverse route:", unlinkError);
        warning = "Route saved, but the return route could not be unlinked.";
      }
    }

    revalidateRoutePages();

    return NextResponse.json({
      success: true,
      data: route,
      ...(warning ? { warning } : {}),
    });
  } catch (error: any) {
    console.error("Error updating route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update route",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/routes
 * Delete a route
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getAdminSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Route ID is required" },
        { status: 400 }
      );
    }

    // Delete route (pricing will be cascade deleted)
    const { error } = await supabase.from("routes").delete().eq("id", id);

    if (error) throw error;

    revalidateRoutePages();

    return NextResponse.json({
      success: true,
      message: "Route deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete route",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}
