/**
 * SERVER-SIDE POSTHOG QUERY CLIENT
 *
 * Read-only counterpart to src/lib/analytics/capture.ts. That module sends
 * events from the browser through the /ingest proxy; this one runs on the
 * server (currently only from the weekly audit cron, src/app/api/cron/
 * weekly-audit/route.ts) and reads them back via PostHog's HogQL query API.
 *
 * Never throws. A missing key, a bad project id, or a network/HTTP failure
 * all resolve to `{ ok: false, error }` — matching the "report why, don't
 * throw" contract sendEmailWithResult() uses in src/lib/notifications.ts.
 * This runs unattended once a week; nobody is watching the logs live, so a
 * thrown error here must not be able to take down the whole report.
 *
 * POSTHOG_HOST defaults to the US cloud (matching the /ingest rewrite in
 * next.config.mjs, which points at us.i.posthog.com) and is overridable for
 * a project hosted on PostHog's EU cloud instead.
 */

import { ANALYTICS_EVENTS } from './events';

const PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const POSTHOG_HOST = process.env.POSTHOG_HOST || 'https://us.posthog.com';

export function isPosthogServerConfigured(): boolean {
  return Boolean(PERSONAL_API_KEY && PROJECT_ID);
}

type HogQLRawResult = { ok: true; rows: unknown[][] } | { ok: false; error: string };

/**
 * Low-level HogQL runner. Callers below build on this; nothing outside this
 * file should need to call it directly, but it's exported for a one-off query
 * that doesn't warrant its own helper.
 */
export async function runHogQL(query: string): Promise<HogQLRawResult> {
  if (!PERSONAL_API_KEY || !PROJECT_ID) {
    return { ok: false, error: 'POSTHOG_PERSONAL_API_KEY / POSTHOG_PROJECT_ID not configured' };
  }

  try {
    const response = await fetch(`${POSTHOG_HOST}/api/projects/${PROJECT_ID}/query/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PERSONAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query } }),
      // A single slow query must not be what makes the whole cron run miss
      // its execution budget — see the route handler's own time budget notes.
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return { ok: false, error: `PostHog API ${response.status}: ${text.slice(0, 300)}` };
    }

    const body = await response.json();
    const rows = Array.isArray(body?.results) ? (body.results as unknown[][]) : [];
    return { ok: true, rows };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown fetch error';
    return { ok: false, error: `PostHog query failed: ${reason}` };
  }
}

export type QueryOutcome<T> = { data: T; error: string | null };

const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/** Sessions per booking wizard step (1-4), from booking_step_viewed. */
export async function getFunnelStepCounts(
  fromIso: string,
  toIso: string
): Promise<QueryOutcome<Record<number, number>>> {
  const query = `
    SELECT properties.step AS step, count(DISTINCT properties.$session_id) AS sessions
    FROM events
    WHERE event = '${ANALYTICS_EVENTS.bookingStepViewed}'
      AND timestamp >= toDateTime('${fromIso}')
      AND timestamp < toDateTime('${toIso}')
    GROUP BY step
    ORDER BY step
  `;
  const result = await runHogQL(query);
  if (!result.ok) return { data: {}, error: result.error };

  const data: Record<number, number> = {};
  for (const row of result.rows) {
    const step = Number(row[0]);
    if (Number.isFinite(step)) data[step] = num(row[1]);
  }
  return { data, error: null };
}

/** Count of booking_created — the conversion event. */
export async function getBookingConversionCount(
  fromIso: string,
  toIso: string
): Promise<QueryOutcome<number>> {
  const query = `
    SELECT count()
    FROM events
    WHERE event = '${ANALYTICS_EVENTS.bookingCreated}'
      AND timestamp >= toDateTime('${fromIso}')
      AND timestamp < toDateTime('${toIso}')
  `;
  const result = await runHogQL(query);
  if (!result.ok) return { data: 0, error: result.error };
  return { data: num(result.rows[0]?.[0]), error: null };
}

/**
 * Top-N ids by event count for a given properties.<key> — used for both
 * "viewed" (booking_package_selected / booking_route_selected) and "booked"
 * (booking_created) breakdowns of packages and routes.
 */
export async function getTopByProperty(
  eventName: string,
  propertyKey: 'package_id' | 'route_id',
  fromIso: string,
  toIso: string,
  limit: number
): Promise<QueryOutcome<Array<{ id: string; count: number }>>> {
  const query = `
    SELECT properties.${propertyKey} AS id, count() AS c
    FROM events
    WHERE event = '${eventName}'
      AND properties.${propertyKey} IS NOT NULL
      AND properties.${propertyKey} != ''
      AND timestamp >= toDateTime('${fromIso}')
      AND timestamp < toDateTime('${toIso}')
    GROUP BY id
    ORDER BY c DESC
    LIMIT ${limit}
  `;
  const result = await runHogQL(query);
  if (!result.ok) return { data: [], error: result.error };

  const data = result.rows
    .filter((row) => row[0] != null && row[0] !== '')
    .map((row) => ({ id: String(row[0]), count: num(row[1]) }));
  return { data, error: null };
}

/** Secondary line item: raw pageviews + unique sessions. */
export async function getTrafficTotals(
  fromIso: string,
  toIso: string
): Promise<QueryOutcome<{ pageviews: number; sessions: number }>> {
  const query = `
    SELECT count() AS pageviews, count(DISTINCT properties.$session_id) AS sessions
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= toDateTime('${fromIso}')
      AND timestamp < toDateTime('${toIso}')
  `;
  const result = await runHogQL(query);
  if (!result.ok) return { data: { pageviews: 0, sessions: 0 }, error: result.error };
  const row = result.rows[0] || [0, 0];
  return { data: { pageviews: num(row[0]), sessions: num(row[1]) }, error: null };
}

/** Secondary line item: instant-quote + contact-form submissions. */
export async function getInquiryCounts(
  fromIso: string,
  toIso: string
): Promise<QueryOutcome<{ quotes: number; contactForms: number }>> {
  const query = `
    SELECT
      countIf(event = '${ANALYTICS_EVENTS.quoteRequested}') AS quotes,
      countIf(event = '${ANALYTICS_EVENTS.contactFormSubmitted}') AS contact_forms
    FROM events
    WHERE event IN ('${ANALYTICS_EVENTS.quoteRequested}', '${ANALYTICS_EVENTS.contactFormSubmitted}')
      AND timestamp >= toDateTime('${fromIso}')
      AND timestamp < toDateTime('${toIso}')
  `;
  const result = await runHogQL(query);
  if (!result.ok) return { data: { quotes: 0, contactForms: 0 }, error: result.error };
  const row = result.rows[0] || [0, 0];
  return { data: { quotes: num(row[0]), contactForms: num(row[1]) }, error: null };
}

/**
 * WhatsApp is a primary conversion channel for this business (see
 * <WhatsAppCTA> / ContactClickListener) and was otherwise invisible in this
 * report.
 */
export async function getWhatsappClickCount(
  fromIso: string,
  toIso: string
): Promise<QueryOutcome<number>> {
  const query = `
    SELECT count()
    FROM events
    WHERE event = '${ANALYTICS_EVENTS.contactWhatsappClicked}'
      AND timestamp >= toDateTime('${fromIso}')
      AND timestamp < toDateTime('${toIso}')
  `;
  const result = await runHogQL(query);
  if (!result.ok) return { data: 0, error: result.error };
  return { data: num(result.rows[0]?.[0]), error: null };
}

/**
 * booking_unavailable grouped by its existing `reason` property ('blocked',
 * 'sold_out', or 'no_price' — see Step2TripDetails.tsx). Shows actual customer
 * impact of blocked dates and pricing gaps, not just an admin-side data audit.
 * 'no_price' here doubles as a customer-facing confirmation of whatever the
 * server-side pricing-integrity check in the health section finds.
 */
export async function getUnavailableDemand(
  fromIso: string,
  toIso: string
): Promise<QueryOutcome<Record<string, number>>> {
  const query = `
    SELECT properties.reason AS reason, count() AS c
    FROM events
    WHERE event = '${ANALYTICS_EVENTS.bookingUnavailable}'
      AND timestamp >= toDateTime('${fromIso}')
      AND timestamp < toDateTime('${toIso}')
    GROUP BY reason
  `;
  const result = await runHogQL(query);
  if (!result.ok) return { data: {}, error: result.error };

  const data: Record<string, number> = {};
  for (const row of result.rows) {
    data[String(row[0] ?? 'unknown')] = num(row[1]);
  }
  return { data, error: null };
}
