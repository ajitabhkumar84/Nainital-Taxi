# Nainital Taxi

The production website and booking platform for **Nainital Taxi**
([nainitaltaxi.in](https://nainitaltaxi.in)) — a taxi and tour operator in
Uttarakhand, India.

It is two applications in one codebase:

- **Public site** — marketing pages, SEO landing pages for routes and
  destinations, and a multi-step booking flow.
- **Admin CMS** (`/admin`) — a password-gated panel where the owner edits site
  content, pricing, routes, seasons and availability. Almost nothing the
  visitor sees is hardcoded; it is read from Supabase and edited here.

**Stack:** Next.js 14.2 (App Router) · React 18 · TypeScript (strict) ·
Tailwind CSS 3 · Supabase (Postgres + Storage) · Zustand · Zod. Deployed on
Vercel.

> **Working on this codebase?** Read [`CLAUDE.md`](./CLAUDE.md) first. It
> documents the architectural invariants — caching, revalidation, auth, CSP —
> that are load-bearing and easy to break without noticing.

## Requirements

- Node.js 18.17+ (CI and Vercel run Node 20+)
- A Supabase project (the free tier is sufficient)

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

### Environment variables

`.env.example` documents a number of *aspirational* integrations (Razorpay,
PhonePe, WhatsApp Business, Cloudinary, Sentry, Web3Forms) that **no code
currently reads**. The variables actually referenced in `src/` are:

**Required — the app will not start or will fail loudly without these:**

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (ships in the JS bundle) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; admin writes bypass RLS with this |
| `ADMIN_PASSWORD` | The single shared admin-panel password |
| `SESSION_SECRET` | HMAC key for the admin session cookie, 32+ chars |

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Recommended in production:**

| Variable | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Rate limiting. Without it, limiting is **off and fails open** |
| `KV_REST_API_URL` / `_TOKEN` | Vercel KV alternative to the above — same API, no code change |
| `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_EMAIL` | Booking confirmation and admin notification emails |

**Optional:** `GOOGLE_API_KEY`, `GOOGLE_CALENDAR_ID` (calendar sync),
`NEXT_PUBLIC_SITE_URL`.

Note that `NEXT_PUBLIC_SITE_URL` is *not* the canonical origin — that is a
hardcoded constant in `src/lib/siteUrl.ts`, deliberately, so a local production
build cannot emit `localhost` canonicals and sitemaps.

### Database

See [`supabase/README.md`](./supabase/README.md) for the bootstrap order and
the conventions for adding schema. In short: there is no migration pipeline —
the `.sql` files are applied by hand in the Supabase SQL Editor, and every new
public table needs RLS enabled with explicit policies.

## Commands

```bash
npm run dev      # next dev -H 0.0.0.0 (binds all interfaces, not just localhost)
npm run build
npm run start
npm run lint     # next lint
```

There is **no test suite** and no CI. `npm run build` and `npm run lint` are
the only automated checks — run both before considering a change done.

## Project layout

```
src/
  app/            page routes, API route handlers, middleware.ts
    admin/        the CMS UI (client components)
    api/admin/*   admin write endpoints (service-role Supabase)
    [slug]/       catch-all for admin-assigned custom page slugs
  components/     feature-grouped components + a shared ui/ kit
  lib/            business logic, data access, caching, security
    supabase/     client / server / admin clients, types, queries
    auth/         HMAC admin session
    security/     CSP builder
  store/          bookingStore.ts (Zustand, persisted)
  hooks/
supabase/         raw .sql files, applied by hand
public/           static assets (favicon, hero images, UPI QR)
```

Path alias: `@/*` → `./src/*`.

## Deployment

Deployed on Vercel from the default branch. All environment variables above
must be set in the Vercel project settings — in particular
`SUPABASE_SERVICE_ROLE_KEY` and `SESSION_SECRET`, without which the admin panel
fails at request time rather than at build time.

Run `supabase/verify_launch_readiness.sql` (read-only) after any schema change
to confirm RLS coverage, that the anon key cannot write, and that the expected
indexes exist.
