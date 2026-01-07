import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  // Pricing
  calculatedPrice: number | null;
  seasonId: string | null;
  seasonName: string | null;

  // Availability
  availabilityStatus: 'available' | 'limited' | 'sold_out' | 'blocked' | null;
  carsAvailable: number | null;

  // Route Context (from destination pages)
  routeContext: RouteContext | null;

  // Submission State
  bookingId: string | null;
  advanceAmount: number | null;
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

  // Pricing actions
  setCalculatedPrice: (price: number, seasonId: string, seasonName: string) => void;

  // Availability actions
  setAvailability: (status: 'available' | 'limited' | 'sold_out' | 'blocked', carsAvailable: number) => void;

  // Route context actions
  setRouteContext: (context: RouteContext) => void;
  clearRouteContext: () => void;

  // Submission actions
  setBookingResult: (bookingId: string, advanceAmount: number) => void;
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
  calculatedPrice: null,
  seasonId: null,
  seasonName: null,
  availabilityStatus: null,
  carsAvailable: null,
  routeContext: null,
  bookingId: null,
  advanceAmount: null,
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

      // Pricing actions
      setCalculatedPrice: (price, seasonId, seasonName) => set({
        calculatedPrice: price,
        seasonId,
        seasonName
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

      // Submission actions
      setBookingResult: (bookingId, advanceAmount) => set({
        bookingId,
        advanceAmount,
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
        // Only persist certain fields
        currentStep: state.currentStep,
        bookingType: state.bookingType,
        packageId: state.packageId,
        packageTitle: state.packageTitle,
        vehicleType: state.vehicleType,
        tripDate: state.tripDate,
        tripTime: state.tripTime,
        passengerCount: state.passengerCount,
        pickupLocation: state.pickupLocation,
        dropoffLocation: state.dropoffLocation,
        specialRequests: state.specialRequests,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        customerEmail: state.customerEmail,
        // Route context for destination-based booking
        routeContext: state.routeContext,
        // Booking result (persisted until reset)
        bookingId: state.bookingId,
        advanceAmount: state.advanceAmount,
        isBookingComplete: state.isBookingComplete,
      }),
    }
  )
);
