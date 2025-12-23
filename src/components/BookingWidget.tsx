"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Select, Label } from "@/components/ui";
import { Calendar, MapPin, Users, Car, Loader2 } from "lucide-react";
import { getPackages, getPrice, checkAvailability, isBookingAllowed } from "@/lib/supabase";
import type { Package } from "@/lib/supabase";
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

  // Price display
  const [priceInfo, setPriceInfo] = useState<{
    price: number;
    season: string;
    bookingAllowed: boolean;
    message?: string;
  } | null>(null);

  // Load packages from database
  useEffect(() => {
    async function loadPackages() {
      try {
        const allPackages = await getPackages();
        setPackages(allPackages);
      } catch (error) {
        console.error("Failed to load packages:", error);
      }
    }
    loadPackages();
  }, []);

  // Filter packages by type
  const tourPackages = packages.filter((p) => p.type === "tour");
  const transferPackages = packages.filter((p) => p.type === "transfer");

  // Check price when form changes
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

  // Handle tour booking
  const handleTourBooking = async () => {
    if (!tourPackage || !tourDate) {
      alert("Please select a package and date");
      return;
    }

    setLoading(true);
    try {
      const selectedPkg = packages.find((p) => p.id === tourPackage);

      // Set booking data in store
      bookingStore.resetBooking(); // Start fresh
      bookingStore.setBookingType('tour');
      bookingStore.setPackage(tourPackage, selectedPkg?.title || 'Tour Package');
      bookingStore.setVehicleType(tourVehicle);
      bookingStore.setTripDate(tourDate);
      bookingStore.setPassengerCount(parseInt(tourPassengers));

      // Set pricing if available
      if (priceInfo) {
        bookingStore.setCalculatedPrice(priceInfo.price, '', priceInfo.season);
      }

      // Navigate to booking page
      router.push('/booking');
    } catch (error) {
      console.error("Booking error:", error);
      alert("Something went wrong. Please try again or contact us directly.");
    } finally {
      setLoading(false);
    }
  };

  // Handle transfer booking
  const handleTransferBooking = async () => {
    if (!transferFrom || !transferDate) {
      alert("Please select pickup location and date");
      return;
    }

    setLoading(true);
    try {
      // Find matching transfer package
      const transferPkg = transferPackages.find(
        (p) => p.slug?.includes(transferFrom.toLowerCase())
      );

      // Set booking data in store
      bookingStore.resetBooking(); // Start fresh
      bookingStore.setBookingType('transfer');

      if (transferPkg) {
        bookingStore.setPackage(transferPkg.id, transferPkg.title);
      } else {
        bookingStore.setPackage('', `Transfer: ${transferFrom} to ${transferTo || 'Nainital'}`);
      }

      bookingStore.setVehicleType(transferVehicle);
      bookingStore.setTripDate(transferDate);
      bookingStore.setPickupLocation(transferFrom);
      bookingStore.setDropoffLocation(transferTo || 'Nainital');

      // Navigate to booking page
      router.push('/booking');
    } catch (error) {
      console.error("Transfer booking error:", error);
      alert("Something went wrong. Please try again or contact us directly.");
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

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
                onChange={(e) => setTransferFrom(e.target.value)}
              >
                <option value="">Choose pick-up point</option>
                <option value="Pantnagar Airport">Pantnagar Airport</option>
                <option value="Kathgodam Railway Station">Kathgodam Railway Station</option>
                <option value="Delhi">Delhi</option>
                <option value="Haldwani">Haldwani</option>
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
              >
                <option value="">Choose drop point</option>
                <option value="Nainital">Nainital</option>
                <option value="Bhimtal">Bhimtal</option>
                <option value="Ranikhet">Ranikhet</option>
                <option value="Mukteshwar">Mukteshwar</option>
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
              >
                {VEHICLE_OPTIONS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label} ({v.capacity})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleTransferBooking}
            disabled={loading || !transferFrom || !transferDate}
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

      <p className="text-center text-sm text-ink/60 mt-4">
        Instant booking for available dates - WhatsApp support for sold-out dates
      </p>
    </Card>
  );
}
