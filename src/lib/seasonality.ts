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
