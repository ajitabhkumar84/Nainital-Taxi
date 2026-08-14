"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  MapPin,
  ArrowRight,
  Clock,
  FileText,
  DollarSign,
  Hotel,
  Eye,
  Package,
  FolderTree,
} from "lucide-react";
import {
  Route,
  RoutePricing,
  RouteCategory,
  RoutePartner,
  Destination,
  PickupLocationRow,
  VehicleType,
  VEHICLE_TYPES,
  SEASON_NAMES,
} from "@/lib/supabase/types";
import { toCanonicalPickupLocation } from "@/lib/pickupLocations";
import { generateRouteSlug } from "@/lib/routeReverse";

// What the server sends back on a 409 when the linked return route's prices
// have been hand-edited and no longer match what's about to be saved.
export interface ReverseConflict {
  reverse: RoutePartner;
}

export type RouteFormData = Partial<
  Route & { pricing: Partial<RoutePricing>[]; create_reverse: boolean }
>;

interface RouteFormProps {
  initialData?:
    | (Route & {
        pricing?: RoutePricing[];
        // Populated by GET /api/admin/routes?id=... — this route's partner in
        // whichever direction applies. Never both.
        linkedReverse?: RoutePartner | null;
        reverseParent?: RoutePartner | null;
      })
    | null;
  // Rejects with a ReverseConflict when the server asks for confirmation
  // before overwriting a diverged return route.
  onSubmit: (data: RouteFormData) => Promise<void>;
  isSubmitting: boolean;
}

export default function RouteForm({ initialData, onSubmit, isSubmitting }: RouteFormProps) {
  // Categories
  const [categories, setCategories] = useState<RouteCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Destinations (for the "View Details" link on /rates)
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  // Pickup locations (admin-manageable, replacing the old hardcoded list)
  const [pickupLocations, setPickupLocations] = useState<PickupLocationRow[]>([]);
  const [loadingPickupLocations, setLoadingPickupLocations] = useState(true);

  // Basic Info
  // Canonicalized against [] until fetchPickupLocations() resolves — the
  // re-derivation effect below corrects this once the real list is in, so
  // an existing route using a legacy alias (e.g. "Kathgodam") still ends up
  // selecting the right canonical option.
  const [pickupLocation, setPickupLocation] = useState(
    toCanonicalPickupLocation([], initialData?.pickup_location || "")
  );
  const [dropLocation, setDropLocation] = useState(initialData?.drop_location || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [distance, setDistance] = useState(initialData?.distance?.toString() || "");
  const [duration, setDuration] = useState(initialData?.duration || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [categoryId, setCategoryId] = useState(initialData?.category_id || "");
  const [displayOrder, setDisplayOrder] = useState(initialData?.display_order?.toString() || "0");

  // Optional Features
  const [featuredPackageId, setFeaturedPackageId] = useState(initialData?.featured_package_id || "");
  const [hasHotelOption, setHasHotelOption] = useState(initialData?.has_hotel_option ?? false);

  // Display Options
  const [showOnDestinationPage, setShowOnDestinationPage] = useState(
    initialData?.show_on_destination_page ?? true
  );
  const [destinationSlug, setDestinationSlug] = useState(initialData?.destination_slug || "");

  // Status
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [enableOnlineBooking, setEnableOnlineBooking] = useState(
    initialData?.enable_online_booking ?? true
  );

  // SEO
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(initialData?.meta_description || "");

  // Pricing - Initialize with existing pricing or empty structure
  const initializePricing = (): Partial<RoutePricing>[] => {
    if (initialData?.pricing && initialData.pricing.length > 0) {
      return initialData.pricing;
    }

    // Create default pricing structure
    const defaultPricing: Partial<RoutePricing>[] = [];
    VEHICLE_TYPES.forEach((vehicleType) => {
      SEASON_NAMES.forEach((seasonName) => {
        defaultPricing.push({
          vehicle_type: vehicleType,
          season_name: seasonName,
          price: 0,
          is_active: true,
        });
      });
    });
    return defaultPricing;
  };

  const [pricing, setPricing] = useState<Partial<RoutePricing>[]>(initializePricing());

  // Reverse route. `reverseParent` being set means THIS row is itself a
  // generated return route — it can't have one of its own, so the toggle is
  // replaced by a notice pointing back at the primary.
  const reverseParent = initialData?.reverseParent ?? null;
  const linkedReverse = initialData?.linkedReverse ?? null;
  const isGeneratedReverse = Boolean(reverseParent);
  const [createReverse, setCreateReverse] = useState(Boolean(linkedReverse));
  // Set from the server's 409 when the linked return route's prices have
  // diverged and overwriting them needs explicit sign-off.
  const [reverseConflict, setReverseConflict] = useState<ReverseConflict | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchDestinations();
    fetchPickupLocations();
  }, []);

  // Re-derive the initial pickup selection once the live list has loaded —
  // pickupLocation's useState initializer above ran against [] (nothing to
  // canonicalize against yet), so an existing route stored under a legacy
  // alias (e.g. "Kathgodam") needs this pass to land on its canonical name.
  useEffect(() => {
    if (!initialData?.pickup_location || pickupLocations.length === 0) return;
    const canonical = toCanonicalPickupLocation(pickupLocations, initialData.pickup_location);
    setPickupLocation((current) => (current !== canonical ? canonical : current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupLocations]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/route-categories");

      if (!response.ok) throw new Error("Failed to fetch categories");

      const { data } = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchDestinations = async () => {
    try {
      const response = await fetch("/api/admin/destinations");

      if (!response.ok) throw new Error("Failed to fetch destinations");

      const data = await response.json();
      setDestinations(data);
    } catch (error) {
      console.error("Error fetching destinations:", error);
    } finally {
      setLoadingDestinations(false);
    }
  };

  const fetchPickupLocations = async () => {
    try {
      const response = await fetch("/api/admin/pickup-locations");

      if (!response.ok) throw new Error("Failed to fetch pickup locations");

      const { data } = await response.json();
      setPickupLocations(data || []);
    } catch (error) {
      console.error("Error fetching pickup locations:", error);
    } finally {
      setLoadingPickupLocations(false);
    }
  };

  const handlePickupChange = (value: string) => {
    setPickupLocation(value);
    if (!initialData && value && dropLocation) {
      setSlug(generateRouteSlug(value, dropLocation));
    }
  };

  const handleDropChange = (value: string) => {
    setDropLocation(value);
    if (!initialData && pickupLocation && value) {
      setSlug(generateRouteSlug(pickupLocation, value));
    }
  };

  // Normalizes on blur (not onChange) so it doesn't fight the admin mid-keystroke —
  // typing "Kathgodam Railway Station" won't flip to "Kathgodam Station" until they
  // tab/click away.
  const handleDropBlur = () => {
    const canonical = toCanonicalPickupLocation(pickupLocations, dropLocation);
    if (canonical !== dropLocation) {
      handleDropChange(canonical);
    }
  };

  const handlePriceChange = (vehicleType: VehicleType, seasonName: string, value: string) => {
    setPricing((prev) =>
      prev.map((p) =>
        p.vehicle_type === vehicleType && p.season_name === seasonName
          ? { ...p, price: parseInt(value) || 0 }
          : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitWith(false);
  };

  // `confirmOverwriteReverse` is only ever true on the retry the confirmation
  // panel triggers, so a diverged return route can't be overwritten without
  // the admin having seen it named.
  const submitWith = async (confirmOverwriteReverse: boolean) => {
    if (!pickupLocation || !dropLocation) {
      alert("Pickup and drop locations are required");
      return;
    }

    try {
      await onSubmit({
        ...buildPayload(),
        ...(isGeneratedReverse ? {} : { create_reverse: createReverse }),
        ...(confirmOverwriteReverse ? { confirm_overwrite_reverse: true } : {}),
      } as RouteFormData);
      setReverseConflict(null);
    } catch (error) {
      const conflict = error as ReverseConflict | undefined;
      if (conflict?.reverse) {
        setReverseConflict(conflict);
        return;
      }
      throw error;
    }
  };

  const buildPayload = () => {
    return {
      pickup_location: pickupLocation,
      drop_location: dropLocation,
      slug,
      distance: distance ? Number(distance) : null,
      duration: duration || null,
      description: description || null,
      category_id: categoryId || null,
      display_order: Number(displayOrder) || 0,
      featured_package_id: featuredPackageId || null,
      has_hotel_option: hasHotelOption,
      show_on_destination_page: showOnDestinationPage,
      destination_slug: destinationSlug || null,
      is_active: isActive,
      enable_online_booking: enableOnlineBooking,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      pricing: pricing.filter((p) => p.price && p.price > 0),
    };
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Route Information */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-coral" />
          Route Information
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Pickup Location *
            </label>
            <select
              value={pickupLocation}
              onChange={(e) => handlePickupChange(e.target.value)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              disabled={loadingPickupLocations}
              required
            >
              <option value="">Choose pickup location</option>
              {pickupLocations.map((location) => (
                <option key={location.id} value={location.name}>
                  {location.name}
                </option>
              ))}
            </select>
            {loadingPickupLocations && (
              <p className="text-xs text-ink/50 mt-1">Loading pickup locations...</p>
            )}
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Drop Location *
            </label>
            <input
              type="text"
              value={dropLocation}
              onChange={(e) => handleDropChange(e.target.value)}
              onBlur={handleDropBlur}
              placeholder="e.g., Nainital"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              required
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block font-body text-sm text-ink/60 mb-2">
            Route Slug (URL)
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="delhi-to-nainital"
            className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Distance (km)
            </label>
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="320"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Duration
            </label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="7-8 hours"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block font-body text-sm text-ink/60 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief description of this route..."
            className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2 flex items-center gap-2">
              <FolderTree className="w-4 h-4" />
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
              disabled={loadingCategories}
            >
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category_name}
                </option>
              ))}
            </select>
            {loadingCategories && (
              <p className="text-xs text-ink/50 mt-1">Loading categories...</p>
            )}
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <p className="text-xs text-ink/50 mt-1">
              Lower numbers appear first (e.g., 1, 2, 3...)
            </p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-whatsapp" />
          Pricing
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-ink/20">
                <th className="text-left font-display text-ink p-3">Vehicle Type</th>
                <th className="text-center font-display text-ink p-3">Off-Season</th>
                <th className="text-center font-display text-ink p-3">Season</th>
              </tr>
            </thead>
            <tbody>
              {VEHICLE_TYPES.map((vehicleType) => {
                const offSeasonPrice = pricing.find(
                  (p) => p.vehicle_type === vehicleType && p.season_name === "Off-Season"
                );
                const seasonPrice = pricing.find(
                  (p) => p.vehicle_type === vehicleType && p.season_name === "Season"
                );

                return (
                  <tr key={vehicleType} className="border-b border-ink/10">
                    <td className="p-3 font-body text-ink capitalize">
                      {vehicleType.replace("_", " ")}
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={offSeasonPrice?.price || ""}
                        onChange={(e) =>
                          handlePriceChange(vehicleType, "Off-Season", e.target.value)
                        }
                        placeholder="₹"
                        className="w-full px-3 py-2 border-2 border-ink rounded-lg font-body text-center focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={seasonPrice?.price || ""}
                        onChange={(e) =>
                          handlePriceChange(vehicleType, "Season", e.target.value)
                        }
                        placeholder="₹"
                        className="w-full px-3 py-2 border-2 border-ink rounded-lg font-body text-center focus:outline-none focus:ring-2 focus:ring-sunshine"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optional Features */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">Optional Features</h2>

        <div className="space-y-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Featured Package ID (Optional)
            </label>
            <input
              type="text"
              value={featuredPackageId}
              onChange={(e) => setFeaturedPackageId(e.target.value)}
              placeholder="Package UUID"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
            <p className="text-xs text-ink/50 font-body mt-1">
              Link this route to a featured tour package
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasHotelOption}
              onChange={(e) => setHasHotelOption(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-coral"
            />
            <span className="font-body">Include Hotel Option</span>
          </label>
        </div>
      </div>

      {/* Status & Visibility */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">Status & Visibility</h2>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-whatsapp"
            />
            <span className="font-body">Active (visible on website)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enableOnlineBooking}
              onChange={(e) => setEnableOnlineBooking(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-teal"
            />
            <span className="font-body">Enable Online Booking</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnDestinationPage}
              onChange={(e) => setShowOnDestinationPage(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-ink accent-lake"
            />
            <span className="font-body">Show on Destination Pages</span>
          </label>
        </div>

        {/* Reverse route: either this row generates one, or it IS one. */}
        <div className="mt-4 pt-4 border-t-2 border-ink/10">
          {isGeneratedReverse ? (
            <div className="p-4 bg-lake/10 border-2 border-lake rounded-xl">
              <p className="font-body text-sm text-ink">
                ↩ This route was auto-generated as the return of{" "}
                <strong>
                  {reverseParent!.pickup_location} → {reverseParent!.drop_location}
                </strong>
                .
              </p>
              <p className="font-body text-xs text-ink/60 mt-1">
                Its prices and status follow that route. Everything else here — slug, description
                and SEO fields — is yours to edit and won&apos;t be overwritten.
              </p>
              <a
                href={`/admin/routes/${reverseParent!.id}`}
                className="inline-block mt-2 font-body text-sm text-lake underline hover:text-ink"
              >
                Edit the primary route →
              </a>
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createReverse}
                  onChange={(e) => setCreateReverse(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-ink accent-coral"
                />
                <span className="font-body">Auto-generate return route</span>
              </label>
              <p className="text-xs text-ink/50 mt-1 ml-7">
                {linkedReverse ? (
                  <>
                    Keeping{" "}
                    <strong>
                      {linkedReverse.pickup_location} → {linkedReverse.drop_location}
                    </strong>{" "}
                    in sync. Prices and status mirror this route; its SEO fields and description are
                    yours to edit. Untick to unlink — it stays live with its own prices.
                  </>
                ) : pickupLocation && dropLocation ? (
                  <>
                    Also creates{" "}
                    <strong>
                      {dropLocation} → {pickupLocation}
                    </strong>{" "}
                    with identical pricing.
                  </>
                ) : (
                  "Also creates the opposite direction with identical pricing."
                )}
              </p>
            </>
          )}
        </div>

        <div className="mt-4">
          <label className="block font-body text-sm text-ink/60 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Linked Destination Page
          </label>
          <select
            value={destinationSlug}
            onChange={(e) => setDestinationSlug(e.target.value)}
            className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            disabled={loadingDestinations}
          >
            <option value="">— None (direct booking only) —</option>
            {destinations.map((destination) => (
              <option key={destination.id} value={destination.slug}>
                {destination.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-ink/50 mt-1">
            Linked → the route on /rates shows a &ldquo;View Details&rdquo; link to
            that destination page alongside &ldquo;Book Now&rdquo;. None → the route
            shows only &ldquo;Book Now&rdquo;.
          </p>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-2xl border-3 border-ink p-6 shadow-retro">
        <h2 className="font-display text-xl text-ink mb-4">SEO Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">Meta Title</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Leave blank to auto-generate"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-ink/60 mb-2">
              Meta Description
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              placeholder="Leave blank to auto-generate"
              className="w-full px-4 py-3 border-3 border-ink rounded-xl font-body focus:outline-none focus:ring-2 focus:ring-sunshine resize-none"
            />
          </div>
        </div>
      </div>

      {/* Diverged return route — needs explicit sign-off before overwriting. */}
      {reverseConflict && (
        <div className="bg-sunshine/15 border-3 border-sunshine rounded-2xl p-6">
          <h3 className="font-display text-lg text-ink mb-2">
            ⚠ The return route has different prices
          </h3>
          <p className="font-body text-sm text-ink">
            <strong>
              {reverseConflict.reverse.pickup_location} → {reverseConflict.reverse.drop_location}
            </strong>{" "}
            currently has prices that differ from this route. Saving will overwrite them with the
            prices above.
          </p>
          <p className="font-body text-sm text-ink/70 mt-2">
            Different rates each way? Untick <strong>Auto-generate return route</strong> to unlink
            them — the return route stays live and keeps its own prices, and you&apos;ll stop seeing
            this warning.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <button
              type="button"
              onClick={() => setReverseConflict(null)}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-white text-ink font-body font-semibold rounded-xl border-3 border-ink hover:bg-sunrise/30 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => submitWith(true)}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-coral text-white font-body font-semibold rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Overwrite return route"}
            </button>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-8 py-4 bg-whatsapp text-white font-body font-semibold text-lg rounded-xl border-3 border-ink shadow-retro hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? "Saving..." : initialData ? "Update Route" : "Create Route"}
        </button>
      </div>
    </form>
  );
}
