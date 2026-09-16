/**
 * WEEKLY OPERATIONAL & ANALYTICS BRIEF — CRON ENTRY POINT
 *
 * Triggered by Vercel Cron (see vercel.json, Sunday 08:00 IST) and gated by
 * src/middleware.ts's CRON_SECRET check — nothing here re-checks auth, per
 * CLAUDE.md invariant #4.
 *
 * Assembles three independent, failure-isolated sections
 * (src/lib/reports/weeklyAuditData.ts), renders one email
 * (src/lib/reports/weeklyAuditEmail.ts), and sends it via Resend. A thrown
 * error in any one `buildXSection()` call degrades only that section — via
 * the outer Promise.allSettled below — rather than aborting before Resend
 * gets a chance to send anything. This runs unattended once a week; nobody
 * is watching the logs live when it fires.
 */

import { NextResponse } from 'next/server';
import {
  buildAnalyticsSection,
  buildCalendarSection,
  buildHealthSection,
  deriveActionItems,
  type AnalyticsSectionData,
  type CalendarSectionData,
  type HealthSectionData,
  type SectionResult,
} from '@/lib/reports/weeklyAuditData';
import { renderWeeklyAuditEmail } from '@/lib/reports/weeklyAuditEmail';
import { sendWeeklyAuditEmail } from '@/lib/notifications';

// No cookies()/headers() call here to force dynamic rendering naturally, so
// this is needed to stop Next.js treating a bare GET as a static-optimization
// candidate.
export const dynamic = 'force-dynamic';

// Declaring this doesn't force every run to actually take 60s — the health
// section's own live-probe crawl is hard-budgeted to 4s (see
// weeklyAuditData.ts), sized to fit comfortably under a conservative Hobby-
// tier ~10s ceiling. This just stops the route's own Next.js default from
// cutting off a run on a plan that honors a longer value.
export const maxDuration = 60;

function unwrap<T>(result: PromiseSettledResult<SectionResult<T>>, label: string): SectionResult<T> {
  if (result.status === 'fulfilled') return result.value;
  const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
  return { ok: false, error: `${label} threw unexpectedly: ${reason}` };
}

export async function GET() {
  const now = new Date();

  // Pure instant arithmetic — never a UTC-midnight rounding. This cron always
  // fires at 02:30 UTC (08:00 IST, see vercel.json), so a rolling 7-day
  // window from execution time already lands exactly on an IST
  // Sunday-morning-to-Sunday-morning boundary with no special-casing needed.
  // Rounding to setUTCHours(0,0,0,0) instead would cut the week 5.5 hours off
  // from the actual IST business day.
  const thisWeek = { from: new Date(now.getTime() - 7 * 86400000).toISOString(), to: now.toISOString() };
  const lastWeek = { from: new Date(now.getTime() - 14 * 86400000).toISOString(), to: thisWeek.from };

  const [analyticsSettled, calendarSettled, healthSettled] = await Promise.allSettled([
    buildAnalyticsSection({ thisWeek, lastWeek }),
    buildCalendarSection(),
    buildHealthSection(),
  ]);

  const analytics: SectionResult<AnalyticsSectionData> = unwrap(analyticsSettled, 'Analytics section');
  const calendar: SectionResult<CalendarSectionData> = unwrap(calendarSettled, 'Calendar section');
  const health: SectionResult<HealthSectionData> = unwrap(healthSettled, 'Site health section');

  const actionItems = deriveActionItems(analytics, calendar, health);

  // Display formatting only, in IST for readability — not the window math
  // above, which is deliberately timezone-free instant arithmetic.
  const dayMonth = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' });
  const dayMonthYear = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const periodLabel = `${dayMonth.format(new Date(thisWeek.from))} – ${dayMonthYear.format(now)} (IST)`;
  const generatedAtLabel = `${new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(now)} IST`;

  const html = renderWeeklyAuditEmail({
    periodLabel,
    generatedAtLabel,
    analytics,
    calendar,
    health,
    actionItems,
  });

  const sendResult = await sendWeeklyAuditEmail(html, 'Weekly Operational & Analytics Brief');

  return NextResponse.json({
    success: sendResult.ok,
    emailError: sendResult.ok ? undefined : sendResult.reason,
    sections: {
      analytics: analytics.ok,
      calendar: calendar.ok,
      health: health.ok,
    },
  });
}
