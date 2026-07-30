import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SelectedAddon } from '@/lib/supabase/types';

export type BookingType = 'tour' | 'transfer';
export type VehicleType = 'sedan' | 'suv_normal' | 'suv_deluxe' | 'suv_luxury';
export type BookingStep = 1 | 2 | 3 | 4;

// Route context for booking from destination pages
export interface RouteContext {
  destinationSlug: string;
  destinationName: string;
  prefilledPickup: string;
  prefilledDropoff: string;
}

// Data-only patch applied atomically on arrival at /booking. Deliberately a
// plain data shape (not Partial<BookingState>) so it can't smuggle in actions
// or submission-result fields — only what a URL entry contract can carry.
export interface BookingEntryPatch {
  currentStep?: BookingStep;
  bookingType?: BookingType;
  packageId?: string;
  packageTitle?: string;
  vehicleType?: VehicleType;
  tripDate?: string;
  tripTime?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  passengerCount?: number;
}

export interface BookingState {
  // Current step in the booking flow
  currentStep: BookingStep;

  // Step 1: Package & Vehicle Selection
  bookingType: BookingType | null;
  packageId: string | null;
  packageTitle: string | null;
  vehicleType: VehicleType | null;

  // Step 2: Trip Details
  tripDate: string | null; // ISO date string
  tripTime: string | null; // e.g., "09:00"
  passengerCount: number;
  pickupLocation: string;
  dropoffLocation: string;
  specialRequests: string;

  // Step 3: Contact Information
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerWhatsapp: string;
  requiresChildSeat: boolean;

  // Pricing
  calculatedPrice: number | null;
  seasonId: string | null;
  seasonName: string | null;

  // Addons
  selectedAddons: SelectedAddon[];
  addonsTotal: number;

  // Availability
  availabilityStatus: 'available' | 'limited' | 'sold_out' | 'blocked' | null;
  carsAvailable: number | null;

  // Route Context (from destination pages)
  routeContext: RouteContext | null;

  // Submission State
  bookingId: string | null;
  advanceAmount: number | null;
  // Authoritative total from the create API response — never the client's
  // pre-submit estimate. Used to render the post-submit UPI screen.
  confirmedTotalAmount: number | null;
  isSubmitting: boolean;
  submitError: string | null;
  isBookingComplete: boolean;

  // Actions
  setCurrentStep: (step: BookingStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Step 1 actions
  setBookingType: (type: BookingType) => void;
  setPackage: (id: string, title: string) => void;
  setVehicleType: (type: VehicleType) => void;

  // Step 2 actions
  setTripDate: (date: string) => void;
  setTripTime: (time: string) => void;
  setPassengerCount: (count: number) => void;
  setPickupLocation: (location: string) => void;
  setDropoffLocation: (location: string) => void;
  setSpecialRequests: (requests: string) => void;

  // Step 3 actions
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerEmail: (email: string) => void;
  setCustomerWhatsapp: (whatsapp: string) => void;
  setRequiresChildSeat: (requiresChildSeat: boolean) => void;

  // Pricing actions
  setCalculatedPrice: (price: number, seasonId: string, seasonName: string) => void;

  // Addon actions
  addAddon: (addon: SelectedAddon) => void;
  removeAddon: (addonId: string) => void;
  clearAddons: () => void;

  // Availability actions
  setAvailability: (status: 'available' | 'limited' | 'sold_out' | 'blocked', carsAvailable: number) => void;

  // Route context actions
  setRouteContext: (context: RouteContext) => void;
  clearRouteContext: () => void;

  // Applies an entry-URL patch atomically on top of a full reset — arriving
  // at /booking always starts a clean booking, never a leftover one (see
  // resetBooking below for why a hand-rolled partial reset is unsafe here).
  applyEntry: (entry: BookingEntryPatch) => void;

  // Submission actions
  setBookingResult: (bookingId: string, advanceAmount: number, totalAmount: number) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setSubmitError: (error: string | null) => void;
  setBookingComplete: (complete: boolean) => void;

  // Reset
  resetBooking: () => void;
}

const initialState = {
  currentStep: 1 as BookingStep,
  bookingType: null,
  packageId: null,
  packageTitle: null,
  vehicleType: null,
  tripDate: null,
  tripTime: null,
  passengerCount: 2,
  pickupLocation: '',
  dropoffLocation: '',
  specialRequests: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  customerWhatsapp: '',
  requiresChildSeat: false,
  calculatedPrice: null,
  seasonId: null,
  seasonName: null,
  selectedAddons: [],
  addonsTotal: 0,
  availabilityStatus: null,
  carsAvailable: null,
  routeContext: null,
  bookingId: null,
  advanceAmount: null,
  confirmedTotalAmount: null,
  isSubmitting: false,
  submitError: null,
  isBookingComplete: false,
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      ...initialState,

      // Step navigation
      setCurrentStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({
        currentStep: Math.min(state.currentStep + 1, 4) as BookingStep
      })),
      prevStep: () => set((state) => ({
        currentStep: Math.max(state.currentStep - 1, 1) as BookingStep
      })),

      // Step 1 actions
      setBookingType: (type) => set({ bookingType: type }),
      setPackage: (id, title) => set({ packageId: id, packageTitle: title }),
      setVehicleType: (type) => set({ vehicleType: type }),

      // Step 2 actions
      setTripDate: (date) => set({ tripDate: date }),
      setTripTime: (time) => set({ tripTime: time }),
      setPassengerCount: (count) => set({ passengerCount: count }),
      setPickupLocation: (location) => set({ pickupLocation: location }),
      setDropoffLocation: (location) => set({ dropoffLocation: location }),
      setSpecialRequests: (requests) => set({ specialRequests: requests }),

      // Step 3 actions
      setCustomerName: (name) => set({ customerName: name }),
      setCustomerPhone: (phone) => set({ customerPhone: phone }),
      setCustomerEmail: (email) => set({ customerEmail: email }),
      setCustomerWhatsapp: (whatsapp) => set({ customerWhatsapp: whatsapp }),
      setRequiresChildSeat: (requiresChildSeat) => set({ requiresChildSeat }),

      // Pricing actions
      setCalculatedPrice: (price, seasonId, seasonName) => set({
        calculatedPrice: price,
        seasonId,
        seasonName
      }),

      // Addon actions
      addAddon: (addon) => set((state) => {
        // Check if addon already exists
        const exists = state.selectedAddons.find(a => a.id === addon.id);
        if (exists) {
          return state; // Don't add duplicate
        }

        const newAddons = [...state.selectedAddons, addon];
        const newTotal = newAddons.reduce((sum, a) => sum + a.price, 0);

        return {
          selectedAddons: newAddons,
          addonsTotal: newTotal
        };
      }),

      removeAddon: (addonId) => set((state) => {
        const newAddons = state.selectedAddons.filter(a => a.id !== addonId);
        const newTotal = newAddons.reduce((sum, a) => sum + a.price, 0);

        return {
          selectedAddons: newAddons,
          addonsTotal: newTotal
        };
      }),

      clearAddons: () => set({
        selectedAddons: [],
        addonsTotal: 0
      }),

      // Availability actions
      setAvailability: (status, carsAvailable) => set({
        availabilityStatus: status,
        carsAvailable
      }),

      // Route context actions
      setRouteContext: (context) => set({
        routeContext: context,
        pickupLocation: context.prefilledPickup,
        dropoffLocation: context.prefilledDropoff,
      }),
      clearRouteContext: () => set({ routeContext: null }),

      // Full reset + entry patch in one atomic write. Also clears bookingId /
      // confirmedTotalAmount / isBookingComplete — without that, a returning
      // customer with a persisted completed booking would land back on the
      // success screen for their previous trip instead of a fresh form.
      applyEntry: (entry) => set({ ...initialState, ...entry }),

      // Submission actions
      setBookingResult: (bookingId, advanceAmount, totalAmount) => set({
        bookingId,
        advanceAmount,
        confirmedTotalAmount: totalAmount,
        isBookingComplete: true,
        isSubmitting: false,
        submitError: null,
      }),
      setSubmitting: (isSubmitting) => set({ isSubmitting }),
      setSubmitError: (error) => set({
        submitError: error,
        isSubmitting: false,
      }),
      setBookingComplete: (complete) => set({ isBookingComplete: complete }),

      // Reset
      resetBooking: () => set(initialState),
    }),
    {
      name: 'nainital-taxi-booking', // localStorage key
      partialize: (state) => ({
        // currentStep, bookingType, packageId, packageTitle and vehicleType are
        // deliberately NOT persisted — the URL is the sole entry contract for
        // these, and persisting them would let a stale localStorage value
        // override the package/vehicle the user just picked (see applyEntry).
        tripDate: state.tripDate,
        tripTime: state.tripTime,
        passengerCount: state.passengerCount,
        pickupLocation: state.pickupLocation,
        dropoffLocation: state.dropoffLocation,
        specialRequests: state.specialRequests,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        customerEmail: state.customerEmail,
        customerWhatsapp: state.customerWhatsapp,
        requiresChildSeat: state.requiresChildSeat,
        // Addons
        selectedAddons: state.selectedAddons,
        addonsTotal: state.addonsTotal,
        // Route context for destination-based booking
        routeContext: state.routeContext,
        // Booking result (persisted until reset)
        bookingId: state.bookingId,
        advanceAmount: state.advanceAmount,
        confirmedTotalAmount: state.confirmedTotalAmount,
        isBookingComplete: state.isBookingComplete,
      }),
    }
  )
);
