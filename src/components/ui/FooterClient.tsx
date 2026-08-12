"use client";

import Footer from "./Footer";
import { useSiteConfig } from "@/hooks/useSiteConfig";

/**
 * Client-side footer, for the handful of pages that are themselves client
 * components ("use client") and so can't await FooterServer. Fetches the same
 * admin-managed config over /api/admin/site-config via the shared hook, the
 * same way Header does.
 *
 * Prefer ./FooterServer wherever the page is a server component — it puts the
 * footer's links in the server HTML. This variant renders DEFAULT_SITE_CONFIG
 * for one paint before the fetch resolves.
 */
export default function FooterClient() {
  const { config } = useSiteConfig();

  return <Footer config={config.footer} contact={config.contact} />;
}
