import type { BookingType, VehicleType } from '@/store/bookingStore';

/**
 * The URL is the entry contract for the booking flow: package/vehicle/trip
 * context travels here, never through localStorage. No price or season ever
 * belongs in this shape — those are always recomputed server/DB-side.
 */
export interface BookingEntry {
  packageId?: string;
  // Set for route-based transfers (routes/route_pricing tables, see
  // BookingWidget's pickup/drop picker) instead of packageId — the two are
  // mutually exclusive, never both set (see parseBookingEntry).
  routeId?: string;
  packageTitle?: string;
  packageSlug?: string;
  packageType?: BookingType;
  vehicle?: VehicleType;
  date?: string;
  time?: string;
  pickup?: string;
  dropoff?: string;
  passengers?: number;
}

const VEHICLE_TYPES: readonly VehicleType[] = ['sedan', 'suv_normal', 'suv_deluxe', 'suv_luxury'];
const PACKAGE_TYPES: readonly BookingType[] = ['tour', 'transfer'];

function tomorrowIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// Step2TripDetails requires the trip date to be at least tomorrow — an entry
// URL carrying an earlier (or malformed) date is dropped rather than passed through.
function isValidFutureDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= tomorrowIso();
}

export function buildBookingUrl(entry: BookingEntry): string {
  const params = new URLSearchParams();

  if (entry.packageId) params.set('packageId', entry.packageId);
  if (entry.routeId) params.set('routeId', entry.routeId);
  if (entry.packageTitle) params.set('packageTitle', entry.packageTitle);
  if (entry.packageSlug) params.set('packageSlug', entry.packageSlug);
  if (entry.packageType) params.set('packageType', entry.packageType);
  if (entry.vehicle) params.set('vehicle', entry.vehicle);
  if (entry.date) params.set('date', entry.date);
  if (entry.time) params.set('time', entry.time);
  if (entry.pickup) params.set('pickup', entry.pickup);
  if (entry.dropoff) params.set('dropoff', entry.dropoff);
  if (entry.passengers) params.set('passengers', String(entry.passengers));

  const qs = params.toString();
  return qs ? `/booking?${qs}` : '/booking';
}

// Parses with plain .get() — URLSearchParams already decodes, so calling
// decodeURIComponent again here would double-decode and throw on titles that
// contain a literal `%` (e.g. "100%" -> "100" -> second decode errors).
export function parseBookingEntry(sp: URLSearchParams): BookingEntry {
  const entry: BookingEntry = {};

  // packageId and routeId are mutually exclusive — a URL carrying both
  // (hand-built, scraped, stale bookmark) would otherwise let both a package
  // and a route reach the pricing dispatch downstream, which decides by
  // presence-check (routeId first) and would silently mask the conflict
  // rather than surface it. routeId wins; packageId is dropped entirely.
  const routeId = sp.get('routeId');
  if (routeId) {
    entry.routeId = routeId;
  } else {
    const packageId = sp.get('packageId');
    if (packageId) entry.packageId = packageId;
  }

  const packageTitle = sp.get('packageTitle');
  if (packageTitle) entry.packageTitle = packageTitle;

  const packageSlug = sp.get('packageSlug');
  if (packageSlug) entry.packageSlug = packageSlug;

  const packageType = sp.get('packageType');
  if (packageType && (PACKAGE_TYPES as string[]).includes(packageType)) {
    entry.packageType = packageType as BookingType;
  }

  const vehicle = sp.get('vehicle');
  if (vehicle && (VEHICLE_TYPES as string[]).includes(vehicle)) {
    entry.vehicle = vehicle as VehicleType;
  }

  const date = sp.get('date');
  if (date && isValidFutureDate(date)) entry.date = date;

  const time = sp.get('time');
  if (time && /^\d{2}:\d{2}$/.test(time)) entry.time = time;

  const pickup = sp.get('pickup');
  if (pickup) entry.pickup = pickup;

  const dropoff = sp.get('dropoff');
  if (dropoff) entry.dropoff = dropoff;

  const passengersRaw = sp.get('passengers');
  if (passengersRaw) {
    const n = parseInt(passengersRaw, 10);
    if (Number.isFinite(n)) entry.passengers = Math.min(10, Math.max(1, n));
  }

  return entry;
}
