"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Select, Label } from "@/components/ui";
import { Calendar, MapPin, Users, Car, Loader2 } from "lucide-react";
import { getPackages, getPrice } from "@/lib/supabase";
import type { Package } from "@/lib/supabase";
import type { Route, RoutePricing } from "@/lib/supabase/types";
import { useBookingStore } from "@/store/bookingStore";

type VehicleType = "sedan" | "suv_normal" | "suv_deluxe" | "suv_luxury";

const VEHICLE_OPTIONS: { value: VehicleType; label: string; capacity: string }[] = [
  { value: "sedan", label: "Sedan", capacity: "4 seater" },
  { value: "suv_normal", label: "SUV", capacity: "6-7 seater" },
  { value: "suv_deluxe", label: "SUV Deluxe", capacity: "7 seater" },
  { value: "suv_luxury", label: "Innova Crysta", capacity: "7 seater" },
];

export default function BookingWidget() {
  const router = useRouter();
  const bookingStore = useBookingStore();
  const [activeTab, setActiveTab] = useState<"tours" | "transfers">("tours");
  const [packages, setPackages] = useState<Package[]>([]);
  const [routes, setRoutes] = useState<(Route & { pricing?: RoutePricing[] })[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingPrice, setCheckingPrice] = useState(false);

  // Tour form state
  const [tourPackage, setTourPackage] = useState("");
  const [tourVehicle, setTourVehicle] = useState<VehicleType>("sedan");
  const [tourDate, setTourDate] = useState("");
  const [tourPassengers, setTourPassengers] = useState("2");

  // Transfer form state
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferVehicle, setTransferVehicle] = useState<VehicleType>("sedan");
  const [transferDate, setTransferDate] = useState("");
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
    if (route && route.pricing && transferDate) {
      calculateTransferPrice(route);
    } else {
      setPriceInfo(null);
    }
  }, [transferFrom, transferTo, transferVehicle, transferDate, routes]);

  // Calculate transfer price
  const calculateTransferPrice = (route: Route & { pricing?: RoutePricing[] }) => {
    if (!route.pricing || !transferDate) return;

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
      if (!tourPackage || !tourDate) {
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

  // Handle tour booking
  const handleTourBooking = async () => {
    if (!tourPackage || !tourDate) {
      alert("Please select a package and date");
      return;
    }

    setLoading(true);
    try {
      const selectedPkg = packages.find((p) => p.id === tourPackage);

      bookingStore.resetBooking();
      bookingStore.setBookingType("tour");
      bookingStore.setPackage(tourPackage, selectedPkg?.title || "Tour Package");
      bookingStore.setVehicleType(tourVehicle);
      bookingStore.setTripDate(tourDate);
      bookingStore.setPassengerCount(parseInt(tourPassengers));

      if (priceInfo) {
        bookingStore.setCalculatedPrice(priceInfo.price, "", priceInfo.season);
      }

      router.push("/booking");
    } catch (error) {
      console.error("Booking error:", error);
      alert("Something went wrong. Please try again or contact us directly.");
    } finally {
      setLoading(false);
    }
  };

  // Handle transfer booking
  const handleTransferBooking = async () => {
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

    setLoading(true);
    try {
      bookingStore.resetBooking();
      bookingStore.setBookingType("transfer");
      bookingStore.setPackage(
        selectedRoute.id,
        `Transfer: ${transferFrom} to ${transferTo}`
      );
      bookingStore.setVehicleType(transferVehicle);
      bookingStore.setTripDate(transferDate);
      bookingStore.setPickupLocation(transferFrom);
      bookingStore.setDropoffLocation(transferTo);

      if (priceInfo) {
        bookingStore.setCalculatedPrice(priceInfo.price, "", priceInfo.season);
      }

      router.push("/booking");
    } catch (error) {
      console.error("Transfer booking error:", error);
      alert("Something went wrong. Please try again or contact us directly.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const dropLocations = getDropLocations();

  return (
    <Card className="max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex border-b-3 border-ink -mt-6 -mx-6 mb-6">
        <button
          onClick={() => setActiveTab("tours")}
          className={`flex-1 py-4 px-6 font-display text-xl transition-all ${
            activeTab === "tours"
              ? "bg-sunshine border-b-4 border-ink -mb-[3px]"
              : "bg-white/50 hover:bg-white/80"
          }`}
        >
          Tour Packages
        </button>
        <button
          onClick={() => setActiveTab("transfers")}
          className={`flex-1 py-4 px-6 font-display text-xl transition-all ${
            activeTab === "transfers"
              ? "bg-teal text-white border-b-4 border-ink -mb-[3px]"
              : "bg-white/50 hover:bg-white/80"
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
                {VEHICLE_OPTIONS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label} ({v.capacity})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="tour-date">
                <Calendar className="w-4 h-4 inline mr-1" />
                Travel Date
              </Label>
              <Input
                id="tour-date"
                type="date"
                min={today}
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
            <div className="bg-sunshine/30 border-2 border-ink rounded-xl p-4 text-center">
              <div className="text-3xl font-display font-bold text-ink">
                ₹{priceInfo.price.toLocaleString()}
              </div>
              <div className="text-sm text-ink/70">
                {priceInfo.season === "Season" ? "Peak Season Price" : "Off-Season Price"}
              </div>
              {!priceInfo.bookingAllowed && priceInfo.message && (
                <div className="mt-2 text-sm text-coral font-medium">
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
            disabled={loading || !tourPackage || !tourDate}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Continue to Booking"
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
                min={today}
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
              />
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
                  getAvailableVehiclesForRoute(selectedRoute).map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label} ({v.capacity})
                    </option>
                  ))
                ) : (
                  <option value="">Select route first</option>
                )}
              </Select>
              {selectedRoute && getAvailableVehiclesForRoute(selectedRoute).length === 0 && (
                <p className="text-xs text-coral mt-1">
                  No vehicles available for this route. Please contact us directly.
                </p>
              )}
            </div>
          </div>

          {/* Route Info */}
          {selectedRoute && (
            <div className="bg-teal/10 border-2 border-teal/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-lg text-ink">
                    {selectedRoute.pickup_location} → {selectedRoute.drop_location}
                  </div>
                  {(selectedRoute.distance || selectedRoute.duration) && (
                    <div className="text-sm text-ink/60 mt-1">
                      {selectedRoute.distance && `${selectedRoute.distance} km`}
                      {selectedRoute.distance && selectedRoute.duration && " • "}
                      {selectedRoute.duration}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Price Display */}
          {priceInfo && selectedRoute && (
            <div className="bg-sunshine/30 border-2 border-ink rounded-xl p-4 text-center">
              <div className="text-3xl font-display font-bold text-ink">
                ₹{priceInfo.price.toLocaleString()}
              </div>
              <div className="text-sm text-ink/70">
                {priceInfo.season === "Season" ? "Peak Season Price" : "Off-Season Price"}
              </div>
              {!priceInfo.bookingAllowed && priceInfo.message && (
                <div className="mt-2 text-sm text-coral font-medium">
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
              !selectedRoute.enable_online_booking
            }
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Continue to Booking"
            )}
          </Button>

          {routes.length === 0 && (
            <div className="text-center py-6 text-ink/60 font-body">
              <p>No transfer routes available at the moment.</p>
              <p className="text-sm mt-2">Please contact us directly for transfers.</p>
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-center text-ink/60 font-body mt-6">
        Instant booking for available dates - WhatsApp support for sold-out dates
      </p>
    </Card>
  );
}
