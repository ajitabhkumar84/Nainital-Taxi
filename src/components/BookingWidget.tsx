"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Select, Label } from "@/components/ui";
import { Calendar, MapPin, Users, Car, Loader2, MessageCircle } from "lucide-react";
import { getPackages, getPrice } from "@/lib/supabase";
import { getVehicleCapacity } from "@/lib/pricing";
import type { Package } from "@/lib/supabase";
import type { Route, RoutePricing } from "@/lib/supabase/types";
import { buildBookingUrl } from "@/lib/bookingLink";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useVehicleLabels } from "@/hooks/useVehicleLabels";
import { DEFAULT_SITE_CONFIG } from "@/lib/supabase/types";

type VehicleType = "sedan" | "suv_normal" | "suv_deluxe" | "suv_luxury";

const VEHICLE_OPTIONS: { value: VehicleType; label: string; capacity: string }[] = [
  { value: "sedan", label: "Sedan", capacity: "4 seater" },
  { value: "suv_normal", label: "SUV", capacity: "6-7 seater" },
  { value: "suv_deluxe", label: "SUV Deluxe", capacity: "7 seater" },
  { value: "suv_luxury", label: "Innova Crysta", capacity: "7 seater" },
];

export default function BookingWidget() {
  const router = useRouter();
  const { config: siteConfig } = useSiteConfig();
  const { labels: vehicleLabels } = useVehicleLabels();
  const phoneNumber =
    siteConfig?.header?.phoneNumber || DEFAULT_SITE_CONFIG.header.phoneNumber;
  const [activeTab, setActiveTab] = useState<"tours" | "transfers">("tours");
  const [packages, setPackages] = useState<Package[]>([]);
  const [routes, setRoutes] = useState<(Route & { pricing?: RoutePricing[] })[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingPrice, setCheckingPrice] = useState(false);

  // Tour form state
  const [tourPackage, setTourPackage] = useState("");
  const [tourVehicle, setTourVehicle] = useState<VehicleType | "">("sedan");
  const [tourDate, setTourDate] = useState("");
  const [tourPassengers, setTourPassengers] = useState("2");

  // Transfer form state
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferVehicle, setTransferVehicle] = useState<VehicleType | "">("sedan");
  const [transferDate, setTransferDate] = useState("");
  const [transferPassengers, setTransferPassengers] = useState("2");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Price display
  const [priceInfo, setPriceInfo] = useState<{
    price: number;
    season: string;
    bookingAllowed: boolean;
    message?: string;
  } | null>(null);

  // Load packages and routes from database
  useEffect(() => {
    async function loadData() {
      try {
        const [allPackages, routesResponse] = await Promise.all([
          getPackages(),
          fetch("/api/routes?withPricing=true").then((r) => r.json()),
        ]);
        setPackages(allPackages);
        if (routesResponse.success) {
          setRoutes(routesResponse.data || []);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    }
    loadData();
  }, []);

  // Filter packages by type
  const tourPackages = packages.filter((p) => p.type === "tour");

  // Get unique pickup locations from routes
  const pickupLocations = Array.from(
    new Set(
      routes.flatMap((r) => [
        r.pickup_location,
        r.drop_location, // For bidirectional
      ])
    )
  ).sort();

  // Get drop locations based on selected pickup
  const getDropLocations = () => {
    if (!transferFrom) return [];

    const validDrops = new Set<string>();

    routes.forEach((route) => {
      // Forward route
      if (route.pickup_location === transferFrom) {
        validDrops.add(route.drop_location);
      }
      // Bidirectional route
      if (route.drop_location === transferFrom) {
        validDrops.add(route.pickup_location);
      }
    });

    return Array.from(validDrops).sort();
  };

  // Get available vehicle types for a route based on pricing
  const getAvailableVehiclesForRoute = (route: Route & { pricing?: RoutePricing[] }) => {
    if (!route.pricing || route.pricing.length === 0) {
      return VEHICLE_OPTIONS; // If no pricing data, show all options
    }

    // Get unique vehicle types that have pricing > 0
    const availableVehicleTypes = new Set<VehicleType>();
    route.pricing.forEach((p) => {
      if (p.price > 0) {
        availableVehicleTypes.add(p.vehicle_type);
      }
    });

    // Filter VEHICLE_OPTIONS to only include available types
    return VEHICLE_OPTIONS.filter((v) => availableVehicleTypes.has(v.value));
  };

  const tourPassengerCount = parseInt(tourPassengers, 10) || 1;
  const tourVehicleOptions = VEHICLE_OPTIONS.filter(
    (v) => getVehicleCapacity(v.value) >= tourPassengerCount
  );

  const transferPassengerCount = parseInt(transferPassengers, 10) || 1;
  const transferVehicleOptions = selectedRoute
    ? getAvailableVehiclesForRoute(selectedRoute).filter(
        (v) => getVehicleCapacity(v.value) >= transferPassengerCount
      )
    : [];

  // Passenger-driven capacity changes CLEAR the selection rather than
  // auto-switching to a bigger (pricier) vehicle — silently upgrading a
  // user's vehicle choice is a price-shock risk. The user must actively pick
  // a larger vehicle, so any fare increase is their own choice. This is
  // deliberately separate from the route-driven auto-switch effect below,
  // which handles a different case (no pricing for the current vehicle on a
  // newly selected route) and is left untouched.
  useEffect(() => {
    const passengers = parseInt(tourPassengers, 10) || 1;
    setTourVehicle((current) => {
      if (current && getVehicleCapacity(current) < passengers) {
        return "";
      }
      return current;
    });
  }, [tourPassengers]);

  useEffect(() => {
    if (!selectedRoute) return;
    const passengers = parseInt(transferPassengers, 10) || 1;
    setTransferVehicle((current) => {
      if (current && getVehicleCapacity(current) < passengers) {
        return "";
      }
      return current;
    });
  }, [transferPassengers, selectedRoute]);

  // Find matching route
  useEffect(() => {
    if (!transferFrom || !transferTo) {
      setSelectedRoute(null);
      return;
    }

    const route =
      routes.find(
        (r) =>
          (r.pickup_location === transferFrom && r.drop_location === transferTo) ||
          (r.pickup_location === transferTo && r.drop_location === transferFrom)
      ) || null;

    setSelectedRoute(route);

    // Auto-select first available vehicle if current selection doesn't have pricing
    if (route && route.pricing) {
      const availableVehicles = getAvailableVehiclesForRoute(route);
      if (availableVehicles.length > 0 && !availableVehicles.find(v => v.value === transferVehicle)) {
        setTransferVehicle(availableVehicles[0].value);
      }
    }

    // Calculate transfer price if route found
    if (route && route.pricing && transferDate && transferVehicle) {
      calculateTransferPrice(route);
    } else {
      setPriceInfo(null);
    }
  }, [transferFrom, transferTo, transferVehicle, transferDate, routes]);

  // Calculate transfer price
  const calculateTransferPrice = (route: Route & { pricing?: RoutePricing[] }) => {
    if (!route.pricing || !transferDate || !transferVehicle) return;

    // Determine season based on date (simple check)
    const month = new Date(transferDate).getMonth() + 1;
    const isSeason = month >= 3 && month <= 6; // March to June is peak season
    const seasonName = isSeason ? "Season" : "Off-Season";

    const pricing = route.pricing.find(
      (p) => p.vehicle_type === transferVehicle && p.season_name === seasonName
    );

    if (pricing) {
      setPriceInfo({
        price: pricing.price,
        season: seasonName,
        bookingAllowed: route.enable_online_booking,
        message: !route.enable_online_booking
          ? "Online booking is currently disabled. Please contact us directly."
          : undefined,
      });
    } else {
      // No pricing available for this vehicle type and season
      setPriceInfo(null);
    }
  };

  // Check price when form changes (for tours)
  useEffect(() => {
    async function checkPrice() {
      if (!tourPackage || !tourDate || !tourVehicle) {
        setPriceInfo(null);
        return;
      }

      setCheckingPrice(true);
      try {
        const pricing = await getPrice(tourPackage, tourVehicle, tourDate);
        setPriceInfo({
          price: pricing.price,
          season: pricing.season_name,
          bookingAllowed: pricing.booking_allowed,
          message: pricing.blackout_message,
        });
      } catch (error) {
        console.error("Price check failed:", error);
        setPriceInfo(null);
      } finally {
        setCheckingPrice(false);
      }
    }

    const debounce = setTimeout(checkPrice, 300);
    return () => clearTimeout(debounce);
  }, [tourPackage, tourVehicle, tourDate]);

  // Handle pickup location change
  const handlePickupChange = (value: string) => {
    setTransferFrom(value);
    setTransferTo(""); // Reset drop location
  };

  // Handle tour booking — a pure navigation. Package/vehicle/date/passengers
  // travel as URL entry-contract params; the store is never pre-seeded here,
  // so /booking always recomputes price itself rather than trusting this form.
  const handleTourBooking = () => {
    if (!tourPackage || !tourDate) {
      alert("Please select a package and date");
      return;
    }

    if (!tourVehicle) {
      alert("Please select a vehicle that fits your passenger count");
      return;
    }

    const selectedPkg = packages.find((p) => p.id === tourPackage);

    router.push(
      buildBookingUrl({
        packageId: tourPackage,
        packageTitle: selectedPkg?.title || "Tour Package",
        packageSlug: selectedPkg?.slug,
        packageType: "tour",
        vehicle: tourVehicle,
        date: tourDate,
        passengers: parseInt(tourPassengers, 10),
      })
    );
  };

  // Handle transfer booking — a pure navigation, mirroring handleTourBooking.
  // selectedRoute.id travels as routeId (distinct from packageId — see
  // bookingLink.ts), so /booking and the create API resolve it against
  // route_pricing/routes rather than pricing/packages. The store is never
  // pre-seeded here; /booking always recomputes price itself.
  const handleTransferBooking = () => {
    if (!transferFrom || !transferTo || !transferDate) {
      alert("Please select pickup location, drop location, and date");
      return;
    }

    if (!selectedRoute) {
      alert("No route found for this transfer. Please contact us directly.");
      return;
    }

    if (!selectedRoute.enable_online_booking) {
      alert("Online booking is disabled for this route. Please contact us directly.");
      return;
    }

    if (!transferVehicle) {
      alert("Please select a vehicle that fits your passenger count");
      return;
    }

    router.push(
      buildBookingUrl({
        routeId: selectedRoute.id,
        packageTitle: `Transfer: ${transferFrom} to ${transferTo}`,
        packageType: "transfer",
        vehicle: transferVehicle,
        date: transferDate,
        pickup: transferFrom,
        dropoff: transferTo,
        passengers: parseInt(transferPassengers, 10),
      })
    );
  };

  // Tour/transfer bookings require at least a day's notice — this mirrors
  // Step2TripDetails' minDate exactly. min={today} would let a same-day date
  // reach the /booking URL, where isValidFutureDate silently drops it,
  // leaving Step 2's date field mysteriously empty.
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const minDate = tomorrowDate.toISOString().split("T")[0];
  const dropLocations = getDropLocations();

  return (
    <Card className="w-full">
      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-lg p-1 -mt-2 mb-6">
        <button
          onClick={() => setActiveTab("tours")}
          aria-pressed={activeTab === "tours"}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm transition-all ${
            activeTab === "tours"
              ? "bg-sunshine text-white font-semibold shadow-sm"
              : "text-slate-500 font-medium hover:text-ink"
          }`}
        >
          Tours &amp; packages
        </button>
        <button
          onClick={() => setActiveTab("transfers")}
          aria-pressed={activeTab === "transfers"}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm transition-all ${
            activeTab === "transfers"
              ? "bg-sunshine text-white font-semibold shadow-sm"
              : "text-slate-500 font-medium hover:text-ink"
          }`}
        >
          Transfers
        </button>
      </div>

      {/* Tour Packages Tab */}
      {activeTab === "tours" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tour-package">
                <MapPin className="w-4 h-4 inline mr-1" />
                Select Package
              </Label>
              <Select
                id="tour-package"
                value={tourPackage}
                onChange={(e) => setTourPackage(e.target.value)}
              >
                <option value="">Choose a package</option>
                {tourPackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.title}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="tour-vehicle">
                <Car className="w-4 h-4 inline mr-1" />
                Vehicle Type
              </Label>
              <Select
                id="tour-vehicle"
                value={tourVehicle}
                onChange={(e) => setTourVehicle(e.target.value as VehicleType)}
              >
                {!tourVehicle && <option value="">Select a vehicle</option>}
                {tourVehicleOptions.map((v) => (
                  <option key={v.value} value={v.value}>
                    {vehicleLabels[v.value] ?? v.label} ({v.capacity})
                  </option>
                ))}
              </Select>
              {!tourVehicle && (
                <p className="text-xs text-amber-700 mt-1">
                  Your vehicle selection was cleared — it doesn&apos;t fit {tourPassengerCount}{" "}
                  passengers. Please choose a larger vehicle.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="tour-date">
                <Calendar className="w-4 h-4 inline mr-1" />
                Travel Date
              </Label>
              <Input
                id="tour-date"
                type="date"
                min={minDate}
                value={tourDate}
                onChange={(e) => setTourDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="tour-passengers">
                <Users className="w-4 h-4 inline mr-1" />
                Passengers
              </Label>
              <Select
                id="tour-passengers"
                value={tourPassengers}
                onChange={(e) => setTourPassengers(e.target.value)}
              >
                <option value="1">1 Person</option>
                <option value="2">2 People</option>
                <option value="3">3 People</option>
                <option value="4">4 People</option>
                <option value="5">5 People</option>
                <option value="6">6+ People</option>
              </Select>
            </div>
          </div>

          {/* Price Display */}
          {checkingPrice && (
            <div className="text-center py-2 text-ink/60">
              <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
              Checking price...
            </div>
          )}

          {priceInfo && !checkingPrice && (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-500">Estimated fare</span>
                <span className="text-2xl font-semibold tabular-nums text-ink">
                  ₹{priceInfo.price.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {priceInfo.season === "Season" ? "Peak season rate" : "Off-season rate"} · includes driver, fuel, tolls
              </div>
              {!priceInfo.bookingAllowed && priceInfo.message && (
                <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                  {priceInfo.message}
                </div>
              )}
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleTourBooking}
            disabled={loading || !tourPackage || !tourDate || !tourVehicle}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Check availability & book"
            )}
          </Button>
        </div>
      )}

      {/* Transfers Tab */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transfer-from">
                <MapPin className="w-4 h-4 inline mr-1" />
                Pick-up Location
              </Label>
              <Select
                id="transfer-from"
                value={transferFrom}
                onChange={(e) => handlePickupChange(e.target.value)}
              >
                <option value="">Choose pick-up point</option>
                {pickupLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="transfer-to">
                <MapPin className="w-4 h-4 inline mr-1" />
                Drop Location
              </Label>
              <Select
                id="transfer-to"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                disabled={!transferFrom || dropLocations.length === 0}
              >
                <option value="">
                  {!transferFrom
                    ? "Select pickup first"
                    : dropLocations.length === 0
                    ? "No routes available"
                    : "Choose drop point"}
                </option>
                {dropLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="transfer-date">
                <Calendar className="w-4 h-4 inline mr-1" />
                Travel Date
              </Label>
              <Input
                id="transfer-date"
                type="date"
                min={minDate}
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="transfer-passengers">
                <Users className="w-4 h-4 inline mr-1" />
                Passengers
              </Label>
              <Select
                id="transfer-passengers"
                value={transferPassengers}
                onChange={(e) => setTransferPassengers(e.target.value)}
              >
                <option value="1">1 Person</option>
                <option value="2">2 People</option>
                <option value="3">3 People</option>
                <option value="4">4 People</option>
                <option value="5">5 People</option>
                <option value="6">6+ People</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="transfer-vehicle">
                <Car className="w-4 h-4 inline mr-1" />
                Vehicle Type
              </Label>
              <Select
                id="transfer-vehicle"
                value={transferVehicle}
                onChange={(e) => setTransferVehicle(e.target.value as VehicleType)}
                disabled={!selectedRoute}
              >
                {selectedRoute ? (
                  <>
                    {!transferVehicle && <option value="">Select a vehicle</option>}
                    {transferVehicleOptions.map((v) => (
                      <option key={v.value} value={v.value}>
                        {vehicleLabels[v.value] ?? v.label} ({v.capacity})
                      </option>
                    ))}
                  </>
                ) : (
                  <option value="">Select route first</option>
                )}
              </Select>
              {selectedRoute && getAvailableVehiclesForRoute(selectedRoute).length === 0 && (
                <p className="text-xs text-amber-700 mt-1">
                  No vehicles available for this route. Please contact us directly.
                </p>
              )}
              {selectedRoute &&
                getAvailableVehiclesForRoute(selectedRoute).length > 0 &&
                !transferVehicle && (
                  <p className="text-xs text-amber-700 mt-1">
                    Your vehicle selection was cleared — it doesn&apos;t fit{" "}
                    {transferPassengerCount} passengers. Please choose a larger vehicle.
                  </p>
                )}
            </div>
          </div>

          {/* Route Info */}
          {selectedRoute && (
            <div className="border border-slate-200 bg-slate-50 rounded-md p-4">
              <div className="font-medium text-ink">
                {selectedRoute.pickup_location} → {selectedRoute.drop_location}
              </div>
              {(selectedRoute.distance || selectedRoute.duration) && (
                <div className="text-sm text-slate-500 mt-1">
                  {selectedRoute.distance && `${selectedRoute.distance} km`}
                  {selectedRoute.distance && selectedRoute.duration && " • "}
                  {selectedRoute.duration}
                </div>
              )}
            </div>
          )}

          {/* Price Display */}
          {priceInfo && selectedRoute && (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-500">Estimated fare</span>
                <span className="text-2xl font-semibold tabular-nums text-ink">
                  ₹{priceInfo.price.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {priceInfo.season === "Season" ? "Peak season rate" : "Off-season rate"} · includes driver, fuel, tolls
              </div>
              {!priceInfo.bookingAllowed && priceInfo.message && (
                <div className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                  {priceInfo.message}
                </div>
              )}
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleTransferBooking}
            disabled={
              loading ||
              !transferFrom ||
              !transferTo ||
              !transferDate ||
              !selectedRoute ||
              !selectedRoute.enable_online_booking ||
              !transferVehicle
            }
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Check availability & book"
            )}
          </Button>

          {routes.length === 0 && (
            <div className="text-center py-6 text-slate-500">
              <p>No transfer routes available at the moment.</p>
              <p className="text-sm mt-2">Please contact us directly for transfers.</p>
            </div>
          )}
        </div>
      )}

      <a
        href={`https://wa.me/${phoneNumber.replace(/[^0-9]/g, "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-ink transition-colors"
      >
        <MessageCircle className="w-4 h-4 text-whatsapp" />
        Or WhatsApp us on {phoneNumber}
      </a>
    </Card>
  );
}
