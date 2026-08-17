import Header from "./Header";
import { getCachedHeaderConfig } from "@/lib/branding";

/**
 * Server-rendered header — the default for every page that is itself a server
 * component. Mirrors FooterServer/Footer in this directory.
 *
 * WHY THIS EXISTS
 * ---------------
 * Header is a client component that called useSiteConfig() internally, which
 * fetches /api/admin/site-config *after hydration*. That meant every page:
 *
 *   1. Painted the header with DEFAULT_SITE_CONFIG (placeholder logo, default
 *      nav links, fallback phone number),
 *   2. Fetched the real config over the network,
 *   3. Swapped it in — a visible flash and a layout shift at the very top of
 *      the page, on every cold load, disproportionately felt on mobile.
 *
 * It also meant the real nav links were never in the server HTML, so crawlers
 * saw only the defaults, and admin edits took up to 5 minutes to appear
 * because the API response is edge-cached with s-maxage=300 — revalidateTag on
 * save does not purge an HTTP Cache-Control header.
 *
 * Passing the config down as a prop fixes all three at once. Header already
 * accepts `config` and prefers it over the hook, so the client-side fetch
 * short-circuits with no change to the component itself. The read here is the
 * same unstable_cache'd query the favicon uses, tagged HEADER_CONFIG_CACHE_TAG,
 * so an admin save is reflected immediately rather than after the TTL.
 *
 * Deliberately NOT re-exported from ./index.ts — that barrel is imported by
 * client components, and pulling an async server component through it would
 * drag this into the client graph and break the build. Import it directly.
 * Client pages keep using ./Header with its internal hook.
 */
export default async function HeaderServer() {
  const { header } = await getCachedHeaderConfig();
  return <Header config={header} />;
}
