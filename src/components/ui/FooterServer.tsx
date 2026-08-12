import Footer from "./Footer";
import { getFooterConfig } from "@/lib/footerConfig";
import { getSiteContactConfig } from "@/lib/siteContact";

/**
 * Server-rendered footer — the default for every page that is itself a server
 * component. Reads the admin-managed config out of Supabase so an edit in
 * /admin/site-config shows up on the live site immediately (the underlying
 * cache is busted by revalidateTag on save), and so the footer's links land in
 * the server HTML where crawlers can see them.
 *
 * Deliberately NOT re-exported from src/components/ui/index.ts: that barrel is
 * imported by client components, and pulling an async server component through
 * it would drag this into the client graph and break the build. Import it
 * directly. Client pages use ./FooterClient instead.
 */
export default async function FooterServer() {
  const [config, contact] = await Promise.all([
    getFooterConfig(),
    getSiteContactConfig(),
  ]);

  return <Footer config={config} contact={contact} />;
}
