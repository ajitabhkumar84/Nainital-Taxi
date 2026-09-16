/**
 * WEEKLY AUDIT — EMAIL RENDERER
 *
 * Pure function: data in, HTML string out. Table-based, inline-styled,
 * Outlook-safe (no flexbox/grid, no external stylesheet, no emojis) — same
 * constraints as the templates in src/lib/notifications.ts, which this reuses
 * escapeHtml/formatPrice/formatDate from.
 *
 * Never throws. A section with `ok: false` renders its own amber "data
 * unavailable" block instead of the normal content, so one bad section can't
 * take the rendering itself down after everything else already built fine.
 */

import { escapeHtml } from '@/lib/notifications';
import { formatPrice } from '@/lib/booking';
import { VEHICLE_TYPES } from '@/lib/supabase/types';
import type {
  AnalyticsSectionData,
  CalendarSectionData,
  HealthSectionData,
  SectionResult,
} from './weeklyAuditData';

const COLORS = {
  pageBg: '#f1f5f9',
  cardBg: '#ffffff',
  header: '#0f172a',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  tableHeaderBg: '#f8fafc',
  amberBg: '#fffbeb',
  amberBorder: '#fcd34d',
  amberText: '#92400e',
};

export interface WeeklyAuditEmailInput {
  periodLabel: string;
  generatedAtLabel: string;
  analytics: SectionResult<AnalyticsSectionData>;
  calendar: SectionResult<CalendarSectionData>;
  health: SectionResult<HealthSectionData>;
  actionItems: string[];
}

function sectionHeading(title: string): string {
  return `<tr><td style="padding:24px 24px 4px;"><h2 style="margin:0;color:${COLORS.text};font-size:16px;border-bottom:2px solid ${COLORS.border};padding-bottom:8px;">${escapeHtml(title)}</h2></td></tr>`;
}

function unavailableBlock(error: string): string {
  return `<tr><td style="padding:8px 24px 20px;">
    <div style="background-color:${COLORS.amberBg};border:1px solid ${COLORS.amberBorder};border-radius:8px;padding:12px 16px;">
      <p style="margin:0;color:${COLORS.amberText};font-size:13px;font-weight:600;">Data unavailable</p>
      <p style="margin:4px 0 0;color:${COLORS.amberText};font-size:12px;">${escapeHtml(error)}</p>
    </div>
  </td></tr>`;
}

function table(headers: string[], rows: string[][]): string {
  const thead = headers
    .map(
      (h) =>
        `<th style="text-align:left;padding:8px 10px;background-color:${COLORS.tableHeaderBg};color:${COLORS.textSecondary};font-size:11px;text-transform:uppercase;letter-spacing:0.02em;border-bottom:1px solid ${COLORS.border};">${escapeHtml(h)}</th>`
    )
    .join('');
  const tbody = rows
    .map(
      (r) =>
        `<tr>${r.map((c) => `<td style="padding:8px 10px;border-bottom:1px solid ${COLORS.border};color:${COLORS.text};font-size:13px;">${c}</td>`).join('')}</tr>`
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-top:8px;"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

function deltaLabel(current: number, previous: number): string {
  if (previous === 0 && current === 0) return '–';
  if (previous === 0) return 'new';
  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? '+' : '';
  return `${sign}${delta.toFixed(0)}%`;
}

function kpiRow(
  label: string,
  thisWeek: number,
  lastWeek: number,
  formatter: (n: number) => string = (n) => String(n)
): string[] {
  return [escapeHtml(label), formatter(thisWeek), formatter(lastWeek), deltaLabel(thisWeek, lastWeek)];
}

function topList(title: string, items: Array<{ name: string; count: number }>): string {
  if (items.length === 0) {
    return `<p style="margin:12px 0 0;color:${COLORS.textSecondary};font-size:12px;">${escapeHtml(title)}: none this week.</p>`;
  }
  const rows = items
    .map((i) => `<li style="margin:0 0 4px;color:${COLORS.text};font-size:13px;">${escapeHtml(i.name)} — ${i.count}</li>`)
    .join('');
  return `<p style="margin:12px 0 4px;color:${COLORS.text};font-size:13px;font-weight:600;">${escapeHtml(title)}</p><ul style="margin:0;padding-left:18px;">${rows}</ul>`;
}

function demandBreakdown(rec: Record<string, number>): string {
  const entries = Object.entries(rec);
  if (entries.length === 0) return 'none';
  return entries.map(([reason, count]) => `${escapeHtml(reason)}: ${count}`).join(', ');
}

function renderAnalyticsSection(result: SectionResult<AnalyticsSectionData>): string {
  const heading = sectionHeading('1. Booking Funnel & Traffic');
  if (!result.ok) return heading + unavailableBlock(result.error);

  const data = result.data;
  if (!data.posthogConfigured) {
    return (
      heading +
      `<tr><td style="padding:0 24px 20px;"><p style="margin:0;color:${COLORS.textSecondary};font-size:13px;">PostHog is not configured (POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID not set) — this section populates once those are added in Vercel.</p></td></tr>`
    );
  }

  const unavailableTotal = (rec: Record<string, number>) => Object.values(rec).reduce((a, b) => a + b, 0);

  const kpiRows: string[][] = [
    kpiRow('Step 1 sessions', data.funnel.thisWeek[1] ?? 0, data.funnel.lastWeek[1] ?? 0),
    kpiRow('Step 2 sessions', data.funnel.thisWeek[2] ?? 0, data.funnel.lastWeek[2] ?? 0),
    kpiRow('Step 3 sessions', data.funnel.thisWeek[3] ?? 0, data.funnel.lastWeek[3] ?? 0),
    kpiRow('Step 4 sessions', data.funnel.thisWeek[4] ?? 0, data.funnel.lastWeek[4] ?? 0),
    kpiRow('Bookings created', data.bookingConversion.thisWeek, data.bookingConversion.lastWeek),
    kpiRow('Pageviews', data.traffic.thisWeek.pageviews, data.traffic.lastWeek.pageviews),
    kpiRow('Unique sessions', data.traffic.thisWeek.sessions, data.traffic.lastWeek.sessions),
    kpiRow('Instant quotes', data.inquiries.thisWeek.quotes, data.inquiries.lastWeek.quotes),
    kpiRow('Contact form submissions', data.inquiries.thisWeek.contactForms, data.inquiries.lastWeek.contactForms),
    kpiRow('WhatsApp CTA clicks', data.whatsappClicks.thisWeek, data.whatsappClicks.lastWeek),
    kpiRow(
      'Unfulfilled demand (blocked/sold out/no price)',
      unavailableTotal(data.unavailableDemand.thisWeek),
      unavailableTotal(data.unavailableDemand.lastWeek)
    ),
    kpiRow('Advance revenue collected', data.advanceRevenue.thisWeek, data.advanceRevenue.lastWeek, formatPrice),
  ];

  const dropOffLine = data.funnel.biggestDropOff
    ? `<p style="margin:12px 0 0;color:${COLORS.text};font-size:13px;">Biggest drop-off: <strong>${data.funnel.biggestDropOff.dropPct.toFixed(0)}%</strong> of sessions leave between Step ${data.funnel.biggestDropOff.fromStep} and Step ${data.funnel.biggestDropOff.toStep}.</p>`
    : `<p style="margin:12px 0 0;color:${COLORS.textSecondary};font-size:13px;">Not enough step data this week to compute a drop-off.</p>`;

  const warningsNote =
    data.queryWarnings.length > 0
      ? `<p style="margin:12px 0 0;color:${COLORS.textSecondary};font-size:11px;">Some sub-queries did not return data: ${data.queryWarnings.map(escapeHtml).join('; ')}</p>`
      : '';

  return (
    heading +
    `<tr><td style="padding:0 24px 20px;">
      ${table(['Metric', 'This Week', 'Last Week', 'Δ'], kpiRows)}
      ${dropOffLine}
      <p style="margin:8px 0 0;color:${COLORS.textSecondary};font-size:12px;">Unfulfilled demand this week by reason: ${demandBreakdown(data.unavailableDemand.thisWeek)}</p>
      ${topList('Top viewed packages', data.topViewedPackages)}
      ${topList('Top viewed routes', data.topViewedRoutes)}
      ${topList('Top booked packages', data.topBookedPackages)}
      ${topList('Top booked routes', data.topBookedRoutes)}
      ${warningsNote}
    </td></tr>`
  );
}

function renderCalendarSection(result: SectionResult<CalendarSectionData>): string {
  const heading = sectionHeading('2. Fleet Calendar & Seasonality');
  if (!result.ok) return heading + unavailableBlock(result.error);

  const data = result.data;

  const seasonLine = `<p style="margin:0;color:${COLORS.text};font-size:13px;">Current season: <strong>${escapeHtml(data.currentSeason.name)}</strong>${
    data.currentSeason.endDate ? ` (through ${escapeHtml(data.currentSeason.endDate)})` : ''
  }</p>`;

  const expiryWarning = data.seasonExpiringSoon
    ? `<p style="margin:6px 0 0;color:${COLORS.amberText};font-size:13px;font-weight:600;">Expires in ${data.seasonExpiringSoon.daysLeft} day(s) — add the next season's pricing before then.</p>`
    : '';

  const blockedBlock =
    data.blockedDates.length > 0
      ? table(['Date', 'Status'], data.blockedDates.map((d) => [escapeHtml(d.date), escapeHtml(d.status)]))
      : `<p style="margin:8px 0 0;color:${COLORS.textSecondary};font-size:13px;">No blocked dates in the next ${data.blockedDatesWindowDays} days. Blocking is fleet-wide — there is no per-vehicle calendar.</p>`;

  const outlookBlock = data.outlook.isEmpty
    ? `<p style="margin:8px 0 0;color:${COLORS.amberText};font-size:13px;">Nothing entered for the next ${data.outlook.windowDays} days — there is no recurrence engine, so this is a data-completeness gap, not a confirmed quiet period.</p>`
    : `${
        data.outlook.seasons.length > 0
          ? table(
              ['Season', 'Start', 'End'],
              data.outlook.seasons.map((s) => [escapeHtml(s.name), escapeHtml(s.startDate), escapeHtml(s.endDate)])
            )
          : ''
      }${
        data.outlook.blackouts.length > 0
          ? table(
              ['Blackout Start', 'Blackout End', 'Reason'],
              data.outlook.blackouts.map((b) => [escapeHtml(b.startDate), escapeHtml(b.endDate), escapeHtml(b.reason || '—')])
            )
          : ''
      }`;

  const syncLine = data.calendarSync.lastSyncedAt
    ? `<p style="margin:12px 0 0;color:${data.calendarSync.isStale ? COLORS.amberText : COLORS.textSecondary};font-size:12px;">Google Calendar last synced ${escapeHtml(data.calendarSync.lastSyncedAt)}${
        data.calendarSync.isStale ? ` — ${data.calendarSync.staleDays} day(s) ago, stale` : ''
      }.</p>`
    : `<p style="margin:12px 0 0;color:${COLORS.amberText};font-size:12px;">Google Calendar has never synced (or its status is unknown).</p>`;

  const fleetLine = `<p style="margin:12px 0 0;color:${COLORS.text};font-size:13px;">Next ${data.upcomingFleet.windowDays} days: <strong>${data.upcomingFleet.confirmedTrips}</strong> confirmed trips, <strong>${formatPrice(
    data.upcomingFleet.expectedRevenue
  )}</strong> expected revenue (every non-cancelled booking on the books, not confirmed-only).</p>`;

  return (
    heading +
    `<tr><td style="padding:0 24px 20px;">
      ${seasonLine}
      ${expiryWarning}
      <p style="margin:16px 0 4px;color:${COLORS.text};font-size:13px;font-weight:600;">Blocked dates (next ${data.blockedDatesWindowDays} days)</p>
      ${blockedBlock}
      <p style="margin:16px 0 4px;color:${COLORS.text};font-size:13px;font-weight:600;">Outlook (next ${data.outlook.windowDays} days)</p>
      ${outlookBlock}
      ${syncLine}
      ${fleetLine}
    </td></tr>`
  );
}

function renderHealthSection(result: SectionResult<HealthSectionData>): string {
  const heading = sectionHeading('3. Site Health');
  if (!result.ok) return heading + unavailableBlock(result.error);

  const data = result.data;

  const liveIssues = data.brokenLinks.liveChecked.filter((r) => !r.ok);
  const dataIssues = data.brokenLinks.dataValidated.filter((r) => !r.ok);

  const linkSummary = `<p style="margin:0;color:${COLORS.text};font-size:13px;">${data.brokenLinks.verifiedLiveCount} page(s) verified live, ${data.brokenLinks.dataValidatedCount} checked via data validation — <strong>${data.brokenLinks.issuesCount}</strong> issue(s) found.</p>`;

  const liveIssuesTable =
    liveIssues.length > 0
      ? table(
          ['URL', 'Status', 'Error'],
          liveIssues.map((r) => [escapeHtml(r.url), r.status ? String(r.status) : '—', escapeHtml(r.error || '')])
        )
      : '';
  const dataIssuesTable =
    dataIssues.length > 0
      ? table(['URL', 'Reason'], dataIssues.map((r) => [escapeHtml(r.url), escapeHtml(r.reason || '')]))
      : '';

  const pricingZero = data.pricingIssues.zeroOrInvalid;
  const pricingZeroBlock =
    pricingZero.length > 0
      ? table(
          ['Table', 'Ref ID', 'Vehicle', 'Season', 'Price'],
          pricingZero.map((p) => [escapeHtml(p.table), escapeHtml(p.refId), escapeHtml(p.vehicleType), escapeHtml(p.seasonName), String(p.price)])
        )
      : `<p style="margin:8px 0 0;color:${COLORS.textSecondary};font-size:13px;">No ₹0/invalid priced rows found.</p>`;

  const zeroPriced = data.pricingIssues.zeroPricedItems;
  const zeroPricedBlock =
    zeroPriced.length > 0
      ? table(['Type', 'Name'], zeroPriced.map((z) => [escapeHtml(z.kind), escapeHtml(z.name)]))
      : `<p style="margin:8px 0 0;color:${COLORS.textSecondary};font-size:13px;">No fully unpriced active packages/routes.</p>`;

  const coverage = data.pricingIssues.vehicleTierCoverage;
  const coverageBlock =
    coverage.length > 0
      ? `<ul style="margin:8px 0 0;padding-left:18px;">${coverage
          .map(
            (c) =>
              `<li style="margin:0 0 4px;color:${COLORS.textSecondary};font-size:12px;">${escapeHtml(c.name)}: ${c.pricedTiers}/${c.totalTiers} vehicle tiers priced this season</li>`
          )
          .join('')}</ul>`
      : `<p style="margin:8px 0 0;color:${COLORS.textSecondary};font-size:12px;">Every priced item covers all ${VEHICLE_TYPES.length} vehicle tiers this season (informational only — partial coverage is often intentional).</p>`;

  const resendLine = `<p style="margin:16px 0 0;color:${data.resendConfigured ? COLORS.textSecondary : COLORS.amberText};font-size:13px;">Resend config: ${
    data.resendConfigured ? 'present' : 'MISSING — check RESEND_API_KEY/FROM_EMAIL/ADMIN_EMAIL'
  }. This email arriving is itself proof of a working send.</p>`;

  const latency = data.latency;
  const latencyLine = latency.ok
    ? `<p style="margin:8px 0 0;color:${latency.isSlow ? COLORS.amberText : COLORS.textSecondary};font-size:13px;">Booking creation latency — cold: ${latency.coldStartMs}ms, warm (min of 2): <strong>${latency.warmMs}ms</strong>${
        latency.isSlow ? ' — SLOW' : ''
      }.</p>`
    : `<p style="margin:8px 0 0;color:${COLORS.amberText};font-size:13px;">Booking latency probe did not complete: ${escapeHtml(latency.probeError || 'unknown error')}.</p>`;

  const pending = data.pendingBookings;
  const pendingBlock =
    pending.length > 0
      ? table(
          ['Booking ID', 'Customer', 'Trip Date', 'Days Pending', 'Status'],
          pending.map((p) => [escapeHtml(p.bookingId), escapeHtml(p.customerName), escapeHtml(p.bookingDate), String(p.daysPending), escapeHtml(p.status)])
        )
      : `<p style="margin:8px 0 0;color:${COLORS.textSecondary};font-size:13px;">No bookings pending 48h+.</p>`;

  return (
    heading +
    `<tr><td style="padding:0 24px 20px;">
      <p style="margin:0 0 4px;color:${COLORS.text};font-size:13px;font-weight:600;">Broken links</p>
      ${linkSummary}
      ${liveIssuesTable}
      ${dataIssuesTable}

      <p style="margin:20px 0 4px;color:${COLORS.text};font-size:13px;font-weight:600;">Pricing integrity</p>
      ${pricingZeroBlock}
      ${zeroPricedBlock}
      ${coverageBlock}

      ${resendLine}
      ${latencyLine}

      <p style="margin:20px 0 4px;color:${COLORS.text};font-size:13px;font-weight:600;">Unresolved pending bookings (48h+)</p>
      ${pendingBlock}
    </td></tr>`
  );
}

function renderActionItems(items: string[]): string {
  return (
    sectionHeading('4. Action Items') +
    `<tr><td style="padding:0 24px 24px;">
      <ol style="margin:0;padding-left:20px;color:${COLORS.text};font-size:13px;line-height:1.8;">
        ${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}
      </ol>
    </td></tr>`
  );
}

export function renderWeeklyAuditEmail(input: WeeklyAuditEmailInput): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Operational & Analytics Brief</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.pageBg};font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.pageBg};padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background-color:${COLORS.cardBg};border-radius:12px;overflow:hidden;border:1px solid ${COLORS.border};">
          <tr><td style="padding:24px;background-color:${COLORS.header};">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Weekly Operational &amp; Analytics Brief</p>
            <p style="margin:6px 0 0;color:#cbd5e1;font-size:13px;">${escapeHtml(input.periodLabel)}</p>
            <p style="margin:2px 0 0;color:#94a3b8;font-size:12px;">Generated ${escapeHtml(input.generatedAtLabel)}</p>
          </td></tr>
          ${renderAnalyticsSection(input.analytics)}
          ${renderCalendarSection(input.calendar)}
          ${renderHealthSection(input.health)}
          ${renderActionItems(input.actionItems)}
          <tr><td style="padding:16px 24px;background-color:${COLORS.tableHeaderBg};border-top:1px solid ${COLORS.border};text-align:center;">
            <p style="margin:0;color:${COLORS.textSecondary};font-size:11px;">Nainital Taxi — automated weekly report. Not for guest distribution.</p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
