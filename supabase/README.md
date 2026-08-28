# Database

Supabase Postgres. This directory holds the raw SQL for the schema.

## There is no migration pipeline

The `.sql` files here are meant to be **pasted into the Supabase SQL Editor by
hand**. There is no `config.toml`, so the Supabase CLI is not wired up either,
and the two files under `migrations/` are named that way by convention only —
nothing runs them automatically.

That means the files here are not a replayable history. They are a set of
scripts that were each applied once, in roughly the order they were written.
Treat the live database as the source of truth, not this directory.

## Bootstrapping a fresh project

Run these in the Supabase SQL Editor, in order:

1. `schema_enhanced.sql` — core tables, enums, views, indexes, triggers
2. `functions.sql` — database functions
3. `enable_rls_with_policies.sql` — row-level security
4. `seed_enhanced.sql` — sample vehicles, packages, destinations, pricing

Then apply the feature schemas added since. `RUN_ALL_MISSING_MIGRATIONS.sql`
bundles ten of them (route categories, ticker, trust section, multi-day rental,
add-ons, temples, admin audit log, reverse route links) plus the two RLS
hardening passes, and is safe to run once as a single script.

Finally, run `verify_launch_readiness.sql` — see below.

## Adding schema

- Write a **new, descriptively named** `.sql` file here. Do not edit
  `schema_enhanced.sql` retroactively — it is the historical baseline, and
  editing it makes the live database and this directory disagree silently.
- **Enable RLS with explicit policies on every new public-schema table.**
  This is not optional. Supabase grants `anon` + `authenticated` full CRUD by
  default on new public tables, and the anon key ships in every page's JS
  bundle. `harden_rls.sql` exists because four tables (`admin_settings`,
  `routes`, `route_pricing`, `booking_status_history`) went live without it,
  and the anon key could write to them in production.
- Admin writes use the service-role key and bypass RLS, so adding RLS never
  breaks the admin panel. It only blocks the public anon key.

## Verifying

`verify_launch_readiness.sql` is **read only** — every statement is a SELECT,
so it is safe to run against production and safe to re-run. It reports:

1. Whether RLS is actually enabled on every public table
2. Whether the anon key can write to anything
3. Whether the anon key can read tables holding customer data
4. Whether the indexes the query layer depends on exist
5. Whether any table is publishing to Realtime (should be none)
6. Database size against the 500 MB free-tier limit

Anything not reporting `PASS` in sections 1–3 is a security gate and needs
attention before shipping. Run it after any schema change.

## Core tables

| Table | Purpose |
|---|---|
| `packages` | Tour packages and transfers |
| `destinations` | Tourist locations with SEO content |
| `routes` / `route_pricing` | Point-to-point transfers and their fares |
| `route_categories` | Grouping for the `/rates` browser |
| `vehicles` | Fleet |
| `pricing` | Package fares — see the pricing model below |
| `seasons` | Date ranges that map to a season name |
| `booking_blackout` | Dates on which booking is refused |
| `availability` | Per-day fleet status |
| `bookings` / `booking_status_history` | Bookings and their audit trail |
| `reviews` | Testimonials, with a moderation flag |
| `admin_settings` | Key-value config (phone, UPI ID, site config blobs) |
| `profiles` | User accounts |
| `waitlist` | Queue for sold-out dates — schema and a query helper exist, but no UI currently uses it |

Plus the feature tables added later: temples and temple categories, add-ons,
pickup locations, the ticker, trust sections, the contact page, and the
multi-day rental page.

## Pricing model

Prices are **entered by hand, not computed from multipliers.** `pricing` is a
flat lookup table, unique on `(package_id, vehicle_type, season_name)`, holding
an integer rupee `price`. Routes work the same way via `route_pricing`.

There are exactly two season names, enforced by a CHECK constraint:
`'Off-Season'` and `'Season'`. The `seasons` table maps date ranges onto those
two names, with a `priority` column to break overlaps. A date matching no
season row falls back to `'Off-Season'`.

So resolving a fare is: find the season for the date → look up the row for that
package/vehicle/season. There is no formula, and no `base_price ×
vehicle_multiplier × season_multiplier` anywhere in the application — an older
version of this document described such a model, and it no longer exists.

Vehicle types are `sedan`, `suv_normal`, `suv_deluxe`, `suv_luxury`.

The booking path reads pricing **live and uncached**, deliberately — a stale
quote costs real money. See the caching policy at the top of
`src/lib/supabase/queries_enhanced.ts`.
