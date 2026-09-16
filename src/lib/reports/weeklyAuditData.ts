/**
 * WEEKLY AUDIT — DATA GATHERING
 *
 * Three independent, failure-isolated sections for the weekly operational
 * email (src/app/api/cron/weekly-audit/route.ts renders and sends it). Each
 * `buildXSection()` returns `{ ok: true, data }` or `{ ok: false, error }` and
 * never throws — this runs unattended once a week, and one broken query (a
 * renamed column, a missing env var) must degrade its own section, not take
 * the whole report down before Resend gets a chance to send anything.
 *
 * Everything here reads live from Supabase/PostHog. Nothing is cached —
 * this runs once a week, so cache hit rate would be near zero anyway, and a
 * stale operational report defeats its own purpose.
 */

import { getAdminSupabaseClient } from '@/lib/supabase/admin';
import { supabase } from '@/lib/supabase/client';
import {
  getSeasonForDate,
  isBookingAllowed,
  getAvailabilityRange,
  getSeasonPeriods,
  getBlackoutPeriods,
} from '@/lib/supabase';
import { VEHICLE_TYPES } from '@/lib/supabase/types';
import { SITE_URL } from '@/lib/siteUrl';
import {
  getFunnelStepCounts,
  getBookingConversionCount,
  getTopByProperty,
  getTrafficTotals,
  getInquiryCounts,
  getWhatsappClickCount,
  getUnavailableDemand,
  isPosthogServerConfigured,
} from '@/lib/analytics/posthogServerQuery';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

export type SectionResult<T> = { ok: true; data: T } | { ok: false; error: string };

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

// booking_date/season end_date/etc. are plain DATE columns with no timezone.
// This cron always fires at 02:30 UTC (08:00 IST), which is well clear of the
// 18:30 UTC IST-midnight rollover, so the UTC calendar date always matches the
// IST calendar date at execution time — no timezone conversion needed here.
// (Contrast with the analytics window math in the route handler, which is
// about *instant* arithmetic for a rolling 7-day PostHog window, a different
// problem.)
function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(`${fromIso}T00:00:00Z`).getTime();
  const to = new Date(`${toIso}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86400000);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ============================================================================
// SECTION 1: ANALYTICS (PostHog)
// ============================================================================

// Named AuditTimeWindow rather than `Window` to avoid shadowing the DOM
// global of the same name.
export interface AuditTimeWindow {
  from: string;
  to: string;
}

export interface AuditWindows {
  thisWeek: AuditTimeWindow;
  lastWeek: AuditTimeWindow;
}

interface TopItem {
  id: string;
  name: string;
  count: number;
}

interface WeekPair<T> {
  thisWeek: T;
  lastWeek: T;
}

export type AnalyticsSectionData =
  | { posthogConfigured: false }
  | {
      posthogConfigured: true;
      funnel: {
        thisWeek: Record<number, number>;
        lastWeek: Record<number, number>;
        biggestDropOff: { fromStep: number; toStep: number; dropPct: number } | null;
      };
      bookingConversion: WeekPair<number>;
      topViewedPackages: TopItem[];
      topViewedRoutes: TopItem[];
      topBookedPackages: TopItem[];
      topBookedRoutes: TopItem[];
      traffic: WeekPair<{ pageviews: number; sessions: number }>;
      inquiries: WeekPair<{ quotes: number; contactForms: number }>;
      whatsappClicks: WeekPair<number>;
      unavailableDemand: WeekPair<Record<string, number>>;
      advanceRevenue: WeekPair<number>;
      queryWarnings: string[];
    };

function biggestDropOff(
  stepCounts: Record<number, number>
): { fromStep: number; toStep: number; dropPct: number } | null {
  let biggest: { fromStep: number; toStep: number; dropPct: number } | null = null;
  for (let step = 1; step <= 3; step++) {
    const from = stepCounts[step] ?? 0;
    const to = stepCounts[step + 1] ?? 0;
    if (from <= 0) continue;
    const dropPct = ((from - to) / from) * 100;
    if (!biggest || dropPct > biggest.dropPct) {
      biggest = { fromStep: step, toStep: step + 1, dropPct };
    }
  }
  return biggest;
}

// `(supabase.from as any)(...)` here (and at every other `packages`/`pricing`/
// `bookings` call site in this file): this hand-authored Database type
// (src/lib/supabase/types.ts) has no `Relationships` field on its table
// entries, which for these three tables specifically breaks supabase-js's
// query-builder inference and collapses the row type to `never` — invisible
// everywhere else in the codebase only because nothing else accesses a row
// property inline (existing callers just `return data || []` against an
// explicitly-typed function return, which `never[]` satisfies vacuously).
// The row shape is pinned by the explicit type below instead — same escape
// hatch CLAUDE.md documents for `routes`/`route_pricing`.
async function resolvePackageNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (await (supabase.from as any)('packages').select('*').in('id', ids)) as {
    data: Array<{ id: string; title: string }> | null;
  };
  const map: Record<string, string> = {};
  for (const row of data || []) map[row.id] = row.title;
  return map;
}

async function resolveRouteNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  // `routes` is not in the generated Database type (see CLAUDE.md's Supabase
  // client table) — same escape hatch sitemap.ts already uses.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from as any)('routes')
    .select('id, pickup_location, drop_location')
    .in('id', ids);
  const map: Record<string, string> = {};
  for (const row of (data || []) as Array<{ id: string; pickup_location: string; drop_location: string }>) {
    map[row.id] = `${row.pickup_location} to ${row.drop_location}`;
  }
  return map;
}

function withNames(items: Array<{ id: string; count: number }>, names: Record<string, string>): TopItem[] {
  return items.map((item) => ({ ...item, name: names[item.id] || `(deleted: ${item.id.slice(0, 8)})` }));
}

/**
 * Advance Revenue Collected: framed by booking-CREATION week (not
 * payment-received week), so it stays comparable with bookingConversion in
 * this same section. "Revenue collected this week" could also reasonably
 * mean "payments that landed this week" — that's a different, valid metric,
 * but not this one; don't silently redefine it later.
 *
 * There is no `advance_amount` column on `bookings` (see src/lib/notifications.ts —
 * it's computed at request time via calculateAdvanceAmount() and never
 * persisted), so this re-derives it from `final_price` for every row that has
 * actually had money change hands (payment_status received/verified) rather
 * than summing a column that doesn't exist.
 */
async function getAdvanceRevenueForWindow(window: AuditTimeWindow): Promise<number> {
  const { calculateAdvanceAmount } = await import('@/lib/booking');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (await (supabase.from as any)('bookings')
    .select('*')
    .in('payment_status', ['received', 'verified'])
    .gte('created_at', window.from)
    .lt('created_at', window.to)) as { data: Array<{ final_price: number }> | null };

  return (data || []).reduce((sum, row) => sum + calculateAdvanceAmount(row.final_price), 0);
}

export async function buildAnalyticsSection(windows: AuditWindows): Promise<SectionResult<AnalyticsSectionData>> {
  try {
    if (!isPosthogServerConfigured()) {
      return { ok: true, data: { posthogConfigured: false } };
    }

    const { thisWeek, lastWeek } = windows;
    const warnings: string[] = [];
    const note = (label: string, error: string | null) => {
      if (error) warnings.push(`${label}: ${error}`);
    };

    const [
      funnelThis,
      funnelLast,
      conversionThis,
      conversionLast,
      viewedPackages,
      viewedRoutes,
      bookedPackages,
      bookedRoutes,
      trafficThis,
      trafficLast,
      inquiriesThis,
      inquiriesLast,
      whatsappThis,
      whatsappLast,
      unavailableThis,
      unavailableLast,
      advanceRevenueThis,
      advanceRevenueLast,
    ] = await Promise.all([
      getFunnelStepCounts(thisWeek.from, thisWeek.to),
      getFunnelStepCounts(lastWeek.from, lastWeek.to),
      getBookingConversionCount(thisWeek.from, thisWeek.to),
      getBookingConversionCount(lastWeek.from, lastWeek.to),
      getTopByProperty(ANALYTICS_EVENTS.bookingPackageSelected, 'package_id', thisWeek.from, thisWeek.to, 3),
      getTopByProperty(ANALYTICS_EVENTS.bookingRouteSelected, 'route_id', thisWeek.from, thisWeek.to, 3),
      getTopByProperty(ANALYTICS_EVENTS.bookingCreated, 'package_id', thisWeek.from, thisWeek.to, 3),
      getTopByProperty(ANALYTICS_EVENTS.bookingCreated, 'route_id', thisWeek.from, thisWeek.to, 3),
      getTrafficTotals(thisWeek.from, thisWeek.to),
      getTrafficTotals(lastWeek.from, lastWeek.to),
      getInquiryCounts(thisWeek.from, thisWeek.to),
      getInquiryCounts(lastWeek.from, lastWeek.to),
      getWhatsappClickCount(thisWeek.from, thisWeek.to),
      getWhatsappClickCount(lastWeek.from, lastWeek.to),
      getUnavailableDemand(thisWeek.from, thisWeek.to),
      getUnavailableDemand(lastWeek.from, lastWeek.to),
      getAdvanceRevenueForWindow(thisWeek).catch((e) => {
        warnings.push(`Advance revenue (this week): ${errorMessage(e)}`);
        return 0;
      }),
      getAdvanceRevenueForWindow(lastWeek).catch((e) => {
        warnings.push(`Advance revenue (last week): ${errorMessage(e)}`);
        return 0;
      }),
    ]);

    note('Funnel (this week)', funnelThis.error);
    note('Funnel (last week)', funnelLast.error);
    note('Booking conversion (this week)', conversionThis.error);
    note('Booking conversion (last week)', conversionLast.error);
    note('Top viewed packages', viewedPackages.error);
    note('Top viewed routes', viewedRoutes.error);
    note('Top booked packages', bookedPackages.error);
    note('Top booked routes', bookedRoutes.error);
    note('Traffic (this week)', trafficThis.error);
    note('Traffic (last week)', trafficLast.error);
    note('Inquiries (this week)', inquiriesThis.error);
    note('Inquiries (last week)', inquiriesLast.error);
    note('WhatsApp clicks (this week)', whatsappThis.error);
    note('WhatsApp clicks (last week)', whatsappLast.error);
    note('Unfulfilled demand (this week)', unavailableThis.error);
    note('Unfulfilled demand (last week)', unavailableLast.error);

    const nameIds = new Set([
      ...viewedPackages.data.map((i) => i.id),
      ...bookedPackages.data.map((i) => i.id),
    ]);
    const routeIds = new Set([...viewedRoutes.data.map((i) => i.id), ...bookedRoutes.data.map((i) => i.id)]);

    const [packageNames, routeNames] = await Promise.all([
      resolvePackageNames(Array.from(nameIds)),
      resolveRouteNames(Array.from(routeIds)),
    ]);

    return {
      ok: true,
      data: {
        posthogConfigured: true,
        funnel: {
          thisWeek: funnelThis.data,
          lastWeek: funnelLast.data,
          biggestDropOff: biggestDropOff(funnelThis.data),
        },
        bookingConversion: { thisWeek: conversionThis.data, lastWeek: conversionLast.data },
        topViewedPackages: withNames(viewedPackages.data, packageNames),
        topViewedRoutes: withNames(viewedRoutes.data, routeNames),
        topBookedPackages: withNames(bookedPackages.data, packageNames),
        topBookedRoutes: withNames(bookedRoutes.data, routeNames),
        traffic: { thisWeek: trafficThis.data, lastWeek: trafficLast.data },
        inquiries: { thisWeek: inquiriesThis.data, lastWeek: inquiriesLast.data },
        whatsappClicks: { thisWeek: whatsappThis.data, lastWeek: whatsappLast.data },
        unavailableDemand: { thisWeek: unavailableThis.data, lastWeek: unavailableLast.data },
        advanceRevenue: { thisWeek: advanceRevenueThis, lastWeek: advanceRevenueLast },
        queryWarnings: warnings,
      },
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

// ============================================================================
// SECTION 2: FLEET CALENDAR & SEASONALITY
// ============================================================================

const CALENDAR_SYNC_STALE_DAYS = 14;
const BLOCKED_DATES_WINDOW_DAYS = 15;
const OUTLOOK_WINDOW_DAYS = 90;
const UPCOMING_FLEET_WINDOW_DAYS = 7;
const SEASON_EXPIRY_WARNING_DAYS = 14;

export interface CalendarSectionData {
  currentSeason: { name: string; startDate: string | null; endDate: string | null };
  seasonExpiringSoon: { endDate: string; daysLeft: number } | null;
  blockedDates: Array<{ date: string; status: string }>;
  blockedDatesWindowDays: number;
  outlook: {
    seasons: Array<{ name: string; startDate: string; endDate: string }>;
    blackouts: Array<{ startDate: string; endDate: string; reason: string | null }>;
    isEmpty: boolean;
    windowDays: number;
  };
  calendarSync: { lastSyncedAt: string | null; staleDays: number | null; isStale: boolean };
  upcomingFleet: { confirmedTrips: number; expectedRevenue: number; windowDays: number };
}

export async function buildCalendarSection(): Promise<SectionResult<CalendarSectionData>> {
  try {
    const today = new Date();
    const todayIso = toDateOnly(today);
    const blockedWindowEndIso = toDateOnly(addDays(today, BLOCKED_DATES_WINDOW_DAYS));
    const outlookEndIso = toDateOnly(addDays(today, OUTLOOK_WINDOW_DAYS));
    const fleetWindowEndIso = toDateOnly(addDays(today, UPCOMING_FLEET_WINDOW_DAYS));

    const [availabilityRange, seasonPeriods, blackoutPeriods, currentSeasonRaw] = await Promise.all([
      getAvailabilityRange(todayIso, blockedWindowEndIso),
      getSeasonPeriods(),
      getBlackoutPeriods(),
      getSeasonForDate(todayIso),
    ]);

    const blockedDates = availabilityRange
      .filter((row) => !row.booking_allowed)
      .map((row) => ({ date: row.date, status: row.status }));

    const outlookSeasons = seasonPeriods
      .filter((s) => s.start_date <= outlookEndIso && s.end_date >= todayIso)
      .map((s) => ({ name: s.name, startDate: s.start_date, endDate: s.end_date }));

    const outlookBlackouts = blackoutPeriods
      .filter((b) => b.start_date <= outlookEndIso && b.end_date >= todayIso)
      .map((b) => ({ startDate: b.start_date, endDate: b.end_date, reason: b.reason }));

    // getSeasonForDate() doesn't return end_date, but getSeasonPeriods() does —
    // match by id rather than issuing a third query against `seasons`.
    const currentSeasonRow = currentSeasonRaw.id
      ? seasonPeriods.find((s) => s.id === currentSeasonRaw.id) || null
      : null;
    const currentSeason = {
      name: currentSeasonRaw.name,
      startDate: currentSeasonRow?.start_date ?? null,
      endDate: currentSeasonRow?.end_date ?? null,
    };

    let seasonExpiringSoon: { endDate: string; daysLeft: number } | null = null;
    if (currentSeason.endDate) {
      const daysLeft = daysBetween(todayIso, currentSeason.endDate);
      if (daysLeft >= 0 && daysLeft <= SEASON_EXPIRY_WARNING_DAYS) {
        seasonExpiringSoon = { endDate: currentSeason.endDate, daysLeft };
      }
    }

    const supabaseAdmin = getAdminSupabaseClient();

    // admin_settings is a key-value table (key TEXT PRIMARY KEY, value JSONB),
    // not a row with named columns — "last_calendar_sync" is a row, written by
    // src/app/api/calendar-sync/route.ts, not a column on a fixed schema.
    const { data: syncRow } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'last_calendar_sync')
      .maybeSingle();

    const lastSyncedAt = typeof syncRow?.value === 'string' ? syncRow.value : null;
    const staleDays = lastSyncedAt
      ? Math.floor((today.getTime() - new Date(lastSyncedAt).getTime()) / 86400000)
      : null;

    // upcoming_bookings view already filters out cancelled/completed and joins
    // the vehicle name (supabase/schema_enhanced.sql) — nothing new to build.
    // Not in the generated Database type (it's a view, not a table), hence `any`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: upcomingRows } = await (supabaseAdmin.from as any)('upcoming_bookings')
      .select('booking_date, status, final_price')
      .gte('booking_date', todayIso)
      .lte('booking_date', fleetWindowEndIso);

    const fleetRows = (upcomingRows || []) as Array<{ status: string; final_price: number }>;
    const confirmedTrips = fleetRows.filter((r) => r.status === 'confirmed').length;
    // "Expected" revenue: every non-cancelled trip on the books for the window,
    // not confirmed-only — some of it is still provisional until confirmed,
    // which the email labels explicitly.
    const expectedRevenue = fleetRows.reduce((sum, r) => sum + (r.final_price || 0), 0);

    return {
      ok: true,
      data: {
        currentSeason,
        seasonExpiringSoon,
        blockedDates,
        blockedDatesWindowDays: BLOCKED_DATES_WINDOW_DAYS,
        outlook: {
          seasons: outlookSeasons,
          blackouts: outlookBlackouts,
          isEmpty: outlookSeasons.length === 0 && outlookBlackouts.length === 0,
          windowDays: OUTLOOK_WINDOW_DAYS,
        },
        calendarSync: {
          lastSyncedAt,
          staleDays,
          isStale: staleDays === null || staleDays > CALENDAR_SYNC_STALE_DAYS,
        },
        upcomingFleet: {
          confirmedTrips,
          expectedRevenue,
          windowDays: UPCOMING_FLEET_WINDOW_DAYS,
        },
      },
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

// ============================================================================
// SECTION 3: SITE HEALTH
// ============================================================================

const CORE_PATHS = ['/', '/rates', '/contact', '/booking'];
const LIVE_PROBE_COUNT = 3; // top N active route pages, live-checked alongside CORE_PATHS
const CRAWL_BUDGET_MS = 4000;
const CRAWL_CONCURRENCY = 4;
const PROBE_TIMEOUT_MS = 3000;
const LATENCY_THRESHOLD_MS = 1000;
const PROBE_USER_AGENT = 'NainitalTaxi-WeeklyAudit/1.0';

interface ProbeResult {
  url: string;
  ok: boolean;
  status: number | null;
  error?: string;
}

async function probeUrl(url: string): Promise<ProbeResult> {
  try {
    let response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
      headers: { 'User-Agent': PROBE_USER_AGENT },
    });
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        headers: { 'User-Agent': PROBE_USER_AGENT },
      });
    }
    return { url, ok: response.ok, status: response.status };
  } catch (error) {
    return { url, ok: false, status: null, error: errorMessage(error) };
  }
}

/**
 * Concurrency-capped, time-budgeted crawl. Sized to fit comfortably under a
 * conservative Vercel Hobby-tier ~10s execution limit even in the worst case —
 * the bulk of the sitemap is validated in-memory below instead, at near-zero
 * time cost.
 */
async function probeUrlsWithBudget(urls: string[]): Promise<ProbeResult[]> {
  const results: ProbeResult[] = [];
  let index = 0;
  const deadline = Date.now() + CRAWL_BUDGET_MS;

  async function worker() {
    while (index < urls.length && Date.now() < deadline) {
      const url = urls[index++];
      results.push(await probeUrl(url));
    }
  }

  await Promise.all(Array.from({ length: Math.min(CRAWL_CONCURRENCY, urls.length) }, () => worker()));

  const checked = new Set(results.map((r) => r.url));
  for (const url of urls) {
    if (!checked.has(url)) {
      results.push({ url, ok: false, status: null, error: 'skipped: crawl time budget exceeded' });
    }
  }
  return results;
}

interface ValidatedRow {
  url: string;
  ok: boolean;
  reason?: string;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const isUrlSafeSlug = (slug: unknown): slug is string => typeof slug === 'string' && SLUG_RE.test(slug);

function validateDestination(row: {
  slug: string;
  name: string;
  hero_image_url: string | null;
  gallery_urls: string[] | null;
}): ValidatedRow {
  const url = `${SITE_URL}/destinations/${row.slug}`;
  if (!isUrlSafeSlug(row.slug)) return { url, ok: false, reason: 'invalid slug' };
  if (!row.name?.trim()) return { url, ok: false, reason: 'missing title' };
  if (!row.hero_image_url && !(row.gallery_urls && row.gallery_urls.length > 0)) {
    return { url, ok: false, reason: 'no image' };
  }
  return { url, ok: true };
}

function validatePackage(row: { slug: string; title: string; image_url: string | null }): ValidatedRow {
  const url = `${SITE_URL}/tour/${row.slug}`;
  if (!isUrlSafeSlug(row.slug)) return { url, ok: false, reason: 'invalid slug' };
  if (!row.title?.trim()) return { url, ok: false, reason: 'missing title' };
  if (!row.image_url) return { url, ok: false, reason: 'no image' };
  return { url, ok: true };
}

function validateRoute(row: { slug: string; pickup_location: string; drop_location: string }): ValidatedRow {
  const url = `${SITE_URL}/routes/${row.slug}`;
  if (!isUrlSafeSlug(row.slug)) return { url, ok: false, reason: 'invalid slug' };
  if (!row.pickup_location?.trim() || !row.drop_location?.trim()) {
    return { url, ok: false, reason: 'missing pickup/drop location' };
  }
  return { url, ok: true };
}

interface PricingIssue {
  table: 'pricing' | 'route_pricing';
  refId: string;
  vehicleType: string;
  seasonName: string;
  price: number;
}

interface ZeroPricedItem {
  kind: 'package' | 'route';
  id: string;
  name: string;
}

interface TierCoverage {
  kind: 'package' | 'route';
  id: string;
  name: string;
  pricedTiers: number;
  totalTiers: number;
}

async function buildPricingIssues(): Promise<{
  zeroOrInvalid: PricingIssue[];
  zeroPricedItems: ZeroPricedItem[];
  vehicleTierCoverage: TierCoverage[];
}> {
  const todayIso = toDateOnly(new Date());
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [pricingRes, routePricingRes, packagesRes, routesRes, currentSeason] = await Promise.all([
    (supabase.from as any)('pricing').select('*').eq('is_active', true),
    (supabase.from as any)('route_pricing').select('*').eq('is_active', true),
    (supabase.from as any)('packages').select('*').eq('is_active', true),
    (supabase.from as any)('routes').select('*').eq('is_active', true),
    getSeasonForDate(todayIso),
  ]);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const pricingRows = (pricingRes.data || []) as Array<{
    id: string;
    package_id: string;
    vehicle_type: string;
    season_name: string;
    price: number;
  }>;
  const routePricingRows = (routePricingRes.data || []) as Array<{
    id: string;
    route_id: string;
    vehicle_type: string;
    season_name: string;
    price: number;
  }>;
  const packages = (packagesRes.data || []) as Array<{ id: string; title: string }>;
  const routes = (routesRes.data || []) as Array<{ id: string; slug: string; pickup_location: string; drop_location: string }>;

  const zeroOrInvalid: PricingIssue[] = [
    ...pricingRows
      .filter((r) => r.price === 0 || Number.isNaN(r.price))
      .map((r) => ({
        table: 'pricing' as const,
        refId: r.package_id,
        vehicleType: r.vehicle_type,
        seasonName: r.season_name,
        price: r.price,
      })),
    ...routePricingRows
      .filter((r) => r.price === 0 || Number.isNaN(r.price))
      .map((r) => ({
        table: 'route_pricing' as const,
        refId: r.route_id,
        vehicleType: r.vehicle_type,
        seasonName: r.season_name,
        price: r.price,
      })),
  ];

  const pricedPackageIds = new Set(pricingRows.map((r) => r.package_id));
  const pricedRouteIds = new Set(routePricingRows.map((r) => r.route_id));

  const zeroPricedItems: ZeroPricedItem[] = [
    ...packages.filter((p) => !pricedPackageIds.has(p.id)).map((p) => ({ kind: 'package' as const, id: p.id, name: p.title })),
    ...routes
      .filter((r) => !pricedRouteIds.has(r.id))
      .map((r) => ({ kind: 'route' as const, id: r.id, name: `${r.pickup_location} to ${r.drop_location}` })),
  ];

  // Coverage against the fixed 4-value vehicle_type enum, for the CURRENT
  // season only. Informational — many packages intentionally skip a tier (a
  // heritage/luxury tour skipping the budget sedan is a business decision,
  // not a bug). Only partial (1-3 of 4) coverage is reported; 0/4 is already
  // covered by zeroPricedItems above, and 4/4 isn't interesting.
  const tiersByPackage = new Map<string, Set<string>>();
  for (const row of pricingRows) {
    if (row.season_name !== currentSeason.name) continue;
    if (!tiersByPackage.has(row.package_id)) tiersByPackage.set(row.package_id, new Set());
    tiersByPackage.get(row.package_id)!.add(row.vehicle_type);
  }
  const tiersByRoute = new Map<string, Set<string>>();
  for (const row of routePricingRows) {
    if (row.season_name !== currentSeason.name) continue;
    if (!tiersByRoute.has(row.route_id)) tiersByRoute.set(row.route_id, new Set());
    tiersByRoute.get(row.route_id)!.add(row.vehicle_type);
  }

  const vehicleTierCoverage: TierCoverage[] = [
    ...packages
      .map((p) => ({ kind: 'package' as const, id: p.id, name: p.title, pricedTiers: tiersByPackage.get(p.id)?.size ?? 0, totalTiers: VEHICLE_TYPES.length }))
      .filter((c) => c.pricedTiers > 0 && c.pricedTiers < VEHICLE_TYPES.length),
    ...routes
      .map((r) => ({
        kind: 'route' as const,
        id: r.id,
        name: `${r.pickup_location} to ${r.drop_location}`,
        pricedTiers: tiersByRoute.get(r.id)?.size ?? 0,
        totalTiers: VEHICLE_TYPES.length,
      }))
      .filter((c) => c.pricedTiers > 0 && c.pricedTiers < VEHICLE_TYPES.length),
  ];

  return { zeroOrInvalid, zeroPricedItems, vehicleTierCoverage };
}

interface LatencyResult {
  ok: boolean;
  coldStartMs: number | null;
  warmMs: number | null;
  isSlow: boolean;
  probeError?: string;
}

/**
 * A weekly cron hitting an otherwise-idle function will reliably catch a cold
 * start on the first request — reporting that single number as "the" latency
 * would be a false-positive slow-site alert. The first sample is recorded
 * separately (informational, never trips the SLOW flag on its own); the
 * pass/fail is evaluated against the minimum of the second and third ("warm")
 * samples.
 */
async function measureBookingLatency(): Promise<LatencyResult> {
  const fail = (probeError: string): LatencyResult => ({ ok: false, coldStartMs: null, warmMs: null, isSlow: false, probeError });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: packages } = (await (supabase.from as any)('packages').select('*').eq('is_active', true).limit(25)) as {
      data: Array<{ id: string }> | null;
    };
    if (!packages || packages.length === 0) return fail('No active packages to probe');

    let chosenPackageId: string | null = null;
    let chosenVehicleType: string | null = null;
    for (const pkg of packages) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-await-in-loop
      const { data: pricingRows } = (await (supabase.from as any)('pricing')
        .select('*')
        .eq('package_id', pkg.id)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(1)) as { data: Array<{ vehicle_type: string; price: number }> | null };
      if (pricingRows && pricingRows.length > 0) {
        chosenPackageId = pkg.id;
        chosenVehicleType = pricingRows[0].vehicle_type;
        break;
      }
    }
    if (!chosenPackageId || !chosenVehicleType) return fail('No active package has a priced vehicle');

    let probeDate: string | null = null;
    for (let offset = 14; offset <= 44; offset++) {
      const candidate = toDateOnly(addDays(new Date(), offset));
      // eslint-disable-next-line no-await-in-loop
      const status = await isBookingAllowed(candidate);
      if (status.allowed) {
        probeDate = candidate;
        break;
      }
    }
    if (!probeDate) return fail('No open date found in the next 44 days to probe');

    const payload = {
      customerName: 'Weekly Audit Bot',
      customerPhone: '9999999999',
      customerCountryCode: '91',
      packageId: chosenPackageId,
      packageName: 'Weekly Audit Probe',
      vehicleType: chosenVehicleType,
      tripDate: probeDate,
      tripTime: '10:00',
      pickupLocation: 'Weekly Audit Probe',
      passengers: 2,
      dryRun: true,
    };

    const timings: number[] = [];
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(`${SITE_URL}/api/bookings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      const elapsed = Date.now() - start;
      if (!response.ok) {
        return fail(`Probe request ${i + 1} returned HTTP ${response.status}`);
      }
      timings.push(elapsed);
    }

    const [coldStartMs, warm1, warm2] = timings;
    const warmMs = Math.min(warm1, warm2);
    return { ok: true, coldStartMs, warmMs, isSlow: warmMs > LATENCY_THRESHOLD_MS };
  } catch (error) {
    return fail(errorMessage(error));
  }
}

interface PendingBooking {
  bookingId: string;
  customerName: string;
  bookingDate: string;
  daysPending: number;
  status: string;
}

async function getUnresolvedPendingBookings(): Promise<PendingBooking[]> {
  const supabaseAdmin = getAdminSupabaseClient();
  const now = Date.now();
  const cutoff48h = new Date(now - 48 * 3600 * 1000).toISOString();
  const cutoff7d = new Date(now - 7 * 24 * 3600 * 1000).toISOString();

  const { data } = await supabaseAdmin
    .from('bookings')
    .select('id, customer_name, booking_date, status, created_at')
    .in('status', ['pending', 'payment_pending'])
    .lte('created_at', cutoff48h)
    .gte('created_at', cutoff7d)
    .order('created_at', { ascending: true });

  return (data || []).map((row) => ({
    bookingId: `NT-${String(row.id).slice(0, 8).toUpperCase()}`,
    customerName: row.customer_name,
    bookingDate: row.booking_date,
    daysPending: Math.floor((now - new Date(row.created_at).getTime()) / 86400000),
    status: row.status,
  }));
}

export interface HealthSectionData {
  brokenLinks: {
    liveChecked: ProbeResult[];
    dataValidated: ValidatedRow[];
    verifiedLiveCount: number;
    dataValidatedCount: number;
    issuesCount: number;
  };
  pricingIssues: {
    zeroOrInvalid: PricingIssue[];
    zeroPricedItems: ZeroPricedItem[];
    vehicleTierCoverage: TierCoverage[];
  };
  resendConfigured: boolean;
  latency: LatencyResult;
  pendingBookings: PendingBooking[];
}

export async function buildHealthSection(): Promise<SectionResult<HealthSectionData>> {
  try {
    const [destinationsRes, packagesRes, routesRes, multiDayRes] = await Promise.all([
      supabase.from('destinations').select('*').eq('is_active', true),
      supabase.from('packages').select('*').eq('is_active', true).eq('type', 'tour'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any)('routes')
        .select('*')
        .eq('is_active', true)
        .eq('show_as_route_page', true)
        .order('display_order', { ascending: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from as any)('multi_day_rental_page')
        .select('page_slug')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .eq('is_published', true)
        .maybeSingle(),
    ]);

    const destinations = destinationsRes.data || [];
    const packages = packagesRes.data || [];
    const routes = (routesRes.data || []) as Array<{ slug: string; pickup_location: string; drop_location: string }>;
    const multiDayRentalPage = multiDayRes.data as { page_slug: string } | null;

    const liveRoutes = routes.slice(0, LIVE_PROBE_COUNT);
    const remainingRoutes = routes.slice(LIVE_PROBE_COUNT);

    const liveUrls = [
      ...CORE_PATHS.map((p) => `${SITE_URL}${p}`),
      ...liveRoutes.map((r) => `${SITE_URL}/routes/${r.slug}`),
    ];
    const liveChecked = await probeUrlsWithBudget(liveUrls);

    const dataValidated: ValidatedRow[] = [
      ...destinations.map(validateDestination),
      ...packages.map(validatePackage),
      ...remainingRoutes.map(validateRoute),
      ...(multiDayRentalPage
        ? [
            isUrlSafeSlug(multiDayRentalPage.page_slug)
              ? { url: `${SITE_URL}/${multiDayRentalPage.page_slug}`, ok: true }
              : { url: `${SITE_URL}/${multiDayRentalPage.page_slug}`, ok: false, reason: 'invalid slug' },
          ]
        : []),
    ];

    const liveIssues = liveChecked.filter((r) => !r.ok).length;
    const dataIssues = dataValidated.filter((r) => !r.ok).length;

    const [pricingIssues, latency, pendingBookings] = await Promise.all([
      buildPricingIssues(),
      measureBookingLatency(),
      getUnresolvedPendingBookings(),
    ]);

    const resendConfigured = Boolean(
      process.env.RESEND_API_KEY && process.env.FROM_EMAIL && process.env.ADMIN_EMAIL
    );

    return {
      ok: true,
      data: {
        brokenLinks: {
          liveChecked,
          dataValidated,
          verifiedLiveCount: liveChecked.length,
          dataValidatedCount: dataValidated.length,
          issuesCount: liveIssues + dataIssues,
        },
        pricingIssues,
        resendConfigured,
        latency,
        pendingBookings,
      },
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

// ============================================================================
// ACTION ITEMS
// ============================================================================

const FUNNEL_DROPOFF_NOTABLE_PCT = 40;
const PENDING_BOOKINGS_BACKLOG_THRESHOLD = 3;

export function deriveActionItems(
  analytics: SectionResult<AnalyticsSectionData>,
  calendar: SectionResult<CalendarSectionData>,
  health: SectionResult<HealthSectionData>
): string[] {
  const items: string[] = [];

  if (!analytics.ok) items.push(`Analytics section failed to build: ${analytics.error}`);
  if (!calendar.ok) items.push(`Calendar section failed to build: ${calendar.error}`);
  if (!health.ok) items.push(`Site health section failed to build: ${health.error}`);

  if (health.ok) {
    const zeroCount = health.data.pricingIssues.zeroOrInvalid.length + health.data.pricingIssues.zeroPricedItems.length;
    if (zeroCount > 0) {
      items.push(`${zeroCount} pricing issue(s) found (₹0/invalid prices or fully unpriced items) — see Site Health.`);
    }

    if (health.data.latency.ok && health.data.latency.isSlow) {
      items.push(`Booking creation is slow under warm conditions (${health.data.latency.warmMs}ms) — see Site Health.`);
    }

    if (health.data.brokenLinks.issuesCount > 0) {
      items.push(`${health.data.brokenLinks.issuesCount} page(s) failed a health check — see Site Health.`);
    }

    if (health.data.pendingBookings.length >= PENDING_BOOKINGS_BACKLOG_THRESHOLD) {
      items.push(`${health.data.pendingBookings.length} bookings pending 48h+ with no payment update — follow up.`);
    }
  }

  if (calendar.ok && calendar.data.seasonExpiringSoon) {
    items.push(
      `Current season pricing expires in ${calendar.data.seasonExpiringSoon.daysLeft} day(s) (${calendar.data.seasonExpiringSoon.endDate}) — add the next season's pricing.`
    );
  }

  if (analytics.ok && analytics.data.posthogConfigured) {
    const dropOff = analytics.data.funnel.biggestDropOff;
    if (dropOff && dropOff.dropPct >= FUNNEL_DROPOFF_NOTABLE_PCT) {
      items.push(`Biggest funnel drop-off: ${dropOff.dropPct.toFixed(0)}% of sessions leave between step ${dropOff.fromStep} and step ${dropOff.toStep}.`);
    }
  }

  if (calendar.ok && calendar.data.calendarSync.isStale && calendar.data.calendarSync.staleDays !== null) {
    items.push(`Google Calendar sync hasn't run in ${calendar.data.calendarSync.staleDays} day(s).`);
  }

  // Never fabricates a finding: an empty list means the fallback message
  // below, not padding out to some artificial minimum count.
  if (items.length === 0) return ['No critical issues found this week.'];
  return items.slice(0, 3);
}
