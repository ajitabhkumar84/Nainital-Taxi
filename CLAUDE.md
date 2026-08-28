# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

A production Next.js site for **Nainital Taxi** (nainitaltaxi.in) — a taxi/tour
operator in Uttarakhand, India. It is two apps in one codebase:

- **Public site** — marketing, SEO landing pages, and a multi-step booking flow.
- **Admin CMS** (`/admin`) — a password-gated panel where the owner edits
  essentially all site content, pricing, routes, seasons and availability.

Almost nothing on the public site is hardcoded copy; it is read from Supabase
and edited through the admin panel. Assume any string a visitor sees is
admin-editable content unless you have confirmed otherwise.

**Stack:** Next.js 14.2 (App Router) · React 18 · TypeScript (strict) ·
Tailwind CSS 3 · Supabase (Postgres + Storage) · Zustand · Zod · Deployed on
Vercel.

## Commands

```bash
npm install
npm run dev      # next dev -H 0.0.0.0  (binds all interfaces, not just localhost)
npm run build
npm run start
npm run lint     # next lint
```

There is **no test suite** and no CI. `npm run build` plus `npm run lint` are
the only automated checks — run both before considering a change done.

## Layout

```
src/
  app/            61 page routes, 47 API route handlers, middleware.ts
    admin/        the CMS UI (client components)
    api/admin/*   admin write endpoints (service-role Supabase)
    [slug]/       catch-all for admin-assigned custom page slugs
  components/     84 components, grouped by feature + a shared ui/ kit
  lib/            all business logic, data access, caching, security
    supabase/     client / server / admin clients, types, queries_enhanced
    auth/         HMAC admin session
    security/     CSP builder
  store/          bookingStore.ts (Zustand, persisted)
  hooks/
supabase/         37 raw .sql files — see "Database" below
```

Path alias: `@/*` → `./src/*`.

## The invariants that actually matter

These are load-bearing and non-obvious. Violating them produces bugs that look
like something else entirely. Most are documented in long comments at the top
of the relevant file — read those before changing behaviour there.

### 1. Every route renders dynamically, on purpose

`src/app/layout.tsx` calls `headers()` to read the per-request CSP nonce. That
opts the entire app out of static rendering — there is **no Full Route Cache**.
Do not try to "fix" this; the nonce cannot be prerendered.

The consequence is that `unstable_cache` on the data layer is the only thing
keeping Supabase query volume affordable. That is why the caching rules below
are strict.

### 2. Caching: content is cached, the booking path is not

`src/lib/supabase/queries_enhanced.ts` has a caching policy in its header
comment. In short:

- **Content reads** (destinations, packages, vehicles, reviews, routes, CMS
  lists) → wrap in `unstable_cache` with a tag from `CACHE_TAGS`.
- **Booking-path reads** (availability, blackout dates, live pricing for a
  date) → stay **uncached**. A stale price or a booking on a blocked date
  costs real money.
- **Three singletons are deliberately uncached** despite being content:
  `getPageContent`, `getTrustSection`, `getTourTrustSection`. An unresolved
  staleness bug (2026-08-17: a hero image edit stayed stale for 90+ minutes on
  Vercel) made these read live so admin saves show up immediately.

Two hard rules:

- **A cached function must use the plain `supabase` singleton from
  `src/lib/supabase/client.ts`.** `unstable_cache` throws if the wrapped
  function touches `cookies()` or `headers()`, which rules out the
  `@supabase/ssr` client in `server.ts`.
- **`src/lib/cacheTags.ts` must stay import-free.** Adding an import there
  closed a circular dependency through `branding.ts`/`footerConfig.ts` and
  webpack surfaced it as a TDZ crash at build time
  (`Cannot access 'i' before initialization`) that named nothing useful.

`CONTENT_CACHE_TTL` is 60s in production, 1s in dev.

### 3. Every admin write calls BOTH revalidation functions

```ts
revalidatePath('/rates')          // clears the route render
revalidateContent(CACHE_TAGS...)  // clears the cached query data
```

Neither implies the other. `revalidatePath` alone re-renders the page against
the *same stale cache entry* — the admin saves, sees nothing change, and
concludes the save failed. Route/category writes should call
`revalidateRoutePages()`, which does both for the whole affected fan-out.

Add a tag to `CACHE_TAGS` rather than inlining a string. The registry exists
because a write revalidating `'destination'` against a read tagged
`'destinations'` silently never busts.

### 4. Auth lives in middleware, not in individual handlers

`src/middleware.ts` is the single gate for `/admin`, `/api/admin/*`,
`/api/availability` and `/api/calendar-sync`. Sessions are an HMAC-SHA256
signed cookie (`src/lib/auth/adminAuth.ts`, `SESSION_SECRET`, 24h).

Exceptions already encoded there: `/api/admin/auth/*` stays open, `GET
/api/admin/site-config` is public (the homepage needs the logo and phone
number), and `/admin` itself renders its own password gate. **A new admin
endpoint under `/api/admin/` is gated automatically — do not add a redundant
check.** A new privileged endpoint *outside* that prefix must be added to the
middleware, not given its own bespoke check.

### 5. Rate limiting only from write handlers

`src/lib/rateLimit.ts` is Upstash/Vercel-KV backed and billed per command.
Middleware runs on effectively every document request, so **never call a
limiter from middleware or a GET** — ordinary bot crawling would exhaust the
daily quota, and the limiter fails open when Redis is unconfigured. Call it
from the POST/PATCH/DELETE handler itself. Existing limiters: admin login
(5/10min), contact form (4/5min), instant quote (10/5min).

### 6. CSP is built per request

`src/lib/security/csp.ts` + the nonce set in middleware. Adding any
third-party script, image host, iframe or analytics vendor requires editing the
directives there or it is silently blocked in visitors' browsers.
`/api/csp-report` logs violations. `'unsafe-eval'` is dev-only (HMR);
`'unsafe-inline'` in `style-src` is required because React `style={{...}}`
attributes cannot carry a nonce.

### 7. Supabase clients — pick the right one

| Client | File | Use for |
|---|---|---|
| `supabase` singleton | `lib/supabase/client.ts` | browser code **and** anything inside `unstable_cache` |
| `createClient()` (ssr, cookies) | `lib/supabase/server.ts` | server components/handlers needing a session — **never** inside `unstable_cache` |
| `getAdminSupabaseClient()` | `lib/supabase/admin.ts` | server-only, service-role, bypasses RLS |

Never import `admin.ts` from a `"use client"` component. `server.ts` and
`admin.ts` are deliberately untyped (no `Database` generic) because the
generated type models only a subset of tables; `as any` casts on
`supabase.from(...)` for unmodelled tables are an established escape hatch
here, not an accident.

Note: 29 API routes use `getAdminSupabaseClient()`, but 7 older ones
(`admin/routes`, `admin/temples`, `admin/temple-categories`, `availability`,
`bookings/*`, `calendar-sync`) still construct a service-role client inline.
Prefer the helper in new code; converting an existing one is a fine drive-by.

### 8. Images

`next.config.mjs` restricts `next/image` to `**.supabase.co` storage paths and
deliberately narrows `deviceSizes`/`imageSizes`/`formats`/`minimumCacheTTL` to
cut Vercel transformation cost ~4x. Do not set `unoptimized: true` globally —
that pushes every image byte onto the Supabase 5GB/month egress limit, which is
the tighter quota. Admin uploads go to the Supabase Storage `images` bucket via
`/api/admin/upload`.

### 9. SEO details that are easy to break

- `SITE_URL` in `src/lib/siteUrl.ts` is a **hardcoded constant**, not
  `NEXT_PUBLIC_SITE_URL` — that var is `localhost:3000` locally and reading it
  would emit localhost canonicals and sitemaps from a local production build.
- The root layout sets **no** `alternates.canonical`. Children inherit
  `alternates` wholesale, so a root canonical previously pointed every page at
  the homepage. Pages set their own or emit none.
- The root layout sets **no** `openGraph.images` — `opengraph-image.tsx`
  supplies it via the file convention.
- WordPress migration redirects live in `next.config.mjs`; dead WordPress URLs
  with no replacement return **410** from middleware (a 410 deindexes faster
  than a redirect, and they are deliberately *not* in `robots.ts` disallow, so
  they keep getting recrawled).

### 10. Misc traps

- `src/components/ui/FooterServer.tsx` is **not** exported from the `ui/index.ts`
  barrel — that barrel is imported by client components, and pulling an async
  server component through it breaks the build. Import it by direct path.
- `RESERVED_PAGE_SLUGS` in `src/lib/slug.ts` must be kept in sync when a new
  top-level route folder is added, or the `[slug]` catch-all can shadow it.
- The booking store's `packageId` and `routeId` are mutually exclusive — a
  booking is either a tour package or a point-to-point route, never both.
- `/api/bookings/create` always recomputes price server-side; the client's
  `totalAmount` is display-only and never trusted.

## Database

Supabase Postgres. **There is no migration pipeline.** `supabase/` holds 37
`.sql` files meant to be pasted into the Supabase SQL Editor by hand — 35 loose
at the top level and only 2 under `supabase/migrations/`. There is no
`config.toml`, so the Supabase CLI is not wired up either.

Conventions when adding schema:

- Write a new descriptively-named `.sql` file in `supabase/`; do not edit
  `schema_enhanced.sql` retroactively.
- **New public-schema tables get RLS enabled with explicit policies.** Supabase
  grants anon + authenticated full CRUD by default, and the anon key ships in
  every page's JS bundle. `harden_rls.sql` exists because four tables shipped
  without it and the anon key could write to them in production.
- `supabase/verify_launch_readiness.sql` is a read-only audit (RLS coverage,
  anon write access, indexes, DB size). Run it after schema changes.

Admin writes use the service-role key and bypass RLS, so adding RLS never
breaks the admin panel — it only blocks the public anon key.

## Environment

Copy `.env.example` → `.env.local`. Note that `.env.example` documents many
*aspirational* integrations (Razorpay, PhonePe, WhatsApp Business, Cloudinary,
Sentry, Web3Forms) that **no code currently reads**. The variables actually
referenced in `src/` are:

**Required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET` (32+ chars).

**Recommended in production:** `UPSTASH_REDIS_REST_URL` / `_TOKEN` (or
`KV_REST_API_URL` / `_TOKEN`) — without these rate limiting is off and fails
open. `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_EMAIL` for booking emails.

**Optional:** `GOOGLE_API_KEY`, `GOOGLE_CALENDAR_ID`, `NEXT_PUBLIC_SITE_URL`.

## Style

- Match the surrounding file. This codebase leans on **long explanatory
  comments above non-obvious decisions**, usually stating what was tried, what
  broke, and the date. That is the house style — when you make a subtle
  trade-off, write that comment.
- TypeScript strict is on. `@typescript-eslint/no-explicit-any` and
  `no-unused-vars` are warnings, not errors; targeted
  `// eslint-disable-next-line` with a reason is accepted for Supabase row
  casts.
- Server components by default; `"use client"` only where interactivity needs
  it. The admin panel is almost entirely client-side.

## Documentation

Three files, and they are the only ones kept current:

- **`CLAUDE.md`** (this file) — the invariants above.
- **`README.md`** — what the project is, setup, env vars, commands, deploy.
- **`supabase/README.md`** — DB bootstrap order, schema conventions, the
  pricing model.

The ~15 root-level `*.md` files that used to sit alongside these
(`master-plan.md`, `QUICKSTART.md`, `MIGRATION_GUIDE.md`, the `*_SUMMARY.md`
and `*_SETUP.md` reports) were deleted in Aug 2026. They were completion
reports and design docs last touched in Dec 2025 / Jan 2026, and several
actively contradicted the code — they are in git history if ever needed.
Don't reintroduce that pattern: a doc describing what a change did belongs in
the commit message, not a new root-level markdown file.

## Known repo debt (do not be surprised by it)

- `images.unsplash.com` is still allowed in the CSP because some
  `destinations`/`packages`/`vehicles` rows hold Unsplash placeholder URLs.
  Remove it once real photography replaces them.
- The UPI ID appears in three places that disagree:
  `Step4Payment.tsx` hardcodes `gokumaon@ptyes` (matching the QR image at
  `public/nainital-upi.jpg`), `/admin/settings` defaults to `gokumaon@upi`,
  and the unused `NEXT_PUBLIC_UPI_ID` in `.env.example` says `gokumaon@paytm`.
  The rendered QR and the copyable text agree with each other, so checkout is
  correct today — but confirm the intended handle with the owner before
  touching any of them.
- `.env.example` documents integrations no code reads (Razorpay, PhonePe,
  WhatsApp Business, Cloudinary, Sentry, Web3Forms). See the env section above
  for what is actually referenced.
