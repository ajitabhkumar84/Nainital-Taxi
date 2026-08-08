import type { MonthDayRange, MultiDayRentalPage, SeasonOverride } from '@/lib/supabase/types';

export type SeasonTier = 'season' | 'mid_season' | 'off_season';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function toMonthDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

// Wraparound-safe: handles ranges that span the year boundary, e.g.
// { start: "12-20", end: "01-15" }.
export function isDateInMonthDayRange(mmdd: string, range: MonthDayRange): boolean {
  if (range.start <= range.end) {
    return mmdd >= range.start && mmdd <= range.end;
  }
  return mmdd >= range.start || mmdd <= range.end;
}

function matchesAnyRange(mmdd: string, ranges: MonthDayRange[] | undefined): boolean {
  return !!ranges?.some((range) => isDateInMonthDayRange(mmdd, range));
}

const OVERRIDE_TIER: Partial<Record<SeasonOverride, SeasonTier>> = {
  force_season: 'season',
  force_mid_season: 'mid_season',
  force_off_season: 'off_season',
};

// Determines which pricing tier is "active" right now: an explicit admin
// override wins outright; otherwise the tiers are matched against `date`,
// falling back to 'mid_season' (a safe middle price) if none of the
// configured ranges cover today — e.g. a gap left by an incomplete setup.
export function detectActiveSeasonTier(
  page: Pick<
    MultiDayRentalPage,
    'season_override' | 'pricing_season_ranges' | 'pricing_mid_season_ranges' | 'pricing_off_season_ranges'
  >,
  date: Date = new Date()
): SeasonTier {
  const overrideTier = OVERRIDE_TIER[page.season_override];
  if (overrideTier) return overrideTier;

  const mmdd = toMonthDay(date);
  if (matchesAnyRange(mmdd, page.pricing_season_ranges)) return 'season';
  if (matchesAnyRange(mmdd, page.pricing_mid_season_ranges)) return 'mid_season';
  if (matchesAnyRange(mmdd, page.pricing_off_season_ranges)) return 'off_season';
  return 'mid_season';
}

export function formatMonthDay(mmdd: string): string {
  const [month, day] = mmdd.split('-').map(Number);
  if (!month || !day) return mmdd;
  return `${day} ${MONTH_NAMES[month - 1]}`;
}

export function formatMonthDayRange(range: MonthDayRange): string {
  return `${formatMonthDay(range.start)} – ${formatMonthDay(range.end)}`;
}

export function formatMonthDayRanges(ranges: MonthDayRange[] | undefined): string[] {
  return (ranges || []).map(formatMonthDayRange);
}

// ---------------------------------------------------------------------------
// Trip-level seasonality: which tier(s) a guest's actual travel dates fall in
// ---------------------------------------------------------------------------

export type SeasonPage = Pick<
  MultiDayRentalPage,
  'season_override' | 'pricing_season_ranges' | 'pricing_mid_season_ranges' | 'pricing_off_season_ranges'
>;

export interface TierBreakdown {
  /** Inclusive day count: 12 Aug -> 17 Aug is 6 days. */
  totalDays: number;
  /** Days falling in each tier. Tiers not present in the trip are 0. */
  counts: Record<SeasonTier, number>;
  /** Tiers the trip actually touches, in order of first occurrence. */
  tiers: SeasonTier[];
}

/** Guards the day-by-day walk below against absurd ranges. */
export const MAX_TRIP_DAYS = 60;

/**
 * Parses a "YYYY-MM-DD" value (what <input type="date"> produces) into a
 * LOCAL-midnight Date. `new Date("2026-08-12")` would parse as UTC midnight,
 * which lands on the previous day west of Greenwich and can shift a trip into
 * the wrong season.
 */
export function parseISODateLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Local-midnight "YYYY-MM-DD", for <input type="date" min=...>. */
export function toISODateLocal(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Walks the trip day by day and tallies which pricing tier each day falls in.
 * A multi-day trip can straddle two tiers (e.g. 8–12 Jul crosses a peak/mid
 * boundary), so a single "the trip is peak season" answer would misquote it.
 *
 * An admin season override applies to every day, since detectActiveSeasonTier
 * returns the forced tier regardless of date.
 *
 * Returns null if the dates are unparseable, reversed, or longer than
 * MAX_TRIP_DAYS.
 */
export function getTierBreakdown(
  page: SeasonPage,
  startValue: string,
  endValue: string
): TierBreakdown | null {
  const start = parseISODateLocal(startValue);
  const end = parseISODateLocal(endValue);
  if (!start || !end || end < start) return null;

  const counts: Record<SeasonTier, number> = { season: 0, mid_season: 0, off_season: 0 };
  const tiers: SeasonTier[] = [];
  let totalDays = 0;

  const cursor = new Date(start);
  while (cursor <= end) {
    if (totalDays >= MAX_TRIP_DAYS) return null;
    const tier = detectActiveSeasonTier(page, cursor);
    counts[tier] += 1;
    if (!tiers.includes(tier)) tiers.push(tier);
    totalDays += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return { totalDays, counts, tiers };
}

const DISPLAY_DATE_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

/** "12 Aug – 17 Aug", for echoing the guest's own dates back to them. */
export function formatTripDates(startValue: string, endValue: string): string | null {
  const start = parseISODateLocal(startValue);
  const end = parseISODateLocal(endValue);
  if (!start || !end) return null;
  const format = (date: Date) => date.toLocaleDateString('en-IN', DISPLAY_DATE_FORMAT);
  return `${format(start)} – ${format(end)}`;
}
