/**
 * BOOKING UTILITIES
 *
 * Core functions for booking ID generation, advance calculation, and validation.
 * Based on Kathgodam Taxi implementation pattern.
 */

/**
 * Generate a unique booking ID in format NT-YYYYMMDD-XXXX
 * Example: NT-20241230-A7B3
 */
export function generateBookingId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `NT-${dateStr}-${randomPart}`;
}

/**
 * Calculate advance payment amount
 * Rule: 25% of total OR Rs 500 minimum (whichever is higher)
 *
 * Examples:
 * - Total Rs 1000 -> 25% = Rs 250, but min Rs 500, so advance = Rs 500
 * - Total Rs 5000 -> 25% = Rs 1250, advance = Rs 1250
 */
export function calculateAdvanceAmount(totalAmount: number): number {
  const percentage = totalAmount * 0.25;
  const minAdvance = 500;
  return Math.max(Math.round(percentage), minAdvance);
}

/**
 * Calculate remaining amount after advance
 */
export function calculateRemainingAmount(totalAmount: number): number {
  const advance = calculateAdvanceAmount(totalAmount);
  return totalAmount - advance;
}

/**
 * Format price for display in INR
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Validate Indian phone number (10 digits, starting with 6-9)
 * Accepts formats: 9876543210, +919876543210, 919876543210
 */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+91|91)?[6-9]\d{9}$/.test(cleaned);
}

/**
 * Normalize phone number to 10-digit format
 * Removes country code prefix if present
 */
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+91')) return cleaned.slice(3);
  if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned.slice(2);
  return cleaned;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return true; // Email is optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Get display name for vehicle type
 */
export function getVehicleDisplayName(vehicleType: string): string {
  const displayNames: Record<string, string> = {
    sedan: 'Sedan (Dzire/Amaze)',
    suv_normal: 'SUV Normal (Ertiga/Triber)',
    suv_deluxe: 'SUV Deluxe (Innova)',
    suv_luxury: 'SUV Luxury (Innova Crysta)',
  };
  return displayNames[vehicleType] || vehicleType;
}

/**
 * Get passenger capacity for vehicle type
 */
export function getVehicleCapacity(vehicleType: string): number {
  const capacities: Record<string, number> = {
    sedan: 4,
    suv_normal: 6,
    suv_deluxe: 6,
    suv_luxury: 6,
  };
  return capacities[vehicleType] || 4;
}

/**
 * Format date for display (e.g., "Mon, 30 Dec 2024")
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format time for display (e.g., "09:00 AM")
 */
export function formatTime(timeStr: string): string {
  // If already in 12-hour format, return as is
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr;
  }

  // Convert 24-hour to 12-hour format
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Check if a date is in the future (valid for booking)
 */
export function isValidBookingDate(dateStr: string): boolean {
  const bookingDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return bookingDate >= today;
}

/**
 * Check if booking date is at least 24 hours in advance
 */
export function isWithinLeadTime(dateStr: string, timeStr: string, minHours: number = 24): boolean {
  const bookingDateTime = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  const diffMs = bookingDateTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours >= minHours;
}

/**
 * Booking validation result
 */
export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate complete booking data before submission
 */
export function validateBookingData(data: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tripDate: string;
  tripTime: string;
  vehicleType: string;
  calculatedPrice: number | null;
  pickupLocation: string;
}): BookingValidationResult {
  const errors: string[] = [];

  // Customer name
  if (!data.customerName || data.customerName.trim().length < 2) {
    errors.push('Please enter your full name');
  }

  // Phone validation
  if (!data.customerPhone) {
    errors.push('Phone number is required');
  } else if (!validatePhone(data.customerPhone)) {
    errors.push('Please enter a valid 10-digit phone number');
  }

  // Email validation (optional but must be valid if provided)
  if (data.customerEmail && !validateEmail(data.customerEmail)) {
    errors.push('Please enter a valid email address');
  }

  // Date validation
  if (!data.tripDate) {
    errors.push('Please select a travel date');
  } else if (!isValidBookingDate(data.tripDate)) {
    errors.push('Travel date must be in the future');
  }

  // Time validation
  if (!data.tripTime) {
    errors.push('Please select a pickup time');
  }

  // Vehicle type
  if (!data.vehicleType) {
    errors.push('Please select a vehicle type');
  }

  // Price
  if (!data.calculatedPrice || data.calculatedPrice <= 0) {
    errors.push('Unable to calculate price. Please try again.');
  }

  // Pickup location
  if (!data.pickupLocation || data.pickupLocation.trim().length < 3) {
    errors.push('Please enter a pickup location');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
